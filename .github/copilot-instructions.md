# Copilot Instructions for Yingmo

## Repository Overview

Yingmo is a pluggable, modular notes application designed for **parallel development by multiple independent agents**. The architecture emphasizes extensibility, separation of concerns, and minimal code delta changes to enable simultaneous work across the codebase.

## Core Architecture Principles

### 1. Plugin-Based Module System

Every feature is a self-contained module that registers with the central `ModuleRegistry`. Modules are isolated and can be developed independently without conflicts.

### 2. Dependency Injection

Never hardcode dependencies. Use the registry pattern or inject via constructor parameters to enable isolated development and testing.

### 3. Modular Store Architecture

The notes store is split into independent modules in `src/stores/notes/` - each module is independently testable with pure functions or injectable classes.

### 4. Type Safety

All modules implement standard interfaces defined in `src/types/`. Always use existing types and never create parallel type systems.

## Development Workflow

### Prerequisites

- Node.js >= 18
- Read `CONTRIBUTING.md` for detailed collaboration patterns
- Review `docs/development.md` for code conventions
- Review `docs/linting-formatting.md` for code style requirements

### Setup

```bash
npm install
npm run dev              # Start dev server
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run build            # Build for production
```

### Code Quality & Formatting

**Pre-commit hooks automatically run** via Husky to format and lint staged files:

- **ESLint** - Lints TypeScript and Vue files
- **Prettier** - Formats code consistently (2 spaces, semicolons, double quotes)

**Manual commands:**

```bash
npm run lint             # Check linting (warnings only)
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without changes
```

**Configuration files:**

- `.eslintrc.cjs` - ESLint rules (Vue 3 + TypeScript + Prettier)
- `.prettierrc.json` - Prettier config (2 spaces, semicolons, LF line endings)
- `.editorconfig` - Editor settings (UTF-8, trim whitespace)

**IMPORTANT:** Always run `npm run lint:fix && npm run format` before committing if pre-commit hooks are not set up.

### Adding a New Module (Most Common Task)

1. **Create module directory**: `src/modules/your-module/`
2. **Implement required files**:
   - `index.ts` - Module definition implementing `NoteModule` interface
   - `YourModuleEditor.vue` - Edit component
   - `YourModuleViewer.vue` - View component
   - `utils.ts` (optional) - Module-specific logic

3. **Register module** in `src/core/initModules.ts`:

   ```typescript
   await moduleRegistry.register(yourModule);
   ```

4. **Add tests** in `src/__tests__/your-module.test.ts`

5. **Lint and format**:

   ```bash
   npm run lint:fix         # Fix linting issues
   npm run format           # Format code
   ```

6. **Verify**:
   - Linting passes: `npm run lint`
   - Formatting is correct: `npm run format:check`
   - Build passes: `npm run build`
   - Tests pass: `npm test && npm run test:e2e`
   - Module registered correctly

**Example module structure** - see `src/modules/text/` (simplest) or `src/modules/markdown/` (typical)

## Conflict-Free Zones for Parallel Development

✅ **Safe for parallel work** (no coordination needed):

- New module in `src/modules/`
- New store module in `src/stores/notes/`
- New service in `src/services/`
- New component in `src/components/`
- Tests in `src/__tests__/`

⚠️ **Coordinate before modifying**:

- Core type definitions (`src/types/note.ts`)
- Main store file (`src/stores/notes.ts`)
- App initialization (`src/main.ts`)
- Package dependencies (`package.json`)

## Code Patterns & Conventions

### File Organization

```
src/
├── modules/              # Pluggable note type modules
├── stores/notes/         # Modular store (utils, tags, sync, etc.)
├── core/                 # Module registry and initialization
├── types/                # Shared type definitions
├── services/             # Injectable services
└── components/           # UI components
```

### Naming Conventions

- Modules: `kebab-case` (e.g., `chord-sheet`)
- Components: `PascalCase.vue` (e.g., `MarkdownEditor.vue`)
- Services: `PascalCase.ts` (e.g., `NoteService.ts`)
- Types: `PascalCase` interfaces/types
- Files: Match primary export name

### Import Conventions

```typescript
// Use path aliases
import { Note } from "@/types/note";
import { moduleRegistry } from "@/core";
import { MyComponent } from "@/components";
```

### TypeScript Strictness

- Strict mode enabled
- No `any` without explicit justification (warnings allowed)
- All public APIs fully typed
- Prefer interfaces for contracts, types for unions/intersections

### Code Style (Enforced by Prettier + ESLint)

- **Indentation:** 2 spaces
- **Semicolons:** Required
- **Quotes:** Double quotes
- **Line endings:** LF (Unix-style)
- **Trailing commas:** ES5 style
- **Print width:** 80 characters
- **Arrow function parens:** Always

## Testing Requirements

### Unit Tests

- Pure functions: Test in isolation (see `src/__tests__/notes/tags.test.ts`)
- Injectable classes: Mock dependencies (see `src/__tests__/notes/sync.test.ts`)
- All new functionality must have tests

### E2E Tests

- Critical user flows in `e2e/` directory
- Module registration and slash commands
- Run with `npm run test:e2e`

### Test Patterns

```typescript
// Pure function test
describe("createId", () => {
  it("generates unique IDs", () => {
    const id1 = createId();
    const id2 = createId();
    expect(id1).not.toBe(id2);
  });
});

// Injectable class test
describe("SyncManager", () => {
  it("syncs with injected API client", async () => {
    const mockClient = { post: vi.fn() };
    const sync = new SyncManager({ apiClient: mockClient });
    await sync.syncNote(note);
    expect(mockClient.post).toHaveBeenCalled();
  });
});
```

## Pull Request Guidelines

### Branch Naming

- `feat/module-name` - New module
- `fix/module-name` - Bug fix in module
- `refactor/area` - Refactoring (coordinate with other agents)
- `docs/topic` - Documentation only

### Commit Messages

```
feat(my-module): add slash command support

- Implement /mycommand for creating my-type notes
- Add MyModuleEditor component
- Register in module system
```

### PR Checklist

- [ ] Linting passes: `npm run lint`
- [ ] Formatting is correct: `npm run format:check`
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test && npm run test:e2e`
- [ ] Module registered in `initModules.ts`
- [ ] Tests added for new functionality
- [ ] Types defined in `src/types/` or module
- [ ] No hardcoded dependencies (use DI)
- [ ] Follows existing patterns (check similar modules)
- [ ] Minimal file changes (only affected files)

## Common Tasks

### Task: Add a New Note Type

1. Create module in `src/modules/your-type/`
2. Implement `NoteModule` interface
3. Create Editor and Viewer components
4. Add slash command configuration
5. Register in `initModules.ts`
6. Add tests for note creation, editing, viewing
7. **Run linting and formatting**: `npm run lint:fix && npm run format`

### Task: Extend Store with New Feature

1. Create new file in `src/stores/notes/your-feature.ts`
2. Export pure functions or injectable class
3. Import in main store `src/stores/notes.ts` if needed
4. Add tests in `src/__tests__/notes/your-feature.test.ts`
5. **Run linting and formatting**: `npm run lint:fix && npm run format`

### Task: Add a New Service

1. Create `src/services/YourService.ts`
2. Implement service interface with DI
3. Register via `moduleRegistry.registerService()`
4. Add tests with mocked dependencies
5. **Run linting and formatting**: `npm run lint:fix && npm run format`

## Important Files & Resources

### Essential Documentation

- **CONTRIBUTING.md** - Collaboration guide (READ THIS FIRST)
- **docs/architecture.md** - System design and data flow
- **docs/development.md** - Code conventions and patterns
- **docs/linting-formatting.md** - Linting and formatting setup
- **docs/screenshots.md** - Screenshot generation workflow
- **src/stores/notes/README.md** - Store refactoring guide

### Type Definitions

- **src/types/module.ts** - Module system contracts
- **src/types/note.ts** - Note type definitions

### Example Modules

- **src/modules/text/** - Simplest module (start here)
- **src/modules/markdown/** - Typical module with editor
- **src/modules/code/** - Module with parameters
- **src/modules/smart-layer/** - Complex module

## Key Principles for Coding Agents

1. **One module per PR** - Minimize merge conflicts
2. **Follow existing patterns** - Check similar modules for conventions
3. **Use dependency injection** - Never hardcode service references
4. **Write isolated tests** - Each module must be independently testable
5. **Register, don't import** - Use `ModuleRegistry` for cross-module access
6. **Minimal changes** - Only modify files directly related to your task
7. **Pure functions preferred** - Simple to test and reason about
8. **Library agnostic** - Focus on architectural patterns, not specific frameworks
9. **Lint and format** - Always run `npm run lint:fix && npm run format` before committing
10. **Pre-commit hooks** - Husky automatically formats staged files on commit

## Build & Test Commands

```bash
# Frontend
npm run dev              # Dev server (http://localhost:5174)
npm run build            # Production build
npm run preview          # Preview production build
npm test                 # Unit tests
npm run test:ui          # Tests with UI
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests (CI mode)
npm run test:e2e:ui      # E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests

# Code Quality
npm run lint             # Check linting (warnings only)
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without changes

# Screenshots (for documentation)
npm run screenshots      # Generate all screenshots
npm run screenshots:hero # Generate hero screenshot only
npm run screenshots:features # Generate feature screenshots

# Sync Server (optional)
cd sync-server
npm install
npm run dev              # Dev server (http://localhost:4444)
npm run build            # Build
npm test                 # Tests
npm run lint             # Lint code
npm run type-check       # TypeScript check
```

## CI/CD Pipeline

### GitHub Actions Workflows

**`.github/workflows/ci.yml`** - Runs on push/PR to main:

- Install dependencies
- Type check
- Lint check
- Format check
- Build
- Run unit tests
- Run E2E tests
- Generate hero screenshot (auto-commits to main)

**`.github/workflows/lint.yml`** - Runs on PRs:

- ESLint check
- Prettier format check

**Pre-commit Hooks** (Husky):

- Automatically formats and lints staged files before commit
- Configured in `.husky/pre-commit`
- Uses `lint-staged` to process only changed files

## Avoiding Merge Conflicts

### Conflict Probability Matrix

- Add new module: 🟡 5% (merge initModules.ts)
- Add store module: ⚪ 0% (new file)
- Add service: ⚪ 0% (new file)
- Add component: ⚪ 0% (new file)
- Modify types: 🔴 80% (coordinate!)
- Modify main store: 🔴 60% (coordinate!)
- Add dependency: 🔴 50% (coordinate!)

### Communication Pattern

If modifying shared files:

1. Announce intent: "Modifying src/types/note.ts to add XType"
2. Make minimal changes
3. Commit immediately after testing
4. Notify completion

## Summary

**Remember:**

- 📦 Modules are isolated - work independently
- 🔧 Services use DI - easy to test
- ⚡ Pure functions preferred - simple to reason about
- 🏗️ Registry pattern - decouple everything
- 📝 Types first - stable contracts

**Your workflow:**

1. Read patterns (CONTRIBUTING.md + docs/development.md)
2. Find similar example module
3. Copy pattern, adapt to your feature
4. Test thoroughly
5. Submit focused PR

**Expected development time per feature: 30-60 minutes**
