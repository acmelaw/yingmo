/**
 * Module system types for extensible note features
 */

import type { Component } from "vue";
import type { Note, NoteType } from "./note";

/**
 * Parameter definition for module configuration
 */
export interface ModuleParameter {
  id: string;
  label: string;
  type: 'number' | 'string' | 'select' | 'boolean' | 'color';
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

/**
 * Slash command definition for creating notes
 */
export interface SlashCommand {
  command: string; // e.g., "/chords", "/chord-sheet"
  aliases?: string[]; // e.g., ["/chord", "/guitar"]
  description: string;
  icon?: string;
  defaultParameters?: Record<string, any>;
  // Parameter definitions for this command
  parameterDefinitions?: ModuleParameter[];
  // Examples of usage
  examples?: string[];
}

export interface NoteModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  supportedTypes: NoteType[];
  
  // Slash command(s) for creating this type of note
  slashCommands?: SlashCommand[];
  
  // Parameters that can be configured for notes of this type
  parameters?: ModuleParameter[];

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
