/**
 * Markdown Note Module - handles markdown notes with rendering
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { MarkdownNote, Note } from "@/types/note";
import MarkdownNoteEditor from "./components/MarkdownNoteEditor.vue";
import MarkdownNoteViewer from "./components/MarkdownNoteViewer.vue";
import { marked } from "marked";

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
    const html = data.html || data.metadata?.renderedHtml || await marked(data.content || data.markdown || "");
    
    return {
      id: createId(),
      type: "markdown",
      title: data.title || "",
      content: data.content || data.markdown || "",
      metadata: {
        renderedHtml: html,
        ...data.metadata
      },
      created: Date.now(),
      updated: Date.now(),
      pinned: false,
      tags: data.tags || [],
    };
  },

  async update(note: MarkdownNote, data: Partial<MarkdownNote>): Promise<MarkdownNote> {
    return {
      ...note,
      ...data,
      updated: Date.now(),
    };
  },

  validate(note: Note): boolean {
    const mdNote = note as MarkdownNote;
    return mdNote.type === "markdown" && typeof mdNote.content === "string";
  },

  serialize(note: Note): string {
    return JSON.stringify(note);
  },

  deserialize(data: string): MarkdownNote {
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
