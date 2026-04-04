/**
 * Code Note Module - handles code snippets with syntax highlighting
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { CodeNote } from "@/types/note";
import { createId, ensureFutureTimestamp } from "@/lib/utils";
import CodeNoteEditor from "./components/CodeNoteEditor.vue";
import CodeNoteViewer from "./components/CodeNoteViewer.vue";

const codeNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<CodeNote> {
    const codeContent = (data.content ?? data.code ?? "") as string;
    return {
      id: createId(),
      type: "code",
      content: codeContent,
      code: codeContent,
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
    const nextCode =
      (updates.content as string | undefined) ??
      (updates as any).code ??
      codeNote.content ??
      codeNote.code ??
      "";
    return {
      ...codeNote,
      ...updates,
      type: "code",
      content: nextCode,
      code: nextCode,
      updated: ensureFutureTimestamp(codeNote.updated),
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

  slashCommands: [
    {
      command: "/code",
      aliases: ["/snippet"],
      description: "Create a code snippet",
      icon: "💻",
      defaultParameters: {
        language: "javascript",
      },
    },
  ],

  parameters: [
    {
      id: "language",
      label: "Language",
      type: "select",
      defaultValue: "javascript",
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "cpp", label: "C++" },
        { value: "csharp", label: "C#" },
        { value: "go", label: "Go" },
        { value: "rust", label: "Rust" },
        { value: "html", label: "HTML" },
        { value: "css", label: "CSS" },
        { value: "json", label: "JSON" },
        { value: "yaml", label: "YAML" },
        { value: "markdown", label: "Markdown" },
        { value: "bash", label: "Bash" },
      ],
      description: "Programming language for syntax highlighting",
    },
  ],

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
