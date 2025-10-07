# Contributing Guide

This guide helps contributors understand the codebase architecture to enable **parallel development with minimal merge conflicts**.

## Core Architecture Principles

### 1. Plugin-Based Module System

**Every feature is a module.** Modules are self-contained and register themselves with the central `ModuleRegistry`.

```typescript
// src/modules/your-module/index.ts
export const yourModule: NoteModule = {
  id: "your-module",
  name: "Your Module",
  version: "1.0.0",
  supportedTypes: ["your-type"],

  slashCommands: [
    {
      command: "/yourcommand",
      description: "Creates a your-type note",
    },
  ],

  async install(context) {
    context.registerNoteType("your-type", yourHandler);
  },

  components: {
    editor: YourEditor,
    viewer: YourViewer,
  },
};
```

**Register in `src/core/initModules.ts`:**

```typescript
await moduleRegistry.register(yourModule);
```

### 2. Modular Store Architecture

The notes store is split into **independent modules** in `src/stores/notes/`:

- **utils.ts** - Pure utility functions (ID generation, cloning, timestamps)
- **tags.ts** - Tag extraction and filtering (Unicode-aware, pure functions)
- **sync.ts** - Server synchronization with offline queue (class-based, DI)
- **categories.ts** - Category indexing with reference counting (class-based)
- **storage.ts** - Persistence abstraction (auto test/prod mode detection)

**Each module is independently testable.** See `src/stores/notes/README.md` for detailed patterns.

### 3. Dependency Injection

**Never hardcode dependencies.** Use the registry or inject via constructor:

```typescript
// ❌ BAD - Hard dependency
import { apiClient } from "@/services/apiClient";

// ✅ GOOD - Injected dependency
class SyncManager {
  constructor(
    private config: {
      apiClient: ApiClient;
      getTenantId: () => string;
    }
  ) {}
}
```

### 4. Type Safety & Contracts

All modules implement standard interfaces defined in `src/types/`:

- **module.ts** - `NoteModule`, `ModuleContext`, `NoteTypeHandler`, `SlashCommand`
- **note.ts** - `Note`, `NoteType`, type-specific note interfaces

**Always use existing types.** Don't create parallel type systems.

## Parallel Development Strategy

### Conflict-Free Zones for Contributors

Different contributors can work simultaneously on:

1. **New Modules** (`src/modules/new-module/`)
   - Create new directory
   - Implement `NoteModule` interface
   - Register in `initModules.ts` (only merge conflict point)
   - Risk: LOW (one-line addition)

2. **Store Extensions** (`src/stores/notes/new-feature.ts`)
   - Add new module file
   - Export pure functions or injectable classes
   - Import in main store if needed
   - Risk: LOW (isolated files)

3. **New Services** (`src/services/YourService.ts`)
   - Implement service interface
   - Register via `moduleRegistry.registerService()`
   - Risk: ZERO (registry pattern)

4. **New Components** (`src/components/YourComponent.vue`)
   - Standalone components
   - Register in module if module-specific
   - Risk: ZERO (no shared files)

5. **Server Modules** (`sync-server/modules/your-module.ts`)
   - Mirror frontend module structure
   - Independent registration
   - Risk: ZERO (parallel to frontend)

### High-Conflict Zones (Coordinate First)

❌ **Avoid simultaneous edits:**

- `src/main.ts` - App initialization
- `src/types/note.ts` - Core type definitions (coordinate type additions)
- `src/stores/notes.ts` - Main store orchestration
- `package.json` - Dependencies (merge conflicts likely)

### Merge Conflict Resolution

If conflicts occur in `initModules.ts`:

```typescript
// Contributor A adds:
await moduleRegistry.register(moduleA);

// Contributor B adds:
await moduleRegistry.register(moduleB);

// Merged result:
await moduleRegistry.register(moduleA);
await moduleRegistry.register(moduleB);
```

Simple additive merges - just include both lines.

## Development Workflow

### Prerequisites

- Node.js >= 18
- Understand the module system (read this entire file)

### Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run dev server:**

   ```bash
   npm run dev
   ```

3. **Run tests (essential):**

   ```bash
   npm test                  # Unit tests
   npm run test:e2e         # E2E tests
   ```

4. **Lint and format (before committing):**

   ```bash
   npm run lint             # Check linting
   npm run lint:fix         # Auto-fix linting issues
   npm run format           # Format code with Prettier
   npm run format:check     # Check formatting
   ```

5. **Optional - sync server:**
   ```bash
   cd sync-server
   npm install
   npm run dev
   ```

### Adding a New Module (Step-by-Step)

**Step 1:** Create module directory

```bash
mkdir -p src/modules/my-module
touch src/modules/my-module/index.ts
touch src/modules/my-module/MyModuleEditor.vue
touch src/modules/my-module/MyModuleViewer.vue
```

**Step 2:** Implement module (see `src/modules/text/` for simplest example)

**Step 3:** Register module in `src/core/initModules.ts`:

```typescript
import { myModule } from "@/modules/my-module";
// ...
await moduleRegistry.register(myModule);
```

**Step 4:** Add tests in `src/__tests__/my-module.test.ts`

**Step 5:** Verify:

```bash
npm run build             # Must pass
npm test                  # Must pass
```

### Code Patterns & Conventions

#### Pure Functions (Preferred)

```typescript
// ✅ Pure, testable, no side effects
export function extractHashtags(text: string): string[] {
  const regex = /#([\p{L}\p{N}_]+)/gu;
  return [...text.matchAll(regex)].map((m) => m[1]);
}
```

#### Injectable Classes (When State Needed)

```typescript
// ✅ Dependency injection for testability
export class SyncManager {
  constructor(
    private deps: {
      apiClient: ApiClient;
      getTenantId: () => string;
    }
  ) {}

  async syncNote(note: Note) {
    const tenant = this.deps.getTenantId();
    await this.deps.apiClient.post(`/notes/${tenant}`, note);
  }
}
```

#### Module Components

```typescript
// ✅ Self-contained, receives note via props
<script setup lang="ts">
import type { YourNote } from "@/types/note";

const props = defineProps<{
  note: YourNote;
}>();

const emit = defineEmits<{
  (e: "update", note: YourNote): void;
}>();
</script>
```

#### Avoid Global State

```typescript
// ❌ BAD - Global state
let cache = {};

// ✅ GOOD - Encapsulated or injected
class CacheService {
  private cache = new Map();
}
```

### Testing Requirements

**Every module must have tests:**

1. **Unit tests** for pure functions:

```typescript
// src/__tests__/my-module.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/modules/my-module/utils";

describe("My Module Utils", () => {
  it("does what it should", () => {
    expect(myFunction("input")).toBe("output");
  });
});
```

2. **Integration tests** for module registration:

```typescript
it("registers my-module correctly", async () => {
  await moduleRegistry.register(myModule);
  expect(moduleRegistry.getModule("my-module")).toBeDefined();
});
```

3. **E2E tests** for user flows (if UI-facing):

```typescript
// e2e/my-module.spec.ts
test("creates my-module note via slash command", async ({ page }) => {
  await page.goto("/");
  await page.fill("input", "/mycommand");
  await page.press("input", "Enter");
  await expect(page.locator(".my-module-note")).toBeVisible();
});
```

### Library Refactoring Awareness

**Current libraries are subject to change:**

- UI framework (Vue/Quasar) → May migrate
- State management (Pinia) → May migrate
- Editor (Tiptap) → May migrate
- Build tool (Vite) → May migrate

**Focus on patterns, not libraries:**

- ✅ Module isolation
- ✅ Dependency injection
- ✅ Interface compliance
- ✅ Pure functions where possible

**When libraries change:**

- Modules with clean abstractions adapt easily
- Modules with library-specific code need updates
- Well-tested modules migrate easier

## Pull Request Guidelines

### Branch Naming

- `feat/module-name` - New module
- `fix/module-name` - Bug fix in module
- `improve/area` - Code improvements (coordinate with others)
- `docs/topic` - Documentation only

### Commit Messages

```
feat(my-module): add slash command support

- Implement /mycommand for creating my-type notes
- Add MyModuleEditor component
- Register in module system
```

### PR Checklist

Before submitting:

- [ ] **Build passes:** `npm run build`
- [ ] **Tests pass:** `npm test && npm run test:e2e`
- [ ] **Linting passes:** `npm run lint`
- [ ] **Formatting passes:** `npm run format:check`
- [ ] **Module registered** in `initModules.ts`
- [ ] **Tests added** for new functionality
- [ ] **Types defined** in `src/types/` or module
- [ ] **No hardcoded dependencies** (use DI)
- [ ] **Follows existing patterns** (check similar modules)
- [ ] **Minimal file changes** (only affected files)

### PR Description Template

```markdown
## What

Brief description of module/feature

## Why

Problem it solves or capability it adds

## Module Details

- Type: text/markdown/code/custom
- Slash command: /yourcommand
- Components: Editor, Viewer
- Dependencies: None / Service X (via DI)

## Testing

- Unit tests: ✅ Added in **tests**/my-module.test.ts
- Integration: ✅ Module registration verified
- E2E: ✅ Added in e2e/my-module.spec.ts

## Conflicts

- Files modified: 2 (new module + initModules.ts)
- Conflict risk: LOW (one-line addition)
- Coordination needed: NO
```

## Coordination

### When to Coordinate

**Coordinate if modifying:**

- Core type definitions (`src/types/note.ts`)
- Main store file (`src/stores/notes.ts`)
- App initialization (`src/main.ts`)
- Package dependencies (`package.json`)

**No coordination needed:**

- New module in `src/modules/`
- New store module in `src/stores/notes/`
- New service in `src/services/`
- New component in `src/components/`
- Tests in `src/__tests__/`

### Communication Pattern

If you must modify shared files:

1. Announce intent: "Modifying src/types/note.ts to add XType"
2. Make minimal changes
3. Commit immediately after testing
4. Notify completion

## Quick Reference

### File Change Impact

| File                      | Change Frequency | Conflict Risk | Agent Coordination  |
| ------------------------- | ---------------- | ------------- | ------------------- |
| `src/modules/*/`          | High             | ⚪ None       | ❌ No               |
| `src/core/initModules.ts` | High             | 🟡 Low        | ⚠️ Additive only    |
| `src/stores/notes/*`      | Medium           | ⚪ None       | ❌ No               |
| `src/types/module.ts`     | Low              | ⚪ None       | ✅ Interface stable |
| `src/types/note.ts`       | Low              | 🔴 High       | ✅ Required         |
| `src/main.ts`             | Very Low         | 🔴 High       | ✅ Required         |
| `package.json`            | Low              | 🔴 High       | ✅ Required         |

### Common Tasks

**Add a note type module:** 15 min

1. Create `src/modules/my-module/`
2. Implement `NoteModule` interface
3. Add to `initModules.ts`
4. Write tests

**Extend store:** 10 min

1. Create `src/stores/notes/my-feature.ts`
2. Export pure functions or class
3. Import in main store if needed
4. Write tests

**Add a service:** 10 min

1. Create `src/services/MyService.ts`
2. Register via `moduleRegistry.registerService()`
3. Inject where needed
4. Write tests

**Add a component:** 5 min

1. Create `src/components/MyComponent.vue`
2. Use in module or view
3. Write tests

---

## Summary for Agents

**This codebase enables parallel development through:**

1. ✅ **Module isolation** - Work on separate modules without conflicts
2. ✅ **Registry pattern** - Add, don't modify shared state
3. ✅ **Dependency injection** - Decouple components
4. ✅ **Pure functions** - Testable, composable logic
5. ✅ **Type contracts** - Shared interfaces, independent implementations

**Your mission:**

- Read this guide thoroughly
- Follow established patterns
- Write isolated, testable code
- Minimize file changes
- Test before submitting

**Expected agent count: 100+ simultaneous contributors**
**Expected conflict rate: <5% (with proper patterns)**

Welcome to the swarm! 🐝
