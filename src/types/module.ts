/**
 * Module system types for extensible note features
 */

import type { Component } from "vue";
import type { Note, NoteType } from "./note";

export interface NoteModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  supportedTypes: NoteType[];

  // Module lifecycle hooks
  install?: (context: ModuleContext) => void | Promise<void>;
  uninstall?: (context: ModuleContext) => void | Promise<void>;

  // UI components for this module
  components?: {
    editor?: Component;
    viewer?: Component;
    preview?: Component;
    settings?: Component;
  };

  // Module capabilities
  capabilities?: ModuleCapabilities;

  // Module configuration
  config?: Record<string, any>;
}

export interface ModuleContext {
  registerNoteType: (type: NoteType, handler: NoteTypeHandler) => void;
  registerComponent: (name: string, component: Component) => void;
  registerAction: (action: NoteAction) => void;
  registerTransform: (transform: TransformDefinition) => void;
  getStore: <T = any>(name: string) => T;
  getService: <T = any>(name: string) => T;
}

export interface ModuleCapabilities {
  canCreate?: boolean;
  canEdit?: boolean;
  canTransform?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  supportsDragDrop?: boolean;
  supportsShare?: boolean;
  supportsSearch?: boolean;
}

export interface NoteTypeHandler {
  create: (data: any) => Promise<Note>;
  update: (note: Note, updates: Partial<Note>) => Promise<Note>;
  delete: (note: Note) => Promise<void>;
  validate: (note: Note) => boolean;
  serialize: (note: Note) => string;
  deserialize: (data: string) => Note;
}

export interface NoteAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  appliesTo: (note: Note) => boolean;
  execute: (note: Note, context: ActionContext) => void | Promise<void>;
}

export interface ActionContext {
  store: any;
  router?: any;
  notify: (
    message: string,
    type?: "success" | "error" | "warning" | "info"
  ) => void;
}

export interface TransformDefinition {
  id: string;
  name: string;
  type: string;
  inputTypes: NoteType[];
  outputType: NoteType | "same";
  configSchema?: Record<string, any>;
  transform: (note: Note, config: any) => Promise<Note>;
}
