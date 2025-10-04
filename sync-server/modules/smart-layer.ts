/**
 * Smart layer note module
 */

import type {
  NoteModule,
  NoteTypeHandler,
  ModuleContext,
} from "../types/module.js";
import type { SmartLayerNote, BaseNote, Note } from "../types/note.js";

const smartLayerNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<SmartLayerNote> {
    return {
      ...baseNote,
      type: "smart-layer",
      source: data.source || { type: "text", data: "" },
      layers: data.layers || [],
      activeLayerId: data.activeLayerId,
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const smartNote = note as SmartLayerNote;
    return {
      ...smartNote,
      ...updates,
      type: "smart-layer",
      source: (updates as any).source ?? smartNote.source,
      layers: (updates as any).layers ?? smartNote.layers,
      activeLayerId: (updates as any).activeLayerId ?? smartNote.activeLayerId,
    };
  },

  validate(note: Note): boolean {
    const smartNote = note as SmartLayerNote;
    return (
      smartNote.type === "smart-layer" &&
      typeof smartNote.id === "string" &&
      smartNote.id.length > 0 &&
      smartNote.source !== undefined &&
      Array.isArray(smartNote.layers)
    );
  },

  serialize(note: Note): any {
    const smartNote = note as SmartLayerNote;
    return {
      source: smartNote.source,
      layers: smartNote.layers,
      activeLayerId: smartNote.activeLayerId,
    };
  },

  deserialize(data: any, baseNote: BaseNote): SmartLayerNote {
    return {
      ...baseNote,
      type: "smart-layer",
      source: data.source || { type: "text", data: "" },
      layers: data.layers || [],
      activeLayerId: data.activeLayerId,
    };
  },
};

export const smartLayerNoteModule: NoteModule = {
  id: "smart-layer-note",
  name: "Smart Layer Notes",
  version: "1.0.0",
  description: "Multi-layer API-driven transformation support",
  supportedTypes: ["smart-layer"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("smart-layer", smartLayerNoteHandler);
    context.log("Smart layer note module installed");
  },
};
