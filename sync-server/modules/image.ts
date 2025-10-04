/**
 * Image note module
 */

import type {
  NoteModule,
  NoteTypeHandler,
  ModuleContext,
} from "../types/module.js";
import type { ImageNote, BaseNote, Note } from "../types/note.js";

const imageNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<ImageNote> {
    return {
      ...baseNote,
      type: "image",
      blobData: data.blobData,
      url: data.url,
      width: data.width,
      height: data.height,
      alt: data.alt,
      transforms: data.transforms || [],
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const imageNote = note as ImageNote;
    return {
      ...imageNote,
      ...updates,
      type: "image",
      blobData: (updates as any).blobData ?? imageNote.blobData,
      url: (updates as any).url ?? imageNote.url,
      width: (updates as any).width ?? imageNote.width,
      height: (updates as any).height ?? imageNote.height,
      alt: (updates as any).alt ?? imageNote.alt,
      transforms: (updates as any).transforms ?? imageNote.transforms,
    };
  },

  validate(note: Note): boolean {
    const imageNote = note as ImageNote;
    return (
      imageNote.type === "image" &&
      typeof imageNote.id === "string" &&
      imageNote.id.length > 0 &&
      (imageNote.blobData !== undefined || imageNote.url !== undefined)
    );
  },

  serialize(note: Note): any {
    const imageNote = note as ImageNote;
    return {
      blobData: imageNote.blobData,
      url: imageNote.url,
      width: imageNote.width,
      height: imageNote.height,
      alt: imageNote.alt,
      transforms: imageNote.transforms,
    };
  },

  deserialize(data: any, baseNote: BaseNote): ImageNote {
    return {
      ...baseNote,
      type: "image",
      blobData: data.blobData,
      url: data.url,
      width: data.width,
      height: data.height,
      alt: data.alt,
      transforms: data.transforms || [],
    };
  },
};

export const imageNoteModule: NoteModule = {
  id: "image-note",
  name: "Image Notes",
  version: "1.0.0",
  description: "Image note support with transformations",
  supportedTypes: ["image"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("image", imageNoteHandler);
    context.log("Image note module installed");
  },
};
