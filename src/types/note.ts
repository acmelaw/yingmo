/**
 * Core note type definitions for the modular note system
 */

export type NoteType =
  | "text"
  | "rich-text"
  | "image"
  | "smart-layer"
  | "markdown"
  | "code";

export interface BaseNote {
  id: string;
  type: NoteType;
  created: number;
  updated: number;
  category?: string;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, any>;
}

// Text-based note (legacy compatibility)
export interface TextNote extends BaseNote {
  type: "text";
  text: string;
}

// Rich text note (TipTap/HTML)
export interface RichTextNote extends BaseNote {
  type: "rich-text";
  content: any; // TipTap JSON content
  html?: string; // Cached HTML representation
}

// Image note with transformation capabilities
export interface ImageNote extends BaseNote {
  type: "image";
  blob: Blob | string; // Blob or base64
  url?: string; // Object URL or external URL
  width?: number;
  height?: number;
  alt?: string;
  transforms?: ImageTransform[];
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
  source: {
    type: "image" | "text" | "url" | "file";
    data: any;
  };
  layers: SmartLayer[];
  activeLayerId?: string;
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

// Markdown note
export interface MarkdownNote extends BaseNote {
  type: "markdown";
  markdown: string;
  html?: string; // Cached rendered HTML
}

// Code snippet note
export interface CodeNote extends BaseNote {
  type: "code";
  code: string;
  language: string;
  filename?: string;
}

// Union type for all note types
export type Note =
  | TextNote
  | RichTextNote
  | ImageNote
  | SmartLayerNote
  | MarkdownNote
  | CodeNote;

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
