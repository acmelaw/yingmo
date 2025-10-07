# Sync Server

Optional server for multi-device synchronization, real-time collaboration, and authentication. Mirrors the frontend's modular architecture for consistency.

## Architecture Philosophy

The sync server follows the **same patterns as the frontend:**

1. **Module System** - Note type handlers mirror frontend modules
2. **Service Registry** - Dependency injection for testability
3. **Type Contracts** - Shared types between frontend/backend
4. **Pure Functions** - Business logic extracted from framework code

**Current Implementation:** Fastify + Drizzle + Better Auth  
**Key Point:** Libraries may change, patterns persist.

## Getting Started

### Prerequisites

- Node.js >= 18

### Quick Start

```bash
cd sync-server
npm install
npm run dev
# → Server at http://localhost:4444
```

### Verify Setup

```bash
# TypeScript should compile
npm run type-check

# Tests should pass
npm test

# Build should succeed
npm run build
```

### Verify Setup

```bash
# TypeScript should compile
npm run type-check

# Tests should pass
npm test

# Build should succeed
npm run build
```

## Server Architecture (Mirrors Frontend)

### Module Registry Pattern

**Server modules register just like frontend:**

```typescript
// sync-server/services/ModuleRegistry.ts
class ModuleRegistry {
  private modules = new Map<string, NoteModule>();

  register(module: NoteModule) {
    this.modules.set(module.id, module);
  }
}

// Registration
import { textModule } from "./modules/text";
moduleRegistry.register(textModule);
```

### Shared Type Contracts

**Same types on both sides:**

```typescript
// Frontend: src/types/note.ts
export interface TextNote extends BaseNote {
  type: "text";
  content: string;
}

// Server: sync-server/types/note.ts (identical)
export interface TextNote extends BaseNote {
  type: "text";
  content: string;
}
```

### Service Layer (Dependency Injection)

```typescript
// sync-server/services/NoteService.ts
export class NoteService {
  constructor(
    private deps: {
      db: Database;
      moduleRegistry: ModuleRegistry;
    }
  ) {}

  async create(type: NoteType, data: any) {
    const module = this.deps.moduleRegistry.getModule(type);
    const note = await module.handler.create(data);
    await this.deps.db.insert(notes).values(note);
    return note;
  }
}
```

## Development Workflow

### Adding a Server Module

**1. Create module file:**

```bash
touch sync-server/modules/my-module.ts
```

**2. Implement handler:**

```typescript
// sync-server/modules/my-module.ts
import type { NoteTypeHandler } from "../types/module";

export const myModuleHandler: NoteTypeHandler = {
  async create(data) {
    // Server-side creation logic
    // May include validation, enrichment, etc.
  },

  async update(note, data) {
    // Server-side update logic
  },
};

export const myModule = {
  id: "my-module",
  handler: myModuleHandler,
};
```

**3. Register:**

```typescript
// sync-server/server.ts
import { myModule } from "./modules/my-module";
moduleRegistry.register(myModule);
```

**4. Test:**

```typescript
// sync-server/__tests__/my-module.test.ts
import { describe, it, expect } from "vitest";
import { myModule } from "../modules/my-module";

describe("My Module", () => {
  it("creates notes correctly", async () => {
    const note = await myModule.handler.create({ content: "test" });
    expect(note.type).toBe("my-type");
  });
});
```

## Database Operations

**Current:** Drizzle ORM on better-sqlite3  
**Pattern:** Abstract database access through service layer

```typescript
// sync-server/services/NoteService.ts
export class NoteService {
  async findById(id: string) {
    // Database abstraction
    return this.db.query.notes.findFirst({
      where: eq(notes.id, id),
    });
  }
}
```

**Migration commands:**

```bash
npm run db:generate   # Generate migrations from schema
npm run db:migrate    # Apply migrations
npm run db:studio     # Visual database explorer
```

## API Endpoints

### REST API (HTTP)

**Pattern:** Routes delegate to services

```typescript
// sync-server/routes/notes.ts
export async function registerNoteRoutes(fastify, noteService) {
  fastify.post("/api/notes", async (request, reply) => {
    const { type, data } = request.body;
    const note = await noteService.create(type, data);
    return { note };
  });
}
```

### WebSocket API (Real-time)

**Pattern:** WebSocket handles Yjs sync protocol

```typescript
// sync-server/server.ts
fastify.get("/api/sync", { websocket: true }, (connection, request) => {
  const room = request.query.room || "default";
  handleYjsSync(connection, room);
});
```

## Testing Strategy

### Unit Tests (Services)

```typescript
import { describe, it, expect, vi } from "vitest";
import { NoteService } from "../services/NoteService";

describe("NoteService", () => {
  it("creates notes via module handler", async () => {
    const mockDb = { insert: vi.fn() };
    const mockRegistry = {
      getModule: () => ({
        handler: { create: async (data) => ({ ...data, id: "123" }) },
      }),
    };

    const service = new NoteService({
      db: mockDb,
      moduleRegistry: mockRegistry,
    });
    const note = await service.create("text", { content: "test" });

    expect(note.id).toBe("123");
  });
});
```

### Integration Tests (Modules)

```typescript
describe("Text Module Integration", () => {
  it("registers and handles text notes", async () => {
    await moduleRegistry.register(textModule);

    const handler = moduleRegistry.getHandler("text");
    const note = await handler.create({ content: "Hello" });

    expect(note.type).toBe("text");
    expect(note.content).toBe("Hello");
  });
});
```

## Deployment

### Docker

**Build image:**

```bash
npm run docker:build
```

**Run container:**

```bash
npm run docker:run
# → Exposes port 4444
```

**Custom port:**

```bash
docker run -p 8080:4444 vue-notes-sync
```

### Environment Variables

```bash
# .env (create in sync-server/)
PORT=4444
HOST=0.0.0.0
DATABASE_URL=./data/notes.db
NODE_ENV=production
```

### Production Build

```bash
npm run build    # TypeScript → JavaScript in dist/
npm start        # Run dist/server.js
```

## Commands Reference

| Command                 | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Dev server with auto-reload (tsx watch) |
| `npm run build`         | Compile TypeScript to dist/             |
| `npm start`             | Run production build (dist/server.js)   |
| `npm test`              | Run unit tests                          |
| `npm run test:watch`    | Watch mode for tests                    |
| `npm run test:coverage` | Coverage report                         |
| `npm run lint`          | Check code style                        |
| `npm run lint:fix`      | Auto-fix style issues                   |
| `npm run type-check`    | TypeScript type checking                |
| `npm run db:generate`   | Generate Drizzle migrations             |
| `npm run db:migrate`    | Run database migrations                 |
| `npm run db:studio`     | Open database UI                        |
| `npm run docker:build`  | Build Docker image                      |
| `npm run docker:run`    | Run in Docker (port 4444)               |

## Parallel Development Tips

### Low-Conflict Operations

✅ **Safe for parallel work:**

- Add new module in `modules/`
- Add new route in `routes/`
- Add new service in `services/`
- Add tests in `__tests__/`

### Coordination Required

⚠️ **Coordinate before modifying:**

- `server.ts` (main entry point)
- `db/schema.ts` (database schema)
- `types/note.ts` (shared type definitions)

### Module Conflicts

If two agents add modules simultaneously:

```typescript
// Agent A adds:
moduleRegistry.register(moduleA);

// Agent B adds:
moduleRegistry.register(moduleB);

// Merge: Just include both lines
moduleRegistry.register(moduleA);
moduleRegistry.register(moduleB);
```

Simple additive merges work.

## Architecture Notes

**Current stack (subject to change):**

- Web framework: Fastify
- Database: better-sqlite3 + Drizzle ORM
- Auth: Better Auth
- WebSocket: ws + y-protocols for Yjs
- Real-time: Yjs CRDT

**Patterns that persist:**

- Module registry system
- Dependency injection
- Type contracts
- Service layer abstraction

When libraries change, well-architected code survives:

1. Business logic in pure functions ✅
2. Framework code in routes/server.ts ✅
3. Database access through service layer ✅
4. Shared types with frontend ✅

## Resources

- **Frontend patterns:** `docs/architecture.md`
- **Module development:** `CONTRIBUTING.md`
- **Type definitions:** `sync-server/types/module.ts`
- **Example modules:** `sync-server/modules/text.ts` (simplest)
