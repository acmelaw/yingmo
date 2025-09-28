# ChatApp · Neo‑Brutalist Notes

Production-ready Vue 3 chat-style notes experience with a neo-brutalist coat of paint. Built to stay tiny while leaning on modern tooling—swap styling systems, add features, or deploy as-is.

## Highlights
- ⚡️ Vite + TypeScript + `<script setup>`
- 🧠 Pinia store powered by VueUse `useStorage` for zero-config persistence
- 🌍 vue-i18n with replaceable `ChatApp` label (i18n-ready)
- 🎨 UnoCSS utility pipeline + branded shortcuts for the brutal aesthetic
- 🧾 Head management via Unhead for SEO/meta polish

## Quick start
```bash
npm install
npm run dev
```
Visit the printed local URL. Notes persist to `localStorage`, so refreshes keep your history.

## Customize fast
| Goal | Start Here |
|------|------------|
| Rename / add locales | extend `messages` in `src/main.ts` |
| Change the look | tweak shortcut tokens in `uno.config.ts` or drop in a component library |
| Add editing / reactions | extend `src/components/NoteItem.vue` |
| Sync to an API | swap the Pinia actions in `src/stores/notes.ts` |
| Keyboard powerups | enhance handlers inside `src/components/Composer.vue` |

## Production tips
- Run `npm run build` for an optimized bundle.
- Adjust UnoCSS presets or add icons in `uno.config.ts` as needs grow.
- Wire CI to `npm run typecheck && npm run test` (Vitest prepped).

## License
MIT
