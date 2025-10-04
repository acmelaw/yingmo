# Platform-Specific Implementation Guide

This guide explains how each platform integration works and how to customize it.

## PWA (Progressive Web App)

### How It Works

The PWA functionality is implemented using `vite-plugin-pwa`:

**Configuration**: `vite.config.ts`
```typescript
VitePWA({
  registerType: "autoUpdate",
  manifest: { /* Web App Manifest */ },
  workbox: { /* Service Worker config */ }
})
```

**Service Worker**: Auto-generated at build time
- Caches app shell for offline use
- Precaches all static assets
- Runtime caching for fonts and external resources

**Manifest**: Auto-generated from config
- App name, icons, theme color
- Display mode (standalone)
- Start URL and scope

### Customization

**Change app name/colors**:
```typescript
// vite.config.ts
manifest: {
  name: "Your App Name",
  theme_color: "#your-color",
  background_color: "#your-bg-color"
}
```

**Add icons**:
Place these in `public/`:
- `pwa-192x192.png` - Android icon
- `pwa-512x512.png` - Splash/large icon
- `apple-touch-icon.png` - iOS icon

**Offline strategy**:
```typescript
// vite.config.ts
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/your-api\.com\/.*/i,
      handler: "NetworkFirst", // or "CacheFirst"
    }
  ]
}
```

### Testing

1. Build: `npm run build`
2. Serve: `npm run preview`
3. Open in Chrome
4. DevTools → Application → Service Workers
5. Check "Offline" and reload

### Deployment

Works on any static hosting:
- **Netlify**: Build command `npm run build`, publish dir `dist`
- **Vercel**: Auto-detects Vite
- **GitHub Pages**: See DEPLOYMENT.md

## Electron (Desktop Apps)

### How It Works

**Main Process**: `electron/main.cjs`
- Creates browser window
- Loads app (dev server or built files)
- Handles native menus, dialogs, etc.

**Preload Script**: `electron/preload.cjs`
- Bridges renderer and main process
- Exposes safe APIs via `contextBridge`

**Renderer Process**: Your Vue app
- Runs in isolated context
- Accesses Electron APIs via `window.electron`

### Platform Detection

```typescript
// In Vue components
const { isElectron } = usePlatform()

if (isElectron) {
  // Electron-specific features
}
```

### Customization

**Window options**:
```javascript
// electron/main.cjs
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  titleBarStyle: 'hiddenInset', // macOS only
  backgroundColor: '#fdfcfa',
  // ... more options
})
```

**Menu items**:
```javascript
// electron/main.cjs
const template = [
  {
    label: 'File',
    submenu: [
      { label: 'New Note', click: () => { /* ... */ } },
      // Add more menu items
    ]
  }
]
```

**IPC Communication**:
```javascript
// electron/main.cjs - Add handler
ipcMain.handle('save-file', async (event, data) => {
  // Native file save dialog
})

// electron/preload.cjs - Expose to renderer
contextBridge.exposeInMainWorld('electron', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data)
})

// Vue component - Use it
window.electron.saveFile(data)
```

### Building

**macOS**:
```bash
npm run electron:build:mac
# Outputs: .dmg and .zip in dist-electron/
```

**Windows** (from macOS/Linux requires wine):
```bash
npm run electron:build:win
# Outputs: .exe installer and portable in dist-electron/
```

**Linux**:
```bash
npm run electron:build:linux
# Outputs: .AppImage, .deb, .rpm in dist-electron/
```

**Configuration**: `package.json` → `build` section
```json
{
  "build": {
    "appId": "com.yourapp.id",
    "mac": {
      "category": "public.app-category.productivity"
    }
  }
}
```

### Code Signing (for distribution)

**macOS**:
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name"
    }
  }
}
```

**Windows**:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

## Capacitor (Mobile Apps)

### How It Works

**Web App**: Built by Vite → `dist/`
**Capacitor**: Wraps web app in native container
**Native Plugins**: Access device features

### Setup

1. **Initialize** (first time):
```bash
npx cap init
# Name: Vue Notes
# Package ID: com.vuenotes.app
```

2. **Add platforms**:
```bash
npx cap add ios
npx cap add android
```

3. **Configuration**: `capacitor.config.json`
```json
{
  "appId": "com.vuenotes.app",
  "appName": "Vue Notes",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

### Development Workflow

1. **Build web app**:
```bash
npm run build
```

2. **Sync to native projects**:
```bash
npx cap sync
```

3. **Open in IDE**:
```bash
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

4. **Run from IDE**:
- Select device/simulator
- Click Run

### Platform Detection

```typescript
const { isCapacitor, isIOS, isAndroid } = usePlatform()

if (isIOS) {
  // iOS-specific UI adjustments
}
```

### Native Features

Install plugins as needed:

```bash
npm install @capacitor/camera
npm install @capacitor/filesystem
npm install @capacitor/share
```

Use in components:
```typescript
import { Camera } from '@capacitor/camera'
import { Share } from '@capacitor/share'

// Take photo
const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri
})

// Share note
await Share.share({
  title: 'My Note',
  text: noteText,
  dialogTitle: 'Share Note'
})
```

### Icons and Splash Screens

1. **Create assets**:
- Icon: 1024x1024 PNG
- Splash: 2732x2732 PNG (centered content)

2. **Generate**:
```bash
npm install -g @capacitor/assets
capacitor-assets generate --iconPath icon.png --splashPath splash.png
```

### iOS-Specific

**Info.plist** (`ios/App/App/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>To add photos to notes</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>To attach images</string>
```

**Build settings**:
- Open in Xcode
- Select project → Signing & Capabilities
- Choose team
- Set bundle ID

### Android-Specific

**AndroidManifest.xml** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**Gradle config** (`android/app/build.gradle`):
```gradle
android {
    defaultConfig {
        applicationId "com.vuenotes.app"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Publishing

**iOS (App Store)**:
1. Archive in Xcode
2. Upload to App Store Connect
3. Fill metadata
4. Submit for review

**Android (Play Store)**:
1. Build → Generate Signed Bundle
2. Upload to Play Console
3. Fill store listing
4. Submit for review

## Cross-Platform Considerations

### Platform-Specific Styling

```vue
<template>
  <div :class="platformClasses">
    <button :style="buttonStyle">Click</button>
  </div>
</template>

<script setup>
const { platform } = usePlatform()

const platformClasses = computed(() => ({
  'ios-style': platform.value === 'ios',
  'android-style': platform.value === 'android',
  'desktop-style': platform.value === 'electron'
}))

const buttonStyle = computed(() => {
  if (platform.value === 'ios') {
    return { borderRadius: '12px' } // iOS style
  }
  return { borderRadius: '4px' } // Material style
})
</script>
```

### Safe Areas (Mobile)

```css
/* iOS safe areas */
.header {
  padding-top: env(safe-area-inset-top);
}

.content {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Feature Detection

```typescript
const { supportsFileSystem } = usePlatform()

async function saveFile() {
  if (supportsFileSystem) {
    // Use native file picker
  } else {
    // Use download link
  }
}
```

## Testing Strategy

### PWA
1. Chrome DevTools → Lighthouse
2. Test offline mode
3. Test install prompt
4. Check manifest

### Electron
1. Build and test each platform
2. Check native menus work
3. Test window states
4. Verify auto-updates

### Mobile
1. Test on simulators
2. Test on real devices
3. Check permissions
4. Test different screen sizes
5. Verify app icons/splash

## Performance Optimization

### PWA
- Service Worker caching
- Code splitting
- Lazy loading
- Asset optimization

### Electron
- Preload scripts for faster startup
- Lazy load heavy dependencies
- Use native modules sparingly

### Mobile
- Minimize bundle size
- Optimize images
- Use native plugins for heavy tasks
- Test on low-end devices

## Security Best Practices

### PWA
- HTTPS only
- Content Security Policy
- No sensitive data in localStorage

### Electron
- Context isolation enabled ✅
- Node integration disabled ✅
- Validate all IPC messages
- Sign your app for distribution

### Mobile
- Request only needed permissions
- Validate all user input
- Use secure storage for sensitive data
- Follow platform guidelines

## Troubleshooting

### PWA won't install
- Check HTTPS is enabled
- Verify manifest.json accessible
- Check service worker registration

### Electron build fails
- Install platform build tools
- Check code signing certificates
- Review electron-builder logs

### Capacitor sync issues
- Clean build: `rm -rf ios android`
- Re-add platform: `npx cap add ios`
- Check capacitor.config.json

## Resources

- PWA: https://vite-pwa-org.netlify.app/
- Electron: https://www.electronjs.org/docs
- Capacitor: https://capacitorjs.com/docs

---

This implementation provides a solid foundation for all three platforms. Customize as needed for your specific requirements!
