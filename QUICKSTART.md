# Quick Start Guide

## First Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**: http://localhost:5173

## Try the Features

### Basic Usage
- Click the "+" or open the composer at the bottom
- Type a note and press Enter or click the arrow button
- Click "×" to delete a note
- Search using the search bar

### Settings (Click ⚙️)
- Toggle between Light/Dark/Auto theme
- Change font size
- Export your notes to JSON or Text
- Import notes from a JSON backup
- Clear all notes

### Keyboard Shortcuts
- `Enter` - Send note (in composer)
- `Shift + Enter` - New line in note
- `Esc` - Close emoji picker

## Platform-Specific Development

### Web/PWA
```bash
npm run dev          # Development
npm run build        # Production build
npm run preview      # Preview production build
```

### Electron Desktop
```bash
npm run electron:dev     # Development with hot reload
npm run electron:build   # Build for current platform
```

### Mobile (Capacitor)
```bash
# First time only
npm run capacitor:init
npm run capacitor:add:ios
npm run capacitor:add:android

# Regular workflow
npm run capacitor:sync          # Build and sync to mobile
npm run capacitor:open:ios      # Open in Xcode
npm run capacitor:open:android  # Open in Android Studio
```

## Testing the App

### As PWA
1. Build: `npm run build`
2. Preview: `npm run preview`
3. Open in Chrome/Edge
4. Look for install prompt
5. Install to test offline functionality

### As Electron App
1. Run: `npm run electron:dev`
2. App window should open
3. Test native menus
4. Check DevTools (View → Toggle Developer Tools)

### Dark Mode
1. Click ⚙️ settings icon
2. Change theme dropdown
3. See instant UI update

### Export/Import
1. Add some notes
2. Click ⚙️ → Export as JSON
3. Clear all notes
4. Click Import Data
5. Select the exported file
6. Notes should restore

## Common Issues

### Port already in use
```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Build errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check for errors
npm run typecheck
```

### Electron not starting
```bash
# Make sure dev server is running first
npm run dev
# Then in another terminal
npm run electron:dev
```

## Project Structure Overview

```
src/
├── components/
│   ├── ChatShell.vue   - Main app container
│   ├── Composer.vue    - Note input component
│   └── NoteItem.vue    - Individual note display
├── stores/
│   ├── notes.ts        - Notes data & logic
│   └── settings.ts     - User preferences
├── composables/
│   ├── useDataExport.ts  - Export/import functions
│   └── usePlatform.ts    - Platform detection
├── App.vue            - Root component
└── main.ts           - App initialization
```

## Next Steps

1. ✅ **Customize**: Edit `package.json` with your app name
2. ✅ **Icons**: Add your PWA icons to `public/`
3. ✅ **Deploy**: See `DEPLOYMENT.md` for hosting options
4. ✅ **Extend**: Add features from `ENHANCEMENTS.md` suggestions

## Resources

- Full documentation: `README.md`
- Deployment guides: `DEPLOYMENT.md`
- Feature list: `ENHANCEMENTS.md`
- Environment setup: `.env.example`

Happy coding! 🚀
