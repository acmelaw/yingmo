# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Code Quality
- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] Build completes successfully (`npm run build`)
- [ ] No console errors in browser
- [ ] All features tested manually
- [ ] Git repository is clean

### Configuration
- [ ] Update `package.json` name and version
- [ ] Set proper app ID in `capacitor.config.json`
- [ ] Configure environment variables (`.env.production`)
- [ ] Update app metadata (description, author, etc.)
- [ ] Review and update licenses

### Assets
- [ ] PWA icons created (192x192, 512x512)
- [ ] Apple touch icon added
- [ ] Favicon updated
- [ ] All images optimized
- [ ] Splash screens created (for mobile)

### Security
- [ ] Remove console.log in production code
- [ ] Enable Content Security Policy
- [ ] Review exposed API endpoints
- [ ] No hardcoded secrets or API keys
- [ ] HTTPS configured for web deployment

## PWA Deployment

### Pre-Flight
- [ ] Manifest file validates (Chrome DevTools)
- [ ] Service worker registers correctly
- [ ] Lighthouse PWA score > 90
- [ ] Offline mode works
- [ ] Install prompt appears

### Build
```bash
npm run build
```

### Hosting Setup
- [ ] Choose hosting provider (Netlify/Vercel/etc)
- [ ] Configure build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Configure redirects for SPA routing
- [ ] Enable HTTPS
- [ ] Set custom domain (optional)

### Post-Deployment
- [ ] Test install on mobile device
- [ ] Verify offline functionality
- [ ] Check service worker updates
- [ ] Test on different browsers
- [ ] Monitor analytics (if configured)

## Electron Deployment

### macOS

#### Pre-Build
- [ ] Apple Developer account active
- [ ] Code signing certificate installed
- [ ] App ID created in Apple Developer portal
- [ ] Notarization credentials configured

#### Build
```bash
npm run electron:build:mac
```

#### Post-Build
- [ ] Test .dmg on clean Mac
- [ ] Verify app is signed (`codesign -dv --verbose=4 "Your App.app"`)
- [ ] Test on macOS 11, 12, 13+
- [ ] Check auto-update works (if configured)
- [ ] Upload to distribution platform

### Windows

#### Pre-Build
- [ ] Code signing certificate (optional but recommended)
- [ ] Test build environment

#### Build
```bash
npm run electron:build:win
```

#### Post-Build
- [ ] Test installer on Windows 10/11
- [ ] Verify portable version works
- [ ] Test auto-update (if configured)
- [ ] Scan for viruses (some AVs flag unsigned apps)
- [ ] Upload to distribution platform

### Linux

#### Build
```bash
npm run electron:build:linux
```

#### Post-Build
- [ ] Test .AppImage on different distros
- [ ] Test .deb on Debian/Ubuntu
- [ ] Test .rpm on Fedora/RHEL
- [ ] Upload to distribution platform

### Distribution
- [ ] Create GitHub release
- [ ] Upload all platform binaries
- [ ] Write release notes
- [ ] Update documentation
- [ ] Announce release

## Mobile Deployment

### iOS

#### Pre-Submission
- [ ] Apple Developer account ($99/year)
- [ ] App ID created
- [ ] Provisioning profiles configured
- [ ] App icons and splash screens added
- [ ] Privacy policy URL ready
- [ ] Support URL ready

#### Build Process
1. [ ] `npm run build`
2. [ ] `npx cap sync ios`
3. [ ] Open in Xcode
4. [ ] Update version/build number
5. [ ] Select "Any iOS Device"
6. [ ] Product → Archive
7. [ ] Distribute App → App Store Connect

#### App Store Connect
- [ ] Create app listing
- [ ] Add screenshots (all required sizes)
- [ ] Write description
- [ ] Set category
- [ ] Add keywords
- [ ] Set pricing
- [ ] Submit for review

#### Post-Approval
- [ ] Test TestFlight version
- [ ] Release to App Store
- [ ] Monitor reviews
- [ ] Track analytics

### Android

#### Pre-Submission
- [ ] Google Play Developer account ($25 one-time)
- [ ] App signing key generated
- [ ] App icons and splash screens added
- [ ] Privacy policy URL ready

#### Build Process
1. [ ] `npm run build`
2. [ ] `npx cap sync android`
3. [ ] Open in Android Studio
4. [ ] Update versionCode and versionName
5. [ ] Build → Generate Signed Bundle
6. [ ] Create upload keystore (first time)
7. [ ] Build AAB file

#### Play Console
- [ ] Create app listing
- [ ] Add screenshots (all required sizes)
- [ ] Write description
- [ ] Set category
- [ ] Content rating questionnaire
- [ ] Set pricing
- [ ] Upload AAB
- [ ] Submit for review

#### Post-Approval
- [ ] Test internal/beta track
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor crashes
- [ ] Track analytics

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics
- [ ] Monitor performance metrics
- [ ] Track user feedback

### Documentation
- [ ] Update README with new version
- [ ] Document breaking changes
- [ ] Update API documentation
- [ ] Create migration guide (if needed)

### Marketing
- [ ] Announce on social media
- [ ] Update website
- [ ] Email users (if applicable)
- [ ] Submit to app directories

### Support
- [ ] Set up support channel
- [ ] Prepare FAQ
- [ ] Monitor GitHub issues
- [ ] Respond to store reviews

## Version Management

### Semantic Versioning
- [ ] MAJOR: Breaking changes
- [ ] MINOR: New features (backward compatible)
- [ ] PATCH: Bug fixes

### Git Tags
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Update Version Numbers
- [ ] `package.json` → `version`
- [ ] `capacitor.config.json` → update if needed
- [ ] Electron → `package.json` version
- [ ] iOS → `Info.plist` CFBundleVersion
- [ ] Android → `build.gradle` versionCode & versionName

## Rollback Plan

### If Issues Found
1. [ ] Pull affected version from stores
2. [ ] Deploy hotfix
3. [ ] Test thoroughly
4. [ ] Increment patch version
5. [ ] Redeploy

### Communication
- [ ] Notify users of issue
- [ ] Explain fix timeline
- [ ] Apologize if necessary
- [ ] Thank for patience

## Future Updates

### Planning
- [ ] Maintain changelog
- [ ] Plan feature roadmap
- [ ] Gather user feedback
- [ ] Monitor competition

### Continuous Improvement
- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Performance optimizations
- [ ] User-requested features

---

## Quick Command Reference

```bash
# Development
npm run dev
npm run electron:dev

# Building
npm run build                    # PWA
npm run electron:build:mac       # macOS
npm run electron:build:win       # Windows
npm run electron:build:linux     # Linux

# Mobile
npm run capacitor:sync
npm run capacitor:open:ios
npm run capacitor:open:android

# Testing
npm run typecheck
npm run preview

# Maintenance
npm outdated
npm audit
npm audit fix
```

---

Good luck with your deployment! 🚀
