# Clean Data Reset & Rebuild Instructions

## Summary

The codebase has been refactored to use a **unified data model** where all notes use a common `content` field instead of type-specific fields (`.text`, `.markdown`, `.code`, etc.).

## Current Status

✅ **Core Architecture Complete:**
- Type definitions updated (`src/types/note.ts`)
- Helper functions created (`getNoteContent`, `setNoteMeta`, etc.)
- All viewers updated to use unified model
- Text editor updated
- Note creation handlers updated
- Caesar cipher module created (demonstrates generic operations)

⚠️ **Remaining Work:**
- 82 TypeScript errors in tests and other editors
- All errors are systematic: changing `.text` → `.content`, `.markdown` → `.content`, etc.
- These are straightforward find-replace operations

## Step 1: Clear All Data

**⚠️ WARNING: This will delete all your notes!**

Execute in browser DevTools console:
```javascript
// Clear localStorage
localStorage.clear();

// Or more targeted:
localStorage.removeItem('vue-notes');
localStorage.removeItem('vue-notes-sync');
localStorage.removeItem('notes');

// Verify it's clear
console.log('Remaining keys:', Object.keys(localStorage));
```

Alternatively, in browser:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Select **Local Storage** → your domain
4. Click "Clear All" or delete specific keys
5. Refresh the page

## Step 2: Fix Remaining Code

All 82 errors follow these patterns:

### Pattern 1: Test files - Update mock data
```typescript
// OLD:
{ type: "text", text: "hello" }

// NEW:
{ type: "text", content: "hello" }
```

### Pattern 2: Editors - Use helper functions
```typescript
// OLD:
const localCode = ref(props.note.code);
emit('update', { code: newValue });

// NEW:
import { getNoteContent, getNoteMeta } from '@/types/note';
const localCode = ref(getNoteContent(props.note));
emit('update', { content: newValue });
```

### Pattern 3: Note handlers - Create with content
```typescript
// OLD:
{ code: data.code || "", language: data.language }

// NEW:
{
  content: data.content || data.code || "",
  metadata: { language: data.language || 'text' }
}
```

## Step 3: Manual Fixes Needed

### High Priority (Prevents Build):

1. **All Module Editors** (`src/modules/*/components/*Editor.vue`):
   - MarkdownNoteEditor.vue
   - CodeNoteEditor.vue
   - RichTextNoteEditor.vue
   - ImageNoteEditor.vue
   - SmartLayerNoteEditor.vue

2. **All Module Handlers** (`src/modules/*/index.ts`):
   - markdown/index.ts
   - code/index.ts
   - rich-text/index.ts
   - image/index.ts
   - smart-layer/index.ts

3. **Store Files**:
   - `src/stores/notes.ts` (line 425)
   - `src/stores/notes.old.ts` (lines 604, 818)

4. **Export Utility**:
   - `src/composables/useDataExport.ts` (lines 88-101)

### Medium Priority (Tests):

5. **Test Files** (all can wait until core app works):
   - `src/__tests__/components/NoteCard.test.ts`
   - `src/__tests__/components/TextNoteEditor.test.ts`
   - `src/__tests__/helpers/mocks.ts`
   - `src/__tests__/helpers/testUtils.ts`
   - `src/__tests__/integration.test.ts`
   - `src/__tests__/ModuleRegistry.test.ts`
   - `src/__tests__/NoteService.test.ts`
   - `src/__tests__/NotesStore.test.ts`
   - `src/__tests__/offline-sync.test.ts`
   - `src/__tests__/performance.test.ts`
   - `src/__tests__/regression/storeAPI.test.ts`

## Step 4: Example Fixes

### Example 1: CodeNoteEditor.vue
```vue
<!-- OLD -->
<script setup>
const localCode = ref(props.note.code);
const localLanguage = ref(props.note.language);

function updateCode() {
  emit("update", { code: localCode.value });
}

watch(() => props.note.code, (newCode) => {
  localCode.value = newCode;
});
</script>

<!-- NEW -->
<script setup>
import { getNoteContent, getNoteMeta, setNoteMeta } from '@/types/note';

const localCode = ref(getNoteContent(props.note));
const localLanguage = ref(getNoteMeta<string>(props.note, 'language', 'text'));

function updateCode() {
  emit("update", { content: localCode.value });
}

function updateLanguage() {
  emit("update", { metadata: { ...props.note.metadata, language: localLanguage.value } });
}

watch(() => getNoteContent(props.note), (newCode) => {
  localCode.value = newCode;
});

watch(() => getNoteMeta<string>(props.note, 'language'), (newLang) => {
  if (newLang) localLanguage.value = newLang;
});
</script>
```

### Example 2: markdown/index.ts
```typescript
// OLD
const markdownNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<MarkdownNote> {
    return {
      id: createId(),
      type: "markdown",
      markdown: data.markdown || "",
      html: data.html,
      created: Date.now(),
      updated: Date.now(),
      // ...
    };
  },

  validate(note) {
    const mdNote = note as MarkdownNote;
    return typeof mdNote.markdown === "string";
  },
};

// NEW
const markdownNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<MarkdownNote> {
    return {
      id: createId(),
      type: "markdown",
      content: data.content || data.markdown || "", // Support both
      metadata: {
        renderedHtml: data.html || data.renderedHtml,
        ...data.metadata
      },
      created: Date.now(),
      updated: Date.now(),
      // ...
    };
  },

  validate(note) {
    const mdNote = note as MarkdownNote;
    return typeof mdNote.content === "string";
  },
};
```

### Example 3: Test Files
```typescript
// OLD
const mockNote: TextNote = {
  id: "1",
  type: "text",
  text: "Test note",
  created: Date.now(),
  updated: Date.now(),
};

await store.update(id, { text: "Updated" });
expect(note.text).toBe("Updated");

// NEW
const mockNote: TextNote = {
  id: "1",
  type: "text",
  content: "Test note",
  created: Date.now(),
  updated: Date.now(),
};

await store.update(id, { content: "Updated" });
expect(getNoteContent(note)).toBe("Updated");
```

## Step 5: Verify

After fixes, verify:

1. **Build succeeds:**
   ```bash
   npm run build
   ```

2. **Tests pass:**
   ```bash
   npm test
   ```

3. **App works:**
   ```bash
   npm run dev
   ```

4. **Test each feature:**
   - Create text note ✓
   - Create markdown note ✓
   - Create code note ✓
   - Transform markdown → text ✓
   - Transform text → caesar-cipher ✓
   - Edit notes ✓
   - Metadata preserved (language, dimensions, etc.) ✓

## Benefits of New Architecture

Once complete, you'll have:

✅ **Generic operations work on any note type:**
```typescript
// Caesar cipher on ANY note
const encrypted = transformNoteContent(note, rot13);

// Word count on ANY note
const wordCount = getNoteContent(note).split(/\s+/).length;

// Search ANY note
notes.filter(n => getNoteContent(n).includes(query));
```

✅ **Simple cross-type viewing:**
```typescript
// Markdown viewed as text? Just reads content!
// No adapters, no conversions, no complexity
```

✅ **Easy to add new note types:**
```typescript
// Just follow the pattern:
interface MyNote extends BaseNote {
  type: "my-type";
  content: string;  // Primary data here
  metadata?: {      // Type-specific stuff here
    myParam: string;
  };
}
```

✅ **Metadata editing works generically:**
```typescript
// Set any metadata on any note
const withMeta = setNoteMeta(note, 'customField', 'value');
```

## Timeline Estimate

- **Manual fixes:** 2-3 hours (systematic find-replace)
- **Testing:** 1 hour
- **Total:** ~4 hours to complete refactoring

## Questions?

The architecture is solid. The remaining work is mechanical (changing field names in editors and tests). All the hard thinking is done!
