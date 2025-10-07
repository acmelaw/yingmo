# Architecture

## Design Philosophy

Yingmo is architected for **massive parallel development** with these core principles:

1. **Plugin-Based Modularity** - Every feature is an isolated, self-registering module
2. **Dependency Injection** - Services and stores are injected, never imported directly
3. **Pure Functional Core** - Business logic in pure functions for easy testing and composition
4. **Registry Pattern** - Central registry manages all modules, services, and components
5. **Type Contracts** - Shared interfaces enable independent implementations

**Key Insight:** Libraries (Vue, Pinia, etc.) are implementation details. Focus on architectural patterns that remain stable across library changes.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (UI Framework - subject to migration)                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Module Registry                        │
│  • Registers note types, components, services           │
│  • Provides ModuleContext for dependency injection      │
│  • Manages module lifecycle                             │
└─────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ↓                     ↓
┌──────────────────────┐    ┌────────────────────┐
│   Plugin Modules     │    │  Modular Store     │
│                      │    │                    │
│ • text               │    │ • utils (pure)     │
│ • markdown           │    │ • tags (pure)      │
│ • code               │    │ • sync (DI)        │
│ • rich-text          │    │ • categories       │
│ • image              │    │ • storage          │
│ • smart-layer        │    │                    │
│ • todo               │    └────────────────────┘
│ • chord-sheet        │              │
│ • caesar-cipher      │              ↓
│                      │    ┌────────────────────┐
└──────────────────────┘    │  Service Layer     │
            │                │                    │
            │                │ • NoteService      │
            ↓                │ • apiClient        │
┌──────────────────────┐    │ • Custom services  │
│  Type System         │    │                    │
│                      │    └────────────────────┘
│ • module.ts          │              │
│ • note.ts            │              ↓
│                      │    ┌────────────────────┐
└──────────────────────┘    │  Persistence       │
                             │                    │
                             │ • LocalStorage     │
                             │ • IndexedDB        │
                             │ • Sync Server      │
                             │                    │
                             └────────────────────┘
```

## High-Level Components

### 1. Module Registry (Central Coordinator)

**Purpose:** Manages all modules and provides dependency injection

**Location:** `src/core/ModuleRegistry.ts`

**Responsibilities:**

- Register/unregister note type modules
- Provide `ModuleContext` with access to stores and services
- Manage component registry
- Track slash commands
- Service locator pattern for dependency injection

**Key Methods:**

```typescript
register(module: NoteModule)           // Add new module
getModule(id: string)                  // Retrieve module
registerService(name, service)         // Add service
getService<T>(name)                    // Retrieve service
```

### 2. Plugin Modules (Isolated Features)

**Purpose:** Self-contained note type implementations

**Location:** `src/modules/*`

**Structure per module:**

```
my-module/
├── index.ts              # Module definition
├── MyModuleEditor.vue    # Edit component
├── MyModuleViewer.vue    # View component
└── utils.ts              # Module-specific logic (optional)
```

**Interface:** Every module implements `NoteModule` from `src/types/module.ts`

**Registration:** Modules self-register in `src/core/initModules.ts`

**Examples:**

- `text` - Plain text notes
- `markdown` - Markdown with preview
- `code` - Code with syntax highlighting
- `rich-text` - WYSIWYG editing
- `todo` - Task lists
- `chord-sheet` - Musical chords
- `image` - Image notes with transforms
- `smart-layer` - AI-powered transformations

### 3. Modular Store (State Management)

**Purpose:** Decomposed state management following Single Responsibility Principle

**Location:** `src/stores/notes/*`

**Modules:**

**utils.ts** (Pure Functions)

- `createId()` - Generate unique IDs
- `clone<T>(value)` - Deep cloning
- `ensureFutureTimestamp()` - Monotonic timestamps
- `normalizeCategory()` - Category normalization

**tags.ts** (Pure Functions)

- `extractHashtags(text)` - Unicode-aware tag extraction
- `mergeTags()` - Combine extracted and explicit tags
- `filterByTags()` - Filter notes by tags
- `cleanTag()` - Normalize tag format

**sync.ts** (Class with DI)

- `SyncManager` class
- Offline queue management
- Server synchronization
- Conflict resolution
- Dependency-injected API client

**categories.ts** (Class with State)

- `CategoryManager` class
- Reference-counted category tracking
- O(1) lookups via Map
- Automatic cleanup

**storage.ts** (Abstraction)

- `createStorageRef<T>()` - Factory for storage
- Auto-detects test mode (in-memory) vs prod (localStorage)
- Type-safe storage keys

**Main Store:** `src/stores/notes.ts` orchestrates these modules

### 4. Service Layer (Injectable Dependencies)

**Purpose:** Shared services accessed via dependency injection

**Location:** `src/services/*`

**Services:**

- `NoteService` - CRUD operations abstraction
- `apiClient` - HTTP client for sync server
- Custom services registered via `moduleRegistry.registerService()`

**Pattern:**

```typescript
// Register
moduleRegistry.registerService("myService", new MyService());

// Inject
const myService = moduleRegistry.getService<MyService>("myService");
```

### 5. Type System (Contracts)

**Purpose:** Shared type definitions ensuring consistency

**Location:** `src/types/*`

**Files:**

- `module.ts` - Module system types (`NoteModule`, `ModuleContext`, `SlashCommand`)
- `note.ts` - Note types (`Note`, `NoteType`, type-specific interfaces)

**Pattern:** All implementations must satisfy these contracts

## Data Flow

### Note Creation Flow

```
1. User Input
   └─> Slash command (/markdown, /code, etc.)

2. Module Registry
   └─> Matches command to module
   └─> Retrieves module's handler

3. Note Type Handler
   └─> Creates note instance (with metadata, timestamps, ID)

4. Store Module (tags.ts)
   └─> Extracts hashtags if enabled (pure function)

5. Store Module (categories.ts)
   └─> Updates category index (reference counting)

6. Store Module (storage.ts)
   └─> Persists to localStorage/IndexedDB

7. Store Module (sync.ts) [if online]
   └─> Adds to sync queue
   └─> Sends to server via injected apiClient

8. UI Update
   └─> Component receives note via props
   └─> Renders using module's viewer component
```

### Module Registration Flow

```
1. App Initialization (main.ts)
   └─> Calls initModules()

2. Module Initialization (core/initModules.ts)
   └─> Imports all module definitions
   └─> Calls moduleRegistry.register() for each

3. Module Registry (core/ModuleRegistry.ts)
   └─> Validates module interface
   └─> Calls module.install(context)

4. Module Install Hook
   └─> Receives ModuleContext
   └─> Registers note type handler via context.registerNoteType()
   └─> Registers components
   └─> Registers services if needed

5. Registry Storage
   └─> Stores module in Map<id, NoteModule>
   └─> Stores type handler in Map<NoteType, Handler>
   └─> Stores components in Map<name, Component>
   └─> Stores slash commands

6. Ready State
   └─> All modules registered
   └─> App ready to handle slash commands
   └─> All note types can be created/edited
```

### Sync Flow (Offline-First)

```
1. Note Modified (offline)
   └─> Store updates local state
   └─> SyncManager.addToPendingQueue(noteId)
   └─> Note persisted locally

2. Connection Restored
   └─> SyncManager detects online state
   └─> SyncManager.syncPendingNotes()

3. For Each Pending Note
   └─> Fetch local version
   └─> Fetch server version (if exists)
   └─> Compare timestamps

4. Conflict Resolution
   ├─> Local newer: updateOnServer()
   ├─> Server newer: update local + removeFromQueue()
   └─> Same: removeFromQueue()

5. Success
   └─> Note synced
   └─> Removed from pending queue
   └─> UI shows synced status
```

## Architectural Patterns

### 1. Registry Pattern (Central)

**Problem:** Hard dependencies make parallel development difficult

**Solution:** Central registry acts as service locator and dependency injector

**Implementation:**

```typescript
class ModuleRegistry {
  private modules = new Map<string, NoteModule>();
  private services = new Map<string, any>();

  registerService(name: string, service: any) {
    this.services.set(name, service);
  }

  getService<T>(name: string): T {
    return this.services.get(name) as T;
  }
}
```

**Benefits:**

- Modules don't import each other
- Services accessed by name, not path
- Easy to mock in tests
- No circular dependencies

### 2. Plugin Architecture (Modules)

**Problem:** Monolithic code prevents parallel work

**Solution:** Self-contained modules with standard interface

**Interface:**

```typescript
interface NoteModule {
  id: string;
  supportedTypes: NoteType[];
  install(context: ModuleContext): void;
  components?: { editor; viewer; preview };
  slashCommands?: SlashCommand[];
}
```

**Benefits:**

- Add features without modifying existing code
- Each module developed independently
- Modules can be enabled/disabled
- Clean separation of concerns

### 3. Dependency Injection (Services)

**Problem:** Hard-coded dependencies make testing difficult

**Solution:** Inject dependencies via constructor or context

**Example:**

```typescript
// Define dependency interface
interface SyncDeps {
  apiClient: ApiClient;
  getTenantId: () => string;
}

// Inject at construction
class SyncManager {
  constructor(private deps: SyncDeps) {}

  async sync() {
    const tenant = this.deps.getTenantId();
    await this.deps.apiClient.post(`/${tenant}/notes`);
  }
}

// Easy to test with mocks
const mockDeps = {
  apiClient: { post: vi.fn() },
  getTenantId: () => "test-tenant",
};
const manager = new SyncManager(mockDeps);
```

**Benefits:**

- Easy unit testing (inject mocks)
- Loose coupling
- Runtime configuration
- Supports multiple implementations

### 4. Pure Functional Core (Store Modules)

**Problem:** Stateful logic is hard to test and reason about

**Solution:** Extract business logic into pure functions

**Example:**

```typescript
// Pure function - no side effects, deterministic
export function extractHashtags(text: string): string[] {
  const regex = /#([\p{L}\p{N}_]+)/gu;
  return [...text.matchAll(regex)].map((m) => m[1]);
}

// Easy to test
expect(extractHashtags("#hello #world")).toEqual(["hello", "world"]);
```

**Benefits:**

- Trivial to test (no mocks needed)
- Easy to understand (input → output)
- Composable
- No hidden state

### 5. Factory Pattern (Storage)

**Problem:** Tests shouldn't persist to localStorage

**Solution:** Factory creates appropriate storage based on environment

**Example:**

```typescript
export function createStorageRef<T>(options: { key: string; initialValue: T }) {
  // Test mode: in-memory storage
  if (isTestMode()) {
    return inMemoryRef(options.initialValue);
  }

  // Prod mode: localStorage
  return localStorageRef(options.key, options.initialValue);
}
```

**Benefits:**

- Tests run in isolation
- No test data pollution
- Same API for both modes
- Environment-aware

### 6. Type-First Design (Contracts)

**Problem:** Breaking changes cascade through codebase

**Solution:** Define interfaces first, implementations second

**Example:**

```typescript
// Contract (stable)
interface NoteTypeHandler {
  create(data: any): Promise<Note>;
  update(note: Note, data: any): Promise<Note>;
  validate(note: Note): boolean;
}

// Implementation (can vary)
const textNoteHandler: NoteTypeHandler = {
  async create(data) {
    /* ... */
  },
  async update(note, data) {
    /* ... */
  },
  validate(note) {
    /* ... */
  },
};
```

**Benefits:**

- Contracts rarely change
- Multiple implementations possible
- TypeScript catches violations
- Clear expectations

## Parallel Development Enablers

### Why This Architecture Enables Concurrent Development

**1. Isolated Module Development**

- Each module in separate directory
- No shared mutable state between modules
- Only touch `initModules.ts` for registration (additive, easy merge)

**2. Registry-Based Coupling**

- Modules register, don't import each other
- Service locator pattern prevents hard dependencies
- Add features without modifying existing code

**3. Pure Functional Core**

- Store utilities are pure functions
- Same input → same output (deterministic)
- No side effects → no hidden interactions
- Easy to test in parallel

**4. Dependency Injection**

- Services injected, not imported
- Easy to mock for isolated testing
- Runtime configuration possible

**5. Type Contracts**

- Interfaces stable, implementations flexible
- TypeScript catches integration errors
- Contributors work against contracts, not implementations

### Conflict Probability Matrix

| Change Type       | Files Modified                  | Contributors Affected | Conflict Risk             |
| ----------------- | ------------------------------- | --------------------- | ------------------------- |
| Add new module    | 2 (module dir + initModules.ts) | All adding modules    | 🟡 5% (merge initModules) |
| Add store module  | 1 (new file)                    | 0                     | ⚪ 0%                     |
| Add service       | 1 (new file)                    | 0                     | ⚪ 0%                     |
| Add component     | 1 (new file)                    | 0                     | ⚪ 0%                     |
| Modify types      | 1 (types file)                  | All                   | 🔴 80% (coordinate!)      |
| Modify main store | 1 (notes.ts)                    | Many                  | 🔴 60% (coordinate!)      |
| Add dependency    | 1 (package.json)                | All                   | 🔴 50% (coordinate!)      |

**Expected conflict rate following these patterns: <5%**

## Current Implementation Details

_Note: These are current choices and may change. Focus on patterns above._

### UI Layer

- Framework: Vue 3 with Composition API
- Components: Quasar framework
- Routing: Vue Router
- I18n: Vue I18n
- Styling: UnoCSS (utility-first)

### State Layer

- Store: Pinia with modular decomposition
- Reactivity: Vue refs and computed
- Persistence: localStorage/IndexedDB via abstraction

### Editor Layer

- Rich text: Tiptap (extensible ProseMirror wrapper)
- Collaboration: Yjs CRDT (optional)
- Markdown: marked library

### Sync Layer

- Server: Fastify (HTTP + WebSocket)
- Auth: Better Auth
- DB: Drizzle ORM on better-sqlite3
- Protocol: Custom JSON + Yjs binary protocol

### Build/Test Layer

- Build: Vite
- Language: TypeScript (strict mode)
- Unit tests: Vitest
- E2E tests: Playwright

**Evolutionary Strategy:**
When libraries change, well-architected modules adapt easily:

1. Extract business logic to pure functions ✅
2. Isolate framework code to components ✅
3. Use dependency injection for services ✅
4. Define clear type contracts ✅

Result: Modules need minimal updates during library changes.

## References

**Deep Dives:**

- Store architecture patterns: [src/stores/notes/README.md](../src/stores/notes/README.md)
- Module development: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Type definitions: `src/types/module.ts`, `src/types/note.ts`

**Example Modules:**

- Simplest: `src/modules/text/` (start here)
- With editor: `src/modules/markdown/`
- Complex: `src/modules/smart-layer/`

**Testing Examples:**

- Pure functions: `src/__tests__/notes/tags.test.ts`
- Dependency injection: `src/__tests__/notes/sync.test.ts`
- Module integration: `src/__tests__/integration.test.ts`
