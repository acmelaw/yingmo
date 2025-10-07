# Screenshot & Documentation Workflow

## Overview

This document explains the automated screenshot generation workflow for documentation and PR demos.

## Quick Start

### Generate All Screenshots

```bash
npm run screenshots
```

This will:

1. Start a dev server
2. Capture hero screenshot for README
3. Capture feature demo screenshots
4. Optimize images (if pngquant is available)
5. Clean up

### Generate Specific Screenshots

```bash
# Only hero screenshot
npm run screenshots:hero

# Only feature demos
npm run screenshots:features
```

## Architecture

### Files

- **`e2e/screenshot.spec.ts`** - Hero screenshot test
- **`e2e/feature-demos.spec.ts`** - Feature demo screenshot tests
- **`e2e/utils/screenshot-helper.ts`** - Reusable screenshot utilities
- **`scripts/generate-screenshots.sh`** - Screenshot generation script
- **`playwright.screenshots.config.ts`** - Playwright config for screenshots

### Screenshot Locations

- **Hero screenshot:** `hero-screenshot.png` (used in main README)
- **Feature demos:** `docs/images/feature-*.png` (used in README features section)

## Adding New Feature Screenshots

### 1. Create the Test

Add to `e2e/feature-demos.spec.ts`:

```typescript
test("capture my-awesome-feature demo", async ({ page }) => {
  await page.goto("/");
  await setupAppForScreenshot(page);

  // Set up the feature (e.g., type text, click buttons)
  await typeInInput(page, "Example with #hashtags");

  // Capture the screenshot
  await captureOptimizedScreenshot(page, {
    path: "docs/images/feature-my-awesome-feature.png",
    type: "png",
  });
});
```

### 2. Update README

Add to `README.md` in the features section:

```markdown
### 🎯 My Awesome Feature

Description of what this feature does...

![My Awesome Feature](docs/images/feature-my-awesome-feature.png)
```

### 3. Generate & Commit

```bash
npm run screenshots
git add docs/images/feature-my-awesome-feature.png README.md e2e/feature-demos.spec.ts
git commit -m "docs: add my-awesome-feature screenshot"
```

## CI Integration

Screenshots are automatically:

1. Generated on every CI run
2. Uploaded as artifacts (30-day retention)
3. Committed to main branch on successful builds

### CI Workflow

```yaml
- name: Generate screenshots
  run: ./scripts/generate-screenshots.sh

- name: Upload screenshots as artifacts
  uses: actions/upload-artifact@v4
  with:
    name: screenshots
    path: |
      hero-screenshot.png
      docs/images/*.png
```

## Best Practices

### Screenshot Quality

- Use PNG for UI screenshots (lossless)
- Keep file sizes under 100KB
- Use `pngquant` for optimization (automatically applied in CI)

### Screenshot Content

- **Hero screenshot**: Show the main app with sample data
- **Feature demos**: Show specific features in action
- **Clean state**: No dev tools, consistent window size
- **Meaningful data**: Use realistic examples

### Helper Functions

Import from `e2e/utils/screenshot-helper.ts`:

```typescript
import {
  setupAppForScreenshot,
  captureOptimizedScreenshot,
  createNote,
  typeInInput,
} from "./utils/screenshot-helper";
```

- **`setupAppForScreenshot(page)`** - Prepares app (closes modals, etc.)
- **`captureOptimizedScreenshot(page, options)`** - Takes optimized screenshot
- **`createNote(page, content, slashCommand?)`** - Creates a complete note
- **`typeInInput(page, content)`** - Types without sending (shows live features)

## Optimization

### Image Optimization

The script automatically optimizes PNGs if `pngquant` is installed:

```bash
# Install pngquant (optional)
# macOS
brew install pngquant

# Ubuntu/Debian
apt-get install pngquant
```

### Size Limits

- Hero screenshot: ~40-50KB
- Feature demos: ~30-40KB each
- Total screenshots: <200KB (to keep repo lean)

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
pkill -f vite
npm run screenshots
```

### Screenshots Not Generated

1. Check dev server starts: `npm run dev`
2. Verify playwright works: `npm run test:e2e`
3. Check script permissions: `chmod +x scripts/generate-screenshots.sh`

### Screenshot Quality Issues

- Increase viewport size in test
- Wait for animations to complete
- Ensure consistent theme/data

## Examples

### Basic Feature Demo

```typescript
test("capture basic demo", async ({ page }) => {
  await page.goto("/");
  await setupAppForScreenshot(page);

  await typeInInput(page, "Hello, World!");

  await captureOptimizedScreenshot(page, {
    path: "docs/images/feature-basic.png",
  });
});
```

### Multi-Step Demo

```typescript
test("capture complex demo", async ({ page }) => {
  await page.goto("/");
  await setupAppForScreenshot(page);

  // Create background notes
  await createNote(page, "First note", "/markdown");
  await createNote(page, "Second note");

  // Show feature in action
  await typeInInput(page, "Feature in action!");

  await captureOptimizedScreenshot(page, {
    path: "docs/images/feature-complex.png",
  });
});
```
