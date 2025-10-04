# Vue Notes Sync Server v3.0 - Modular Architecture

## 🎉 Major Refactoring Complete

The sync server has been completely refactored to match the frontend's modular architecture, supporting all note types and providing a clean, extensible backend.

## 📋 Features

### ✅ Modular Note Type System
- **6 Note Types Supported**: text, rich-text, markdown, code, image, smart-layer
- **Extensible Architecture**: Easy to add new note types via modules
- **Type Handlers**: Each note type has its own CRUD operations
- **Module Registry**: Central registry for managing all modules

### ✅ Enhanced Database Schema
- **Type-specific storage**: Generic `content` field stores type-specific data as JSON
- **Legacy compatibility**: Maintains `text` and `tiptapContent` fields for migration
- **Metadata support**: Flexible metadata field for custom note attributes
- **Edit history**: Track all changes to notes over time

### ✅ REST API
- **CRUD Operations**: Full create, read, update, delete support
- **Type Filtering**: Filter notes by type, category, tags, archived status
- **Bulk Sync**: Legacy compatibility endpoint for syncing multiple notes
- **Edit History**: Retrieve historical changes for any note

### ✅ Real-time Collaboration
- **Yjs Integration**: WebSocket-based real-time sync
- **Awareness Protocol**: See other users' cursors and selections
- **Room Management**: Isolated collaboration spaces
- **Auto-persistence**: Automatic saving of Yjs document state

## 🏗️ Architecture

```
sync-server/
├── types/
│   ├── note.ts           # All note type definitions
│   └── module.ts         # Module system interfaces
├── services/
│   ├── ModuleRegistry.ts # Central module management
│   └── NoteService.ts    # CRUD operations service
├── modules/
│   ├── index.ts          # Module initialization
│   ├── text.ts           # Text note module
│   ├── rich-text.ts      # Rich text note module
│   ├── markdown.ts       # Markdown note module
│   ├── code.ts           # Code note module
│   ├── image.ts          # Image note module
│   └── smart-layer.ts    # Smart layer note module
├── routes/
│   └── notes.ts          # REST API routes
├── db/
│   ├── schema.ts         # Database schema
│   └── migrate.ts        # Migration utilities
├── server.ts             # Legacy server (PoC)
└── server-modular.ts     # New modular server
```

## 🚀 Getting Started

### Run the New Modular Server

```bash
cd sync-server
npm run dev:modular
```

Or start it manually:
```bash
tsx server-modular.ts
```

### API Endpoints

#### Notes API
- `POST /api/notes` - Create a note
- `GET /api/notes` - List notes (with filters)
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note
- `POST /api/notes/sync` - Bulk sync (legacy)
- `GET /api/notes/:id/history` - Get edit history

#### System
- `GET /health` - Health check & system info
- `GET /api/rooms` - List active Yjs rooms
- `WS /api/sync?room=<name>` - WebSocket collaboration

### Example: Create a Note

```bash
curl -X POST http://localhost:4444/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "tenantId": "default",
    "userId": "user1",
    "data": {
      "id": "note-123",
      "text": "Hello World",
      "tags": ["greeting"],
      "category": "general"
    }
  }'
```

### Example: Create a Rich Text Note

```bash
curl -X POST http://localhost:4444/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rich-text",
    "tenantId": "default",
    "userId": "user1",
    "data": {
      "content": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Hello " },
              { "type": "text", "text": "World", "marks": [{ "type": "bold" }] }
            ]
          }
        ]
      }
    }
  }'
```

## 🔧 Adding a New Note Type

1. **Create Module File**: `modules/my-type.ts`

```typescript
import type { NoteModule, NoteTypeHandler, ModuleContext } from "../types/module.js";
import type { MyNote, BaseNote, Note } from "../types/note.js";

const myNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<MyNote> {
    return {
      ...baseNote,
      type: "my-type",
      // ... type-specific fields
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    // Update logic
  },

  validate(note: Note): boolean {
    // Validation logic
  },

  serialize(note: Note): any {
    // Serialize for database
  },

  deserialize(data: any, baseNote: BaseNote): MyNote {
    // Deserialize from database
  },
};

export const myNoteModule: NoteModule = {
  id: "my-note",
  name: "My Note Type",
  version: "1.0.0",
  supportedTypes: ["my-type"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("my-type", myNoteHandler);
    context.log("My note module installed");
  },
};
```

2. **Register in `modules/index.ts`**:

```typescript
import { myNoteModule } from "./my-type.js";

export async function initializeModules() {
  await moduleRegistry.register(myNoteModule);
  // ...
}
```

3. **Add Type Definition in `types/note.ts`**:

```typescript
export type NoteType = "text" | "rich-text" | "my-type" | ...;

export interface MyNote extends BaseNote {
  type: "my-type";
  // ... custom fields
}

export type Note = TextNote | RichTextNote | MyNote | ...;
```

## 🔄 Migration from Legacy Server

The new server maintains backward compatibility:

1. **Legacy Fields**: `text` and `tiptapContent` still stored
2. **Auto-detection**: Text notes automatically use text handler
3. **Sync Endpoint**: `/api/notes/sync` works as before
4. **Database Schema**: Extended, not replaced

To migrate:
1. Keep both servers running during transition
2. Update frontend to use new endpoints gradually
3. Test all note types
4. Switch over when ready

## 📊 Database Schema Changes

### Before (PoC)
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  tiptapContent TEXT,
  ...
);
```

### After (Modular)
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,  -- JSON, type-specific
  text TEXT,              -- Legacy
  tiptapContent TEXT,     -- Legacy
  metadata TEXT,          -- JSON, flexible
  ...
);
```

## 🧪 Testing

```bash
# Run tests (when added)
npm test

# Check module registration
curl http://localhost:4444/health
```

## 📝 Next Steps

1. **Database Migration**: Create migration script for existing data
2. **Tests**: Add comprehensive test suite
3. **Auth Integration**: Connect Better Auth properly
4. **File Storage**: Add support for image/file uploads
5. **Search**: Implement full-text search across note types
6. **API Docs**: Generate OpenAPI/Swagger documentation

## 🎯 Benefits

✅ **Type Safety**: Full TypeScript support
✅ **Extensibility**: Easy to add new note types
✅ **Maintainability**: Clean separation of concerns
✅ **Testability**: Modular architecture enables unit testing
✅ **Scalability**: Can add features without breaking existing code
✅ **Frontend Alignment**: Backend matches frontend architecture
