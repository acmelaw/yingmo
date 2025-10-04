# Vue Notes - Modular Architecture Refactoring

## Overview

This document describes the comprehensive refactoring of Vue Notes to support a modular, extensible architecture. The refactoring enables easy addition of new note types (like image notes with smart layers) without modifying core code.

## Architecture Changes

### 1. **Modular Type System** (`src/types/`)

#### Note Types (`src/types/note.ts`)
- **Base Note Interface**: Common fields for all note types (id, type, created, updated, category, tags, archived, metadata)
- **Specific Note Types**:
  - `TextNote`: Basic text notes (legacy compatibility)
  - `RichTextNote`: TipTap/HTML content
  - `ImageNote`: Image storage with transformation capabilities
  - `SmartLayerNote`: Multi-layer API-driven transformations
  - `MarkdownNote`: Markdown with cached HTML
  - `CodeNote`: Code snippets with syntax highlighting

#### Module System (`src/types/module.ts`)
- **NoteModule**: Plugin interface for extending functionality
- **ModuleContext**: Dependency injection for modules
- **NoteTypeHandler**: CRUD operations for specific note types
- **TransformDefinition**: Non-destructive transformations

### 2. **Core Infrastructure** (`src/core/`)

#### Module Registry (`src/core/ModuleRegistry.ts`)
Central registry managing:
- Module registration and lifecycle
- Note type handlers
- UI components per note type
- Actions and transforms
- Service and store injection

#### Module Initialization (`src/core/initModules.ts`)
Centralized module loading at app startup

### 3. **Service Layer** (`src/services/`)

#### NoteService (`src/services/NoteService.ts`)
Abstraction layer providing:
- Type-specific CRUD operations via handlers
- Fallback implementations
- Validation and serialization
- Search across all note types

### 4. **Refactored State Management** (`src/stores/`)

#### Modular Notes Store (`src/stores/notesModular.ts`)
Enhanced features:
- Support for all note types
- Module-aware operations
- Migration from legacy format
- Type filtering (`getNotesByType`)
- Integrated with ModuleRegistry

#### Legacy Store (`src/stores/notes.ts`)
Kept for backward compatibility during migration

### 5. **Module Implementation** (`src/modules/`)

#### Text Module (`src/modules/text/`)
Reference implementation showing:
- Module definition
- Type handler implementation
- Editor and viewer components
- Validation and serialization

**Structure:**
```
src/modules/text/
├── index.ts              # Module definition
└── components/
    ├── TextNoteEditor.vue
    └── TextNoteViewer.vue
```

### 6. **Universal Components** (`src/components/`)

#### NoteCard (`src/components/NoteCard.vue`)
- Dynamically renders any note type using module-registered components
- Shows metadata (category, tags, type)
- Displays available transforms
- Handles edit/view/preview modes

#### Refactored Shell (`src/components/ChatShellModular.vue`)
- Module initialization on mount
- Type-aware note creation
- Works with universal NoteCard

### 7. **Testing Infrastructure**

#### Vitest Setup (`vitest.config.ts`)
- Happy DOM environment
- Coverage reporting
- Global test utilities

#### Module Registry Tests (`src/__tests__/ModuleRegistry.test.ts`)
- Module registration/unregistration
- Type handler functionality
- Component resolution

#### Store Tests (`src/__tests__/NotesStore.test.ts`)
- Multi-type note operations
- Migration from legacy format
- Search and filtering
- Export/import with new format

## How to Add a New Note Type

### Example: Adding Smart Layer Notes

1. **Define the module** (`src/modules/smart-layer/index.ts`):
```typescript
import type { NoteModule } from '@/types/module';
import SmartLayerEditor from './components/SmartLayerEditor.vue';
import SmartLayerViewer from './components/SmartLayerViewer.vue';

export const smartLayerModule: NoteModule = {
  id: 'smart-layer',
  name: 'Smart Layer Notes',
  version: '1.0.0',
  supportedTypes: ['smart-layer'],

  async install(context) {
    context.registerNoteType('smart-layer', smartLayerHandler);
    context.registerTransform(ocrTransform);
    context.registerTransform(captionTransform);
  },

  components: {
    editor: SmartLayerEditor,
    viewer: SmartLayerViewer,
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: true,
    supportsDragDrop: true,
  },
};
```

2. **Create components**:
- `SmartLayerEditor.vue`: Edit UI with layer management
- `SmartLayerViewer.vue`: Display with layer switching
- `SmartLayerPreview.vue`: Thumbnail view (optional)

3. **Register in initialization** (`src/core/initModules.ts`):
```typescript
import { smartLayerModule } from '@/modules/smart-layer';

export async function initializeModules() {
  await moduleRegistry.register(textNoteModule);
  await moduleRegistry.register(smartLayerModule); // Add here
}
```

4. **Define transforms**:
```typescript
const ocrTransform: TransformDefinition = {
  id: 'ocr',
  name: 'Extract Text (OCR)',
  type: 'ocr',
  inputTypes: ['image', 'smart-layer'],
  outputType: 'smart-layer',
  async transform(note, config) {
    // Call OCR API
    // Cache result in layer
    // Return updated note
  },
};
```

## Key Features

### ✅ **Modular & Extensible**
- Add new note types without touching core code
- Plugin-based architecture
- Clean separation of concerns

### ✅ **Type-Safe**
- Full TypeScript support
- Discriminated union types for notes
- Type guards for runtime checks

### ✅ **Backward Compatible**
- Legacy notes automatically migrated
- Old API methods still work
- Incremental adoption possible

### ✅ **Testable**
- Vitest integration
- Isolated module testing
- Mock-friendly service layer

### ✅ **Performance**
- Lazy module loading (future)
- Cached transformations
- Efficient change detection

### ✅ **Developer Experience**
- Clear module structure
- Documented APIs
- Reference implementations

## Migration Guide

### From Legacy to Modular System

**Old way:**
```typescript
const store = useNotesStore();
store.add('My note text');
```

**New way (backward compatible):**
```typescript
const store = useNotesStore();
// Legacy method still works
store.add('My note text');

// Or use new type-aware method
await store.create('text', { text: 'My note text' });
await store.create('image', { blob: imageBlob, alt: 'Screenshot' });
```

### Component Updates

**Old NoteItem:**
```vue
<NoteItem :note="note" @delete="remove(note.id)" />
```

**New NoteCard:**
```vue
<NoteCard
  :note="note"
  @delete="remove(note.id)"
  @update="(updates) => store.update(note.id, updates)"
  @archive="archive(note.id)"
/>
```

## File Structure

```
src/
├── types/
│   ├── note.ts           # Note type definitions
│   └── module.ts         # Module system types
├── core/
│   ├── ModuleRegistry.ts # Central module registry
│   └── initModules.ts    # Module initialization
├── services/
│   └── NoteService.ts    # Service layer abstraction
├── stores/
│   ├── notes.ts          # Legacy store (deprecated)
│   ├── notesModular.ts   # New modular store
│   └── settings.ts       # Settings store
├── modules/
│   ├── text/             # Text note module
│   │   ├── index.ts
│   │   └── components/
│   ├── image/            # Future: Image module
│   └── smart-layer/      # Future: Smart layer module
├── components/
│   ├── NoteCard.vue      # Universal note renderer
│   ├── ChatShellModular.vue # Refactored shell
│   ├── Composer.vue      # Note composer
│   └── ...
└── __tests__/
    ├── ModuleRegistry.test.ts
    └── NotesStore.test.ts
```

## Next Steps

### Ready for Implementation:

1. **Image Module** with drag-and-drop support
2. **Smart Layer Module** with:
   - Screenshot capture
   - OCR transformation
   - AI caption generation
   - Concept extraction
   - Folder watching (Electron)

3. **Transform UI**:
   - Layer switching interface
   - Transform configuration
   - Cache management
   - API key management

4. **Rich Text Module** (TipTap integration)

5. **Markdown Module** with live preview

6. **Code Module** with syntax highlighting

### Infrastructure Improvements:

- [ ] Add Storybook for component documentation
- [ ] Implement E2E tests with Playwright
- [ ] Add module lazy loading
- [ ] Create CLI for module scaffolding
- [ ] Add module marketplace/discovery

## Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch
```

## Dependencies Review

### Kept:
- **Vue 3** + **Pinia**: Core framework
- **TipTap**: Rich text editing (for future rich-text module)
- **Quasar**: UI components
- **VueUse**: Composables
- **UnoCSS**: Utility CSS
- **Vue Router**: Navigation
- **Vue I18n**: Internationalization
- **Yjs**: Collaboration (for future collab features)

### Added:
- **Vitest**: Testing framework
- **@vue/test-utils**: Vue component testing
- **happy-dom**: DOM environment for tests

### To Consider Removing:
- TipTap extensions if not using rich-text module
- Collaboration libraries (Yjs, y-*) if not implementing collab

## Performance Considerations

- Modules loaded synchronously on startup (convert to lazy loading)
- Transform results cached in note metadata
- Vue's reactivity handles efficient updates
- IndexedDB for large binary data (images)

## Security Considerations

- Sanitize user input in all note types
- Validate module registration
- Secure API key storage for transforms
- CSP compliance for external APIs

## Conclusion

The refactored architecture provides a solid foundation for:
- Adding smart layer functionality
- Maintaining backward compatibility
- Scaling to many note types
- Easy testing and debugging
- Clear code organization

All core infrastructure is in place. The next step is to implement the specific feature modules based on your requirements.
