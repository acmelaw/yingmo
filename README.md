# Yingmo

A modern notes application built with Vue 3 + Quasar, rich-text editing via Tiptap, and optional real-time collaboration using Yjs. Designed with an offline-first mindset and a modular store architecture for maintainability and testability.

- UI: Vue 3, Quasar, Vue Router, Vue I18n
- Editor: Tiptap (Starter Kit and rich extensions)
- State: Pinia
- Collaboration & Offline: Yjs, y-indexeddb, y-websocket, idb/localforage
- Build: Vite + TypeScript
- Tests: Vitest (unit), Playwright (e2e)

For detailed store architecture and refactoring guidance, see the notes store documentation:
See src/stores/notes/README.md

## Repository Structure

```
.
├── src/                      # Frontend source (Vue 3 + Quasar)
│   └── stores/
│       └── notes/
│           └── README.md     # Notes store refactoring doc (modular architecture)
├── sync-server/              # Optional sync server (Fastify, Drizzle, Better Auth, Yjs)
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Frontend scripts and dependencies
├── tsconfig.json             # Frontend TypeScript configuration
└── docs/                     # Project documentation (added in this PR)
```

## Quickstart

Requirements:
- Node.js >= 18

Install dependencies:
```
npm install
```

Run the frontend dev server:
```
npm run dev
```

Build for production:
```
npm run build
```

Preview the production build:
```
npm run preview
```

Run unit tests:
```
npm test
```

Run e2e tests (CI mode):
```
npm run test:e2e
```

Optional: start the sync server (in a separate terminal):
```
cd sync-server
npm install
npm run dev
```
By default, the server maps to port 4444 (see Docker script mapping).

## Scripts

From package.json:

- Dev: `npm run dev` or `npm run dev-host`
- Build: `npm run build`
- Preview: `npm run preview`
- Unit tests:
  - `npm test`
  - `npm run test:ui`
  - `npm run test:coverage`
- E2E tests:
  - `npm run test:e2e`
  - `npm run test:e2e:ui`
  - `npm run test:e2e:headed`
  - `npm run test:e2e:debug`

Sync server scripts (see docs/sync-server.md):
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`
- Lint: `npm run lint` / `npm run lint:fix`
- Type check: `npm run type-check`
- Drizzle:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:studio`
- Docker:
  - `npm run docker:build`
  - `npm run docker:run` (exposes :4444)

## Architecture

- Frontend
  - Vue 3 + Quasar for UI
  - Pinia store with modular design for notes (see src/stores/notes/README.md)
  - Tiptap-based editor with common extensions
  - Offline persistence with IndexedDB (via y-indexeddb / idb / localforage)
- Collaboration & Sync
  - Yjs for CRDT-based collaboration
  - y-websocket for real-time sync
  - Optional server for multi-device synchronization and auth (Fastify + Better Auth + Drizzle + better-sqlite3)
- Tooling
  - Vite, TypeScript, UnoCSS, Vitest, Playwright

See more in:
- docs/architecture.md
- docs/sync-server.md

## Contributing

See CONTRIBUTING.md for development workflow, testing guidance, and PR conventions.
