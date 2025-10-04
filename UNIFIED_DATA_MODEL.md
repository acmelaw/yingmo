# Unified Data Model Migration

## Overview

We've refactored the note system from **type-specific field names** to a **unified data model** where all notes share a common `content` field.

## Why This Change?

### Before (Problematic):
```typescript
TextNote { text: "hello" }
MarkdownNote { markdown: "# hello" }
CodeNote { code: "console.log('hello')", language: "js" }
RichTextNote { html: "<p>hello</p>", content: {...} }
ImageNote { url: "...", alt: "...", width: 100, height: 100 }
SmartLayerNote { source: {...}, layers: [...] }
```

**Problems:**
- ❌ Inconsistent field names (`.text`, `.markdown`, `.code`, `.html`)
- ❌ Transformations required complex type-specific logic
- ❌ Generic operations (like Caesar cipher) needed to know every type
- ❌ Viewing markdown as text required adapters and conversions
- ❌ Adding new types required updating viewers everywhere

### After (Unified):
```typescript
TextNote { content: "hello", metadata: {} }
MarkdownNote { content: "# hello", metadata: { renderedHtml: "..." } }
CodeNote { content: "console.log('hello')", metadata: { language: "js" } }
RichTextNote { content: "<p>hello</p>", metadata: { format: "html" } }
ImageNote { content: "https://...", metadata: { alt: "...", width: 100, height: 100 } }
SmartLayerNote { content: "source data", metadata: { source: {...}, layers: [...] } }
```

**Benefits:**
- ✅ **Single content field** - all notes store primary data in `content`
- ✅ **Lossless transformations** - viewing markdown as text just reads `content`
- ✅ **Generic operations** - Caesar cipher works on `content` regardless of type
- ✅ **Simple viewers** - no type checking needed
- ✅ **Extensible** - new note types follow the same pattern
- ✅ **Metadata flexibility** - type-specific parameters in `metadata`

## Data Structure

### BaseNote Interface
```typescript
export interface BaseNote {
  id: string;
  type: NoteType;
  content: string;          // ← UNIFIED: Primary data goes here
  created: number;
  updated: number;
  category?: string;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, any>;  // ← Type-specific parameters
  viewAs?: NoteType | string;       // ← View mode (lossless transform)
}
```

### Type-Specific Metadata

#### TextNote
```typescript
{
  content: "plain text here",
  metadata: {}  // No extra metadata needed
}
```

#### MarkdownNote
```typescript
{
  content: "# Heading\n\nParagraph",
  metadata: {
    renderedHtml: "<h1>Heading</h1><p>Paragraph</p>"  // Cached render
  }
}
```

#### CodeNote
```typescript
{
  content: "console.log('Hello');",
  metadata: {
    language: "javascript",  // Required
    filename: "app.js"       // Optional
  }
}
```

#### RichTextNote
```typescript
{
  content: "<p>HTML content</p>",
  metadata: {
    format: "html",
    tiptapContent: { /* TipTap JSON */ }
  }
}
```

#### ImageNote
```typescript
{
  content: "https://example.com/image.jpg",  // URL or base64
  metadata: {
    alt: "Description",
    width: 800,
    height: 600,
    blob: Blob  // If local
  }
}
```

#### SmartLayerNote
```typescript
{
  content: "source text or data",
  metadata: {
    source: { type: "text", data: "..." },
    layers: [{ id: "1", name: "Summary", ... }],
    activeLayerId: "1"
  }
}
```

## Helper Functions

Use these helpers for consistent access:

```typescript
import { getNoteContent, setNoteContent, getNoteMeta, setNoteMeta } from '@/types/note';

// Get content from any note
const text = getNoteContent(note);

// Update content
const updatedNote = setNoteContent(note, "new content");

// Get metadata value
const language = getNoteMeta<string>(note, 'language', 'text');

// Set metadata value  
const withMeta = setNoteMeta(note, 'language', 'typescript');

// Transform content generically (e.g., Caesar cipher)
const encrypted = transformNoteContent(note, text => rot13(text));
```

## Caesar Cipher Example

With the unified model, Caesar cipher is trivial:

```vue
<script setup>
import { computed } from "vue";
import { getNoteContent } from "@/types/note";

const props = defineProps<{ note: Note }>();

// Works on ANY note type!
const originalText = computed(() => getNoteContent(props.note));
const encryptedText = computed(() => rot13(originalText.value));

function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}
</script>

<template>
  <div class="caesar-cipher-viewer">
    <div class="original">{{ originalText }}</div>
    <div class="encrypted">{{ encryptedText }}</div>
  </div>
</template>
```

**No type checking. No adapters. No complex logic. Just works!**

## Migration Required

⚠️ **Breaking Change**: Existing notes in localStorage/database use the old schema and will not load correctly.

### Option 1: Fresh Start (Recommended for Development)
```bash
# Clear all notes and start fresh
localStorage.clear()
# Or manually in browser DevTools: Application → Local Storage → Clear
```

### Option 2: Data Migration (For Production)
Create a migration script to convert existing notes:

```typescript
function migrateNote(oldNote: any): Note {
  const base = {
    id: oldNote.id,
    type: oldNote.type,
    created: oldNote.created,
    updated: oldNote.updated,
    category: oldNote.category,
    tags: oldNote.tags,
    archived: oldNote.archived,
  };

  switch (oldNote.type) {
    case 'text':
      return { ...base, content: oldNote.text || '', metadata: {} };
    
    case 'markdown':
      return { 
        ...base, 
        content: oldNote.markdown || '',
        metadata: { renderedHtml: oldNote.html }
      };
    
    case 'code':
      return {
        ...base,
        content: oldNote.code || '',
        metadata: {
          language: oldNote.language || 'text',
          filename: oldNote.filename
        }
      };
    
    case 'rich-text':
      return {
        ...base,
        content: oldNote.html || '',
        metadata: {
          format: 'html',
          tiptapContent: oldNote.content
        }
      };
    
    case 'image':
      return {
        ...base,
        content: oldNote.url || '',
        metadata: {
          blob: oldNote.blob,
          alt: oldNote.alt,
          width: oldNote.width,
          height: oldNote.height,
          transforms: oldNote.transforms
        }
      };
    
    case 'smart-layer':
      return {
        ...base,
        content: JSON.stringify(oldNote.source?.data || ''),
        metadata: {
          source: oldNote.source,
          layers: oldNote.layers,
          activeLayerId: oldNote.activeLayerId
        }
      };
    
    default:
      return { ...base, content: JSON.stringify(oldNote), metadata: {} };
  }
}
```

## Files Changed

### Type Definitions
- `src/types/note.ts` - Unified interfaces, helper functions

### Viewers (All updated to use `getNoteContent` and `getNoteMeta`)
- `src/modules/text/components/TextNoteViewer.vue`
- `src/modules/markdown/components/MarkdownNoteViewer.vue`
- `src/modules/code/components/CodeNoteViewer.vue`
- `src/modules/rich-text/components/RichTextNoteViewer.vue`
- `src/modules/image/components/ImageNoteViewer.vue`
- `src/modules/smart-layer/components/SmartLayerNoteViewer.vue`
- `src/modules/caesar-cipher/components/CaesarCipherNoteViewer.vue` (NEW!)

### Editors
- `src/modules/text/components/TextNoteEditor.vue` - Uses `content` field

### Note Handlers
- `src/modules/text/index.ts` - Creates notes with `content`

### App Components
- `src/components/NoteShell.vue` - Creates notes with unified structure

## Benefits Demonstrated

### 1. Simple Cross-Type Viewing
```typescript
// Before: Complex adapters, type checking, conversions
// After: Just swap the viewer component!
<component :is="displayTypeViewer" :note="note" />
```

### 2. Generic Content Operations
```typescript
// Works on ANY note type
function searchNotes(query: string) {
  return notes.filter(note => 
    getNoteContent(note).includes(query)
  );
}

function countWords(note: Note) {
  return getNoteContent(note).split(/\s+/).length;
}

function encrypt(note: Note) {
  return setNoteContent(note, rot13(getNoteContent(note)));
}
```

### 3. Metadata Editing
```typescript
// Edit language for code note
const updated = setNoteMeta(codeNote, 'language', 'typescript');

// Add description to image
const withDesc = setNoteMeta(imageNote, 'description', 'Sunset photo');

// Store custom data
const withCustom = setNoteMeta(note, 'myCustomField', { foo: 'bar' });
```

### 4. Extensible Architecture
Adding a new note type:
1. Define the interface extending `BaseNote`
2. Specify what goes in `content` and `metadata`
3. Create viewer/editor components
4. Done! Everything else just works.

## Testing

After clearing data, test:

1. **Create notes** of each type (text, markdown, code, etc.)
2. **Transform views** (markdown → text, code → caesar-cipher)
3. **Edit notes** - content should update correctly
4. **Caesar cipher viewer** - should encrypt any note type
5. **Metadata** - code notes should preserve language, images should preserve dimensions

## Summary

**Old approach:** Every note type had different field names, requiring adapters, conversions, and type-specific logic everywhere.

**New approach:** All notes use `content` for primary data and `metadata` for type-specific parameters. Viewing, transforming, and operating on notes is now simple and generic.

**Result:** Clean architecture, easy to extend, powerful generic operations like Caesar cipher work universally!
