/**
 * Core note type definitions for the modular note system
 *
 * UNIFIED DATA MODEL:
 * All notes share a common `content` field for their primary data.
 * Type-specific parameters go in `metadata`.
 * This makes transformations lossless and generic operations (like Caesar cipher) possible.
 */

export type NoteType =
  | "text"
  | "rich-text"
  | "image"
  | "smart-layer"
  | "markdown"
  | "code"
  | "todo"
  | "chord-sheet";

export type NoteColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export interface BaseNote {
  id: string;
  type: NoteType;
  title?: string; // Optional title for all notes
  content: string; // UNIFIED: All notes store their primary data here
  created: number;
  updated: number;
  pinned?: boolean; // Pin notes to top
  category?: string;
  tags?: string[];
  archived?: boolean;
  color?: NoteColor; // Google Keep-style color coding
  metadata?: Record<string, any>; // Type-specific parameters (language, dimensions, etc.)
  // View-only display type (doesn't affect underlying data)
  // Can be a NoteType or a view-only module ID like 'caesar-cipher'
  viewAs?: NoteType | string;
}

// Text-based note
export interface TextNote extends BaseNote {
  type: "text";
  content: string; // Plain text content
  text: string; // Legacy alias maintained for compatibility
}

// Markdown note
export interface MarkdownNote extends BaseNote {
  type: "markdown";
  content: string; // Markdown source
  markdown?: string; // Legacy alias for editor compatibility
  html?: string; // Optional cached HTML (legacy support)
  metadata?: {
    renderedHtml?: string; // Cached rendered HTML
    [key: string]: any;
  };
}

// Code snippet note
export interface CodeNote extends BaseNote {
  type: "code";
  content: string; // Code content
  code?: string; // Legacy alias
  metadata: {
    language: string; // Required for code notes
    filename?: string;
    [key: string]: any;
  };
}

// Rich text note (TipTap/HTML)
export interface RichTextNote extends BaseNote {
  type: "rich-text";
  content: string; // HTML content or JSON stringified
  html?: string; // Legacy alias for rendered HTML
  metadata?: {
    format?: "html" | "tiptap-json";
    tiptapContent?: any; // TipTap JSON content
    [key: string]: any;
  };
}

// Image note
export interface ImageNote extends BaseNote {
  type: "image";
  content: string; // URL or base64 data
  metadata?: {
    blob?: Blob | string;
    width?: number;
    height?: number;
    alt?: string;
    transforms?: ImageTransform[];
    [key: string]: any;
  };
}

export interface ImageTransform {
  id: string;
  type: "ocr" | "caption" | "resize" | "filter";
  config: Record<string, any>;
  result?: any;
  cached?: boolean;
  timestamp?: number;
}

// Smart layer note with API-driven transformations
export interface SmartLayerNote extends BaseNote {
  type: "smart-layer";
  content: string; // Stringified source data
  metadata: {
    source: {
      type: "image" | "text" | "url" | "file";
      data: any;
    };
    layers: SmartLayer[];
    activeLayerId?: string;
    [key: string]: any;
  };
}

export interface SmartLayer {
  id: string;
  name: string;
  type: string; // 'concept', 'extract', 'summarize', 'translate', etc.
  config: SmartLayerConfig;
  result?: any;
  cached?: boolean;
  timestamp?: number;
  error?: string;
}

export interface SmartLayerConfig {
  apiEndpoint?: string;
  apiKey?: string;
  prompt?: string;
  model?: string;
  parameters?: Record<string, any>;
}

// Todo item
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

// Todo note (checkbox list)
export interface TodoNote extends BaseNote {
  type: "todo";
  content: string; // Text representation "[x] task\n[ ] task"
  text: string; // Alias for search
  items: TodoItem[]; // Array of todo items
}

// Chord sheet note (guitar/music chords)
export interface ChordSheetNote extends BaseNote {
  type: "chord-sheet";
  content: string; // Chord sheet text with chords and lyrics
  metadata: {
    transpose?: number; // Semitones to transpose (-12 to 12)
    originalKey?: string; // Original key of the song
    capo?: number; // Capo position
    artist?: string;
    title?: string;
    [key: string]: any;
  };
}

// Union type for all note types
export type Note =
  | TextNote
  | RichTextNote
  | ImageNote
  | SmartLayerNote
  | MarkdownNote
  | CodeNote
  | TodoNote
  | ChordSheetNote;

// ============================================================================
// HELPER FUNCTIONS for accessing note content
// These provide a unified interface regardless of note type
// ============================================================================

/**
 * Get the primary content from any note type
 */
export function getNoteContent(note: Note): string {
  if (typeof note.content === "string" && note.content.length > 0) {
    return note.content;
  }

  const legacyText = (note as any).text;
  if (typeof legacyText === "string" && legacyText.length > 0) {
    return legacyText;
  }

  const legacyMarkdown = (note as any).markdown;
  if (typeof legacyMarkdown === "string" && legacyMarkdown.length > 0) {
    return legacyMarkdown;
  }

  const legacyCode = (note as any).code;
  if (typeof legacyCode === "string" && legacyCode.length > 0) {
    return legacyCode;
  }

  const legacyHtml = (note as any).html;
  if (typeof legacyHtml === "string" && legacyHtml.length > 0) {
    return legacyHtml;
  }

  return "";
}

/**
 * Set the primary content for any note type
 */
export function setNoteContent(note: Note, content: string): Note {
  const updated: any = { ...note, content };

  if (isTextNote(updated)) {
    updated.text = content;
  } else if (isMarkdownNote(updated)) {
    updated.markdown = content;
  } else if (isCodeNote(updated)) {
    updated.code = content;
  }

  return updated;
}

/**
 * Get metadata value with type safety
 */
export function getNoteMeta<T = any>(
  note: Note,
  key: string,
  defaultValue?: T
): T | undefined {
  return note.metadata?.[key] ?? defaultValue;
}

/**
 * Set metadata value
 */
export function setNoteMeta(note: Note, key: string, value: any): any {
  return {
    ...note,
    metadata: {
      ...note.metadata,
      [key]: value,
    },
  };
}

/**
 * Apply a transformation to note content (for generic operations like Caesar cipher)
 */
export function transformNoteContent(
  note: Note,
  transformer: (content: string) => string
): Note {
  return setNoteContent(note, transformer(getNoteContent(note)));
}

// Type guards
export function isTextNote(note: Note): note is TextNote {
  return note.type === "text";
}

export function isRichTextNote(note: Note): note is RichTextNote {
  return note.type === "rich-text";
}

export function isImageNote(note: Note): note is ImageNote {
  return note.type === "image";
}

export function isSmartLayerNote(note: Note): note is SmartLayerNote {
  return note.type === "smart-layer";
}

export function isMarkdownNote(note: Note): note is MarkdownNote {
  return note.type === "markdown";
}

export function isCodeNote(note: Note): note is CodeNote {
  return note.type === "code";
}

export function isChordSheetNote(note: Note): note is ChordSheetNote {
  return note.type === "chord-sheet";
}
