/**
 * Todo Note Module - checkbox-based task lists
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { TodoNote, TodoItem } from "@/types/note";
import TodoNoteEditor from "./components/TodoNoteEditor.vue";
import TodoNoteViewer from "./components/TodoNoteViewer.vue";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseTextToTodos(text: string): TodoItem[] {
  const lines = text.split('\n');
  return lines
    .filter(line => line.trim())
    .map(line => {
      // Parse "[ ] task" or "- [ ] task" or "[x] task" format
      const match = line.match(/^[-\s]*\[([x\s])\]\s*(.+)$/i);
      if (match) {
        return {
          id: createId(),
          text: match[2].trim(),
          done: match[1].toLowerCase() === 'x'
        };
      }
      // Plain text becomes unchecked todo
      return {
        id: createId(),
        text: line.trim(),
        done: false
      };
    });
}

const todoNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<TodoNote> {
    const text = (data?.content ?? data?.text ?? "") as string;
    const items = parseTextToTodos(text);

    return {
      id: createId(),
      type: "todo",
      items,
      text, // Keep original text for search
      content: text,
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata: data.metadata || {},
    };
  },

  async update(note, updates) {
    const todoNote = note as TodoNote;

    // If text/content updated, reparse
    if (updates.content || (updates as any).text) {
      const text = ((updates.content ?? (updates as any).text) as string);
      const items = parseTextToTodos(text);
      return {
        ...todoNote,
        ...updates,
        type: "todo",
        items,
        text,
        content: text,
        updated: Date.now(),
      };
    }

    // If items updated directly (toggle done)
    if ((updates as any).items) {
      const items = (updates as any).items as TodoItem[];
      const text = items.map(i => `[${i.done ? 'x' : ' '}] ${i.text}`).join('\n');
      return {
        ...todoNote,
        ...updates,
        type: "todo",
        items,
        text,
        content: text,
        updated: Date.now(),
      };
    }

    return {
      ...todoNote,
      ...updates,
      type: "todo",
      updated: Date.now(),
    };
  },

  async delete(note) {
    // Cleanup if needed
    console.log(`Deleting todo note ${note.id}`);
  },

  validate(note) {
    const todoNote = note as TodoNote;
    return (
      !!todoNote.id &&
      todoNote.type === "todo" &&
      Array.isArray(todoNote.items) &&
      !!todoNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as TodoNote;
  },
};

export const todoModule: NoteModule = {
  id: "todo-note",
  name: "Todo Lists",
  version: "1.0.0",
  description: "Checkbox-based task lists",
  supportedTypes: ["todo"],

  async install(context) {
    context.registerNoteType("todo", todoNoteHandler);
    console.log("Todo note module installed");
  },

  components: {
    editor: TodoNoteEditor,
    viewer: TodoNoteViewer,
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

export default todoModule;
