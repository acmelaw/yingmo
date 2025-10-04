/**
 * Service layer for note operations
 * Provides abstraction over storage and module-specific operations
 */

import {
  isTextNote,
  isRichTextNote,
  isMarkdownNote,
  isCodeNote,
  type Note,
  type NoteType,
  type BaseNote,
} from "../types/note.js";
import { moduleRegistry } from "./ModuleRegistry.js";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

type NoteCreationData = {
  id?: string;
  created?: string | number | Date;
  updated?: string | number | Date;
  category?: string;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, unknown>;
  text?: string;
  markdown?: string;
  code?: string;
  content?: unknown;
  html?: string;
};

type NoteRow = typeof schema.notes.$inferSelect;

export interface NoteService {
  create(
    type: NoteType,
    data: NoteCreationData,
    tenantId: string,
    userId: string
  ): Promise<Note>;
  update(noteId: string, updates: Partial<Note>): Promise<Note>;
  get(noteId: string): Promise<Note | null>;
  delete(noteId: string): Promise<void>;
  list(
    tenantId: string,
    userId: string,
    filters?: NoteFilters
  ): Promise<Note[]>;
  search(
    tenantId: string,
    userId: string,
    query: string,
    filters?: NoteFilters
  ): Promise<Note[]>;
  validate(note: Note): boolean;
}

export interface NoteFilters {
  type?: NoteType;
  category?: string;
  tags?: string[];
  archived?: boolean;
}

export class DefaultNoteService implements NoteService {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async create(
    type: NoteType,
    data: Record<string, unknown>,
    tenantId: string,
    userId: string
  ): Promise<Note> {
    const handler = moduleRegistry.getTypeHandler(type);
    if (!handler) {
      throw new Error(`No handler registered for note type: ${type}`);
    }

    const noteData = data as NoteCreationData;

    // Create base note structure
    const baseNote: BaseNote = {
      id: noteData.id ?? this.generateId(),
      type,
      tenantId,
      userId,
      created: new Date(noteData.created ?? Date.now()),
      updated: new Date(noteData.updated ?? Date.now()),
      category:
        typeof noteData.category === "string" ? noteData.category : undefined,
      tags: Array.isArray(noteData.tags)
        ? noteData.tags.filter((tag): tag is string => typeof tag === "string")
        : undefined,
      archived:
        typeof noteData.archived === "boolean" ? noteData.archived : false,
      metadata:
        noteData.metadata && typeof noteData.metadata === "object"
          ? (noteData.metadata as BaseNote["metadata"])
          : undefined,
    };

    // Use module handler to create note
    const note = await handler.create(data, baseNote);

    // Serialize and save to database
    const serialized = handler.serialize(note);

    await this.db.insert(schema.notes).values({
      id: note.id,
      type: note.type,
      tenantId: note.tenantId,
      userId: note.userId,
      tags: note.tags,
      category: note.category,
      archived: note.archived || false,
      metadata: note.metadata,
      created: note.created,
      updated: note.updated,
      content: serialized,
      text: isTextNote(note) ? note.text : null,
      tiptapContent: isRichTextNote(note) ? note.content : null,
    });

    // Create initial edit history entry
    await this.createEditHistory(note.id, note, "create");

    return note;
  }

  async update(noteId: string, updates: Partial<Note>): Promise<Note> {
    const existing = await this.get(noteId);
    if (!existing) {
      throw new Error(`Note not found: ${noteId}`);
    }

    const handler = moduleRegistry.getTypeHandler(existing.type);
    if (!handler) {
      throw new Error(`No handler registered for note type: ${existing.type}`);
    }

    // Use module handler to update note
    const updated = await handler.update(existing, updates);
    updated.updated = new Date();

    // Serialize and save
    const serialized = handler.serialize(updated);

    await this.db
      .update(schema.notes)
      .set({
        tags: updated.tags,
        category: updated.category,
        archived: updated.archived,
        metadata: updated.metadata,
        updated: updated.updated,
        content: serialized,
        text: isTextNote(updated) ? updated.text : null,
        tiptapContent: isRichTextNote(updated) ? updated.content : null,
      })
      .where(eq(schema.notes.id, noteId));

    // Create edit history entry
    await this.createEditHistory(noteId, updated, "update");

    return updated;
  }

  private async createEditHistory(
    noteId: string,
    note: Note,
    changeType: string
  ): Promise<void> {
    try {
      // Extract text content for history
      let textContent = "";
      if (isTextNote(note)) {
        textContent = note.text;
      } else if (isMarkdownNote(note)) {
        textContent = note.markdown;
      } else if (isCodeNote(note)) {
        textContent = note.code;
      } else if (isRichTextNote(note)) {
        if (typeof note.html === "string") {
          textContent = note.html;
        } else {
          textContent = JSON.stringify(note.content ?? {});
        }
      }

      await this.db.insert(schema.noteEdits).values({
        id: randomUUID(),
        noteId,
        userId: note.userId,
        text: textContent.substring(0, 1000), // Limit to 1000 chars
        tags: note.tags || [],
        timestamp: new Date(),
        changeType,
        device: "server",
      });
    } catch (error) {
      // Don't fail the update if history fails
      console.error("Failed to create edit history:", error);
    }
  }

  async get(noteId: string): Promise<Note | null> {
    const [row] = await this.db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, noteId))
      .limit(1);

    if (!row) return null;

    return this.deserializeNote(row);
  }

  async delete(noteId: string): Promise<void> {
    await this.db.delete(schema.notes).where(eq(schema.notes.id, noteId));
  }

  async list(
    tenantId: string,
    userId: string,
    filters?: NoteFilters
  ): Promise<Note[]> {
    const conditions = [
      eq(schema.notes.tenantId, tenantId),
      eq(schema.notes.userId, userId),
    ];

    if (filters?.type) {
      conditions.push(eq(schema.notes.type, filters.type));
    }

    if (filters?.archived !== undefined) {
      conditions.push(eq(schema.notes.archived, filters.archived));
    }

    const rows = await this.db
      .select()
      .from(schema.notes)
      .where(and(...conditions))
      .orderBy(desc(schema.notes.updated));

    return rows
      .map((row) => this.deserializeNote(row))
      .filter((n): n is Note => n !== null);
  }

  async search(
    tenantId: string,
    userId: string,
    query: string,
    filters?: NoteFilters
  ): Promise<Note[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.list(tenantId, userId, filters);
    }

    const notes = await this.list(tenantId, userId, filters);
    return notes.filter((note) => this.matchesQuery(note, normalized));
  }

  validate(note: Note): boolean {
    const handler = moduleRegistry.getTypeHandler(note.type);
    if (!handler) return false;
    return handler.validate(note);
  }

  private deserializeNote(row: NoteRow): Note | null {
    const handler = moduleRegistry.getTypeHandler(row.type as NoteType);
    if (!handler) {
      console.error(`No handler for note type: ${row.type}`);
      return null;
    }

    const baseNote: BaseNote = {
      id: row.id,
      type: row.type as NoteType,
      tenantId: row.tenantId,
      userId: row.userId,
      created: new Date(row.created),
      updated: new Date(row.updated),
      category: row.category ?? undefined,
      tags: Array.isArray(row.tags)
        ? row.tags.filter((tag): tag is string => typeof tag === "string")
        : undefined,
      archived: Boolean(row.archived),
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as BaseNote["metadata"])
          : undefined,
    };

    return handler.deserialize(row.content, baseNote);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private matchesQuery(note: Note, normalized: string): boolean {
    if (isTextNote(note) && note.text.toLowerCase().includes(normalized)) {
      return true;
    }

    if (
      isMarkdownNote(note) &&
      note.markdown.toLowerCase().includes(normalized)
    ) {
      return true;
    }

    if (isCodeNote(note) && note.code.toLowerCase().includes(normalized)) {
      return true;
    }

    if (isRichTextNote(note)) {
      if (typeof note.html === "string" && note.html.toLowerCase().includes(normalized)) {
        return true;
      }

      const serializedContent = JSON.stringify(note.content ?? {}).toLowerCase();
      if (serializedContent.includes(normalized)) {
        return true;
      }
    }

    if (note.category && note.category.toLowerCase().includes(normalized)) {
      return true;
    }

    if (Array.isArray(note.tags)) {
      if (note.tags.some((tag) => tag.toLowerCase().includes(normalized))) {
        return true;
      }
    }

    if (note.metadata) {
      const metadataString = JSON.stringify(note.metadata).toLowerCase();
      if (metadataString.includes(normalized)) {
        return true;
      }
    }

    return false;
  }
}
