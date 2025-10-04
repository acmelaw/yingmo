/**
 * Image Note Module - handles image uploads and display
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { ImageNote } from "@/types/note";
import ImageNoteEditor from "./components/ImageNoteEditor.vue";
import ImageNoteViewer from "./components/ImageNoteViewer.vue";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextTimestamp(previous: number): number {
  const now = Date.now();
  return now > previous ? now : previous + 1;
}

const imageNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<ImageNote> {
    return {
      id: createId(),
      type: "image",
      blob: data.blob,
      url: data.url,
      width: data.width,
      height: data.height,
      alt: data.alt,
      transforms: data.transforms || [],
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata: data.metadata,
    };
  },

  async update(note, updates) {
    const imgNote = note as ImageNote;
    return {
      ...imgNote,
      ...updates,
      type: "image",
      updated: nextTimestamp(imgNote.updated),
    } as ImageNote;
  },

  async delete(note) {
    // Revoke object URL if it exists
    const imgNote = note as ImageNote;
    if (imgNote.url && imgNote.url.startsWith("blob:")) {
      URL.revokeObjectURL(imgNote.url);
    }
    console.log(`Deleting image note ${note.id}`);
  },

  validate(note) {
    const imgNote = note as ImageNote;
    return (
      !!imgNote.id &&
      imgNote.type === "image" &&
      (!!imgNote.blob || !!imgNote.url) &&
      !!imgNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as ImageNote;
  },
};

export const imageNoteModule: NoteModule = {
  id: "image-note",
  name: "Image Notes",
  version: "1.0.0",
  description: "Image note support with upload and display",
  supportedTypes: ["image"],

  async install(context) {
    context.registerNoteType("image", imageNoteHandler);
    console.log("Image note module installed");
  },

  components: {
    editor: ImageNoteEditor,
    viewer: ImageNoteViewer,
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: true,
    canExport: false,
    canImport: false,
    supportsSearch: false,
  },
};
