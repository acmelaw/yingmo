# Vue Notes - Production Ready Multi-Platform App

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

