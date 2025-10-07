#!/bin/bash
# Screenshot Generation Script
# Generates all documentation screenshots for README and features

set -e

echo "📸 Starting screenshot generation..."

# Start dev server in background
echo "🚀 Starting dev server..."
npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for dev server..."
for i in {1..30}; do
  if curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "✅ Dev server is ready"
    break
  fi
  sleep 1
done

# Capture screenshots using special config
echo "📸 Capturing hero screenshot..."
npx playwright test e2e/screenshot.spec.ts --config=playwright.screenshots.config.ts --reporter=line || echo "Screenshot test status: $?"

# Capture feature demo screenshots
echo "📸 Capturing feature demo screenshots..."
npx playwright test e2e/feature-demos.spec.ts --config=playwright.screenshots.config.ts --reporter=line || echo "Feature demo status: $?"

# Optimize images if pngquant is available
if command -v pngquant &> /dev/null; then
  echo "🔧 Optimizing PNG images..."
  find . -name "*.png" -path "./docs/images/*" -o -name "hero-screenshot.png" | while read -r img; do
    pngquant --force --quality=80-95 --output "$img" "$img" 2>/dev/null || true
  done
fi

# Clean up
echo "🧹 Cleaning up..."
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

echo "✅ Screenshot generation complete!"
