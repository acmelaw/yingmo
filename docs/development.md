# Development Guide

## Quick Start for Coding Agents

**Goal:** Get productive in <10 minutes by understanding patterns, not libraries.

### Prerequisites
- Node.js >= 18
- Understanding of TypeScript
- Read `CONTRIBUTING.md` for agent collaboration patterns

### Setup (2 min)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# → App runs at http://localhost:5174

# (Optional) Start sync server in another terminal
cd sync-server
npm install
npm run dev
# → Server runs at http://localhost:4444
```

### Verify Setup (1 min)

```bash
# Build should pass
npm run build

# Tests should pass
npm test

# TypeScript should compile
npx tsc --noEmit
```

If all pass, you're ready to develop.

If all pass, you're ready to develop.

## Architecture Patterns (Critical)

### Pattern 1: Module Isolation

**Where:** `src/modules/your-module/`

**Structure:**
```
your-module/
├── index.ts              # Module definition (implements NoteModule)
├── YourEditor.vue        # Edit component
├── YourViewer.vue        # View component
└── utils.ts              # Module-specific helpers (optional)
```

**Template:**
```typescript
// src/modules/your-module/index.ts
import type { NoteModule } from "@/types/module";

export const yourModule: NoteModule = {
  id: "your-module",
  name: "Your Module",
  version: "1.0.0",
  supportedTypes: ["your-type"],
  
  slashCommands: [{
    command: "/yourcommand",
    description: "Create your-type note"
  }],
  
  async install(context) {
    context.registerNoteType("your-type", {
      async create(data) { /* ... */ },
      async update(note, data) { /* ... */ },
      validate(note) { /* ... */ },
    });
  },
  
  components: {
    editor: YourEditor,
    viewer: YourViewer,
  }
};
```

**Register in `src/core/initModules.ts`:**
```typescript
import { yourModule } from "@/modules/your-module";
// ...
await moduleRegistry.register(yourModule);
```

### Pattern 2: Pure Functions (Preferred)

**Where:** `src/stores/notes/your-feature.ts`

**Why:** Easy to test, compose, and reason about

**Example:**
```typescript
/**
 * Extract mentions from text
 * Pure function - same input always produces same output
 */
export function extractMentions(text: string): string[] {
  const regex = /@([\p{L}\p{N}_]+)/gu;
  return [...text.matchAll(regex)].map(m => m[1]);
}

// Test (no mocks needed)
expect(extractMentions("@alice @bob")).toEqual(["alice", "bob"]);
```

**Anti-pattern (avoid):**
```typescript
// ❌ Stateful, hard to test
let cache = {};
export function extractMentions(text: string) {
  if (cache[text]) return cache[text];
  // ...
  cache[text] = result;
  return result;
}
```

### Pattern 3: Dependency Injection

**Where:** Services and managers that need external dependencies

**Why:** Testable, flexible, no hard coupling

**Example:**
```typescript
// Define dependency interface
interface EmailServiceDeps {
  apiClient: ApiClient;
  getUserEmail: () => string;
}

// Inject via constructor
export class EmailService {
  constructor(private deps: EmailServiceDeps) {}
  
  async send(message: string) {
    const email = this.deps.getUserEmail();
    await this.deps.apiClient.post("/email", { to: email, message });
  }
}

// Easy testing
const mockDeps = {
  apiClient: { post: vi.fn() },
  getUserEmail: () => "test@example.com"
};
const service = new EmailService(mockDeps);
await service.send("Hello");
expect(mockDeps.apiClient.post).toHaveBeenCalled();
```

### Pattern 4: Registry Access (Services)

**Where:** Accessing shared services

**Why:** Decouple modules, enable dynamic configuration

**Register service:**
```typescript
// In module install hook
install(context) {
  const service = new MyService();
  context.registerService("myService", service);
}
```

**Access service:**
```typescript
import { moduleRegistry } from "@/core/ModuleRegistry";

const myService = moduleRegistry.getService<MyService>("myService");
await myService.doSomething();
```

### Pattern 5: Type Contracts

**Where:** `src/types/module.ts`, `src/types/note.ts`

**Why:** Stable interfaces enable independent implementations

**Define types first:**
```typescript
// src/types/note.ts
export interface YourNote extends BaseNote {
  type: "your-type";
  content: string;
  metadata?: {
    customField?: string;
  };
}
```

**Implement handler:**
```typescript
const handler: NoteTypeHandler = {
  async create(data): Promise<YourNote> {
    return {
      id: createId(),
      type: "your-type",
      content: data.content || "",
      created: Date.now(),
      updated: Date.now(),
      metadata: data.metadata
    };
  }
  // ...
};
```

## Code Conventions

### File Organization

```
src/
├── modules/          # One directory per module
│   ├── text/
│   ├── markdown/
│   └── your-module/
├── stores/
│   └── notes/       # Modular store (one file per concern)
│       ├── utils.ts
│       ├── tags.ts
│       └── sync.ts
├── services/        # Injectable services
├── components/      # Shared UI components
└── types/          # Type definitions
```

### Naming Conventions

- **Modules:** kebab-case directory, PascalCase component (`text/`, `TextEditor.vue`)
- **Types:** PascalCase (`NoteModule`, `TextNote`)
- **Functions:** camelCase (`extractTags`, `createId`)
- **Constants:** UPPER_SNAKE_CASE (`STORAGE_KEYS`, `DEFAULT_CONFIG`)

### Import Conventions

```typescript
// Use path alias
import { useNotesStore } from "@/stores/notes";  // ✅
import { useNotesStore } from "../../stores/notes";  // ❌

// Group imports
// 1. External libraries
import { ref, computed } from "vue";
import { defineStore } from "pinia";

// 2. Types
import type { Note, NoteModule } from "@/types/note";

// 3. Internal modules
import { extractTags } from "./tags";
import { createId } from "./utils";
```

### TypeScript Strictness

```typescript
// ✅ Explicit types for public APIs
export function extractTags(text: string): string[] {
  // ...
}

// ✅ Type parameters for generics
export function clone<T>(value: T): T {
  return structuredClone(value);
}

// ✅ Return type for async functions
export async function fetchNotes(): Promise<Note[]> {
  // ...
}

// ⚠️ Avoid 'any' unless absolutely necessary
const data: any = await fetch();  // Try to type this

// ✅ Use 'unknown' and narrow
const data: unknown = await fetch();
if (isNote(data)) {
  // TypeScript knows it's a Note here
}
```

## Testing Strategy

### Unit Tests (Pure Functions)

**Location:** `src/__tests__/your-module.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { extractTags } from "@/stores/notes/tags";

describe("Tag Extraction", () => {
  it("extracts hashtags", () => {
    expect(extractTags("#hello #world")).toEqual(["hello", "world"]);
  });
  
  it("supports Unicode", () => {
    expect(extractTags("#café #日本語")).toEqual(["café", "日本語"]);
  });
  
  it("deduplicates tags", () => {
    expect(extractTags("#same #SAME")).toEqual(["same"]);
  });
});
```

### Integration Tests (Dependency Injection)

```typescript
import { describe, it, expect, vi } from "vitest";
import { SyncManager } from "@/stores/notes/sync";

describe("SyncManager", () => {
  it("queues notes when offline", () => {
    const mockDeps = {
      apiClient: { post: vi.fn() },
      getTenantId: () => "test"
    };
    
    const manager = new SyncManager(mockDeps);
    manager.addToPendingQueue("note-1");
    
    expect(manager.getPendingNotes()).toContain("note-1");
  });
});
```

### E2E Tests (User Flows)

**Location:** `e2e/your-feature.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("creates note via slash command", async ({ page }) => {
  await page.goto("/");
  
  // Type slash command
  await page.fill('[data-testid="composer"]', "/markdown");
  await page.press('[data-testid="composer"]', "Enter");
  
  // Verify note created
  await expect(page.locator(".markdown-note")).toBeVisible();
});
```

### Test Commands

```bash
# Unit tests
npm test                    # Run once (CI mode)
npm run test:ui             # Interactive UI
npm run test:coverage       # With coverage report

# E2E tests
npm run test:e2e            # Headless (CI mode)
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:headed     # See browser
npm run test:e2e:debug      # Debug mode
```

## Development Workflow

### Adding a Feature (Step-by-Step)

**1. Plan (2 min)**
- What module does this belong to?
- New module or extend existing?
- What types/interfaces needed?

**2. Create Module Structure (3 min)**
```bash
mkdir -p src/modules/my-feature
touch src/modules/my-feature/index.ts
touch src/modules/my-feature/MyFeatureEditor.vue
touch src/modules/my-feature/MyFeatureViewer.vue
```

**3. Implement Module (15-30 min)**
- Define type in `src/types/note.ts` (if new note type)
- Implement `NoteModule` interface
- Create components
- Add slash command

**4. Register Module (1 min)**
```typescript
// src/core/initModules.ts
import { myFeatureModule } from "@/modules/my-feature";
// ...
await moduleRegistry.register(myFeatureModule);
```

**5. Test (10 min)**
```bash
npm test                    # Unit tests pass
npm run test:e2e           # E2E tests pass
npm run build              # Build succeeds
```

**6. Verify in Browser (5 min)**
```bash
npm run dev
# Visit http://localhost:5174
# Test slash command
# Verify note creation/editing
```

### Debugging Tips

**1. Hot Module Replacement (HMR)**
- Changes to `.vue` files reload instantly
- Changes to `.ts` files may need manual refresh

**2. Vue DevTools**
- Install browser extension
- Inspect component state
- Check Pinia stores

**3. Console Debugging**
```typescript
// Temporary debug logs (remove before commit)
console.log("Module registered:", moduleRegistry.getAllModules());
console.log("Note state:", note);
```

**4. Test Debugging**
```bash
# Debug specific test
npm test -- --reporter=verbose my-module.test.ts

# Debug E2E visually
npm run test:e2e:headed
```

## Common Tasks

### Task: Add a New Note Type

**Time:** ~30 minutes

**Files to create:**
- `src/modules/my-type/index.ts`
- `src/modules/my-type/MyTypeEditor.vue`
- `src/modules/my-type/MyTypeViewer.vue`
- `src/__tests__/my-type.test.ts`

**Files to modify:**
- `src/types/note.ts` (add type definition)
- `src/core/initModules.ts` (register module)

**Conflict risk:** Low (1 file shared: initModules.ts)

### Task: Extend Store with New Feature

**Time:** ~15 minutes

**Files to create:**
- `src/stores/notes/my-feature.ts`
- `src/__tests__/notes/my-feature.test.ts`

**Files to modify:**
- `src/stores/notes.ts` (import and use new module)

**Conflict risk:** Low if pure functions, Medium if modifying main store

### Task: Add a New Service

**Time:** ~20 minutes

**Files to create:**
- `src/services/MyService.ts`
- `src/__tests__/MyService.test.ts`

**Files to modify:**
- Module that registers service (via `context.registerService()`)

**Conflict risk:** Very Low

## Build & Deploy

### Build for Production

```bash
npm run build
# → Output in dist/
```

### Preview Production Build

```bash
npm run preview
# → Serves dist/ at http://localhost:4173
```

### Type Checking

```bash
npx tsc --noEmit
# → Checks types without emitting files
```

### Linting (if configured)

```bash
npm run lint           # Check
npm run lint:fix       # Auto-fix
```

## Useful Scripts Reference

### Frontend (root package.json)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (localhost:5174) |
| `npm run dev-host` | Dev server (network accessible) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Unit tests (CI mode) |
| `npm run test:ui` | Unit tests (interactive) |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | E2E tests (CI mode) |
| `npm run test:e2e:ui` | E2E tests (interactive) |
| `npm run test:e2e:headed` | E2E tests (visible browser) |
| `npm run test:e2e:debug` | E2E tests (debug mode) |

### Sync Server (sync-server/package.json)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with watch mode |
| `npm run build` | Build TypeScript |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style |
| `npm run type-check` | TypeScript type checking |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open database studio |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container (port 4444) |

## Path Aliases

TypeScript path aliases (configured in `tsconfig.json`):

```typescript
import { Note } from "@/types/note";           // → src/types/note
import { moduleRegistry } from "@/core";       // → src/core
import { MyComponent } from "@/components";    // → src/components
```

**Always use `@/` prefix for absolute imports within src/.**

## Resources

- **Architecture patterns:** `docs/architecture.md`
- **Agent collaboration:** `CONTRIBUTING.md`
- **Store refactoring:** `src/stores/notes/README.md`
- **Type definitions:** `src/types/module.ts`, `src/types/note.ts`
- **Example modules:** `src/modules/text/` (simplest), `src/modules/markdown/` (typical)

## Summary for Agents

**Remember:**
1. 📦 Modules are isolated - work independently
2. 🔧 Services use DI - easy to test
3. ⚡ Pure functions preferred - simple to reason about
4. 🏗️ Registry pattern - decouple everything
5. 📝 Types first - stable contracts

**Your workflow:**
1. Read patterns (this doc + CONTRIBUTING.md)
2. Find similar example module
3. Copy pattern, adapt to your feature
4. Test thoroughly
5. Submit focused PR

**Expected development time per feature: 30-60 minutes**
