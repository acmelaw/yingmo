# Quick Start Guide - Enhanced Hashtag System

## What's New? 🎉

Your hashtag system just got a major upgrade! Here's what changed:

### 1. **Unicode Support** 🌍
- ✅ Now works with ANY language!
- Examples: `#café`, `#日本語`, `#münchen`, `#привет`
- Old system only worked with English letters

### 2. **Separated Tags & Content** 🎯
- **Before:** Deleting a tag also deleted it from your note text ❌
- **Now:** Tags and content are completely separate ✅
- Your note text never changes when managing tags!

### 3. **Multi-Tag Filtering** 🔍
- **Before:** Filter by one tag at a time
- **Now:** Click multiple tags to find notes with ALL of them
- Example: Filter by `#work` AND `#urgent` to find urgent work notes

### 4. **Edit History** 📝
- Every edit is now tracked automatically
- See how many times a note was edited (📝 icon)
- Future: Undo/redo and version comparison

### 5. **Smart Search** 💡
- Type `#` in search to see tag suggestions
- Shows how many notes have each tag
- Click any suggestion to instantly filter

## Getting Started

### Creating Notes with Tags

**Option 1: Auto-Extract (Default)**
1. Type your note: `Meeting tomorrow at #café with #team`
2. Click send
3. Result:
   - Content: `Meeting tomorrow at café with team`
   - Tags: `#café`, `#team` (shown separately)

**Option 2: Manual Tags Only**
1. Open Settings (⚙️ icon)
2. Toggle OFF "Auto-extract Tags"
3. Now hashtags stay in your text
4. Add tags manually using the "+ Add Tag" button when editing

### Managing Tags

**Adding a tag to existing note:**
1. Hover over any note
2. Click ✏️ (Edit button)
3. Click "+ Add Tag" button
4. Type tag name (without #)
5. Press Enter or click ✓
6. Click "✓ Save"

**Removing a tag:**
1. Hover over any tag on a note
2. Click the ✕ that appears
3. Tag removed instantly
4. **Your note content stays unchanged!** ✅

### Filtering by Tags

**Single tag:**
1. Click any `#tag` in a note or sidebar
2. Only notes with that tag appear
3. Click the tag again to deselect

**Multiple tags:**
1. Click first tag (e.g., `#work`)
2. Click second tag (e.g., `#urgent`)
3. Only notes with BOTH tags appear
4. Click "Clear All" to reset

### Searching

**Text search:**
- Type anything in search box
- Matches note content, categories, and tags

**Tag search:**
- Type `#` in search box
- See suggested tags with note counts
- Click any suggestion to filter by that tag

## Tips & Tricks

### Unicode Tags
You can now use hashtags in ANY language:
- French: `#réunion`, `#café`
- Japanese: `#会議`, `#重要`
- German: `#büro`, `#münchen`
- Russian: `#работа`
- Arabic: `#اجتماع`
- And many more!

### Tag Organization (Coming Soon)
We're planning hierarchical tags:
```
#work
├─ #work/meeting
├─ #work/email
└─ #work/project
```

### Edit History
Look for the 📝 icon next to edited notes:
- Hover to see number of edits
- Future: Click to view full history

### Settings

**Auto-Extract Tags:**
- **ON (default):** Hashtags automatically become tags, removed from text
- **OFF:** Keep hashtags in text, add tags manually

**When to turn OFF auto-extract:**
- You want hashtags visible in your notes
- You use # for non-tag purposes (e.g., #1, #winning)
- You prefer manual tag management

## Migration from Old System

### Your data is safe! ✅

The system automatically migrates your existing notes:
- All notes preserved exactly as they were
- Old single-tag filter → New multi-tag filter
- Old tags → New tag system
- No data loss!

### What changed in existing notes:

**If you had notes like this:**
```
"Buy groceries #shopping #urgent"
```

**They now show as:**
- **Content:** "Buy groceries #shopping #urgent" (unchanged)
- **Tags:** `#shopping`, `#urgent` (extracted)

**To clean up old notes:**
1. Enable "Auto-extract Tags" in settings (default)
2. Edit each old note
3. Save it (the hashtags will be extracted and removed from text)
4. Your note will now show clean content + separate tags

## Troubleshooting

### Tags not appearing
- **Check:** Is "Auto-extract Tags" enabled in Settings?
- **Remember:** Auto-extract only works when CREATING notes, not editing

### Can't find multi-tag filtering
- Click multiple tags in sidebar or on notes
- They should highlight when active
- Look for "Filtering by:" banner at top

### Search suggestions not showing
- Type at least one character
- Type `#` to specifically search tags
- Make sure you have created some tags

### Old hashtags still in text
- This is normal if you had notes before the update
- Edit each note and save to clean them up
- Or turn OFF auto-extract to keep them as-is

## Keyboard Shortcuts

**In note edit mode:**
- `Enter` = Save note
- `Shift + Enter` = New line
- `Escape` = Cancel editing

**In tag input:**
- `Enter` = Add tag
- `Escape` = Cancel

**In search:**
- `Escape` = Clear search

## Advanced Features

### Edit History Details
Each edit stores:
- Timestamp of when it was made
- Content at that time
- Tags at that time
- (Future: User who made the edit for collaboration)

### Rich Text Editor (Optional)
A TipTap-based rich text editor is available:
- Bold, italic, lists, headings
- CRDT-based for real-time collaboration
- History tracking built-in
- Can be enabled per-note or globally

*Not yet integrated - coming in future update!*

## What's Next?

Planned features:
- 🔄 Undo/redo edits
- 📊 Tag analytics and usage stats
- 🎨 Custom tag colors
- 🌳 Hierarchical tags (#work/meeting)
- 🤝 Real-time collaboration with TipTap
- 🔗 Tag relationships and suggestions
- 📱 Better mobile experience

## Feedback

Found a bug or have a suggestion? The system is designed to be:
- **Non-destructive:** Your data is never lost
- **Backward compatible:** Old notes work perfectly
- **Future-proof:** Ready for collaboration features

---

**Version:** 2.0.0
**Last Updated:** October 4, 2025

Enjoy your enhanced note-taking experience! 🚀
