# Vue Notes Quasar (Next)

This `next/` project is a Quasar-powered rewrite of the Vue Notes application. It reuses the existing stores, composables, and brutalist design tokens while gaining the Quasar CLI ecosystem for desktop, mobile, and web builds.

## Quick start

```bash
cd next
npm install
npm run dev
```

## Production build

```bash
cd next
npm run build
npm run preview
```

The build output is written to `next/dist/` and can be used with Quasar's electron, capacitor, or SSR tooling.

## Notes

- Styling relies on the shared `uno.config.ts` at the repo root, keeping the brutalist shortcuts intact.
- Stores and composables mirror the legacy app, so data/state can migrate with minimal changes.
- Once this branch is promoted, remove unused legacy files listed in the migration guide.
