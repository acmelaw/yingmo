/**
 * Tag management utilities
 */

/**
 * Enhanced Unicode-aware hashtag extraction
 * Supports: #hello, #café, #日本語, #hello123, #hello_world, #kebab-case
 */
export function extractHashtags(text: string): string[] {
  // Match # followed by unicode word characters, numbers, underscores, and hyphens
  // \p{L} = any unicode letter, \p{N} = any unicode number
  const matches = text.match(/#[\p{L}\p{N}_-]+/gu);
  if (!matches) return [];

  // Remove # and return unique tags (case-insensitive deduplication)
  const tags = matches.map((tag) => tag.substring(1));
  return [...new Set(tags.map((t) => t.toLowerCase()))].map(
    (lowered) => tags.find((t) => t.toLowerCase() === lowered) || lowered
  );
}

/**
 * Merge tags from text and explicit tags
 */
export function mergeTags(
  text: string,
  explicitTags?: string[],
  autoExtract = true
): string[] {
  const extractedTags = autoExtract ? extractHashtags(text) : [];
  const allTags = [...extractedTags, ...(explicitTags || [])];
  return [...new Set(allTags.map((t) => t.toLowerCase()))]
    .map(
      (lowered) => allTags.find((t) => t.toLowerCase() === lowered) || lowered
    )
    .sort();
}

/**
 * Remove hashtags from text for clean content display
 */
export function stripHashtags(text: string): string {
  return text
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean tag by removing # prefix and converting to lowercase
 */
export function cleanTag(tag: string): string {
  return tag.replace(/^#/, "").toLowerCase();
}

/**
 * Extract all unique tags from a collection of notes
 */
export function extractAllTags(notes: Array<{ tags?: string[] }>): string[] {
  const tagSet = new Set<string>();
  notes.forEach((note) => {
    note.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Filter notes by selected tags (AND logic)
 */
export function filterByTags<T extends { tags?: string[] }>(
  notes: T[],
  selectedTags: string[]
): T[] {
  if (selectedTags.length === 0) return notes;

  return notes.filter((note) => {
    if (!note.tags || note.tags.length === 0) return false;
    // All selected tags must be present (AND logic)
    return selectedTags.every((tag) => note.tags!.includes(tag));
  });
}
