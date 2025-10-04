# 🏗️ Self-Hosted Architecture

## Overview

This application is designed for **complete self-hosting** with **offline-first** capabilities and **graceful degradation**.

### Key Principles

1. **Works Offline** - Full functionality without any server
2. **Optional Sync** - Add real-time collaboration when needed
3. **Graceful Degradation** - Automatically switches between online/offline
4. **Self-Contained** - No external dependencies required
5. **Easy Deployment** - Docker, Kubernetes, or bare metal

## Architecture Modes

### Mode 1: Offline-Only (No Server Required)

**Perfect for:**
- Personal use
- Privacy-focused scenarios
- Air-gapped systems
- Offline-first requirements

**Stack:**
```
┌─────────────────────────────┐
│  Vue 3 Frontend             │
│  ┌──────────────────────┐  │
│  │  Tiptap Editor       │  │
│  │  Yjs (Local CRDT)    │  │
│  │  IndexedDB Storage   │  │
│  └──────────────────────┘  │
└─────────────────────────────┘
```

**Features:**
- ✅ All data stored locally in IndexedDB
- ✅ No network requests
- ✅ Instant load and save
- ✅ Export/Import for backup
- ✅ Works in airplane mode

**Deployment:**
```bash
./deployment/deploy.sh offline
# Outputs static files in dist/
# Host anywhere - Netlify, Vercel, GitHub Pages, etc.
```

### Mode 2: Auto Mode (Graceful Degradation)

**Perfect for:**
- Teams with optional collaboration
- Scenarios with unreliable connectivity
- Best of both worlds

**Stack:**
```
┌────────────────────────────────────┐
│  Vue 3 Frontend                    │
│  ┌───────────────────────────────┐ │
│  │  Offline-First (IndexedDB)    │ │
│  │  ↓                             │ │
│  │  Optional Sync (WebSocket)    │ │
│  └───────────────────────────────┘ │
└────────────────────────────────────┘
         ↕ (when available)
┌────────────────────────────────────┐
│  Sync Server (Node.js)             │
│  - Lightweight WebSocket server    │
│  - Room-based sync                 │
│  - Optional persistence            │
└────────────────────────────────────┘
```

**Features:**
- ✅ Works offline by default
- ✅ Auto-connects to server when available
- ✅ Auto-reconnects on network recovery
- ✅ Syncs changes when online
- ✅ No data loss during outages

**Deployment:**
```bash
./deployment/deploy.sh docker notes.example.com
# OR
./deployment/deploy.sh vps notes.example.com
```

### Mode 3: WebSocket Mode (Server-Required)

**Perfect for:**
- Enterprise environments
- Guaranteed sync
- Centralized control

**Stack:**
```
┌────────────────────────────────────┐
│  Vue 3 Frontend                    │
│  ↕                                 │
│  WebSocket (Required)              │
└────────────────────────────────────┘
         ↕ (always connected)
┌────────────────────────────────────┐
│  Sync Server Cluster               │
│  ┌──────────┐  ┌──────────┐       │
│  │ Server 1 │  │ Server 2 │ ...   │
│  └────┬─────┘  └────┬─────┘       │
│       └─────┬────────┘             │
│           Redis                     │
└────────────────────────────────────┘
```

**Features:**
- ✅ Real-time sync required
- ✅ Horizontal scaling with Redis
- ✅ Centralized persistence
- ✅ Load balancing support

**Deployment:**
```bash
./deployment/deploy.sh kubernetes notes.example.com
```

## Technology Stack

### Frontend (Stateless)

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Vue 3 + TypeScript | Reactive UI |
| Editor | Tiptap 2.x | Rich text editing |
| CRDT | Yjs | Conflict-free sync |
| Storage | IndexedDB | Offline persistence |
| Sync | y-websocket | Real-time sync |
| Build | Vite | Fast bundler |
| PWA | vite-plugin-pwa | Offline support |

**Why this stack:**
- ✅ No server-side rendering required
- ✅ Deploy as static files
- ✅ Works offline by design
- ✅ Browser-native storage (IndexedDB)
- ✅ CRDT ensures no conflicts

### Backend (Optional, Lightweight)

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | JavaScript runtime |
| Server | ws (WebSocket) | Real-time transport |
| CRDT | Yjs | Same as frontend |
| Scaling | Redis (optional) | Multi-instance sync |
| Persistence | Filesystem/S3 | Document storage |

**Why Node.js over Python:**
- ✅ Shares Yjs library with frontend (same CRDT implementation)
- ✅ Lightweight (~50MB vs ~500MB for Python)
- ✅ Faster WebSocket performance
- ✅ Simpler deployment
- ✅ Better TypeScript integration

**Resource Usage:**
- CPU: 0.1-0.5 cores (idle-active)
- RAM: 128-512MB
- Network: ~1KB/sec per active user

## Deployment Options

### 1. Docker Compose (Recommended)

**Pros:**
- ✅ Easiest deployment
- ✅ Reproducible environment
- ✅ Auto-restart on failure
- ✅ Simple updates

**Cons:**
- ⚠️ Requires Docker

```bash
# One-line deploy
./deployment/deploy.sh docker notes.example.com

# Manual
docker-compose up -d
```

**Services:**
- Frontend (Nginx) - Port 80/443
- Sync Server (Node.js) - Port 4444
- Redis (optional) - Port 6379

**Resource Requirements:**
- CPU: 2 cores
- RAM: 2GB
- Disk: 10GB

### 2. Bare Metal / VPS

**Pros:**
- ✅ Maximum performance
- ✅ Full control
- ✅ No containerization overhead

**Cons:**
- ⚠️ Manual setup
- ⚠️ OS-specific

```bash
./deployment/deploy.sh vps notes.example.com
```

**Components:**
- Nginx (frontend + reverse proxy)
- Node.js (sync server)
- systemd (process management)
- Certbot (SSL certificates)

**Supported OS:**
- Ubuntu 22.04+
- Debian 11+
- RHEL 8+
- macOS 12+ (development)

### 3. Kubernetes (Helm)

**Pros:**
- ✅ Horizontal scaling
- ✅ High availability
- ✅ Auto-healing
- ✅ Rolling updates

**Cons:**
- ⚠️ Complex setup
- ⚠️ Higher resource usage

```bash
./deployment/deploy.sh kubernetes notes.example.com
```

**Resources:**
- Frontend: 2-10 replicas (auto-scale)
- Sync Server: 3-20 replicas (auto-scale)
- Redis: 1 instance (sentinel for HA)

**Requirements:**
- Kubernetes 1.25+
- Helm 3.0+
- Ingress controller (nginx)
- Cert-manager (SSL)

### 4. Static Hosting (Offline Mode)

**Pros:**
- ✅ Zero server costs
- ✅ Infinite scale (CDN)
- ✅ Maximum privacy
- ✅ No maintenance

**Cons:**
- ⚠️ No real-time collaboration
- ⚠️ No multi-device sync

```bash
./deployment/deploy.sh offline
```

**Deploy to:**
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static file host

## Configuration

### Environment Variables

**Frontend (.env):**
```bash
# Sync mode: 'offline' | 'websocket' | 'auto'
VITE_SYNC_MODE=auto

# Server URL (optional in offline mode)
VITE_SYNC_SERVER=wss://notes.example.com/sync
```

**Sync Server:**
```bash
# Server settings
NODE_ENV=production
PORT=4444

# Persistence
PERSISTENCE=true
PERSISTENCE_DIR=/var/lib/vue-notes/data

# CORS (comma-separated)
ALLOWED_ORIGINS=https://notes.example.com

# Redis for scaling (optional)
REDIS_URL=redis://localhost:6379
```

### Recommended Configurations

**Personal Use:**
```bash
VITE_SYNC_MODE=offline
# No server needed!
```

**Small Team (< 10 users):**
```bash
VITE_SYNC_MODE=auto
VITE_SYNC_SERVER=wss://notes.company.com/sync

# Server:
PERSISTENCE=true
# No Redis needed
```

**Medium Team (10-100 users):**
```bash
VITE_SYNC_MODE=auto
VITE_SYNC_SERVER=wss://notes.company.com/sync

# Server:
PERSISTENCE=true
REDIS_URL=redis://redis:6379  # Enable for horizontal scaling
```

**Enterprise (100+ users):**
```bash
VITE_SYNC_MODE=websocket  # Require sync
VITE_SYNC_SERVER=wss://notes.company.com/sync

# Kubernetes with:
# - 3+ sync server replicas
# - Redis cluster
# - Load balancer
# - Auto-scaling
```

## Offline-First Features

### How Offline-First Works

```typescript
// 1. Always write to IndexedDB first (instant)
doc.getText('content').insert(0, 'Hello')
// Saved to IndexedDB immediately

// 2. Sync to server when available
if (isOnline && serverAvailable) {
  wsProvider.sync()  // Syncs changes in background
}

// 3. Auto-sync on reconnection
window.addEventListener('online', () => {
  wsProvider.reconnect()
  // All pending changes sync automatically
})
```

### Graceful Degradation

```
User Action → IndexedDB (instant save)
              ↓
              Is online?
              ├─ Yes → WebSocket sync
              │        ├─ Success → ✅ Synced
              │        └─ Fail → 📴 Offline mode
              └─ No → 📴 Offline mode (works normally)
```

**Benefits:**
- 📱 Works in airplane mode
- 🚇 Works in subway tunnels
- 🏔️ Works in remote areas
- 💾 Never lose data
- ⚡ Always fast (no server wait)

### Conflict Resolution

**CRDT (Yjs) automatically resolves conflicts:**

```
User A (offline): "Hello World"
User B (offline): "Hello There"

When both sync:
Result: "Hello World There" ✅ (auto-merged)
```

**No manual conflict resolution needed!**

### Data Persistence Layers

```
Layer 1: In-Memory (Yjs Doc)
         ↓
Layer 2: IndexedDB (y-indexeddb)
         ↓ (when available)
Layer 3: WebSocket Sync (y-websocket)
         ↓ (optional)
Layer 4: Server Persistence (Filesystem/S3)
```

**Guarantees:**
- ✅ Data never lost (IndexedDB persists across sessions)
- ✅ Offline changes sync when online
- ✅ Multiple devices stay in sync
- ✅ Works without server

## Scaling

### Vertical Scaling (Single Server)

**Recommended specs by user count:**

| Users | vCPU | RAM | Disk | Cost/mo |
|-------|------|-----|------|---------|
| 1-10 | 1 | 1GB | 5GB | $5 |
| 10-50 | 2 | 2GB | 10GB | $12 |
| 50-100 | 2 | 4GB | 20GB | $24 |
| 100-500 | 4 | 8GB | 50GB | $48 |

### Horizontal Scaling (Multiple Servers)

**Enable Redis for multi-instance sync:**

```yaml
# docker-compose.yml
services:
  sync-server:
    replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379

  redis:
    image: redis:alpine
```

**Benefits:**
- ✅ Load balancing across servers
- ✅ High availability (no single point of failure)
- ✅ Rolling updates (zero downtime)

**Cost:**
- Base: $50/mo (3 small VPS + Redis)
- Kubernetes: $150/mo (managed cluster)

### CDN for Frontend

**Deploy static files to CDN:**

```bash
# Build
npm run build

# Upload to S3/CloudFront, Cloudflare, etc.
aws s3 sync dist/ s3://notes-frontend/
```

**Benefits:**
- ✅ Global distribution
- ✅ Infinite scale
- ✅ ~$1/mo for 1TB bandwidth
- ✅ No server management

**Keep sync servers regional** - WebSocket doesn't benefit from CDN

## Monitoring

### Health Checks

**Frontend:**
```bash
curl https://notes.example.com/health
# Expected: 200 OK
```

**Sync Server:**
```bash
curl https://notes.example.com/sync/health
# Expected: {"status":"ok","connections":42,"uptime":86400}
```

**Docker:**
```bash
docker-compose ps
# All services should be "Up (healthy)"
```

### Metrics

**Prometheus metrics at `/metrics`:**

```
yjs_connections_total 42
yjs_rooms_total 15
yjs_memory_bytes 134217728
```

**Grafana Dashboard:**
- Connection count
- Active rooms
- Memory usage
- CPU usage
- Network I/O

### Logs

**Docker:**
```bash
docker-compose logs -f sync-server
```

**systemd:**
```bash
journalctl -u vue-notes-sync -f
```

**Application:**
```bash
# Enable debug logging in browser
localStorage.debug = 'yjs:*'
```

## Security

### Transport Security

**Always use TLS in production:**

```nginx
# Redirect HTTP → HTTPS
server {
  listen 80;
  return 301 https://$server_name$request_uri;
}

# HTTPS only
server {
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
}
```

### Authentication (Optional)

**Add JWT to WebSocket:**

```typescript
// Frontend
const token = await getAuthToken()
const provider = new WebsocketProvider(
  `wss://server.com/sync?token=${token}`,
  roomId,
  doc
)

// Server
wsServer.on('connection', (ws, req) => {
  const token = new URL(req.url, 'ws://base').searchParams.get('token')
  const user = verifyJWT(token)
  if (!user) {
    ws.close(4001, 'Unauthorized')
  }
})
```

### CORS

**Configure allowed origins:**

```bash
ALLOWED_ORIGINS=https://notes.example.com,https://notes.company.com
```

### Rate Limiting

**Nginx:**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /sync {
  limit_req zone=api burst=20;
  proxy_pass http://sync_backend;
}
```

## Backup & Recovery

### Automatic Backups

**Client-side (automatic):**
- IndexedDB persists all data
- Browser handles durability
- Export feature for manual backup

**Server-side (optional):**

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/data-$DATE.tar.gz /var/lib/vue-notes/data
find /backups -name "data-*.tar.gz" -mtime +30 -delete
```

```cron
# Daily at 3 AM
0 3 * * * /opt/vue-notes/backup.sh
```

### Disaster Recovery

**Scenario 1: Server failure**
- ✅ Users keep working offline
- ✅ Data safe in IndexedDB
- ✅ Restore server from backup
- ✅ Users auto-sync when back online

**Scenario 2: Lost device**
- ✅ Data on server (if synced)
- ✅ Or restore from export
- ✅ Or lost (if offline-only mode)

**Recommendation:**
- Enable collaboration mode for backup
- Or use periodic export to cloud storage

## Cost Analysis

### Total Cost of Ownership

**Scenario 1: Personal Use (Offline Mode)**
```
Frontend: $0 (GitHub Pages)
Server: $0 (not needed)
Total: $0/month
```

**Scenario 2: Small Team (10 users)**
```
Frontend: $0 (Netlify)
Server: $5/month (small VPS)
Total: $5/month ($0.50/user)
```

**Scenario 3: Medium Company (100 users)**
```
Frontend: $0 (Cloudflare Pages)
Server: $24/month (medium VPS)
Total: $24/month ($0.24/user)
```

**Scenario 4: Enterprise (1000+ users)**
```
Frontend: $20/month (CloudFront)
Servers: $150/month (3x VPS + Redis)
Total: $170/month ($0.17/user)
```

**vs SaaS alternatives:**
- Notion: $10/user/month
- Google Workspace: $12/user/month
- Microsoft 365: $12.50/user/month

**Self-hosting savings for 100 users:**
- SaaS: $1000-1250/month
- Self-hosted: $24/month
- **Savings: ~$1000/month** 💰

## Support & Maintenance

### Updates

**Docker:**
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

**VPS:**
```bash
cd /opt/vue-notes
git pull
npm ci
npm run build
systemctl restart vue-notes-sync
```

**Kubernetes:**
```bash
helm upgrade vue-notes ./helm/vue-notes
```

### Troubleshooting

See [main README](../README.md) and [COLLABORATION.md](../COLLABORATION.md)

---

**Questions?** Open an issue on GitHub.
