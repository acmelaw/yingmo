/**
 * Text note module - handles basic text notes
 */

import type { NoteModule, NoteTypeHandler, ModuleContext } from "../types/module.js";
import type { TextNote, BaseNote, Note } from "../types/note.js";

const textNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<TextNote> {
    return {
      ...baseNote,
      type: "text",
      text: data.text || "",
      editHistory: data.editHistory || [],
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const textNote = note as TextNote;
    return {
      ...textNote,
      ...updates,
      type: "text",
      text: (updates as any).text ?? textNote.text,
      editHistory: (updates as any).editHistory ?? textNote.editHistory,
    };
  },

  validate(note: Note): boolean {
    const textNote = note as TextNote;
    return (
      textNote.type === "text" &&
      typeof textNote.id === "string" &&
      textNote.id.length > 0 &&
      typeof textNote.text === "string"
    );
  },

  serialize(note: Note): any {
    const textNote = note as TextNote;
    return {
      text: textNote.text,
      editHistory: textNote.editHistory,
    };
  },

  deserialize(data: any, baseNote: BaseNote): TextNote {
    return {
      ...baseNote,
      type: "text",
      text: data.text || "",
      editHistory: data.editHistory || [],
    };
  },
};

export const textNoteModule: NoteModule = {
  id: "text-note",
  name: "Text Notes",
  version: "1.0.0",
  description: "Basic text note support",
  supportedTypes: ["text"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("text", textNoteHandler);
    context.log("Text note module installed");
  },
};
