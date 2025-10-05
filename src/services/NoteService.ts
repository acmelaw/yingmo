/**
 * Service layer for note operations
 * Provides abstraction over storage and module-specific operations
 */

import type { Note, NoteType, BaseNote } from "@/types/note";
import { getNoteContent } from "@/types/note";
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
      const created = await handler.create(data);
      return this.normalizeNote(created);
    }

    // Fallback to basic text note creation
    const note: BaseNote = {
      id: this.generateId(),
      type,
      created: Date.now(),
      updated: Date.now(),
      ...data,
    };

    return this.normalizeNote(note as Note);
  }

  async update(note: Note, updates: Partial<Note>): Promise<Note> {
    // If type is changing, skip handler and use fallback
    const isTypeChanging = updates.type && updates.type !== note.type;

    if (!isTypeChanging) {
      const handler = moduleRegistry.getTypeHandler(note.type);

      if (handler) {
        const updated = await handler.update(note, updates);
        return this.normalizeNote(updated);
      }
    }

    // Fallback to basic update (used when type changes or no handler)
    const merged = {
      ...note,
      ...updates,
      updated: this.ensureFutureTimestamp(note.updated),
    } as Note;

    return this.normalizeNote(merged);
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
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    const notes = await this.getAll();
    const textMatches: Note[] = [];
    const secondaryMatches: Note[] = [];
    const seenSecondary = new Set<string>();

    for (const note of notes) {
      const id = note.id ?? this.generateId();

      // Prefer primary content matches when available
      const content = getNoteContent(note).toLowerCase();
      if (content.includes(normalized)) {
        textMatches.push(note);
        continue;
      }

      // Collect other field matches so they can be returned if we have no text hits
      if (
        note.category &&
        note.category.toLowerCase().includes(normalized) &&
        !seenSecondary.has(id)
      ) {
        secondaryMatches.push(note);
        seenSecondary.add(id);
        continue;
      }

      if (
        note.tags?.some((tag) => tag.toLowerCase().includes(normalized)) &&
        !seenSecondary.has(id)
      ) {
        secondaryMatches.push(note);
        seenSecondary.add(id);
        continue;
      }

      if (
        "markdown" in note &&
        typeof (note as any).markdown === "string" &&
        (note as any).markdown.toLowerCase().includes(normalized) &&
        !seenSecondary.has(id)
      ) {
        secondaryMatches.push(note);
        seenSecondary.add(id);
        continue;
      }

      if (
        "code" in note &&
        typeof (note as any).code === "string" &&
        (note as any).code.toLowerCase().includes(normalized) &&
        !seenSecondary.has(id)
      ) {
        secondaryMatches.push(note);
        seenSecondary.add(id);
      }
    }

    if (textMatches.length > 0) {
      return textMatches;
    }

    return secondaryMatches;
  }

  validate(note: Note): boolean {
    const handler = moduleRegistry.getTypeHandler(note.type);

    if (handler && handler.validate) {
      return handler.validate(note);
    }

    // Basic validation
    if (!note.id || !note.type || !note.created) {
      return false;
    }

    const type =
      typeof (note as any).type === "string" ? (note as any).type : "";
    const isRegisteredType = moduleRegistry.hasTypeHandler(type);
    if (!isRegisteredType && type !== "unknown") {
      return false;
    }

    return true;
  }

  private generateId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private ensureFutureTimestamp(previous: number): number {
    const now = Date.now();
    return now > previous ? now : previous + 1;
  }

  private normalizeNote(note: Note): Note {
    if (note.type === "text") {
      const content = (note as any).content ?? (note as any).text ?? "";
      (note as any).content = content;
      (note as any).text = content;
    } else if (note.type === "markdown") {
      const content = (note as any).content ?? (note as any).markdown ?? "";
      (note as any).content = content;
      if ((note as any).markdown === undefined) {
        (note as any).markdown = content;
      }
    } else if (note.type === "code") {
      const content = (note as any).content ?? (note as any).code ?? "";
      (note as any).content = content;
      if ((note as any).code === undefined) {
        (note as any).code = content;
      }
    }

    return note;
  }
}
