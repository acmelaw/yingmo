/**
 * Module system for extensible note type handling
 */

import type { Note, NoteType, BaseNote } from "./note.js";

export interface NoteModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  supportedTypes: NoteType[];

  // Lifecycle hooks
  install?: (context: ModuleContext) => void | Promise<void>;
  uninstall?: (context: ModuleContext) => void | Promise<void>;

  // Note type handler
  handler?: NoteTypeHandler;

  // Module configuration
  config?: Record<string, any>;
}

export interface ModuleContext {
  registerTypeHandler: (type: NoteType, handler: NoteTypeHandler) => void;
  getService: <T = any>(name: string) => T;
  log: (message: string, level?: "info" | "warn" | "error") => void;
}

export interface NoteTypeHandler {
  create: (data: any, baseNote: BaseNote) => Promise<Note>;
  update: (note: Note, updates: Partial<Note>) => Promise<Note>;
  validate: (note: Note) => boolean;
  serialize: (note: Note) => any; // For database storage
  deserialize: (data: any, baseNote: BaseNote) => Note; // From database
  delete?: (note: Note) => Promise<void>;
}
