/**
 * Service layer for note operations
 * Provides abstraction over storage and module-specific operations
 */

import type { Note, NoteType, BaseNote } from "../types/note.js";
import { moduleRegistry } from "./ModuleRegistry.js";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface NoteService {
  create(
    type: NoteType,
    data: any,
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
    data: any,
    tenantId: string,
    userId: string
  ): Promise<Note> {
    const handler = moduleRegistry.getTypeHandler(type);
    if (!handler) {
      throw new Error(`No handler registered for note type: ${type}`);
    }

    // Create base note structure
    const baseNote: BaseNote = {
      id: data.id || this.generateId(),
      type,
      tenantId,
      userId,
      created: new Date(data.created || Date.now()),
      updated: new Date(data.updated || Date.now()),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata: data.metadata,
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
      text: (note as any).text, // Legacy support
      tiptapContent: (note as any).content, // Legacy support
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
        text: (updated as any).text, // Legacy support
        tiptapContent: (updated as any).content, // Legacy support
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
      if ("content" in note && typeof note.content === "string") {
        textContent = note.content;
      } else if ("text" in note && typeof (note as any).text === "string") {
        textContent = (note as any).text;
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

  validate(note: Note): boolean {
    const handler = moduleRegistry.getTypeHandler(note.type);
    if (!handler) return false;
    return handler.validate(note);
  }

  private deserializeNote(row: any): Note | null {
    const handler = moduleRegistry.getTypeHandler(row.type as NoteType);
    if (!handler) {
      console.error(`No handler for note type: ${row.type}`);
      return null;
    }

    const baseNote: BaseNote = {
      id: row.id,
      type: row.type,
      tenantId: row.tenantId,
      userId: row.userId,
      created: new Date(row.created),
      updated: new Date(row.updated),
      category: row.category,
      tags: row.tags,
      archived: row.archived,
      metadata: row.metadata,
    };

    return handler.deserialize(row.content, baseNote);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
