/**
 * Code Note Module - handles code snippets with syntax highlighting
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { CodeNote } from "@/types/note";
import CodeNoteEditor from "./components/CodeNoteEditor.vue";
import CodeNoteViewer from "./components/CodeNoteViewer.vue";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextTimestamp(previous: number): number {
  const now = Date.now();
  return now > previous ? now : previous + 1;
}

const codeNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<CodeNote> {
    return {
      id: createId(),
      type: "code",
      content: data.content || data.code || "",
      metadata: {
        language: data.language || data.metadata?.language || "javascript",
        filename: data.filename || data.metadata?.filename,
        ...data.metadata,
      },
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
    };
  },

  async update(note, updates) {
    const codeNote = note as CodeNote;
    return {
      ...codeNote,
      ...updates,
      type: "code",
      updated: nextTimestamp(codeNote.updated),
    } as CodeNote;
  },

  async delete(note) {
    console.log(`Deleting code note ${note.id}`);
  },

  validate(note) {
    const codeNote = note as CodeNote;
    return (
      !!codeNote.id &&
      codeNote.type === "code" &&
      typeof codeNote.content === "string" &&
      !!codeNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as CodeNote;
  },
};

export const codeNoteModule: NoteModule = {
  id: "code-note",
  name: "Code Snippets",
  version: "1.0.0",
  description: "Code snippet support with syntax highlighting",
  supportedTypes: ["code"],

  async install(context) {
    context.registerNoteType("code", codeNoteHandler);
    console.log("Code note module installed");
  },

  components: {
    editor: CodeNoteEditor,
    viewer: CodeNoteViewer,
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: false,
    canExport: true,
    canImport: true,
    supportsSearch: true,
  },
};
