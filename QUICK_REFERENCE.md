# Vue Notes - Quick Reference

## 🚀 Start Development

```bash
# Terminal 1 - Frontend
cd /Users/eric/Projects/vue-notes
npm run dev
# Opens at http://localhost:5174

# Terminal 2 - Sync Server
cd /Users/eric/Projects/vue-notes/sync-server
npm run dev
# WebSocket at ws://localhost:4444
```

## 📁 Key Files

### Frontend
- **Main App**: `src/App.vue` → `src/components/NoteShell.vue`
- **Store**: `src/stores/notes.ts` (unified, CRDT-aware)
- **Design Tokens**: `src/design/tokens.ts`
- **Base Components**: `src/components/ui/Brutal*.vue`
- **Module Registry**: `src/core/ModuleRegistry.ts`

### Sync Server
- **Server**: `sync-server/server.ts`
- **WebSocket Handler**: Lines 230-330 (path-based routing)
- **Database**: `sync-server/data/vue-notes.db` (SQLite)
- **Modules**: `sync-server/modules/*.ts`

## 🎨 Design System Usage

### Buttons
```vue
<BrutalButton variant="primary" size="md" @click="handleClick">
  Click Me
</BrutalButton>

<!-- Variants: default, primary, secondary, accent -->
<!-- Sizes: sm, md, lg -->

<!-- Icon button -->
<BrutalButton icon @click="handleClick">
  ⚙️
</BrutalButton>
```

### Inputs
```vue
<BrutalInput 
  v-model="text"
  placeholder="Type here..."
  @submit="handleSubmit"
/>

<!-- Multiline -->
<BrutalInput 
  v-model="text"
  multiline
  :rows="5"
/>
```

### Cards
```vue
<BrutalCard variant="default" hover>
  <h3>Card Title</h3>
  <p>Card content</p>
</BrutalCard>
```

### Chips/Tags
```vue
<BrutalChip variant="accent" removable @remove="handleRemove">
  #tag
</BrutalChip>
```

### Modals
```vue
<BrutalModal v-model="showModal">
  <template #default="{ close }">
    <h2>Modal Title</h2>
    <p>Content</p>
    <BrutalButton @click="close">Close</BrutalButton>
  </template>
</BrutalModal>
```

## 🔌 Module System

### Creating a New Note Type Module

1. **Define the module** (`src/modules/mynote/index.ts`):
```typescript
import type { NoteModule, NoteTypeHandler } from '@/types/module';

const handler: NoteTypeHandler = {
  async create(data: any) {
    return {
      id: crypto.randomUUID(),
      type: 'mynote',
      ...data,
      created: Date.now(),
      updated: Date.now(),
    };
  },
  async update(note, updates) {
    return { ...note, ...updates, updated: Date.now() };
  },
  async delete(note) {},
  validate(note) { return true; },
  serialize(note) { return JSON.stringify(note); },
  deserialize(data) { return JSON.parse(data); },
};

export const myNoteModule: NoteModule = {
  id: 'my-note',
  name: 'My Note Type',
  version: '1.0.0',
  supportedTypes: ['mynote'],
  
  async install(context) {
    context.registerNoteType('mynote', handler);
  },
  
  components: {
    editor: () => import('./components/MyNoteEditor.vue'),
    viewer: () => import('./components/MyNoteViewer.vue'),
  },
  
  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: true,
  },
};
```

2. **Register the module** (`src/core/initModules.ts`):
```typescript
import { myNoteModule } from '@/modules/mynote';

export async function initializeModules() {
  await moduleRegistry.register(myNoteModule);
}
```

3. **Create editor component** (`src/modules/mynote/components/MyNoteEditor.vue`):
```vue
<script setup lang="ts">
import type { MyNote } from '@/types/note';

const props = defineProps<{
  note: MyNote;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  update: [updates: Partial<MyNote>];
}>();

function handleUpdate() {
  emit('update', { /* changes */ });
}
</script>

<template>
  <div>
    <!-- Your editor UI -->
  </div>
</template>
```

## 🗄️ Store Usage

### Creating Notes
```typescript
// In component
const store = useNotesStore();

// Simple text note
await store.create('text', { text: 'Hello world' });

// With category and tags
await store.create('text', {
  text: 'Note content',
  category: 'Work',
  tags: ['important', 'todo'],
});

// Other note types
await store.create('markdown', { markdown: '# Title\n\nContent' });
await store.create('code', { code: 'console.log()', language: 'javascript' });
```

### Updating Notes
```typescript
await store.update(noteId, {
  text: 'Updated content',
  tags: ['updated'],
});
```

### Deleting Notes
```typescript
await store.remove(noteId);
```

### Archiving
```typescript
await store.archive(noteId);
await store.unarchive(noteId);
```

### Searching & Filtering
```typescript
// Set search query
store.searchQuery = 'search term';

// Set category filter
store.selectedCategory = 'Work';

// Get filtered notes (computed)
const notes = store.filteredNotes;
```

## 🔄 CRDT Collaboration

### Using the Collaboration Hook
```typescript
import { useCollaborationDoc } from '@/composables/useCollaborationDoc';

const collaboration = useCollaborationDoc('note-123');

// Connect to sync server
collaboration.connect('http://localhost:4444');

// Access the Yjs document
const doc = collaboration.doc.value;
if (doc) {
  const yText = doc.getText('content');
  yText.insert(0, 'Hello');
}

// Disconnect
collaboration.disconnect();
```

## 🌐 Sync Server API

### REST Endpoints

#### Health Check
```http
GET http://localhost:4444/health
```

#### List Notes
```http
GET http://localhost:4444/api/notes?tenantId=xxx&userId=yyy
```

#### Create Note
```http
POST http://localhost:4444/api/notes
Content-Type: application/json

{
  "type": "text",
  "tenantId": "xxx",
  "userId": "yyy",
  "text": "Note content",
  "tags": ["tag1"]
}
```

#### Update Note
```http
PATCH http://localhost:4444/api/notes/:noteId
Content-Type: application/json

{
  "text": "Updated content"
}
```

#### Delete Note
```http
DELETE http://localhost:4444/api/notes/:noteId
```

#### Search Notes
```http
GET http://localhost:4444/api/notes/search?tenantId=xxx&userId=yyy&q=search+term
```

### WebSocket Endpoint

```javascript
// Connect to a room
const ws = new WebSocket('ws://localhost:4444/api/sync/note-123');

// Using y-websocket provider
import { WebsocketProvider } from 'y-websocket';
const provider = new WebsocketProvider(
  'ws://localhost:4444/api/sync',
  'note-123',
  doc
);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode (recommended during development)
npm run test:watch

# Coverage
npm run test:coverage

# Specific test file
npm test -- NotesStore.test.ts

# UI mode (interactive)
npm run test:ui
```

## 🏗️ Build & Deploy

### Frontend
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Sync Server
```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Database migrations
npm run db:migrate

# Database studio (GUI)
npm run db:studio
```

### Docker
```bash
# Build
docker build -t vue-notes:latest .

# Run
docker run -p 5174:80 vue-notes:latest

# Sync server
cd sync-server
docker build -t vue-notes-sync:latest .
docker run -p 4444:4444 vue-notes-sync:latest
```

## 🔍 Troubleshooting

### WebSocket Connection Failed
```bash
# Check if sync server is running
curl http://localhost:4444/health

# Check WebSocket endpoint
wscat -c ws://localhost:4444/api/sync/test-room

# Kill stuck process
lsof -ti:4444 | xargs kill -9
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build

# Type check
npm run type-check
```

### Database Issues
```bash
# Reset database
cd sync-server
rm data/vue-notes.db*
npm run db:migrate
```

## 📚 Resources

- **Vue 3 Docs**: https://vuejs.org
- **Pinia Docs**: https://pinia.vuejs.org
- **Yjs Docs**: https://docs.yjs.dev
- **Fastify Docs**: https://fastify.dev
- **Drizzle ORM**: https://orm.drizzle.team

## 🎯 Common Tasks

### Add a new design token
Edit `src/design/tokens.ts` and update CSS variables in `src/style.css`

### Add a new component class
Add to `src/design/components.css`

### Add i18n translation
Edit `src/main.ts` messages object

### Change default port
Frontend: Edit `vite.config.ts` → `server.port`
Sync Server: Set `PORT` env variable

### Enable debug logging
Set `LOG_LEVEL=debug` for sync server

## ✨ Keyboard Shortcuts

- `Ctrl/Cmd + K` - Open command palette (TODO)
- `Ctrl/Cmd + N` - New note
- `Ctrl/Cmd + /` - Toggle composer
- `Ctrl/Cmd + F` - Focus search
- `Esc` - Close modals/dialogs
- `Enter` - Submit (in composer/inputs)
- `Shift + Enter` - New line (in multiline inputs)

---

💡 **Tip**: Keep this file open as a reference while developing!
