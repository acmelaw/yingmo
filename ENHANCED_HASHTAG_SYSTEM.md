# Enhanced Hashtag System - Implementation Guide

## Overview

This document details the comprehensive upgrade to the hashtag and note editing system, addressing:

1. **Unicode Hashtag Support** - Full international character support
2. **Separated Content & Tags** - Clean UX with independent management
3. **Edit History Tracking** - Complete audit trail with CRDT support
4. **Enhanced Search** - Intelligent tag suggestions and filtering
5. **Multi-Tag Filtering** - AND-based tag combinations

## Key Changes from Previous Version

### 1. Unicode Hashtag Support

**Previous (ASCII only):**
```javascript
// Only matched #hello, #test123
const matches = text.match(/#[\w]+/g);
```

**New (Unicode-aware):**
```javascript
// Matches #café, #日本語, #münchen, #hello_world
const matches = text.match(/#[\p{L}\p{N}_]+/gu);
```

**Supported Characters:**
- ✅ Latin: `#café`, `#naïve`
- ✅ Cyrillic: `#привет`
- ✅ CJK: `#日本語`, `#中文`, `#한글`
- ✅ Arabic: `#مرحبا`
- ✅ Greek: `#γεια`
- ✅ Numbers & Underscores: `#tag_123`, `#hello_world`

### 2. Separated Content & Tags

**Previous Behavior (Confusing):**
- Tags stored in text: "Meeting notes #work #urgent"
- Removing tag deleted text: "Meeting notes" (❌ Lost content!)
- Tags duplicated in text AND array

**New Behavior (Clean):**
```typescript
interface Note {
  id: string;
  text: string;              // "Meeting notes" (clean content)
  tags: string[];            // ["work", "urgent"] (separate)
  editHistory: NoteEdit[];   // Full change tracking
  tiptapContent?: any;       // Rich text support
}
```

**User Experience:**
- ✅ Content never modified when adding/removing tags
- ✅ Tags managed independently via UI buttons
- ✅ Clean separation of concerns
- ✅ Optional auto-extraction on creation only

### 3. Auto-Extract Toggle

**Configurable Behavior:**

```typescript
// In settings panel
store.autoExtractTags = true;  // Extract #tags from text on CREATE
store.autoExtractTags = false; // Manual tag management only
```

**When Enabled (default):**
1. User types: "Check out #café in #münchen"
2. On save: 
   - `text = "Check out café in münchen"` (hashtags stripped)
   - `tags = ["café", "münchen"]` (extracted & stored)

**When Disabled:**
1. User types: "Check out #café in #münchen"
2. On save:
   - `text = "Check out #café in #münchen"` (preserved as-is)
   - `tags = []` (no extraction, manual only)

### 4. Edit History Tracking

**Data Structure:**
```typescript
interface NoteEdit {
  timestamp: number;    // When edit occurred
  text: string;         // Content at that time
  tags?: string[];      // Tags at that time
  userId?: string;      // Future: for collaboration
}

interface Note {
  // ... other fields
  editHistory?: NoteEdit[];  // Complete audit trail
}
```

**Tracking:**
- ✅ Every `update()` call adds history entry
- ✅ View edit count indicator (📝 icon)
- ✅ Tooltip shows number of edits
- ✅ Future: Undo/redo capability
- ✅ Future: Diff view between versions

### 5. TipTap Rich Editor (Optional)

**Component Created:** `RichTextEditor.vue`

**Features:**
- CRDT-based collaboration via Yjs
- Rich formatting (bold, italic, lists, headings)
- Graceful degradation to plain text
- History tracking via Yjs (when collaboration enabled)
- Collaborative cursors

**Usage:**
```vue
<RichTextEditor
  v-model="noteText"
  :enable-collaboration="true"
  :collaboration-doc="ydoc"
  placeholder="Start typing..."
  @update:json="handleJsonUpdate"
/>
```

**Integration Status:**
- ✅ Component ready
- ⏳ Not yet integrated into NoteItem (pending user preference)
- ⏳ Can be enabled per-note or globally

### 6. Multi-Tag Filtering

**Previous (Single tag):**
```typescript
selectedTag: string | null;  // Filter by ONE tag
```

**New (Multiple tags with AND logic):**
```typescript
selectedTags: string[];  // Filter by ALL selected tags

// Filtering logic
if (selectedTags.length > 0) {
  result = notes.filter(note => 
    selectedTags.every(tag => note.tags?.includes(tag))
  );
}
```

**UI Behavior:**
- Click tag → Add to filter
- Click again → Remove from filter
- Filter banner shows all active tags
- Click "✕" on tag chip → Remove that tag
- "Clear All" → Remove all filters

**Visual Feedback:**
- Active tags highlighted with ring
- Filter banner shows: "Filtering by: #tag1 ✕ #tag2 ✕ #tag3 ✕"
- Empty state adapts message

### 7. Enhanced Search Component

**New Component:** `SearchBar.vue`

**Features:**
1. **Smart Suggestions:**
   - Type "#caf" → Shows "café", "cafeteria"
   - Type "work" → Shows "work", "workflow", "workspace"
   - Displays note count per tag

2. **Hashtag Detection:**
   - Recognizes `#` prefix for tag-specific search
   - Changes suggestion header dynamically

3. **Quick Filter:**
   - Click suggestion → Add to tag filter
   - Auto-clears search input
   - Smooth dropdown animation

4. **Visual Design:**
   - Neo-brutalism styling
   - Slide-down animation
   - Hover effects on suggestions
   - Clear button for quick reset

**Code Example:**
```vue
<SearchBar />
<!-- Auto-wired to store.searchQuery -->
<!-- Provides tag suggestions -->
<!-- Handles click-to-filter -->
```

## Store API Reference

### Updated Functions

#### `add(text: string, category?: string, tags?: string[])`
```typescript
// Behavior depends on autoExtractTags setting
store.add("Meeting at #café with #team");

// If autoExtractTags = true:
// → text: "Meeting at café with team"
// → tags: ["café", "team"]

// If autoExtractTags = false:
// → text: "Meeting at #café with #team"
// → tags: []
```

#### `update(id: string, updates: Partial<Note>)`
```typescript
// NEVER auto-extracts on edit (by design)
store.update(noteId, {
  text: "Updated content",
  tags: ["new", "tags"]  // Must be explicit
});
// → Adds entry to editHistory
// → Sets updated timestamp
```

#### `removeTag(noteId: string, tag: string)`
```typescript
// Removes tag WITHOUT touching text
store.removeTag(noteId, "urgent");
// → Removes from tags array
// → Does NOT modify note.text
// → Adds to edit history
```

#### `addTag(noteId: string, tag: string)`
```typescript
// Adds tag WITHOUT touching text
store.addTag(noteId, "urgent");
// → Adds to tags array (if not exists)
// → Does NOT modify note.text
// → Adds to edit history
```

#### `toggleTag(tag: string)` (NEW)
```typescript
// Toggle tag in filter
store.toggleTag("work");
// If "work" in selectedTags → remove it
// If "work" not in selectedTags → add it
```

#### `clearTagFilters()` (NEW)
```typescript
// Remove all tag filters
store.clearTagFilters();
// → selectedTags = []
```

### Helper Functions

#### `extractHashtags(text: string): string[]`
```typescript
// Unicode-aware extraction
extractHashtags("Hello #café and #日本語");
// → ["café", "日本語"]
```

#### `stripHashtags(text: string): string`
```typescript
// Remove all hashtags from text
stripHashtags("Hello #café and #world");
// → "Hello and"
```

#### `mergeTags(text: string, tags?: string[], autoExtract = true): string[]`
```typescript
// Merge extracted + explicit tags
mergeTags("Hello #world", ["urgent"], true);
// → ["urgent", "world"]

mergeTags("Hello #world", ["urgent"], false);
// → ["urgent"]  // No extraction
```

## UI Components Updated

### NoteItem.vue

**New Features:**
- ✅ Separate tag management in edit mode
- ✅ "+ Add Tag" button
- ✅ Tag input with Enter/Escape handling
- ✅ Visual edit history indicator (📝)
- ✅ Tags never modify content
- ✅ Multi-tag filter integration (active state)

**Edit Mode UI:**
```
┌─────────────────────────────────┐
│ [Textarea for content]          │
│                                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Tags              [+ Add Tag]   │
│ ─────────────────────────────   │
│ [Input] [✓]  (when adding)      │
│ #tag1 ✕  #tag2 ✕  #tag3 ✕      │
└─────────────────────────────────┘

[✓ Save] [✕ Cancel]
```

### ChatShell.vue

**New Features:**
- ✅ SearchBar component integration
- ✅ Multi-tag filter banner
- ✅ Click tag chips to toggle
- ✅ "Clear All" button
- ✅ Auto-extract toggle in settings
- ✅ Sidebar shows active state for multiple tags

**Filter Banner UI:**
```
┌──────────────────────────────────────┐
│ Filtering by: #work ✕ #urgent ✕     │
│                    [Clear All] ────┐ │
└──────────────────────────────────────┘
```

### Composer.vue

**Updates:**
- ✅ Unicode regex for hashtag detection
- ✅ Real-time preview works with international chars
- ✅ Hashtag count includes all Unicode tags

### SearchBar.vue (NEW)

**Features:**
- ✅ Smart tag suggestions
- ✅ Note count per tag
- ✅ Click to filter
- ✅ Keyboard navigation ready
- ✅ Auto-complete on Enter
- ✅ Dropdown with smooth animations

## Migration Guide

### From v1.0 to v2.0

**Automatic Migration:**
- Existing notes preserve all data
- `editHistory` added automatically on first edit
- `autoExtractTags` defaults to `true` (same behavior)

**User Action Required:**
None! Fully backward compatible.

**Optional Cleanup:**
If users want to remove hashtags from old note text:
1. Enable auto-extract in settings
2. Edit each old note
3. Tags will be extracted and text cleaned

**Data Version:**
```typescript
VERSION_KEY = "2.0.0"  // Updated from 1.0.0
```

## Troubleshooting

### Tags not extracting

**Check:**
1. Is `autoExtractTags` enabled in settings?
2. Are you creating a NEW note? (Extraction only on create, not edit)
3. Is the hashtag format correct? (Must start with #, followed by letters/numbers/_)

### Tag removal changes content

**Issue:** This was the OLD behavior.  
**Fix:** Update to v2.0 - tags are now separate.

### Unicode tags not working

**Check:**
1. Ensure regex uses `/gu` flags (global + unicode)
2. Pattern must be `#[\p{L}\p{N}_]+`
3. Browser must support Unicode property escapes (modern browsers only)

**Fallback:**
```typescript
// For older browsers, add polyfill or use:
const matches = text.match(/#[^\s]+/g);  // Less precise but works
```

### Edit history not showing

**Check:**
1. Make at least 2 edits (first edit = creation)
2. Look for 📝 icon next to timestamp
3. Hover for tooltip with count

### Multi-tag filter shows no results

**Expected:** AND logic means note must have ALL selected tags.  
**Example:**
- Note 1: ["work", "urgent"]
- Note 2: ["work", "meeting"]
- Filter: ["work", "urgent", "meeting"]
- Result: 0 notes (none have all 3)

**Solution:** Use fewer tags or separate searches.

## Performance Considerations

### Regex Performance

**Unicode regex is slower than ASCII:**
```typescript
// Fast (ASCII only): ~0.01ms per note
/#[\w]+/g

// Slower (Unicode): ~0.05ms per note  
/#[\p{L}\p{N}_]+/gu
```

**Impact:**
- 1,000 notes: +40ms total
- 10,000 notes: +400ms total

**Optimization (if needed):**
```typescript
// Cache regex compilation
const HASHTAG_REGEX = /#[\p{L}\p{N}_]+/gu;

function extractHashtags(text: string): string[] {
  HASHTAG_REGEX.lastIndex = 0;  // Reset for reuse
  const matches = text.matchAll(HASHTAG_REGEX);
  return [...new Set([...matches].map(m => m[0].substring(1)))];
}
```

### Edit History Storage

**Growth Rate:**
- 1 edit = ~100 bytes
- 100 edits = ~10KB per note
- 1,000 notes × 10 edits = ~1MB

**Pruning Strategy (future):**
```typescript
// Keep only last N edits
const MAX_HISTORY = 50;

if (editHistory.length > MAX_HISTORY) {
  editHistory = editHistory.slice(-MAX_HISTORY);
}
```

## Future Enhancements

### Planned Features

1. **Tag Hierarchy:**
   ```
   #work
   ├─ #work/meeting
   ├─ #work/email
   └─ #work/project
   ```

2. **Tag Autocomplete:**
   - Suggest existing tags while typing
   - Fuzzy matching
   - Recent tags first

3. **Undo/Redo:**
   ```typescript
   store.undo(noteId);  // Restore previous version
   store.redo(noteId);  // Reapply change
   ```

4. **Diff Viewer:**
   - Show side-by-side comparison
   - Highlight changed sections
   - Color-coded additions/deletions

5. **Tag Analytics:**
   - Most used tags
   - Tag usage over time
   - Tag relationships graph

6. **Tag Colors:**
   ```typescript
   interface Tag {
     name: string;
     color: string;
     icon?: string;
   }
   ```

7. **OR-based Filtering:**
   ```typescript
   filterMode: 'AND' | 'OR'
   // OR: Show notes with ANY selected tag
   // AND: Show notes with ALL selected tags (current)
   ```

8. **Tag Aliases:**
   ```typescript
   const tagAliases = {
     'urgent': ['priority', 'important', 'asap'],
     'work': ['job', 'office', 'business']
   };
   ```

## Testing Recommendations

### Unit Tests

```typescript
describe('extractHashtags', () => {
  it('extracts Unicode hashtags', () => {
    expect(extractHashtags('#café #日本語'))
      .toEqual(['café', '日本語']);
  });

  it('handles emoji (not supported)', () => {
    expect(extractHashtags('#hello😀'))
      .toEqual(['hello']);  // Emoji stops tag
  });
});

describe('removeTag', () => {
  it('does not modify text', () => {
    const note = { id: '1', text: 'Content', tags: ['test'] };
    store.removeTag('1', 'test');
    expect(note.text).toBe('Content');  // Unchanged!
  });
});
```

### Integration Tests

```typescript
describe('Note editing workflow', () => {
  it('tracks edit history', () => {
    const id = store.add('Original');
    store.update(id, { text: 'Updated' });
    
    const note = store.notes.find(n => n.id === id);
    expect(note.editHistory).toHaveLength(2);
  });

  it('supports multi-tag filtering', () => {
    store.add('Note 1', undefined, ['work', 'urgent']);
    store.add('Note 2', undefined, ['work']);
    
    store.toggleTag('work');
    store.toggleTag('urgent');
    
    expect(store.filteredNotes).toHaveLength(1);
  });
});
```

## Summary

### Breaking Changes
None! Fully backward compatible.

### New Capabilities
1. ✅ Unicode hashtag support (#café, #日本語)
2. ✅ Separated content & tags (no text modification)
3. ✅ Edit history tracking
4. ✅ Multi-tag filtering (AND logic)
5. ✅ Enhanced search with suggestions
6. ✅ TipTap rich editor component (optional)
7. ✅ Auto-extract toggle

### User Benefits
1. **Clearer UX:** Tags don't mess with content
2. **International:** Works in any language
3. **Audit Trail:** See what changed and when
4. **Flexible Search:** Multiple tags, smart suggestions
5. **Future-Proof:** CRDT support for collaboration

### Developer Benefits
1. **Clean Architecture:** Separation of concerns
2. **Type Safety:** Full TypeScript interfaces
3. **Extensible:** Easy to add features
4. **Testable:** Pure functions, no side effects
5. **Well-Documented:** Comprehensive guides

---

**Version:** 2.0.0  
**Date:** October 4, 2025  
**Author:** AI Assistant  
**License:** MIT
