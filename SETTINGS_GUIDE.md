# Settings Guide - Hashtag Behavior

## Understanding Auto-Extract & Clean Content

The app now gives you full control over how hashtags are handled:

### Setting 1: Auto-Extract Tags 🏷️

**What it does:**
- When **ON**: Detects `#hashtags` in your text and saves them as tags
- When **OFF**: You manage tags manually using the "+ Add Tag" button

**Examples:**

**Auto-Extract ON:**
```
You type: "Meeting tomorrow #work #urgent"
Result:
  Content: "Meeting tomorrow #work #urgent"
  Tags: [work, urgent]
```

**Auto-Extract OFF:**
```
You type: "Meeting tomorrow #work #urgent"
Result:
  Content: "Meeting tomorrow #work #urgent"
  Tags: [] (none - add manually if needed)
```

**When to use:**
- ✅ **ON** if you like typing `#hashtags` naturally in your notes
- ✅ **OFF** if you prefer to add tags separately/manually

---

### Setting 2: Clean Content 🧹

> ⚠️ Only available when Auto-Extract is ON

**What it does:**
- When **ON**: Removes `#hashtags` from your note text after extracting them
- When **OFF**: Keeps `#hashtags` in your note text (but still extracts to tags)

**Examples:**

**Clean Content ON:**
```
You type: "Meeting tomorrow #work #urgent"
Result:
  Content: "Meeting tomorrow" (hashtags removed!)
  Tags: [work, urgent]
```

**Clean Content OFF:**
```
You type: "Meeting tomorrow #work #urgent"  
Result:
  Content: "Meeting tomorrow #work #urgent" (hashtags kept!)
  Tags: [work, urgent]
```

**When to use:**
- ✅ **ON** if you want clean, hashtag-free notes (tags stored separately)
- ✅ **OFF** if you want hashtags visible in your notes for context

---

## Recommended Configurations

### 📋 Scenario 1: Twitter/Social Media Style
"I want to type `#hashtags` naturally and see them in my notes"

**Settings:**
- Auto-Extract Tags: ✅ ON
- Clean Content: ❌ OFF

**Result:**
```
Type: "Just finished project #frontend #react"
Shows: "Just finished project #frontend #react"
Tags: [frontend, react]
```

---

### 🧼 Scenario 2: Clean & Organized
"I want tags separate from my note content"

**Settings:**
- Auto-Extract Tags: ✅ ON
- Clean Content: ✅ ON

**Result:**
```
Type: "Just finished project #frontend #react"
Shows: "Just finished project"
Tags: [frontend, react]
```

---

### ✋ Scenario 3: Manual Control
"I'll add tags myself when I need them"

**Settings:**
- Auto-Extract Tags: ❌ OFF
- Clean Content: N/A (disabled)

**Result:**
```
Type: "Just finished project #frontend #react"
Shows: "Just finished project #frontend #react"
Tags: [] (add manually via "+ Add Tag" button)
```

---

## Important Notes

### ⚠️ Editing Behavior
**Regardless of settings, editing NEVER auto-extracts or modifies your content!**

When you edit a note:
- Your text stays exactly as you typed it
- Tags must be managed using the tag buttons
- This prevents accidental content changes

### 🔄 Settings Only Affect New Notes
Changing settings doesn't affect existing notes.

To update old notes:
1. Enable your preferred settings
2. Edit each note and save
3. New behavior will apply

### 🌍 Unicode Support
All settings work with international hashtags:
- French: `#café`, `#réunion`
- Japanese: `#日本語`, `#会議`
- German: `#münchen`, `#büro`
- And many more!

---

## Tips

1. **Start with defaults** (Auto-Extract ON, Clean Content OFF)
2. **Try both modes** for a few notes to see which you prefer
3. **Mix approaches**: Different settings for different note types
4. **Use search**: Type `#` in search to filter by tags regardless of settings

---

## Quick Reference

| Setting | Auto-Extract | Clean Content | What You See | Tags |
|---------|--------------|---------------|--------------|------|
| Default | ✅ ON | ❌ OFF | `Meeting #work` | `[work]` |
| Clean Mode | ✅ ON | ✅ ON | `Meeting` | `[work]` |
| Manual Mode | ❌ OFF | N/A | `Meeting #work` | `[]` |

---

**Need help?** Check the main documentation or toggle settings and create a test note to see how it works!
