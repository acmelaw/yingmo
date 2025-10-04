# Deployment Guide

## Quick Deploy Options

### 1. Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
npm run build
# Deploy the 'dist' folder
```

**Netlify**: Connect your repo and set build command to `npm run build` and publish directory to `dist`

**Vercel**: Same as Netlify

**GitHub Pages**:
```bash
npm run build
cd dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:username/repo.git main:gh-pages
```

### 2. FastAPI Backend

Create `server.py`:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI()

# Serve static files
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# Catch-all route for SPA
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Serve static files if they exist
    if full_path.startswith("pwa-") or full_path in ["favicon.svg", "manifest.webmanifest", "robots.txt"]:
        return FileResponse(f"dist/{full_path}")

    # Otherwise serve index.html for client-side routing
    return FileResponse("dist/index.html")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Install dependencies:
```bash
pip install fastapi uvicorn
```

Run:
```bash
python server.py
```

### 3. Docker Container

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:
```bash
docker build -t vue-notes .
docker run -p 8080:80 vue-notes
```

### 4. Electron Desktop Apps

Build for your platform:
```bash
# macOS
npm run electron:build:mac

# Windows (cross-compile from macOS/Linux requires wine)
npm run electron:build:win

# Linux
npm run electron:build:linux
```

Distribute the files from `dist-electron/`:
- macOS: `.dmg` file
- Windows: `.exe` installer
- Linux: `.AppImage`, `.deb`, or `.rpm`

### 5. Mobile Apps (iOS/Android)

#### iOS

1. Build and sync:
```bash
npm run capacitor:sync
```

2. Open in Xcode:
```bash
npm run capacitor:open:ios
```

3. In Xcode:
   - Select your development team
   - Choose a device or simulator
   - Click Run (⌘R)

4. For distribution:
   - Archive the app
   - Submit to App Store Connect

#### Android

1. Build and sync:
```bash
npm run capacitor:sync
```

2. Open in Android Studio:
```bash
npm run capacitor:open:android
```

3. In Android Studio:
   - Wait for Gradle sync
   - Select a device/emulator
   - Click Run

4. For distribution:
   - Build > Generate Signed Bundle / APK
   - Upload to Google Play Console

## Environment Variables

Create `.env.production`:

```env
VITE_APP_NAME=Vue Notes
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://api.example.com
```

## Performance Optimization

### Enable gzip compression

**Nginx**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

**FastAPI**:
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### CDN Integration

Replace local assets with CDN URLs in production build.

### Cache Headers

Set appropriate cache headers for static assets (already configured in nginx example above).

## Monitoring

Add error tracking:

```typescript
// src/main.ts
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    // Send to your error tracking service
    console.error('Global error:', event.error);
  });
}
```

## Security Checklist

- ✅ HTTPS enabled (required for PWA)
- ✅ Content Security Policy configured
- ✅ No sensitive data in localStorage
- ✅ Input sanitization (Vue handles this)
- ✅ Regular dependency updates

## Troubleshooting

### PWA not updating
- Clear browser cache
- Unregister old service worker
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Build size too large
- Check `npm run build` output
- Analyze with `vite-plugin-visualizer`
- Remove unused dependencies

### Slow initial load
- Enable lazy loading for routes
- Optimize images
- Use CDN for heavy assets
