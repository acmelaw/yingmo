# Module System Usage Guide

## Overview

The Vue Notes app now supports 6 different note types through a modular architecture. Each module provides specialized editing and viewing capabilities.

## Available Note Types

### 1. Text Notes 📝
**Type:** `"text"`
**Best for:** Quick notes, hashtags, plain text

```typescript
await store.create("text", {
  text: "My quick note #idea"
});
```

**Features:**
- Simple textarea editor
- Automatic hashtag extraction
- Fast and lightweight

---

### 2. Markdown Notes 📄
**Type:** `"markdown"`
**Best for:** Formatted documents, README files, documentation

```typescript
await store.create("markdown", {
  markdown: "# My Document\n\n**Bold** and *italic* text"
});
```

**Features:**
- Edit/Preview/Split view modes
- Live markdown rendering
- Supports headers, lists, links, code blocks
- Cached HTML for performance

---

### 3. Code Snippets 💻
**Type:** `"code"`
**Best for:** Code snippets, scripts, SQL queries

```typescript
await store.create("code", {
  code: "function hello() {\n  console.log('Hello!');\n}",
  language: "javascript",
  filename: "hello.js"
});
```

**Supported Languages:**
- JavaScript, TypeScript, Python, Java
- C#, Go, Rust, Ruby, PHP
- HTML, CSS, SQL, Bash
- JSON, YAML, Markdown

**Features:**
- Language selector
- Optional filename
- Character and line counting
- Monospace rendering

---

### 4. Rich Text Notes ✏️
**Type:** `"rich-text"`
**Best for:** Formatted content, styled text

```typescript
await store.create("rich-text", {
  content: { type: "doc", content: [] },
  html: "<p><strong>Bold</strong> and <em>italic</em></p>"
});
```

**Features:**
- WYSIWYG editor with toolbar
- Bold, italic, underline
- Bullet lists and links
- Clean HTML storage

---

### 5. Image Notes 🖼️
**Type:** `"image"`
**Best for:** Screenshots, photos, diagrams

```typescript
await store.create("image", {
  blob: base64String,
  url: objectURL,
  width: 1920,
  height: 1080,
  alt: "Screenshot of dashboard"
});
```

**Features:**
- Drag-and-drop upload
- Click-to-upload
- Base64 encoding
- Image dimensions tracking
- Optional captions/alt text

---

### 6. Smart Layer Notes 🤖
**Type:** `"smart-layer"`
**Best for:** AI-powered transformations, analysis

```typescript
await store.create("smart-layer", {
  source: {
    type: "text",
    data: "The original content to transform"
  },
  layers: [
    {
      id: crypto.randomUUID(),
      name: "Summary",
      type: "summarize",
      config: { model: "gpt-4" },
      result: "AI-generated summary here"
    }
  ]
});
```

**Layer Types:**
- Summarize, Extract, Translate
- OCR (for images)
- Concept extraction
- Custom transformations

---

## Using the Module Picker

The `ModulePicker` component provides a beautiful UI for selecting note types:

```vue
<template>
  <button @click="showPicker = true">Create Note</button>

  <ModulePicker
    v-if="showPicker"
    @select="handleSelect"
    @close="showPicker = false"
  />
</template>

<script setup>
import { ref } from 'vue';
import ModulePicker from '@/components/ModulePicker.vue';
import { useNotesStore } from '@/stores/notes';

const showPicker = ref(false);
const store = useNotesStore();

async function handleSelect(noteType) {
  showPicker.value = false;

  // Create note based on type
  const data = getDefaultData(noteType);
  await store.create(noteType, data);
}

function getDefaultData(type) {
  const defaults = {
    text: { text: "" },
    markdown: { markdown: "" },
    code: { code: "", language: "javascript" },
    "rich-text": { content: { type: "doc", content: [] } },
    image: { blob: "", url: "" },
    "smart-layer": {
      source: { type: "text", data: "" },
      layers: []
    }
  };
  return defaults[type] || {};
}
</script>
```

---

## Displaying Notes

Use `NoteCard` with dynamic component loading:

```vue
<template>
  <NoteCard
    v-for="note in notes"
    :key="note.id"
    :note="note"
    @delete="handleDelete"
    @update="handleUpdate"
  />
</template>

<script setup>
import { computed } from 'vue';
import { useNotesStore } from '@/stores/notes';
import NoteCard from '@/components/NoteCard.vue';

const store = useNotesStore();
const notes = computed(() => store.filteredNotes);

async function handleDelete(noteId) {
  await store.remove(noteId);
}

async function handleUpdate(noteId, updates) {
  await store.update(noteId, updates);
}
</script>
```

The `NoteCard` component automatically loads the correct editor/viewer based on note type.

---

## Module Registration

All modules are automatically registered on app startup:

```typescript
// src/core/initModules.ts
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import { markdownNoteModule } from "@/modules/markdown";
// ... other imports

export async function initializeModules() {
  await moduleRegistry.register(textNoteModule);
  await moduleRegistry.register(markdownNoteModule);
  await moduleRegistry.register(codeNoteModule);
  await moduleRegistry.register(richTextNoteModule);
  await moduleRegistry.register(imageNoteModule);
  await moduleRegistry.register(smartLayerNoteModule);
}
```

This is called in `main.ts` before the app mounts.

---

## Querying Available Modules

```typescript
import { moduleRegistry } from '@/core/ModuleRegistry';

// Get all registered modules
const allModules = moduleRegistry.getAllModules();
// => [textNoteModule, markdownNoteModule, ...]

// Get a specific module
const textModule = moduleRegistry.getModule("text-note");

// Get modules for a specific type
const textModules = moduleRegistry.getModulesForType("text");

// Get the type handler
const handler = moduleRegistry.getTypeHandler("markdown");
await handler.create({ markdown: "# Hello" });
```

---

## Creating Custom Modules

To create a new module, follow this structure:

```typescript
// src/modules/my-module/index.ts
import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { MyNote } from "@/types/note";
import MyNoteEditor from "./components/MyNoteEditor.vue";
import MyNoteViewer from "./components/MyNoteViewer.vue";

const myNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<MyNote> {
    // Implementation
  },
  async update(note, updates) {
    // Implementation
  },
  async delete(note) {
    // Cleanup
  },
  validate(note) {
    // Validation logic
  },
  serialize(note) {
    return JSON.stringify(note);
  },
  deserialize(data: string) {
    return JSON.parse(data);
  },
};

export const myNoteModule: NoteModule = {
  id: "my-note",
  name: "My Custom Notes",
  version: "1.0.0",
  description: "My custom note type",
  supportedTypes: ["my-type"],

  async install(context) {
    context.registerNoteType("my-type", myNoteHandler);
  },

  components: {
    editor: MyNoteEditor,
    viewer: MyNoteViewer,
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: false,
    canExport: true,
    canImport: true,
    supportsSearch: true,
  },
};
```

Then register it in `initModules.ts`:

```typescript
import { myNoteModule } from "@/modules/my-module";

export async function initializeModules() {
  // ... other modules
  await moduleRegistry.register(myNoteModule);
}
```

---

## Best Practices

1. **Choose the Right Type:**
   - Text: Quick notes, lists
   - Markdown: Documentation, formatted content
   - Code: Snippets, scripts
   - Rich Text: Styled content
   - Image: Visual content
   - Smart Layer: AI transformations

2. **Consistent Styling:**
   - All modules use neo-brutalism design
   - 2px solid borders
   - Bold typography
   - Black and white color scheme

3. **Performance:**
   - Images use base64 for small files
   - Markdown caches rendered HTML
   - Lazy load module components

4. **Accessibility:**
   - All editors support keyboard navigation
   - Images require alt text
   - Proper semantic HTML

---

## Examples

### Creating Different Note Types

```typescript
const store = useNotesStore();

// Text note with hashtags
await store.create("text", {
  text: "Meeting notes #work #important",
  category: "work"
});

// Markdown note
await store.create("markdown", {
  markdown: "## Today's Tasks\n\n- [ ] Review PR\n- [ ] Deploy",
  category: "tasks"
});

// Code snippet
await store.create("code", {
  code: "SELECT * FROM users WHERE active = true;",
  language: "sql",
  filename: "active-users.sql",
  tags: ["database", "query"]
});

// Rich text
await store.create("rich-text", {
  html: "<p>Check out <a href='https://example.com'>this link</a>!</p>"
});
```

### Updating Notes

```typescript
// Update text
await store.update(noteId, {
  text: "Updated content"
});

// Update markdown
await store.update(noteId, {
  markdown: "# New title\n\nNew content",
  html: "<h1>New title</h1><p>New content</p>"
});

// Update code language
await store.update(noteId, {
  language: "python"
});
```

---

## Troubleshooting

**Module not found:**
- Ensure module is registered in `initModules.ts`
- Check that `initializeModules()` is called before app mount

**Component not rendering:**
- Verify module exports `components.editor` and `components.viewer`
- Check Vue devtools for component registration

**Type errors:**
- Ensure note type is defined in `src/types/note.ts`
- Check that handler implements all required methods

---

## Next Steps

- Implement note type transformations (e.g., Text → Markdown)
- Add CRDT sync support with Yjs
- Create more specialized modules (PDF, Video, Audio)
- Add collaborative editing features

---

**For more information, see:**
- `/src/types/module.ts` - Module type definitions
- `/src/types/note.ts` - Note type definitions
- `/src/core/ModuleRegistry.ts` - Registry implementation
- `/PHASE_2_SUMMARY.md` - Detailed completion summary
