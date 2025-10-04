/**
 * REST API routes for note operations
 */

import type { FastifyInstance } from "fastify";
import type { NoteService, NoteFilters } from "../services/NoteService.js";
import { moduleRegistry } from "../services/ModuleRegistry.js";
import type { Note, NoteType } from "../types/note.js";

export async function registerNoteRoutes(
  fastify: FastifyInstance,
  noteService: NoteService
) {
  /**
   * Create a new note
   * POST /api/notes
   */
  fastify.post<{
    Body: {
      type: NoteType;
      tenantId: string;
      userId: string;
      data: Record<string, unknown>;
    };
  }>("/api/notes", async (request, reply) => {
    try {
      const { type, tenantId, userId, data } = request.body;

      const note = await noteService.create(type, data, tenantId, userId);

      return {
        success: true,
        note: {
          ...note,
          created: note.created.getTime(),
          updated: note.updated.getTime(),
        },
      };
    } catch (error) {
      fastify.log.error(`Create note error: ${error}`);
      reply.code(500);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Update a note
   * PUT /api/notes/:id
   */
  fastify.put<{
    Params: { id: string };
    Body: { updates: Partial<Note> };
  }>("/api/notes/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { updates } = request.body;

      const note = await noteService.update(id, updates);

      return {
        success: true,
        note: {
          ...note,
          created: note.created.getTime(),
          updated: note.updated.getTime(),
        },
      };
    } catch (error) {
      fastify.log.error(`Update note error: ${error}`);
      reply.code(500);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Get a specific note
   * GET /api/notes/:id
   */
  fastify.get<{
    Params: { id: string };
  }>("/api/notes/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const note = await noteService.get(id);

      if (!note) {
        reply.code(404);
        return { error: "Note not found" };
      }

      return {
        note: {
          ...note,
          created: note.created.getTime(),
          updated: note.updated.getTime(),
        },
      };
    } catch (error) {
      fastify.log.error(`Get note error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Delete a note
   * DELETE /api/notes/:id
   */
  fastify.delete<{
    Params: { id: string };
  }>("/api/notes/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      await noteService.delete(id);

      return { success: true };
    } catch (error) {
      fastify.log.error(`Delete note error: ${error}`);
      reply.code(500);
      return { success: false, error: String(error) };
    }
  });

  /**
   * List notes with filters
   * GET /api/notes?tenantId=x&userId=y&type=text&archived=false
   */
  fastify.get<{
    Querystring: {
      tenantId: string;
      userId: string;
      type?: NoteType;
      category?: string;
      archived?: string;
    };
  }>("/api/notes", async (request, reply) => {
    try {
      const { tenantId, userId, type, category, archived } = request.query;

      const filters: NoteFilters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (archived !== undefined) filters.archived = archived === "true";

      const notes = await noteService.list(tenantId, userId, filters);

      return {
        notes: notes.map((note) => ({
          ...note,
          created: note.created.getTime(),
          updated: note.updated.getTime(),
        })),
      };
    } catch (error) {
      fastify.log.error(`List notes error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Search notes
   * GET /api/notes/search?q=term&tenantId=x&userId=y
   */
  fastify.get<{
    Querystring: {
      tenantId: string;
      userId: string;
      q: string;
      type?: NoteType;
      category?: string;
    };
  }>("/api/notes/search", async (request, reply) => {
    try {
      const { tenantId, userId, q, type, category } = request.query;

      if (!q) {
        reply.code(400);
        return { error: "Query parameter q is required" };
      }

      const filters: NoteFilters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;

      const notes = await noteService.search(tenantId, userId, q, filters);

      return {
        notes: notes.map((note) => ({
          ...note,
          created: note.created.getTime(),
          updated: note.updated.getTime(),
        })),
      };
    } catch (error) {
      fastify.log.error(`Search notes error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Bulk sync notes (legacy compatibility)
   * POST /api/notes/sync
   */
  fastify.post<{
    Body: {
      tenantId: string;
      userId: string;
      notes: Array<Record<string, unknown>>;
    };
  }>("/api/notes/sync", async (request, reply) => {
    try {
      const { tenantId, userId, notes: clientNotes } = request.body;

      // Upsert each note
      for (const noteRecord of clientNotes) {
        const noteData = noteRecord as Record<string, unknown>;
        const rawId = noteData["id"];
        const noteId = typeof rawId === "string" ? rawId : undefined;

        if (noteId) {
          const existing = await noteService.get(noteId);

          if (existing) {
            await noteService.update(noteId, noteData as Partial<Note>);
            continue;
          }
        }

        const rawType = noteData["type"];
        const candidateType =
          typeof rawType === "string" && moduleRegistry.hasTypeHandler(rawType)
            ? (rawType as NoteType)
            : "text";

        await noteService.create(candidateType, noteData, tenantId, userId);
      }

      // Return all server notes
      const serverNotes = await noteService.list(tenantId, userId);

      return {
        success: true,
        notes: serverNotes.map((note) => ({
          ...note,
          created: note.created.getTime(),
          updated: note.updated.getTime(),
        })),
      };
    } catch (error) {
      fastify.log.error(`Sync error: ${error}`);
      reply.code(500);
      return { success: false, error: String(error) };
    }
  });
}
