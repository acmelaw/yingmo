# 📝 Vue Notes - Production-Ready Self-Hosted Notes App

A modern, **offline-first** collaborative notes application with **CRDT-based** real-time synchronization. Works completely offline or with optional server for multi-user collaboration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-green)](https://vuejs.org/)
[![Yjs](https://img.shields.io/badge/Yjs-13.6-orange)](https://docs.yjs.dev/)

## ✨ Features

### Core Features
- ✅ **Offline-First** - Works without any server, data stored locally
- ✅ **Real-Time Collaboration** - Optional multi-user editing with CRDT
- ✅ **Graceful Degradation** - Auto-switches between online/offline modes
- ✅ **Rich Text Editing** - Tiptap editor with full formatting
- ✅ **Cross-Platform** - PWA, Electron (Windows/Mac/Linux), Mobile (iOS/Android)
- ✅ **Self-Hosted** - Complete control, no external dependencies
- ✅ **Production-Ready** - Docker, Kubernetes, bare metal deployment

### Advanced Features
- 🔄 **CRDT Synchronization** - Conflict-free collaborative editing with Yjs
- 💾 **Multi-Layer Persistence** - IndexedDB → WebSocket → Server storage
- 🎨 **Dark Mode** - Eye-friendly interface
- 🔍 **Search** - Full-text search across all notes
- 🏷️ **Categories & Tags** - Organize your notes
- 📤 **Export/Import** - JSON, Markdown, plain text
- 🔐 **Privacy-Focused** - Data stays local (or on your server)
- 📱 **Mobile-Optimized** - Responsive design for all devices

## 🚀 Quick Start

### Option 1: Offline-Only (No Server)

Perfect for personal use with zero setup:

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run deploy:offline

# Serve the dist folder with any static host
npx serve dist
```

Open http://localhost:3000 - **works completely offline!**

### Option 2: With Collaboration (Docker)

For teams with real-time sync:

```bash
# One-line deploy with Docker Compose
npm run deploy:docker

# Or manually:
docker-compose up -d
```

- **Frontend:** http://localhost
- **Sync Server:** ws://localhost:4444

### Option 3: Full Development Setup

```bash
# Install dependencies
npm install
cd sync-server && npm install && cd ..

# Run frontend + sync server
npm run dev:fullstack
```

- **Frontend:** http://localhost:5173
- **Sync Server:** ws://localhost:4444

## 📦 Deployment Options

| Mode | Setup | Cost/mo | Users | Use Case |
|------|-------|---------|-------|----------|
| **Offline** | Static hosting | $0 | 1 | Personal use |
| **Docker** | Small VPS | $5 | 1-50 | Small team |
| **VPS** | Medium VPS | $24 | 50-100 | Growing team |
| **Kubernetes** | K8s cluster | $150+ | 100+ | Enterprise |

### Quick Deploy Commands

```bash
# Offline mode (no server)
./deployment/deploy.sh offline

# Docker Compose
./deployment/deploy.sh docker notes.yourdomain.com

# VPS / Bare Metal
./deployment/deploy.sh vps notes.yourdomain.com

# Kubernetes (Helm)
./deployment/deploy.sh kubernetes notes.yourdomain.com
```

See **[SELF_HOSTED.md](./SELF_HOSTED.md)** for complete deployment guide.

## 🏗️ Architecture

### Three Deployment Modes

#### 1. Offline-Only Mode (Zero Cost)
```
┌──────────────────────────┐
│  Vue 3 Frontend          │
│  ├─ Tiptap Editor        │
│  ├─ Yjs (Local CRDT)     │
│  └─ IndexedDB Storage    │
└──────────────────────────┘
```
- ✅ No server needed
- ✅ Data in browser (IndexedDB)
- ✅ Export/import for backup

#### 2. Auto Mode (Graceful Degradation)
```
┌────────────────────────────┐
│  Frontend                  │
│  ├─ Offline: IndexedDB     │
│  └─ Online: WebSocket ──┐  │
└─────────────────────────┼──┘
                          │
┌─────────────────────────▼──┐
│  Sync Server (Optional)    │
│  └─ Node.js + Yjs          │
└────────────────────────────┘
```
- ✅ Works offline by default
- ✅ Syncs when server available
- ✅ Auto-reconnects
- ✅ No data loss during outages

#### 3. Server Mode (Enterprise)
```
┌────────────────────────────┐
│  Frontend (Always Online)  │
└──────────────┬─────────────┘
               │ WebSocket
┌──────────────▼─────────────┐
│  Sync Server Cluster       │
│  ├─ Node.js instances (3+) │
│  ├─ Redis (coordination)   │
│  └─ Load balancer          │
└────────────────────────────┘
```
- ✅ Real-time required
- ✅ Horizontal scaling
- ✅ High availability

**See [SELF_HOSTED.md](./SELF_HOSTED.md) for architecture details.**

A modern, feature-rich notes application built with Vue 3, TypeScript, and Vite. Supports deployment as a PWA, Electron desktop app, and Capacitor mobile app.

## Features

- ✅ **Multi-Platform Support**
  - Progressive Web App (PWA)
  - Electron Desktop App (Windows, macOS, Linux)
  - Capacitor Hybrid App (iOS, Android)
  - Static deployment (FastAPI, any web server)

- 🎨 **Modern UI/UX**
  - Responsive design with brutal/neubrutalism aesthetics
  - Dark mode support
  - Customizable font sizes
  - Smooth animations and transitions

- 📝 **Rich Note Features**
  - Create, edit, and delete notes
  - Search functionality
  - Categories and tags
  - Archive/unarchive notes
  - Timestamps (created/updated)
  - Emoji support

- 💾 **Data Management**
  - Local storage with localStorage
  - Export to JSON or plain text
  - Import from JSON
  - Data persistence across sessions

- � **Offline Support**
  - Service Worker for offline functionality
  - Local-first architecture
  - No backend required

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: UnoCSS (Tailwind preset)
- **Internationalization**: Vue I18n
- **Desktop**: Electron
- **Mobile**: Capacitor
- **PWA**: Vite PWA Plugin

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- For Electron: Platform-specific build tools
- For iOS: Xcode (macOS only)
- For Android: Android Studio

### Installation

\`\`\`bash
# Install dependencies
npm install

# Development server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

## Platform-Specific Builds

### PWA Deployment

The app is automatically configured as a PWA. Just build and deploy to any static hosting:

\`\`\`bash
npm run build
# Deploy the 'dist' folder to your hosting provider
\`\`\`

#### Deploy to FastAPI

\`\`\`python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

# Mount the built Vue app
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("dist/index.html")
\`\`\`

### Electron Desktop App

\`\`\`bash
# Development
npm run electron:dev

# Build for current platform
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
\`\`\`

The built apps will be in \`dist-electron/\`:
- **Windows**: \`.exe\` installer and portable
- **macOS**: \`.dmg\` and \`.zip\`
- **Linux**: \`.AppImage\`, \`.deb\`, \`.rpm\`

### Capacitor Mobile Apps

#### Initial Setup

\`\`\`bash
# Initialize Capacitor (first time only)
npm run capacitor:init

# Add platforms
npm run capacitor:add:ios
npm run capacitor:add:android
\`\`\`

#### Build and Run

\`\`\`bash
# Build and sync
npm run capacitor:sync

# Open in IDE
npm run capacitor:open:ios      # Opens Xcode
npm run capacitor:open:android  # Opens Android Studio
\`\`\`

Then build and run from the respective IDE.

## Configuration

### Environment Variables

Create a \`.env\` file:

\`\`\`env
VITE_APP_NAME=Vue Notes
VITE_APP_VERSION=1.0.0
\`\`\`

### Customization

- **Theme Colors**: Edit \`uno.config.ts\`
- **App Metadata**: Edit \`package.json\` and \`capacitor.config.json\`
- **PWA Settings**: Edit \`vite.config.ts\` (VitePWA plugin)
- **Electron Settings**: Edit \`electron/main.cjs\`

## Project Structure

\`\`\`
vue-notes/
├── electron/           # Electron main process files
│   ├── main.cjs       # Electron entry point
│   └── preload.cjs    # Preload script
├── public/            # Static assets
│   ├── favicon.svg
│   └── pwa-*.png     # PWA icons
├── src/
│   ├── components/    # Vue components
│   │   ├── ChatShell.vue
│   │   ├── Composer.vue
│   │   └── NoteItem.vue
│   ├── composables/   # Vue composables
│   │   ├── useDataExport.ts
│   │   └── usePlatform.ts
│   ├── stores/        # Pinia stores
│   │   ├── notes.ts
│   │   └── settings.ts
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── capacitor.config.json
├── package.json
├── tsconfig.json
├── uno.config.ts
└── vite.config.ts
\`\`\`

## Features in Detail

### Search & Filter

- Real-time search across note content
- Filter by category
- Sort by created/updated date or content

### Data Export/Import

- **Export to JSON**: Complete data with metadata
- **Export to Text**: Human-readable format
- **Import**: Restore from JSON backup

### Dark Mode

- Auto-detect system preference
- Manual override (light/dark/auto)
- Persistent user preference

### Responsive Design

- Mobile-first approach
- Touch-friendly interactions
- Adaptive layouts for all screen sizes

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- Content Security Policy enabled
- Context isolation in Electron
- No eval() or unsafe inline scripts
- Local-first data storage

## Performance

- Code splitting for optimal loading
- Tree shaking for minimal bundle size
- Lazy loading of components
- Service Worker caching

## Troubleshooting

### PWA not installing
- Ensure HTTPS (required for PWA)
- Check service worker registration
- Verify manifest.json is accessible

### Electron build fails
- Check platform-specific build tools
- Ensure electron-builder dependencies
- Review \`electron/main.cjs\` for errors

### Mobile app issues
- Verify Capacitor CLI is installed
- Check iOS/Android SDK requirements
- Run \`npx cap sync\` after changes

## License

MIT

---

Built with ❤️ using Vue 3, TypeScript, and modern web technologies.

