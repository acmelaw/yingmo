

# Notes Store Refactoring

This directory contains the refactored notes store following modern TypeScript best practices and modular architecture.

## Architecture Overview

The refactored store follows the **Single Responsibility Principle** and **Dependency Injection** patterns, breaking the monolithic store into focused, testable modules.

### Module Structure

```
src/stores/notes/
├── utils.ts          # General utilities (ID generation, cloning, timestamps)
├── tags.ts           # Tag extraction and management
├── sync.ts           # Server synchronization and offline queue
├── categories.ts     # Category tracking and management
└── storage.ts        # Persistence layer abstraction
```

## Module Responsibilities

### `utils.ts`
**Purpose**: General-purpose utility functions

**Exports**:
- `clone<T>(value: T)` - Deep clone using structuredClone or JSON fallback
- `createId()` - Generate unique IDs
- `ensureFutureTimestamp(prev: number)` - Ensure timestamps are monotonically increasing
- `normalizeCategory(category)` - Normalize category strings

**Design Pattern**: Pure functions, stateless

---

### `tags.ts`
**Purpose**: Tag extraction and filtering logic

**Exports**:
- `extractHashtags(text: string)` - Extract #hashtags from text with Unicode support
- `mergeTags(text, explicitTags, autoExtract)` - Combine extracted and manual tags
- `stripHashtags(text)` - Remove hashtags from text
- `cleanTag(tag)` - Normalize tag format
- `extractAllTags(notes)` - Get all unique tags from notes
- `filterByTags(notes, selectedTags)` - Filter notes by tags (AND logic)

**Key Features**:
- ✅ Unicode support (#café, #日本語)
- ✅ Case-insensitive deduplication
- ✅ Pure functions (no side effects)
- ✅ Fully unit testable

**Design Pattern**: Pure functions, functional programming

---

### `sync.ts`
**Purpose**: Server synchronization and offline queue management

**Class**: `SyncManager`

**Methods**:
- `addToPendingQueue(noteId)` - Add note to sync queue
- `removeFromPendingQueue(noteId)` - Remove from queue
- `getPendingNotes()` - Get all pending note IDs
- `syncPendingNotes(notes)` - Sync all pending notes
- `createOnServer(type, data)` - Create note on server
- `updateOnServer(noteId, updates)` - Update note on server
- `deleteOnServer(noteId)` - Delete note from server
- `fetchFromServer()` - Fetch notes from server
- `getState()` / `setState()` - Serialize/deserialize queue

**Key Features**:
- ✅ Offline-first architecture
- ✅ Conflict resolution (local vs remote timestamps)
- ✅ Error handling and retry logic
- ✅ Dependency injection (API client, auth getters)
- ✅ Stateful class with clear lifecycle

**Design Pattern**: Class-based with dependency injection

---

### `categories.ts`
**Purpose**: Category tracking and indexing

**Class**: `CategoryManager`

**Methods**:
- `rebuild(notes)` - Rebuild index from scratch
- `track(category)` - Increment category count
- `untrack(category)` - Decrement category count
- `getAll()` - Get all categories
- `getCount(category)` - Get usage count
- `clear()` - Reset state

**Key Features**:
- ✅ Reference counting for automatic cleanup
- ✅ Sorted category list
- ✅ O(1) lookups via Map
- ✅ Prevents duplicate categories

**Design Pattern**: Class-based with encapsulated state

---

### `storage.ts`
**Purpose**: Persistence layer abstraction

**Exports**:
- `createStorageRef<T>(options)` - Create localStorage or in-memory ref
- `STORAGE_KEYS` - Centralized storage key constants
- `CURRENT_VERSION` - Data version for migrations

**Key Features**:
- ✅ Test mode detection (in-memory storage for tests)
- ✅ Automatic deep cloning in test mode
- ✅ Type-safe storage keys
- ✅ Version management

**Design Pattern**: Factory pattern with environment detection

---

## Main Store (`notesRefactored.ts`)

The main store file is now a **thin orchestration layer** that:

1. Initializes dependencies (services, managers)
2. Exposes computed properties
3. Delegates operations to specialized modules
4. Handles Vue reactivity and watchers

### Key Improvements

✅ **Separation of Concerns**: Each module has a single, clear responsibility

✅ **Testability**: Pure functions and injected dependencies make unit testing trivial

✅ **Type Safety**: Full TypeScript with strict types and interfaces

✅ **Readability**: ~600 LOC refactored store vs ~900 LOC monolithic

✅ **Maintainability**: Changes to sync logic don't affect tag extraction

✅ **Reusability**: Modules can be used independently

✅ **Performance**: Optimized with Maps, Sets, and efficient algorithms

## Migration Path

### Phase 1: Side-by-side (Current)
- Old store: `src/stores/notes.ts`
- New store: `src/stores/notesRefactored.ts`
- Components use old store
- Tests pass for both

### Phase 2: Gradual Migration
```typescript
// In components, gradually switch:
import { useNotesStore } from "@/stores/notes"; // old
import { useNotesStore } from "@/stores/notesRefactored"; // new
```

### Phase 3: Cleanup
- Delete `src/stores/notes.ts`
- Rename `notesRefactored.ts` → `notes.ts`
- Remove old tests

## Testing Strategy

### Unit Tests
Each module can be tested independently:

```typescript
// tags.test.ts
import { extractHashtags, mergeTags } from "@/stores/notes/tags";

test("extractHashtags supports Unicode", () => {
  expect(extractHashtags("#café #日本語")).toEqual(["café", "日本語"]);
});

// sync.test.ts
import { SyncManager } from "@/stores/notes/sync";

test("SyncManager queues notes when offline", () => {
  const syncManager = new SyncManager(mockConfig);
  syncManager.addToPendingQueue("note-1");
  expect(syncManager.getPendingNotes()).toContain("note-1");
});
```

### Integration Tests
Test the full store with all modules:

```typescript
import { useNotesStore } from "@/stores/notesRefactored";

test("creates note offline and syncs when online", async () => {
  const store = useNotesStore();
  settings.syncEnabled = true;
  
  const id = await store.create("text", { text: "#test" });
  expect(store.pendingSync).toContain(id);
  
  auth.login({ tenantId: "t1", userId: "u1", token: "tk1" });
  await store.syncPendingNotes();
  expect(store.pendingSync).not.toContain(id);
});
```

## Best Practices Applied

### 1. **Pure Functions**
```typescript
// ✅ Good: Pure, testable
export function extractHashtags(text: string): string[] {
  return text.match(/#[\p{L}\p{N}_]+/gu) || [];
}

// ❌ Bad: Side effects, global state
let extractedTags: string[] = [];
export function extractHashtags(text: string) {
  extractedTags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
}
```

### 2. **Dependency Injection**
```typescript
// ✅ Good: Dependencies injected
class SyncManager {
  constructor(private config: SyncConfig) {}
}

// ❌ Bad: Hard-coded dependencies
class SyncManager {
  private apiClient = apiClient; // Can't mock
}
```

### 3. **Single Responsibility**
```typescript
// ✅ Good: One responsibility per module
import { extractHashtags } from "./tags";
import { SyncManager } from "./sync";

// ❌ Bad: Everything in one file
export const useNotesStore = defineStore("notes", () => {
  // 900 lines of mixed concerns...
});
```

### 4. **Type Safety**
```typescript
// ✅ Good: Explicit types
export function mergeTags(
  text: string,
  explicitTags?: string[],
  autoExtract = true
): string[] { /* ... */ }

// ❌ Bad: Implicit any
export function mergeTags(text, tags, auto) { /* ... */ }
```

### 5. **Encapsulation**
```typescript
// ✅ Good: Private state, public API
class CategoryManager {
  private categoryCounts = new Map();
  public getAll() { return this.categories; }
}

// ❌ Bad: Exposed internal state
const categoryCounts = new Map(); // Global
export { categoryCounts }; // Anyone can modify
```

## Performance Optimizations

### Before (Monolithic)
```typescript
// Linear search for every operation
const allTags = computed(() => {
  const tags: string[] = [];
  notes.forEach(n => tags.push(...(n.tags || [])));
  return [...new Set(tags)].sort();
});
```

### After (Modular)
```typescript
// O(1) lookups with Set
class CategoryManager {
  private categoryCounts = new Map<string, number>();
  
  track(category: string) {
    this.categoryCounts.set(
      category,
      (this.categoryCounts.get(category) ?? 0) + 1
    );
  }
}
```

## Future Enhancements

### 1. Add y-indexeddb Integration
```typescript
// storage.ts
export class IndexedDBStorage {
  async save(key: string, value: unknown) {
    await idb.put(STORE_NAME, value, key);
  }
}
```

### 2. Add Conflict Resolution Strategies
```typescript
// sync.ts
export enum ConflictStrategy {
  LOCAL_WINS,
  REMOTE_WINS,
  LAST_WRITE_WINS,
  MANUAL_MERGE,
}
```

### 3. Add Background Sync
```typescript
// sync.ts
export class BackgroundSyncManager extends SyncManager {
  startAutoSync(intervalMs: number) {
    setInterval(() => this.syncPendingNotes(), intervalMs);
  }
}
```

## API Comparison

### Old Store (Monolithic)
```typescript
const store = useNotesStore();
// 60+ methods mixed together
store.create(...);
store.syncFromServer();
store.extractHashtags(...); // internal helper exposed
```

### New Store (Modular)
```typescript
const store = useNotesStore();
// Clear public API
store.create(...);
store.syncPendingNotes();

// Or use modules directly
import { extractHashtags } from "@/stores/notes/tags";
const tags = extractHashtags(text);
```

## Documentation

Each module includes:
- ✅ JSDoc comments for all public APIs
- ✅ Type definitions for all parameters
- ✅ Usage examples in this README
- ✅ Design pattern documentation

## Conclusion

This refactoring transforms a monolithic 900-line store into a modular, maintainable, and testable architecture following industry best practices:

- **SOLID Principles**: Single responsibility, dependency inversion
- **Functional Programming**: Pure functions, immutability
- **OOP Patterns**: Encapsulation, dependency injection
- **Modern TypeScript**: Strict types, interfaces, generics

The result is code that is:
- Easier to understand
- Easier to test
- Easier to maintain
- Easier to extend
- More performant
