/**
 * Rich text note module - handles TipTap/HTML content
 */

import type { NoteModule, NoteTypeHandler, ModuleContext } from "../types/module.js";
import type { RichTextNote, BaseNote, Note } from "../types/note.js";

const richTextNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<RichTextNote> {
    return {
      ...baseNote,
      type: "rich-text",
      content: data.content || { type: "doc", content: [] },
      html: data.html,
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const richTextNote = note as RichTextNote;
    return {
      ...richTextNote,
      ...updates,
      type: "rich-text",
      content: (updates as any).content ?? richTextNote.content,
      html: (updates as any).html ?? richTextNote.html,
    };
  },

  validate(note: Note): boolean {
    const richTextNote = note as RichTextNote;
    return (
      richTextNote.type === "rich-text" &&
      typeof richTextNote.id === "string" &&
      richTextNote.id.length > 0 &&
      richTextNote.content !== undefined
    );
  },

  serialize(note: Note): any {
    const richTextNote = note as RichTextNote;
    return {
      content: richTextNote.content,
      html: richTextNote.html,
    };
  },

  deserialize(data: any, baseNote: BaseNote): RichTextNote {
    return {
      ...baseNote,
      type: "rich-text",
      content: data.content || { type: "doc", content: [] },
      html: data.html,
    };
  },
};

export const richTextNoteModule: NoteModule = {
  id: "rich-text-note",
  name: "Rich Text Notes",
  version: "1.0.0",
  description: "TipTap/HTML rich text note support",
  supportedTypes: ["rich-text"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("rich-text", richTextNoteHandler);
    context.log("Rich text note module installed");
  },
};
