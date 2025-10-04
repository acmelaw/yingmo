# Collaborative Editing with Yjs & Tiptap

This document explains the collaborative editing architecture using CRDTs (Conflict-free Replicated Data Types) via Yjs and rich text editing with Tiptap.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vue 3)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Tiptap     │  │     Yjs      │  │   WebSocket     │  │
│  │  Rich Editor │─▶│     CRDT     │─▶│    Provider     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                  │                   │            │
│         │                  │                   │            │
│         └──────────────────┴───────────────────┘            │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ WebSocket
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                 │
│                FastAPI Backend (Python)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   WebSocket     │  │   Document   │  │  Persistence │  │
│  │     Server      │─▶│    Rooms     │─▶│   (Optional) │  │
│  └─────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Yjs (CRDT Engine)

**What it does:**
- Manages conflict-free document synchronization
- Tracks changes across multiple clients
- Resolves conflicts automatically
- Supports offline editing with automatic merge

**File:** `src/composables/useCollaboration.ts`

```typescript
const { doc, provider, state } = useCollaboration({
  roomId: 'note-123',
  serverUrl: 'ws://localhost:8000',
  username: 'Alice',
})
```

**Features:**
- Automatic reconnection
- IndexedDB persistence
- Awareness (user presence)
- Undo/redo support

### 2. Tiptap (Rich Text Editor)

**What it does:**
- Provides rich text editing interface
- Built on ProseMirror (robust editing foundation)
- Extensible with plugins
- Vue 3 integration

**File:** `src/components/CollaborativeEditor.vue`

**Supported formatting:**
- **Bold**, *Italic*, ~~Strikethrough~~
- Headings (H1, H2, H3)
- Lists (bullet, numbered, tasks)
- Code blocks
- Links
- Highlighting

### 3. WebSocket Server (FastAPI)

**What it does:**
- Broadcasts changes between clients
- Maintains document state
- Manages rooms (one per document)
- Handles persistence

**File:** `server/main.py`

**Endpoints:**
- `WS /api/sync/{room_id}` - WebSocket for real-time sync
- `GET /api/rooms` - List active rooms
- `POST /api/documents/{doc_id}/save` - Save document
- `GET /api/documents/{doc_id}` - Load document

## How It Works

### 1. Document Creation

```typescript
// Create a collaborative note
const noteId = store.add(
  "Initial content",
  "category",
  ["tag1", "tag2"],
  true // collaborative = true
);

// This creates:
// - A Note in the store
// - A Y.Doc (Yjs document)
// - IndexedDB persistence
// - WebSocket connection to room
```

### 2. Real-Time Synchronization

```
Client A types "Hello"
     │
     ├─▶ Yjs creates update (binary)
     │
     ├─▶ WebSocket sends to server
     │
Server broadcasts to all clients
     │
     ├─▶ Client B receives update
     │
     └─▶ Client B's Yjs doc updates
         └─▶ Tiptap editor re-renders
```

### 3. Conflict Resolution

Yjs uses a CRDT algorithm that guarantees:
- **Eventual consistency** - All clients converge to the same state
- **No manual merging** - Conflicts resolved automatically
- **Causal ordering** - Edits applied in correct order

**Example:**
```
Time    Client A        Client B        Result
────────────────────────────────────────────────
T0      "Hello"         "Hello"         "Hello"
T1      "Hello World"   "Hello there"   (conflict!)
T2      (sync)          (sync)          "Hello World there"
```

### 4. Offline Support

```typescript
// Works offline!
// Changes stored in IndexedDB
editor.insert("Offline edit");

// When back online
// - IndexedDB syncs to Y.Doc
// - WebSocket syncs to server
// - All clients receive updates
```

## Usage Guide

### Basic Setup

1. **Start the backend:**
```bash
cd server
pip install -r requirements.txt
python main.py
```

2. **Start the frontend:**
```bash
npm run dev
```

3. **Enable collaboration:**
```bash
# In .env
VITE_ENABLE_COLLAB=true
VITE_COLLAB_SERVER=ws://localhost:8000
```

### Creating a Collaborative Note

```typescript
// In Vue component
const store = useNotesStore();

// Create collaborative note
const noteId = store.add(
  "Note content",
  undefined, // category
  undefined, // tags
  true       // collaborative!
);
```

### Using the Editor

```vue
<template>
  <CollaborativeNoteItem
    :note="note"
    username="Alice"
    userColor="#4ecdc4"
    @update="handleUpdate"
  />
</template>
```

### Monitoring Collaboration

```typescript
const { state } = useCollaboration({ roomId: 'note-123' });

// Check connection
console.log(state.isConnected.value); // true/false

// Active users
console.log(state.activeUsers.value); // 3

// Sync status
console.log(state.isSynced.value); // true/false
```

## Advanced Features

### 1. User Awareness (Cursors)

Shows where other users are typing:

```typescript
// Tiptap automatically shows:
// - User cursor position
// - User name
// - User color
```

### 2. Presence Detection

```typescript
// Get all connected users
const awareness = provider.awareness;
const users = Array.from(awareness.getStates().values());

users.forEach(user => {
  console.log(user.name, user.color);
});
```

### 3. History & Undo

```typescript
// Built-in undo/redo
editor.chain().undo().run();
editor.chain().redo().run();

// Works across network!
// Undoes your changes, not others
```

### 4. Persistence Strategies

**Client-side (IndexedDB):**
```typescript
// Automatic with y-indexeddb
const persistence = new IndexeddbPersistence(roomId, doc);
```

**Server-side (Optional):**
```python
# In server/main.py
# Add database integration
async def save_to_database(room_id: str, state: bytes):
    # Save to PostgreSQL, MongoDB, etc.
    pass
```

## Production Deployment

### Frontend

```bash
# Build with collaboration enabled
VITE_ENABLE_COLLAB=true \
VITE_COLLAB_SERVER=wss://your-domain.com \
npm run build
```

### Backend

**Option 1: Same server**
```bash
# Server both frontend and WebSocket
cd server
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Option 2: Separate services**
```bash
# Frontend: Netlify/Vercel
# Backend: Heroku/Railway/Fly.io

# Update CORS in server/main.py
allow_origins=["https://your-frontend.com"]
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY server/requirements.txt .
RUN pip install -r requirements.txt

COPY server/ .
COPY dist/ ./dist/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Scaling Considerations

**Horizontal scaling:**
- Use Redis for pub/sub between server instances
- Share document state via Redis

```python
# Example with Redis
import redis
r = redis.Redis()

# Broadcast to all instances
r.publish(f'room:{room_id}', message)
```

**Database persistence:**
```python
# Periodically snapshot documents
async def snapshot_document(room_id: str):
    state = rooms[room_id].state
    await db.save_snapshot(room_id, state, timestamp=now())
```

## Security

### Authentication

```python
# In server/main.py
@app.websocket("/api/sync/{room_id}")
async def websocket_sync(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(None)  # Auth token
):
    user = await verify_token(token)
    if not user:
        await websocket.close(code=4001)
        return
    
    # Check permissions
    if not can_access_room(user, room_id):
        await websocket.close(code=4003)
        return
```

### Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@limiter.limit("100/minute")
@app.websocket("/api/sync/{room_id}")
async def websocket_sync(...):
    pass
```

### Encryption

```typescript
// Client-side encryption
import { encryptUpdate, decryptUpdate } from './crypto';

// Before sending
const encrypted = encryptUpdate(update, secretKey);
websocket.send(encrypted);

// After receiving
const decrypted = decryptUpdate(encrypted, secretKey);
doc.applyUpdate(decrypted);
```

## Troubleshooting

### Connection Issues

**Problem:** WebSocket won't connect

**Solution:**
```bash
# Check server is running
curl http://localhost:8000

# Check WebSocket endpoint
wscat -c ws://localhost:8000/api/sync/test-room

# Check CORS settings
# In server/main.py, verify allow_origins
```

### Sync Conflicts

**Problem:** Documents out of sync

**Solution:**
```typescript
// Force full sync
provider.disconnect();
provider.connect();

// Or clear local state
await indexeddbProvider.clearData();
location.reload();
```

### Performance Issues

**Problem:** Slow with large documents

**Solution:**
```typescript
// 1. Debounce updates
const debouncedUpdate = debounce((update) => {
  websocket.send(update);
}, 100);

// 2. Split large documents
// Use multiple Y.Docs for different sections

// 3. Limit history
doc.gc = true; // Enable garbage collection
```

## Migration from Old Store

```typescript
// Migrate existing notes to collaborative
import { useNotesStore } from '@/stores/notes';
import { useNotesStore as useCollabStore } from '@/stores/notesCollaborative';

const oldStore = useNotesStore();
const newStore = useCollabStore();

// Migrate
oldStore.notes.forEach(note => {
  newStore.add(
    note.text,
    note.category,
    note.tags,
    false // Start non-collaborative
  );
});
```

## API Reference

### useCollaboration

```typescript
interface CollaborationConfig {
  roomId: string;           // Unique room identifier
  serverUrl?: string;       // WebSocket server URL
  enablePersistence?: boolean; // Enable IndexedDB
  username?: string;        // User display name
  userColor?: string;       // User cursor color
}

const {
  doc,          // Y.Doc - Yjs document
  provider,     // WebSocketProvider
  state: {
    isConnected,  // Ref<boolean>
    isSynced,     // Ref<boolean>
    activeUsers,  // Ref<number>
    error,        // Ref<string | null>
  },
  destroy,      // Cleanup function
} = useCollaboration(config);
```

### CollaborativeEditor Props

```typescript
interface Props {
  ydoc: Y.Doc;              // Yjs document
  fieldName?: string;       // Field in Y.Doc
  placeholder?: string;     // Editor placeholder
  editable?: boolean;       // Read-only mode
  username?: string;        // Current user
  userColor?: string;       // Cursor color
  autoFocus?: boolean;      // Focus on mount
}
```

## Resources

- [Yjs Documentation](https://docs.yjs.dev/)
- [Tiptap Documentation](https://tiptap.dev/)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [CRDT Explained](https://crdt.tech/)

---

Happy collaborating! 🤝✨
