/**
 * Markdown Note Module - handles markdown notes with rendering
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { MarkdownNote } from "@/types/note";
import MarkdownNoteEditor from "./components/MarkdownNoteEditor.vue";
import MarkdownNoteViewer from "./components/MarkdownNoteViewer.vue";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextTimestamp(previous: number): number {
  const now = Date.now();
  return now > previous ? now : previous + 1;
}

const markdownNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<MarkdownNote> {
    return {
      id: createId(),
      type: "markdown",
      markdown: data.markdown || "",
      html: data.html,
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata: data.metadata,
    };
  },

  async update(note, updates) {
    const mdNote = note as MarkdownNote;
    return {
      ...mdNote,
      ...updates,
      type: "markdown",
      updated: nextTimestamp(mdNote.updated),
    } as MarkdownNote;
  },

  async delete(note) {
    console.log(`Deleting markdown note ${note.id}`);
  },

  validate(note) {
    const mdNote = note as MarkdownNote;
    return (
      !!mdNote.id &&
      mdNote.type === "markdown" &&
      typeof mdNote.markdown === "string" &&
      !!mdNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as MarkdownNote;
  },
};

export const markdownNoteModule: NoteModule = {
  id: "markdown-note",
  name: "Markdown Notes",
  version: "1.0.0",
  description: "Markdown note support with live preview",
  supportedTypes: ["markdown"],

  async install(context) {
    context.registerNoteType("markdown", markdownNoteHandler);
    console.log("Markdown note module installed");
  },

  components: {
    editor: MarkdownNoteEditor,
    viewer: MarkdownNoteViewer,
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
