# Hashtag System & Note Editing Guide

## 🏷️ Hashtag Management System

### Overview
A comprehensive hashtag system that automatically detects, extracts, manages, and filters notes based on hashtags. The system treats hashtags as first-class citizens with full CRUD operations.

---

## ✨ Key Features

### 1. **Automatic Hashtag Detection**
- **Pattern**: Any word prefixed with `#` (e.g., `#work`, `#important`)
- **Regex**: `/#[\w]+/g` matches hashtags in note text
- **Auto-extraction**: Hashtags are automatically extracted when notes are created or edited
- **Deduplication**: Duplicate hashtags are automatically removed

### 2. **Hashtag Storage**
```typescript
interface Note {
  id: string;
  text: string;
  tags?: string[]; // Hashtags stored WITHOUT the # symbol
  // ... other properties
}
```

**Example:**
```
Text: "Meeting notes #work #important #project"
Stored tags: ["work", "important", "project"]
```

### 3. **Visual Feedback**
- Real-time hashtag counter while typing
- Visual preview of detected hashtags
- Color-coded tag badges
- Active state for selected tags

---

## 🔧 Core Functionality

### Creating Notes with Hashtags

**Method 1: Type naturally**
```
Just type: "This is a #cool note about #javascript"
Result: Automatically extracts ["cool", "javascript"]
```

**Method 2: Quick hashtag button**
```
1. Click #️⃣ button in composer
2. Automatically adds " #" to your text
3. Continue typing the tag name
```

**Method 3: Emoji & tag combo**
```
Type: "Great day! 🎉 #happy #blessed"
Result: Text + emoji + tags all saved together
```

### Editing Notes

**Edit Mode Activation:**
1. Hover over any note
2. Click the ✏️ edit button (bottom right)
3. Note enters edit mode with textarea

**Edit Mode Features:**
- Auto-expanding textarea
- Real-time hashtag detection
- Keyboard shortcuts:
  - `Enter`: Save changes
  - `Shift + Enter`: New line
  - `Escape`: Cancel editing
- Save/Cancel buttons with visual feedback

**What Happens on Save:**
```typescript
// Original
text: "Old note #old"
tags: ["old"]

// User edits to
text: "Updated note #new #cool"

// System automatically:
1. Extracts hashtags from new text
2. Merges with any existing tags
3. Deduplicates
4. Updates note
tags: ["new", "cool"]
```

### Deleting Tags

**Method 1: Click the X button**
```
1. Hover over a tag in any note
2. Small ✕ button appears in top-right corner
3. Click to remove tag
```

**What Happens:**
```typescript
// Before
text: "Meeting #work #important notes"
tags: ["work", "important"]

// Click X on "work" tag

// After
text: "Meeting #important notes"  // #work removed from text
tags: ["important"]  // removed from tags array
```

**Method 2: Edit the note text**
```
1. Enter edit mode
2. Manually delete hashtags from text
3. Save
4. Tags array automatically updates
```

---

## 🔍 Search & Filter

### Search by Hashtag

**In Search Bar:**
```
Search: "work"
Matches: Any note containing "work" in text OR tags
```

**Tag Filtering:**
```
1. Click on any tag badge in a note
2. Filter activates instantly
3. Only notes with that tag shown
4. Tag filter indicator appears at top
```

### Sidebar Tag Navigation

**Desktop View:**
```
├── Header
├── Tag Filter Indicator (if active)
├── ┌─────────────┬─────────────────┐
│   │  Sidebar    │  Messages       │
│   │  #work (5)  │  [Notes here]   │
│   │  #personal  │                 │
│   │  #ideas (12)│                 │
│   └─────────────┴─────────────────┘
└── Composer
```

**Mobile View:**
```
- Sidebar hidden by default
- Click #️⃣ button in header to toggle
- Overlays on top of messages
- Auto-closes when tag selected
```

**Sidebar Features:**
- Alphabetically sorted tags
- Note count for each tag `#work (5)`
- Active state highlighting
- Click tag to filter
- Clear filter button

---

## 🎨 UI/UX Design Principles

### Color Coding

```css
/* Category Badge */
background: var(--brutal-accent);  /* Yellow */
border: 2px solid #000;
→ Used for: Note categories

/* Hashtag Tags */
background: var(--brutal-secondary);  /* Cyan */
color: white;
border: 2px solid #000;
→ Used for: All hashtags

/* Active Tag (in sidebar) */
background: var(--brutal-accent);  /* Yellow */
→ Shows currently filtered tag
```

### Interactive States

**Tag in Note (Clickable):**
```
Default: Cyan background
Hover: Yellow background (accent color)
Active (filtering): Yellow background with ring
```

**Tag in Sidebar:**
```
Default: Light background, black border
Hover: Cyan background, white text, lifted shadow
Active: Yellow background, darker shadow
Click: Shadow compress effect
```

**Delete Tag Button (✕):**
```
Default: Hidden (opacity: 0)
Hover over tag: Visible (opacity: 100)
Position: Absolute top-right of tag
Color: Warning red background
```

### Micro-interactions

1. **Hover Effects:**
   - Tags grow shadow on hover
   - Slight translate up-left
   - Background color change
   - Smooth 150ms transition

2. **Click Effects:**
   - Shadow compresses
   - Translate down-right
   - Tactile feedback

3. **Filter Activation:**
   - Tag highlights immediately
   - Filter banner slides down
   - Notes filter with animation
   - Sidebar shows active state

---

## 💻 Technical Implementation

### Store Functions

```typescript
// Extract hashtags from text
function extractHashtags(text: string): string[]

// Merge extracted + explicit tags
function mergeTags(text: string, tags?: string[]): string[]

// Add note with hashtags
store.add(text, category?, tags?)

// Update note (auto-extracts hashtags)
store.update(noteId, { text, ...updates })

// Remove specific tag from note
store.removeTag(noteId, tag)

// Add tag to existing note
store.addTag(noteId, tag)

// Filter by tag
store.selectedTag = 'tagName'

// Clear filter
store.selectedTag = null

// Get all unique tags
store.allTags // computed, sorted alphabetically
```

### Computed Properties

```typescript
// In Note Component
const allTags = computed(() => {
  // Combines note.tags + extracted hashtags
  // Deduplicates and returns unique list
})

// In Store
const allTags = computed(() => {
  // Aggregates all tags from all notes
  // Returns sorted unique list
})

const filteredNotes = computed(() => {
  // Filters by:
  // 1. Search query (text + tags)
  // 2. Selected category
  // 3. Selected tag
})
```

---

## 📱 Responsive Behavior

### Desktop (>768px)
```
- Sidebar toggle button in header
- Sidebar width: 256px
- Smooth slide-in animation
- Side-by-side layout
```

### Mobile (<768px)
```
- Sidebar toggle in top-left of header
- Full-width overlay when open
- Close button (✕) visible in sidebar
- Auto-closes after tag selection
```

---

## ⌨️ Keyboard Shortcuts

### In Composer
```
Enter          → Send note
Shift + Enter  → New line
Escape         → Close emoji picker
#              → Auto-shows hashtag helper
```

### In Edit Mode
```
Enter          → Save changes
Shift + Enter  → New line in edit
Escape         → Cancel editing
```

---

## 🎯 Usage Examples

### Example 1: Work Note with Multiple Tags
```
Input: "Client meeting tomorrow at 2pm #work #important #client"

Result:
- Text: "Client meeting tomorrow at 2pm #work #important #client"
- Tags: ["work", "important", "client"]
- Searchable by: "client", "meeting", "work", etc.
- Filterable by: any of the three tags
```

### Example 2: Editing and Removing Tags
```
1. Original note: "Buy milk #shopping #groceries"
2. Click edit button
3. Change to: "Buy milk and bread #shopping"
4. Save

Result:
- Text: "Buy milk and bread #shopping"
- Tags: ["shopping"]  // groceries removed
```

### Example 3: Quick Tag Addition
```
1. Existing note: "Great idea for the project"
2. Hover over note → click edit
3. Add: "Great idea for the project #ideas #projectX"
4. Save

Result:
- Tags automatically extracted: ["ideas", "projectX"]
- Both added to searchable tags
```

### Example 4: Tag-based Filtering
```
1. You have notes with #work, #personal, #ideas
2. Click #work tag in any note
3. View filters to show only #work notes
4. Banner shows: "Filtering by: #work [Clear Filter]"
5. Sidebar highlights #work as active
6. Click "Clear Filter" or click tag again to reset
```

---

## 🔄 Data Flow

### Creating a Note
```
User types text with #hashtags
         ↓
Composer extracts hashtags
         ↓
Store.add(text, category, tags)
         ↓
mergeTags(text, tags)
         ↓
Note saved with deduplicated tags
         ↓
UI updates, allTags recomputed
         ↓
Sidebar shows new tags
```

### Editing a Note
```
User clicks edit button
         ↓
Note enters edit mode
         ↓
User modifies text/tags
         ↓
Save → Store.update(id, {text})
         ↓
extractHashtags(newText)
         ↓
mergeTags(newText, existingTags)
         ↓
Note updated with new tag set
         ↓
UI refreshes
```

### Deleting a Tag
```
User clicks ✕ on tag
         ↓
Store.removeTag(noteId, tag)
         ↓
Remove tag from tags array
         ↓
Remove #tag from text via regex
         ↓
Clean up multiple spaces
         ↓
Store.update with cleaned data
         ↓
UI updates
```

---

## 🎨 Customization

### Changing Tag Colors
```css
/* In style.css */
.brutal-tag {
  background: var(--brutal-secondary);  /* Change this */
  color: var(--brutal-white);
  border: 2px solid var(--brutal-border);
}

/* Active tag in sidebar */
.brutal-tag-item.active {
  background: var(--brutal-accent);  /* And this */
}
```

### Hashtag Regex Pattern
```typescript
// In stores/notes.ts
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g);  // Modify regex here
  // Current: #word with letters, numbers, underscore
  // Could add: #word-with-dashes → /#[\w-]+/g
  // Could add: #émoji → /#[\w\u00C0-\u017F]+/g
}
```

---

## 🚀 Future Enhancements

Planned features for the hashtag system:

- [ ] **Tag Autocomplete**: Suggest existing tags as you type
- [ ] **Tag Hierarchy**: Parent/child tag relationships (#work/meeting)
- [ ] **Tag Colors**: Custom colors per tag
- [ ] **Tag Stats**: Usage graphs and trends
- [ ] **Tag Cloud**: Visual representation of popular tags
- [ ] **Tag Merging**: Combine similar tags
- [ ] **Tag Aliases**: Different names, same tag
- [ ] **Multi-tag Filter**: Filter by multiple tags (AND/OR logic)
- [ ] **Tag Pinning**: Pin favorite tags to top of sidebar
- [ ] **Tag Export**: Export notes by tag
- [ ] **Bulk Tag Operations**: Add/remove tags from multiple notes

---

## 📊 Performance Considerations

### Optimizations Implemented:

1. **Computed Properties**: Tags only recalculated when notes change
2. **Set Operations**: Deduplication uses Set for O(1) lookup
3. **Regex Caching**: Compiled once per operation
4. **Lazy Loading**: Tags computed on-demand
5. **Index-based Updates**: No full array scans

### Scalability:

```
✅ Works well: Up to 1000 notes, 100 tags
⚠️ Consider optimization: 1000+ notes, 200+ tags
💡 Future: Virtual scrolling for large tag lists
```

---

## 🐛 Troubleshooting

### Tags not appearing?
```
Check:
1. Note was saved (not just typed)
2. Hashtag has # prefix in text
3. Hashtag is alphanumeric (#work123 ✓)
4. No spaces in hashtag (#work notes ✗)
```

### Tag not filtering?
```
Check:
1. Tag is spelled correctly
2. Case sensitivity (tags are case-sensitive)
3. Clear browser cache if persisting
4. Check console for errors
```

### Edit mode not working?
```
Check:
1. Hover over note to see edit button
2. Click edit button (not the note itself)
3. Textarea should appear and focus
4. Use Enter to save, Escape to cancel
```

---

**Built with 💪 using Vue 3 Composition API, Pinia, and Neo-Brutalism design**
