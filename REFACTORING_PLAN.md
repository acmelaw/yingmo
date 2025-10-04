# Vue Notes Refactoring Plan

## Overview
Complete refactoring to create a unified, clean, cross-platform note-taking app with CRDT sync.

## Goals
- ✅ Single source of truth (no duplicate components/stores)
- ✅ Consistent neo-brutalism design system
- ✅ Pure Vue 3 Composition API (remove Quasar dependency)
- ✅ Modular architecture for extensible note types
- ✅ CRDT-based sync with graceful offline fallback
- ✅ Cross-platform: Web, Electron, iOS/Android (Capacitor)
- ✅ Local-first with IndexedDB + Yjs

## Phase 1: Frontend Consolidation ✅

### 1.1 Remove Duplicates
- [ ] Delete `ChatShell.vue` (keep `ChatShellModular.vue` as `NoteShell.vue`)
- [ ] Delete `NoteItem.vue` (keep `NoteCard.vue`)
- [ ] Delete `stores/notes.ts` (keep `stores/notesModular.ts` as `stores/notes.ts`)
- [ ] Remove Quasar dependency completely

### 1.2 Design System
- [ ] Create `/src/design/` folder with:
  - `tokens.ts` - Design tokens (colors, spacing, typography)
  - `components.css` - Reusable component classes
  - `utilities.ts` - Helper functions for styling
- [ ] Consolidate all neo-brutalism styles
- [ ] Create consistent button/input/card components

### 1.3 Component Refactor
- [ ] Rename and clean up main shell component
- [ ] Standardize all components to use design system
- [ ] Remove all Quasar component references
- [ ] Create base UI components (Button, Input, Card, etc.)

## Phase 2: Module System Completion

### 2.1 Core Modules
- [ ] Ensure all module types work: text, rich-text, markdown, code, image, smart-layer
- [ ] Complete module registration in `initModules.ts`
- [ ] Add module picker UI
- [ ] Implement transforms between note types

### 2.2 CRDT Integration
- [ ] Yjs provider for local IndexedDB persistence
- [ ] WebSocket provider for sync-server
- [ ] Awareness for collaborative cursors
- [ ] Conflict-free hashtag merging

## Phase 3: Sync Server Enhancement

### 3.1 CRDT Support
- [ ] Per-tenant Y.Doc management
- [ ] Hashtag extraction and indexing
- [ ] Cross-reference resolution
- [ ] Full-text search with Unicode support

### 3.2 API Consistency
- [ ] Unified REST + WebSocket API
- [ ] Module-aware CRUD operations
- [ ] Batch operations for efficiency
- [ ] Proper error handling

## Phase 4: Cross-Platform

### 4.1 Build Targets
- [ ] Web app (Vite build)
- [ ] Electron app (desktop)
- [ ] Capacitor config for iOS
- [ ] Capacitor config for Android

### 4.2 Platform Adapters
- [ ] Storage adapter (Web: IndexedDB, Native: SQLite)
- [ ] Auth adapter (Web: cookie, Native: secure storage)
- [ ] Sync adapter (graceful WebSocket fallback)

## Phase 5: Testing & Polish

### 5.1 Tests
- [ ] Unit tests for all stores
- [ ] Component tests
- [ ] E2E tests for sync
- [ ] Performance benchmarks

### 5.2 Documentation
- [ ] Architecture docs
- [ ] API documentation
- [ ] Module development guide
- [ ] Deployment guide

## Timeline
- Phase 1: 2 hours
- Phase 2: 3 hours
- Phase 3: 2 hours
- Phase 4: 3 hours
- Phase 5: 2 hours

Total: ~12 hours of focused work
