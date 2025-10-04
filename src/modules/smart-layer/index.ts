/**
 * Smart Layer Note Module - handles AI-powered transformations
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { SmartLayerNote } from "@/types/note";
import SmartLayerNoteEditor from "./components/SmartLayerNoteEditor.vue";
import SmartLayerNoteViewer from "./components/SmartLayerNoteViewer.vue";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextTimestamp(previous: number): number {
  const now = Date.now();
  return now > previous ? now : previous + 1;
}

const smartLayerNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<SmartLayerNote> {
    const source = data.source || data.metadata?.source || { type: "text", data: "" };
    const layers = data.layers || data.metadata?.layers || [];
    
    return {
      id: createId(),
      type: "smart-layer",
      content: data.content || JSON.stringify(source.data) || "",
      metadata: {
        source,
        layers,
        activeLayerId: data.activeLayerId || data.metadata?.activeLayerId,
        ...data.metadata
      },
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
    };
  },

  async update(note, updates) {
    const smartNote = note as SmartLayerNote;
    return {
      ...smartNote,
      ...updates,
      type: "smart-layer",
      updated: nextTimestamp(smartNote.updated),
    } as SmartLayerNote;
  },

  async delete(note) {
    console.log(`Deleting smart-layer note ${note.id}`);
  },

  validate(note) {
    const smartNote = note as SmartLayerNote;
    return (
      !!smartNote.id &&
      smartNote.type === "smart-layer" &&
      typeof smartNote.content === "string" &&
      !!smartNote.metadata?.source &&
      Array.isArray(smartNote.metadata?.layers) &&
      !!smartNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as SmartLayerNote;
  },
};

export const smartLayerNoteModule: NoteModule = {
  id: "smart-layer-note",
  name: "Smart Layer Notes",
  version: "1.0.0",
  description: "AI-powered note transformations and layers",
  supportedTypes: ["smart-layer"],

  async install(context) {
    context.registerNoteType("smart-layer", smartLayerNoteHandler);
    console.log("Smart layer note module installed");
  },

  components: {
    editor: SmartLayerNoteEditor,
    viewer: SmartLayerNoteViewer,
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: true,
    canExport: true,
    canImport: true,
    supportsSearch: true,
  },
};
