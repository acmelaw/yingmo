/**
 * Text Note Module - handles basic text notes
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { TextNote } from "@/types/note";
import { createId, ensureFutureTimestamp } from "@/lib/utils";
import TextNoteEditor from "./components/TextNoteEditor.vue";
import TextNoteViewer from "./components/TextNoteViewer.vue";

const textNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<TextNote> {
    const content = (data?.content ?? data?.text ?? "") as string;
    return {
      id: createId(),
      type: "text",
      content,
      text: content,
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata: data.metadata || {},
    };
  },

  async update(note, updates) {
    const textNote = note as TextNote;
    const nextContent =
      (updates.content as string | undefined) ??
      (updates as any).text ??
      textNote.content ??
      textNote.text ??
      "";
    return {
      ...textNote,
      ...updates,
      type: "text", // Ensure type doesn't change
      content: nextContent,
      text: nextContent,
      updated: ensureFutureTimestamp(textNote.updated),
    } as TextNote;
  },

  async delete(note) {
    // Cleanup if needed
    console.log(`Deleting text note ${note.id}`);
  },

  validate(note) {
    const textNote = note as TextNote;
    return (
      !!textNote.id &&
      textNote.type === "text" &&
      typeof textNote.content === "string" &&
      !!textNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as TextNote;
  },
};

export const textNoteModule: NoteModule = {
  id: "text-note",
  name: "Text Notes",
  version: "1.0.0",
  description: "Basic text note support",
  supportedTypes: ["text"],

  slashCommands: [
    {
      command: "/text",
      aliases: ["/t"],
      description: "Create a text note",
      icon: "📝",
    },
  ],

  async install(context) {
    context.registerNoteType("text", textNoteHandler);
    console.log("Text note module installed");
  },

  components: {
    editor: TextNoteEditor,
    viewer: TextNoteViewer,
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
