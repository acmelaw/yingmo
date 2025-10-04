#!/bin/bash
#
# Production deployment script for Vue Notes
# Supports: Docker Compose, Bare Metal, VPS
#

set -e

echo "🚀 Vue Notes - Production Deployment"
echo "===================================="
echo ""

# Configuration
DEPLOY_MODE="${1:-docker}"
DOMAIN="${2:-localhost}"

case $DEPLOY_MODE in
  docker)
    echo "📦 Deploying with Docker Compose..."
    echo ""
    
    # Build frontend
    echo "Building frontend..."
    npm ci
    VITE_SYNC_MODE=auto \
    VITE_SYNC_SERVER=wss://$DOMAIN/sync \
    npm run build
    
    # Build and start containers
    echo "Starting containers..."
    docker-compose up -d --build
    
    echo ""
    echo "✅ Deployment complete!"
    echo "   Frontend: http://$DOMAIN"
    echo "   Sync Server: ws://$DOMAIN/sync"
    echo ""
    echo "Check status: docker-compose ps"
    echo "View logs: docker-compose logs -f"
    ;;
    
  vps)
    echo "🖥️  Deploying to VPS (bare metal)..."
    echo ""
    
    # Check prerequisites
    command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
    command -v nginx >/dev/null 2>&1 || { echo "❌ Nginx is required but not installed."; exit 1; }
    
    # Build frontend
    echo "Building frontend..."
    npm ci
    VITE_SYNC_MODE=auto \
    VITE_SYNC_SERVER=wss://$DOMAIN/sync \
    npm run build
    
    # Deploy frontend
    echo "Deploying frontend..."
    sudo mkdir -p /var/www/vue-notes
    sudo cp -r dist/* /var/www/vue-notes/
    sudo chown -R www-data:www-data /var/www/vue-notes
    
    # Build sync server
    echo "Building sync server..."
    cd sync-server
    npm ci
    npm run build
    cd ..
    
    # Deploy sync server
    echo "Deploying sync server..."
    sudo mkdir -p /opt/vue-notes/sync-server
    sudo cp -r sync-server/* /opt/vue-notes/sync-server/
    sudo mkdir -p /var/lib/vue-notes/data
    sudo chown -R www-data:www-data /var/lib/vue-notes
    
    # Install systemd service
    echo "Installing systemd service..."
    sudo cp deployment/vue-notes-sync.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable vue-notes-sync
    sudo systemctl restart vue-notes-sync
    
    # Configure Nginx
    echo "Configuring Nginx..."
    sudo cp deployment/nginx.conf /etc/nginx/sites-available/vue-notes
    sudo ln -sf /etc/nginx/sites-available/vue-notes /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    # Setup SSL with Certbot (if domain is not localhost)
    if [ "$DOMAIN" != "localhost" ]; then
      echo "Setting up SSL..."
      sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || true
    fi
    
    echo ""
    echo "✅ Deployment complete!"
    echo "   Frontend: https://$DOMAIN"
    echo "   Sync Server: wss://$DOMAIN/sync"
    echo ""
    echo "Check status:"
    echo "  - Frontend: sudo systemctl status nginx"
    echo "  - Sync Server: sudo systemctl status vue-notes-sync"
    echo "View logs:"
    echo "  - Sync Server: sudo journalctl -u vue-notes-sync -f"
    ;;
    
  kubernetes|k8s)
    echo "☸️  Deploying to Kubernetes..."
    echo ""
    
    # Check prerequisites
    command -v helm >/dev/null 2>&1 || { echo "❌ Helm is required but not installed."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required but not installed."; exit 1; }
    
    # Build and push container images
    echo "Building container images..."
    
    # Frontend image
    docker build -t vue-notes-frontend:latest -f deployment/Dockerfile.frontend .
    
    # Sync server image  
    docker build -t vue-notes-sync:latest -f sync-server/Dockerfile sync-server
    
    # Tag and push (adjust registry as needed)
    # docker tag vue-notes-frontend:latest $REGISTRY/vue-notes-frontend:latest
    # docker push $REGISTRY/vue-notes-frontend:latest
    # docker tag vue-notes-sync:latest $REGISTRY/vue-notes-sync:latest
    # docker push $REGISTRY/vue-notes-sync:latest
    
    # Deploy with Helm
    echo "Deploying with Helm..."
    helm upgrade --install vue-notes ./helm/vue-notes \
      --set ingress.hosts[0].host=$DOMAIN \
      --set syncServer.env[4].value=https://$DOMAIN \
      --create-namespace \
      --namespace vue-notes
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Check status:"
    echo "  kubectl get pods -n vue-notes"
    echo "  kubectl get svc -n vue-notes"
    echo "  kubectl get ingress -n vue-notes"
    echo ""
    echo "View logs:"
    echo "  kubectl logs -n vue-notes -l app.kubernetes.io/component=frontend -f"
    echo "  kubectl logs -n vue-notes -l app.kubernetes.io/component=sync -f"
    ;;
    
  offline)
    echo "🔒 Building for offline-only deployment..."
    echo ""
    
    # Build with offline mode
    npm ci
    VITE_SYNC_MODE=offline \
    npm run build
    
    echo ""
    echo "✅ Build complete!"
    echo ""
    echo "The dist/ folder contains a fully offline-capable app."
    echo "Deploy to any static file host:"
    echo ""
    echo "  Option 1 - Simple HTTP server:"
    echo "    npx serve dist"
    echo ""
    echo "  Option 2 - Python:"
    echo "    python -m http.server -d dist 8080"
    echo ""
    echo "  Option 3 - Nginx:"
    echo "    cp -r dist/* /var/www/html/"
    echo ""
    echo "  Option 4 - Static hosting:"
    echo "    Deploy dist/ to Netlify, Vercel, GitHub Pages, etc."
    echo ""
    ;;
    
  *)
    echo "Usage: $0 <mode> [domain]"
    echo ""
    echo "Modes:"
    echo "  docker      - Deploy with Docker Compose (default)"
    echo "  vps         - Deploy to VPS/bare metal with systemd"
    echo "  kubernetes  - Deploy to Kubernetes with Helm"
    echo "  offline     - Build for offline-only mode (no server)"
    echo ""
    echo "Examples:"
    echo "  $0 docker"
    echo "  $0 vps notes.example.com"
    echo "  $0 kubernetes notes.example.com"
    echo "  $0 offline"
    echo ""
    exit 1
    ;;
esac
