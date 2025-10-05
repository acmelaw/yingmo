# Design System Migration Plan
## From Custom CSS to UnoCSS + shadcn/vue

## Current Issues

1. **Inconsistent theming** - Light mode shows dark backgrounds, dark mode has white text on yellow
2. **Manual CSS maintenance** - Hard to keep track of all color/text combinations
3. **Missing utility classes** - Reinventing the wheel for common patterns
4. **Dark mode fragility** - Custom CSS variables don't always work correctly

## Proposed Solution: UnoCSS + shadcn/vue

### Why UnoCSS?

- **Instant utility classes** - No manual CSS for common patterns
- **Neo-brutalist presets** - Can configure bold borders, hard shadows, sharp corners
- **Theme-aware** - Built-in dark mode support with `dark:` prefix
- **Tiny bundle** - Only includes utilities you actually use
- **Vue-friendly** - Works seamlessly with Vue SFC

### Why shadcn/vue?

- **Headless components** - We control the styling, but get the behavior
- **Copy-paste approach** - Components live in our codebase, fully customizable
- **Accessibility built-in** - Proper ARIA, keyboard navigation, focus management
- **Radix Vue** - Based on solid primitives (Dialog, Popover, Select, etc.)

## Neo-Brutalist UnoCSS Configuration

```ts
// uno.config.ts
import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  theme: {
    colors: {
      // Neo-brutalist palette
      brutal: {
        black: '#000000',
        white: '#FFFFFF',
        pink: '#FF006E',
        cyan: '#00F5FF',
        yellow: '#FFFF00',
        green: '#00FF41',
        purple: '#B026FF',
        orange: '#FF6B00',
      },
    },
    borderRadius: {
      // Mostly sharp corners
      none: '0',
      sm: '2px',
      brutal: '0',
    },
    boxShadow: {
      // Hard shadows (no blur!)
      'brutal-sm': '3px 3px 0 #000',
      'brutal': '5px 5px 0 #000',
      'brutal-lg': '8px 8px 0 #000',
      'brutal-xl': '12px 12px 0 #000',
      // Dark mode variants
      'dark-brutal-sm': '3px 3px 0 #fff',
      'dark-brutal': '5px 5px 0 #fff',
      'dark-brutal-lg': '8px 8px 0 #fff',
    },
    borderWidth: {
      brutal: '3px',
      'brutal-thick': '4px',
    },
  },
  shortcuts: {
    // Brutal button base
    'btn-brutal': 'px-6 py-3 font-black uppercase tracking-wide border-brutal border-black bg-white shadow-brutal transition-all duration-100',
    'btn-brutal-hover': 'hover:(-translate-x-0.5 -translate-y-0.5 shadow-brutal-lg)',
    'btn-brutal-active': 'active:(translate-x-0.5 translate-y-0.5 shadow-brutal-sm)',

    // Brutal card
    'card-brutal': 'p-6 border-brutal border-black bg-white shadow-brutal',

    // Dark mode support
    'dark:btn-brutal': 'dark:(border-white bg-brutal-black text-white shadow-dark-brutal)',
    'dark:card-brutal': 'dark:(border-white bg-brutal-black shadow-dark-brutal)',
  },
  safelist: [
    // Ensure brutal utilities are always available
    'shadow-brutal',
    'shadow-brutal-lg',
    'border-brutal',
    'font-black',
  ],
})
```

## Component Migration Examples

### Before (Custom CSS):
```vue
<template>
  <button class="btn btn-primary">
    Send
  </button>
</template>

<style scoped>
.btn {
  border: 3px solid var(--brutal-border-color);
  box-shadow: var(--brutal-shadow);
  /* ... 20+ more lines */
}
</style>
```

### After (UnoCSS):
```vue
<template>
  <button class="btn-brutal btn-brutal-hover btn-brutal-active bg-brutal-pink text-white">
    Send
  </button>
</template>

<!-- No <style> needed! -->
```

### shadcn/vue Components

We'd install these key components:

1. **Dialog** - For modals (settings panel)
2. **Popover** - For action menus in Composer
3. **Select** - For type selector, settings dropdowns
4. **Switch** - For dark mode toggle
5. **Button** - Base button primitive
6. **Card** - For note bubbles

Each component would be styled with our brutal utilities:

```vue
<!-- components/ui/button.vue -->
<script setup lang="ts">
import { Primitive } from 'radix-vue'
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}>()

const buttonClass = computed(() => {
  const base = 'btn-brutal btn-brutal-hover btn-brutal-active'
  const variants = {
    primary: 'bg-brutal-pink text-white',
    secondary: 'bg-brutal-cyan text-black',
    ghost: 'bg-transparent border-brutal',
  }
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return `${base} ${variants[props.variant || 'primary']} ${sizes[props.size || 'md']}`
})
</script>

<template>
  <Primitive as="button" :class="buttonClass">
    <slot />
  </Primitive>
</template>
```

## Migration Steps

### Phase 1: Setup (1-2 hours)
1. Install UnoCSS: `npm i -D unocss @unocss/preset-uno`
2. Install shadcn/vue: `npx shadcn-vue@latest init`
3. Configure uno.config.ts with neo-brutalist theme
4. Update vite.config.ts to include UnoCSS plugin

### Phase 2: Core Utilities (2-3 hours)
1. Define brutal shortcuts in UnoCSS config
2. Create dark mode color scheme
3. Test utilities with simple components
4. Verify dark mode switching works correctly

### Phase 3: Install shadcn Components (1-2 hours)
1. Add Button component: `npx shadcn-vue@latest add button`
2. Add Dialog component: `npx shadcn-vue@latest add dialog`
3. Add Popover component: `npx shadcn-vue@latest add popover`
4. Add Select component: `npx shadcn-vue@latest add select`
5. Add Switch component: `npx shadcn-vue@latest add switch`
6. Style each with brutal utilities

### Phase 4: Migrate Components (4-6 hours)
1. **Composer.vue** - Replace custom button CSS with UnoCSS utilities
2. **NoteCard.vue** - Use shadcn Card + brutal utilities
3. **NoteShell.vue** - Replace header/settings CSS with utilities
4. **SearchBar.vue** - Use shadcn Input
5. **ServerSelector.vue** - Use shadcn Select

### Phase 5: Cleanup (1 hour)
1. Remove design-system.css
2. Remove component-specific style blocks where possible
3. Update main.ts to remove old CSS import
4. Test all components in light/dark mode

## Benefits

✅ **Consistent theming** - UnoCSS handles dark mode automatically
✅ **Less code** - Utilities replace verbose CSS
✅ **Better DX** - Autocomplete in editor for utility classes
✅ **Accessibility** - shadcn components have proper ARIA
✅ **Maintainability** - One source of truth for design tokens
✅ **Still brutal** - We control the aesthetic through config

## Estimated Total Time
**10-15 hours** of focused work

## Alternative: Quick Fix Current System

If you want to stick with custom CSS for now, I can:

1. Fix text color issues (30 mins)
2. Fix dark/light mode backgrounds (30 mins)
3. Add missing color combinations (1 hour)

**Total: 2 hours**

But this is technical debt - we'll likely hit these issues again.

## Recommendation

**Migrate to UnoCSS + shadcn/vue**

The upfront time investment pays off in:
- Fewer bugs (dark mode "just works")
- Faster development (no custom CSS)
- Better UX (accessible components)
- Easier collaboration (standard tools)

The neo-brutalist aesthetic is preserved - we're just changing the implementation, not the design.

## Decision

What would you like to do?

A. **Migrate to UnoCSS + shadcn** (recommended, 10-15 hours)
B. **Quick fix current system** (band-aid, 2 hours, but debt remains)
C. **Hybrid approach** - UnoCSS now, shadcn components later

Let me know and I'll execute!
