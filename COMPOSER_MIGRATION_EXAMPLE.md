# Composer Component Migration Guide

## Before: Custom CSS Classes
```vue
<template>
  <div class="brutal-composer">
    <div class="composer-row">
      <div class="composer-actions">
        <button class="btn btn-icon btn-ghost">...</button>
      </div>
      <div class="composer-input">...</div>
      <div class="composer-submit">
        <button class="btn btn-primary btn-lg">Send</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 200+ lines of custom CSS */
.brutal-composer { ... }
.composer-row { ... }
.btn { ... }
.btn-icon { ... }
/* etc. */
</style>
```

## After: UnoCSS Utilities
```vue
<template>
  <div class="w-full">
    <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
      <!-- Actions: 2x3 grid -->
      <div class="grid grid-cols-2 gap-2">
        <button class="btn-icon">...</button>
      </div>
      
      <!-- Editor: flex-1 -->
      <div class="flex-1">...</div>
      
      <!-- Send button -->
      <div>
        <button class="btn-primary btn-lg">⚡ Send</button>
      </div>
    </div>
  </div>
</template>

<!-- NO <style> BLOCK NEEDED! -->
<!-- All styling via UnoCSS shortcuts defined in uno.config.ts -->
```

## Key Changes

### Container
- **Before:** `class="brutal-composer"`
- **After:** `class="w-full"`

### Grid Layout
- **Before:** `class="composer-row"` with custom CSS grid
- **After:** `class="grid grid-cols-[auto_1fr_auto] gap-4 items-center"`

### Buttons
- **Before:** `class="btn btn-icon btn-ghost"` (custom CSS)
- **After:** `class="btn-icon"` (UnoCSS shortcut)

### Dark Mode
- **Before:** Manual CSS variables and media queries
- **After:** Automatic via `dark:` prefix in shortcuts

## Benefits
1. ✅ No scoped styles needed
2. ✅ Consistent with rest of app
3. ✅ Dark mode automatic
4. ✅ Smaller bundle (only used utilities)
5. ✅ Easier to maintain
