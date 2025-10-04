/**
 * Code note module
 */

import type { NoteModule, NoteTypeHandler, ModuleContext } from "../types/module.js";
import type { CodeNote, BaseNote, Note } from "../types/note.js";

const codeNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<CodeNote> {
    return {
      ...baseNote,
      type: "code",
      code: data.code || "",
      language: data.language || "javascript",
      filename: data.filename,
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const codeNote = note as CodeNote;
    return {
      ...codeNote,
      ...updates,
      type: "code",
      code: (updates as any).code ?? codeNote.code,
      language: (updates as any).language ?? codeNote.language,
      filename: (updates as any).filename ?? codeNote.filename,
    };
  },

  validate(note: Note): boolean {
    const codeNote = note as CodeNote;
    return (
      codeNote.type === "code" &&
      typeof codeNote.id === "string" &&
      codeNote.id.length > 0 &&
      typeof codeNote.code === "string" &&
      typeof codeNote.language === "string"
    );
  },

  serialize(note: Note): any {
    const codeNote = note as CodeNote;
    return {
      code: codeNote.code,
      language: codeNote.language,
      filename: codeNote.filename,
    };
  },

  deserialize(data: any, baseNote: BaseNote): CodeNote {
    return {
      ...baseNote,
      type: "code",
      code: data.code || "",
      language: data.language || "javascript",
      filename: data.filename,
    };
  },
};

export const codeNoteModule: NoteModule = {
  id: "code-note",
  name: "Code Notes",
  version: "1.0.0",
  description: "Code snippet note support",
  supportedTypes: ["code"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("code", codeNoteHandler);
    context.log("Code note module installed");
  },
};
