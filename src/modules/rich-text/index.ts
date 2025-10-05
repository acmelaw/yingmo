/**
 * Rich Text Note Module - handles rich text with formatting
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { RichTextNote } from "@/types/note";
import RichTextNoteEditor from "./components/RichTextNoteEditor.vue";
import RichTextNoteViewer from "./components/RichTextNoteViewer.vue";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextTimestamp(previous: number): number {
  const now = Date.now();
  return now > previous ? now : previous + 1;
}

const richTextNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<RichTextNote> {
    const htmlContent = (data.content ?? data.html ?? "") as string;
    return {
      id: createId(),
      type: "rich-text",
      content: htmlContent,
      html: htmlContent,
      metadata: {
        format: data.format || data.metadata?.format || "html",
        tiptapContent:
          data.tiptapContent || data.metadata?.tiptapContent || data.content,
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
    const richNote = note as RichTextNote;
    const nextContent =
      (updates.content as string | undefined) ??
      (updates as any).html ??
      richNote.content ??
      richNote.html ??
      "";
    return {
      ...richNote,
      ...updates,
      type: "rich-text",
      content: nextContent,
      html: nextContent,
      updated: nextTimestamp(richNote.updated),
    } as RichTextNote;
  },

  async delete(note) {
    console.log(`Deleting rich-text note ${note.id}`);
  },

  validate(note) {
    const richNote = note as RichTextNote;
    return (
      richNote.type === "rich-text" && typeof richNote.content === "string"
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as RichTextNote;
  },
};

export const richTextNoteModule: NoteModule = {
  id: "rich-text-note",
  name: "Rich Text Notes",
  version: "1.0.0",
  description: "Rich text note support with formatting",
  supportedTypes: ["rich-text"],

  async install(context) {
    context.registerNoteType("rich-text", richTextNoteHandler);
    console.log("Rich text note module installed");
  },

  components: {
    editor: RichTextNoteEditor,
    viewer: RichTextNoteViewer,
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
