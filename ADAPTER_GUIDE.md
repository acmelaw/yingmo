# ViewAdapter System Guide

## Overview

The ViewAdapter system provides a modular, extensible architecture for viewing notes in different formats without modifying the original data. This is a **lossless transformation** system - viewing a note in a different format only changes how it's displayed, not the underlying data.

## Key Concepts

### 1. Lossless Transformations

When you transform a note to view it in a different format:
- The original `type` and `data` fields remain unchanged
- A `viewAs` field is added to indicate the current display mode
- You can switch back to the original view at any time
- No data is lost or converted

Example:
```typescript
// Original note
{
  id: "123",
  type: "text",
  data: { content: "Hello World" },
  // ... other fields
}

// Viewing as markdown (viewAs is added)
{
  id: "123",
  type: "text",  // Original type preserved
  data: { content: "Hello World" },  // Original data preserved
  viewAs: "markdown",  // Display mode
  // ... other fields
}
```

### 2. ViewAdapter Interface

All adapters implement this interface:

```typescript
interface ViewAdapter<T = any> {
  canAdapt(note: Note): boolean;
  adapt(note: Note): T;
  getWarning?(note: Note): string | null;
}
```

- `canAdapt`: Returns `true` if this adapter can handle the note
- `adapt`: Transforms the note data into the format expected by the viewer
- `getWarning`: (Optional) Returns a warning message when viewing cross-type

### 3. Adapter Registry

The `AdapterRegistry` manages all adapters and provides a unified API:

```typescript
const adapted = viewAdapterRegistry.adaptNote(note, 'targetType');
// Returns: { data: T, warning: string | null }
```

## Built-in Adapters

The system includes 7 adapters out of the box:

1. **TextViewAdapter** - Shows any note as plain text
2. **MarkdownViewAdapter** - Shows any note as markdown
3. **CodeViewAdapter** - Shows any note as code
4. **RichTextViewAdapter** - Shows any note as HTML
5. **ImageViewAdapter** - Shows any note as an image (tries to detect URLs)
6. **SmartLayerViewAdapter** - Shows any note with transformation layers
7. **JsonViewAdapter** - Shows the raw JSON for debugging/editing

## Creating a Custom Adapter

Let's create a **Caesar Cipher Viewer** that displays text with ROT13 encryption.

### Step 1: Create the Adapter

Create a new file: `src/adapters/CaesarCipherViewAdapter.ts`

```typescript
import type { Note } from '@/types/note';
import type { ViewAdapter } from '@/core/ViewAdapters';

interface CaesarCipherData {
  originalText: string;
  encryptedText: string;
  shift: number;
}

export class CaesarCipherViewAdapter implements ViewAdapter<CaesarCipherData> {
  canAdapt(note: Note): boolean {
    // Can adapt any note type
    return true;
  }

  adapt(note: Note): CaesarCipherData {
    // Extract text content from different note types
    let text = '';

    switch (note.type) {
      case 'text':
        text = note.data.content || '';
        break;
      case 'markdown':
        text = note.data.markdown || '';
        break;
      case 'code':
        text = note.data.code || '';
        break;
      case 'rich-text':
        // Strip HTML tags for encryption
        text = note.data.html?.replace(/<[^>]*>/g, '') || '';
        break;
      case 'image':
        text = note.data.alt || note.data.url || '';
        break;
      case 'smart-layer':
        text = JSON.stringify(note.data.source?.data || '');
        break;
      default:
        text = JSON.stringify(note.data);
    }

    return {
      originalText: text,
      encryptedText: this.rot13(text),
      shift: 13
    };
  }

  getWarning(note: Note): string | null {
    if (note.type !== 'text') {
      return `Viewing ${note.type} note with Caesar cipher encryption`;
    }
    return null;
  }

  private rot13(text: string): string {
    return text.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
    });
  }
}
```

### Step 2: Register the Adapter

Update `src/core/ViewAdapters.ts`:

```typescript
import { CaesarCipherViewAdapter } from '@/adapters/CaesarCipherViewAdapter';

// Inside the AdapterRegistry class, add to the adapters map:
this.adapters.set('caesar-cipher', new CaesarCipherViewAdapter());
```

### Step 3: Create the Viewer Component

Create `src/modules/caesar-cipher/components/CaesarCipherNoteViewer.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { viewAdapterRegistry } from '@/core/ViewAdapters';

const props = defineProps<{
  note: Note;
}>();

const adapted = computed(() =>
  viewAdapterRegistry.adaptNote(props.note, 'caesar-cipher')
);
const noteData = computed(() => adapted.value.data);
const warning = computed(() => adapted.value.warning);
</script>

<template>
  <div class="caesar-cipher-viewer">
    <div v-if="warning" class="view-mode-notice">
      💡 {{ warning }}
    </div>

    <div class="cipher-container">
      <div class="cipher-section">
        <h3>Original Text</h3>
        <div class="text-content">
          {{ noteData.originalText }}
        </div>
      </div>

      <div class="cipher-arrow">
        ROT{{ noteData.shift }} →
      </div>

      <div class="cipher-section encrypted">
        <h3>Encrypted Text</h3>
        <div class="text-content">
          {{ noteData.encryptedText }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.caesar-cipher-viewer {
  padding: 16px;
}

.cipher-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: start;
}

.cipher-section {
  border: 2px solid #000;
  padding: 16px;
  background: #fff;
}

.cipher-section.encrypted {
  background: #f0f0f0;
  font-family: monospace;
}

.cipher-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.text-content {
  line-height: 1.6;
  word-wrap: break-word;
}

.cipher-arrow {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #666;
}

.view-mode-notice {
  margin-bottom: 16px;
  padding: 12px;
  background: #fff3cd;
  border: 2px solid #000;
  border-left: 4px solid #ffc107;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
}
</style>
```

### Step 4: Register the Module

Create `src/modules/caesar-cipher/index.ts`:

```typescript
import type { NoteModuleDefinition } from '@/types/module';
import CaesarCipherNoteViewer from './components/CaesarCipherNoteViewer.vue';

export default {
  type: 'caesar-cipher',
  name: 'Caesar Cipher',
  icon: '🔐',
  viewer: CaesarCipherNoteViewer,
  // Optional: add editor if you want to create cipher notes
  // editor: CaesarCipherNoteEditor,
} as NoteModuleDefinition;
```

### Step 5: Register in Module Registry

Update `src/core/initModules.ts`:

```typescript
import caesarCipherModule from '@/modules/caesar-cipher';

export function initModules() {
  moduleRegistry.register(textModule);
  moduleRegistry.register(markdownModule);
  moduleRegistry.register(codeModule);
  moduleRegistry.register(richTextModule);
  moduleRegistry.register(imageModule);
  moduleRegistry.register(smartLayerModule);
  moduleRegistry.register(caesarCipherModule);  // Add this line
}
```

### Step 6: Add to Type System

Update `src/types/note.ts` to include the new type:

```typescript
export type NoteType =
  | 'text'
  | 'markdown'
  | 'code'
  | 'rich-text'
  | 'image'
  | 'smart-layer'
  | 'caesar-cipher';  // Add this line
```

## Usage

Once registered, users can:

1. **View any note as Caesar cipher:**
   - Select a note
   - Click the transform button (🔄)
   - Choose "Caesar Cipher"
   - See the encrypted version

2. **Switch back:**
   - Click transform button again
   - Choose the original type
   - Data is preserved perfectly

3. **See warnings:**
   - When viewing non-text notes as cipher
   - Warning explains what's happening

## Best Practices

### 1. Handle All Note Types

Your adapter should gracefully handle all note types:

```typescript
adapt(note: Note): YourDataType {
  switch (note.type) {
    case 'text':
      return this.adaptText(note.data);
    case 'markdown':
      return this.adaptMarkdown(note.data);
    // ... handle all types
    default:
      // Fallback to JSON
      return this.adaptFromJSON(note);
  }
}
```

### 2. Provide Helpful Warnings

```typescript
getWarning(note: Note): string | null {
  const displayType = note.viewAs || note.type;
  if (note.type !== 'your-target-type') {
    return `Viewing ${note.type} note as ${displayType}. Original data preserved.`;
  }
  return null;
}
```

### 3. Type Safety

Always define the data shape your adapter returns:

```typescript
interface YourAdapterData {
  field1: string;
  field2: number;
  // ... etc
}

export class YourAdapter implements ViewAdapter<YourAdapterData> {
  // ...
}
```

### 4. Fallback Behavior

Always provide sensible defaults:

```typescript
adapt(note: Note): YourData {
  return {
    content: extractContent(note) || 'No content available',
    metadata: extractMetadata(note) || {},
  };
}
```

## Advanced: Custom Transformations

You can implement complex transformations:

### Example: Markdown to Plain Text

```typescript
class MarkdownToTextAdapter implements ViewAdapter<TextData> {
  adapt(note: Note): TextData {
    if (note.type === 'markdown') {
      // Strip markdown syntax
      let text = note.data.markdown || '';
      text = text.replace(/[*_~`#]/g, '');  // Remove formatting
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');  // Links
      return { content: text };
    }
    return { content: JSON.stringify(note.data) };
  }
}
```

### Example: Code Syntax Highlighter

```typescript
class CodeHighlightAdapter implements ViewAdapter<HighlightData> {
  adapt(note: Note): HighlightData {
    const code = this.extractCode(note);
    const language = this.detectLanguage(note);

    return {
      code,
      language,
      highlighted: this.highlightSyntax(code, language),
      lineNumbers: code.split('\n').length,
    };
  }

  private highlightSyntax(code: string, lang: string): string {
    // Use a syntax highlighting library
    // Return HTML with syntax highlighting
  }
}
```

## Testing Your Adapter

```typescript
import { describe, it, expect } from 'vitest';
import { YourAdapter } from './YourAdapter';

describe('YourAdapter', () => {
  const adapter = new YourAdapter();

  it('should adapt text notes', () => {
    const note = {
      id: '1',
      type: 'text',
      data: { content: 'Hello' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = adapter.adapt(note);
    expect(result).toMatchObject({
      // Expected output
    });
  });

  it('should provide warning for cross-type viewing', () => {
    const note = { type: 'markdown', /* ... */ };
    const warning = adapter.getWarning(note);
    expect(warning).toContain('Viewing markdown');
  });
});
```

## JSON View for Debugging

The built-in `JsonViewAdapter` is perfect for:
- Debugging note structure
- Direct editing of note data
- Understanding the data model
- Fixing corrupted notes

Just transform any note to "json" type to see its raw structure.

## Summary

The ViewAdapter system provides:
- ✅ **Lossless transformations** - Original data always preserved
- ✅ **Type safety** - Proper TypeScript types throughout
- ✅ **Extensibility** - Easy to add new viewers
- ✅ **Modularity** - Each adapter is independent
- ✅ **Warning system** - Users know when viewing cross-type
- ✅ **Fallback handling** - Graceful degradation

Create custom adapters by:
1. Implementing the `ViewAdapter` interface
2. Registering in the `AdapterRegistry`
3. Creating a viewer component
4. Adding the module to the registry

Your custom viewers are now first-class citizens in the notes app! 🚀
