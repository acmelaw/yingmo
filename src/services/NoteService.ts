/**
 * Service layer for note operations
 * Provides abstraction over storage and module-specific operations
 */

import type { Note, NoteType, BaseNote } from "@/types/note";
import { moduleRegistry } from "@/core/ModuleRegistry";

export interface NoteService {
  create(type: NoteType, data: any): Promise<Note>;
  update(note: Note, updates: Partial<Note>): Promise<Note>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<Note | null>;
  getAll(): Promise<Note[]>;
  search(query: string): Promise<Note[]>;
  validate(note: Note): boolean;
}

export class DefaultNoteService implements NoteService {
  private notesStore: any;

  constructor(notesStore: any) {
    this.notesStore = notesStore;
  }

  async create(type: NoteType, data: any): Promise<Note> {
    const handler = moduleRegistry.getTypeHandler(type);

    if (handler) {
      return handler.create(data);
    }

    // Fallback to basic text note creation
    const note: BaseNote = {
      id: this.generateId(),
      type,
      created: Date.now(),
      updated: Date.now(),
      ...data,
    };

    return note as Note;
  }

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    const handler = moduleRegistry.getTypeHandler(note.type);

    if (handler) {
      return handler.update(note, updates);
    }

    // Fallback to basic update
    return {
      ...note,
      ...updates,
      updated: Date.now(),
    } as Note;
  }

  async delete(id: string): Promise<void> {
    const note = await this.get(id);
    if (!note) return;

    const handler = moduleRegistry.getTypeHandler(note.type);

    if (handler && handler.delete) {
      await handler.delete(note);
    }

    // Additional cleanup can be done here
  }

  async get(id: string): Promise<Note | null> {
    const notes = this.notesStore.notes;
    return notes.find((n: Note) => n.id === id) || null;
  }

  async getAll(): Promise<Note[]> {
    return this.notesStore.notes;
  }

  async search(query: string): Promise<Note[]> {
    const notes = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return notes.filter((note: Note) => {
      // Search in common fields
      if (note.category?.toLowerCase().includes(lowerQuery)) return true;
      if (note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)))
        return true;

      // Type-specific search
      if ("text" in note && typeof note.text === "string") {
        return note.text.toLowerCase().includes(lowerQuery);
      }

      if ("markdown" in note && typeof note.markdown === "string") {
        return note.markdown.toLowerCase().includes(lowerQuery);
      }

      if ("code" in note && typeof note.code === "string") {
        return note.code.toLowerCase().includes(lowerQuery);
      }

      return false;
    });
  }

  validate(note: Note): boolean {
    const handler = moduleRegistry.getTypeHandler(note.type);

    if (handler && handler.validate) {
      return handler.validate(note);
    }

    // Basic validation
    return !!note.id && !!note.type && !!note.created;
  }

  private generateId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
