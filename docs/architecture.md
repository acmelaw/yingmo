# Architecture

## Overview

Yingmo is a Vue 3 + Quasar application with a modular state management layer and optional real-time sync:

- UI: Vue 3, Quasar, Vue Router, Vue I18n
- Editor: Tiptap (Starter Kit + extensions)
- State: Pinia, with a refactored notes store split into focused modules
- Collaboration & Offline: Yjs (CRDT), y-indexeddb for local persistence, y-websocket for realtime
- Optional Sync Server: Fastify, Better Auth, Drizzle ORM (better-sqlite3), ws

## High-Level Components

- App Shell (Vue + Quasar)
- Editor (Tiptap)
- Notes Store (Pinia)
  - Utilities (pure functions)
  - Tags extraction/filtering
  - Sync manager (queue, retries, conflict handling)
  - Categories manager (indexing, counts)
  - Storage abstraction (browser storage)
- Sync Server (optional)
  - Fastify HTTP/WebSocket
  - Better Auth for authentication flows
  - Drizzle ORM on better-sqlite3 for storage
  - Yjs protocol support

## Data Flow

1. User edits note content in Tiptap.
2. Store updates via Pinia modules:
   - Tags extracted (pure functions)
   - Categories updated
   - Local persistence (y-indexeddb / storage abstraction) ensures offline support
3. If collaboration/sync is enabled:
   - Yjs updates propagate via WebSocket
   - Sync manager enqueues offline changes and resolves conflicts when reconnected
4. Optional server persists/coordinates shared state and user auth.

## Notes Store Design

The notes store is refactored into small modules for clarity and testability:

- utils.ts: cloning, ID creation, timestamp handling
- tags.ts: Unicode-aware hashtag extraction and filtering
- sync.ts: offline queue, server sync, conflict strategies
- categories.ts: category indexing with O(1) lookups
- storage.ts: persistence abstraction, test-mode in-memory storage

See the in-repo documentation:
See src/stores/notes/README.md

## Tooling

- Vite for dev/build
- TypeScript with strict configuration
- Vitest for unit tests, Playwright for e2e
- UnoCSS for utility-first styling (as configured in the project)

## Testing Strategy

- Unit tests target pure modules (tags, utils) and injected dependencies (sync manager)
- Integration tests validate store behavior end-to-end (offline creation, later sync)
- E2E tests cover user flows with Playwright
