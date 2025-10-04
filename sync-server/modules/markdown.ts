/**
 * Markdown note module
 */

import type {
  NoteModule,
  NoteTypeHandler,
  ModuleContext,
} from "../types/module.js";
import type { MarkdownNote, BaseNote, Note } from "../types/note.js";

const markdownNoteHandler: NoteTypeHandler = {
  async create(data: any, baseNote: BaseNote): Promise<MarkdownNote> {
    return {
      ...baseNote,
      type: "markdown",
      markdown: data.markdown || "",
      html: data.html,
    };
  },

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const mdNote = note as MarkdownNote;
    return {
      ...mdNote,
      ...updates,
      type: "markdown",
      markdown: (updates as any).markdown ?? mdNote.markdown,
      html: (updates as any).html ?? mdNote.html,
    };
  },

  validate(note: Note): boolean {
    const mdNote = note as MarkdownNote;
    return (
      mdNote.type === "markdown" &&
      typeof mdNote.id === "string" &&
      mdNote.id.length > 0 &&
      typeof mdNote.markdown === "string"
    );
  },

  serialize(note: Note): any {
    const mdNote = note as MarkdownNote;
    return {
      markdown: mdNote.markdown,
      html: mdNote.html,
    };
  },

  deserialize(data: any, baseNote: BaseNote): MarkdownNote {
    return {
      ...baseNote,
      type: "markdown",
      markdown: data.markdown || "",
      html: data.html,
    };
  },
};

export const markdownNoteModule: NoteModule = {
  id: "markdown-note",
  name: "Markdown Notes",
  version: "1.0.0",
  description: "Markdown note support",
  supportedTypes: ["markdown"],

  async install(context: ModuleContext) {
    context.registerTypeHandler("markdown", markdownNoteHandler);
    context.log("Markdown note module installed");
  },
};
