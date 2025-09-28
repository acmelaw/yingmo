# ChatApp (Neo‑Brutalist Notes)

A minimal, idiomatic Vue 3 + Vite note‑taking UI that feels like a chat timeline. Built to be **tiny**, **hackable**, and **themeable**. Styling follows a neo‑brutalist aesthetic using only a handful of CSS tokens so you can swap to any component / design system later.

## Goals
- Treat notes like chat messages for fast capture
- Clean, tiny surface area (easy to extend or delete pieces)
- i18n ready: `appName` is a translation key
- Pinia store encapsulates note logic (swap for backend later)
- Zero global CSS framework lock‑in (just tokens)

## Stack
- Vue 3 `<script setup>` + TypeScript
- Vite for instant dev
- Pinia for state
- vue-i18n for localization

## Run
```bash
pnpm install   # or: npm install / yarn install
pnpm dev       # starts dev server
```

## Extend Ideas
| Feature | Where to Start |
|---------|----------------|
| Persistence (localStorage) | augment `add/remove` in `src/stores/notes.ts` |
| Edit notes | add an edit mode to `NoteItem.vue` |
| Multi-language | expand `messages` in `main.ts` |
| Theming | override CSS variables in `:root` or add class toggle |
| Keyboard history nav | track index + key handlers in `Composer.vue` |
| Backend sync | replace store actions with API calls |

## i18n Rename
Change the displayed app label by updating `messages.en.appName` or adding locales and switching `locale` dynamically.

## Replace Styling
Drop in Tailwind / UnoCSS / etc. Replace `src/style.css` or map tokens to utilities. Component markup is intentionally flat & class‑lite.

## License
MIT
