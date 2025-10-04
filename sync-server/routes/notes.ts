/**
 * REST API routes for note operations
 */

import type { FastifyInstance } from "fastify";
import type { NoteService } from "../services/NoteService.js";
import type { NoteType } from "../types/note.js";

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
      data: any;
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
    Body: { updates: any };
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

      const filters: any = {};
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
   * Bulk sync notes (legacy compatibility)
   * POST /api/notes/sync
   */
  fastify.post<{
    Body: {
      tenantId: string;
      userId: string;
      notes: Array<any>;
    };
  }>("/api/notes/sync", async (request, reply) => {
    try {
      const { tenantId, userId, notes: clientNotes } = request.body;

      // Upsert each note
      for (const noteData of clientNotes) {
        const existing = await noteService.get(noteData.id);
        
        if (existing) {
          // Update existing note
          await noteService.update(noteData.id, noteData);
        } else {
          // Create new note
          const type = noteData.type || "text";
          await noteService.create(type, noteData, tenantId, userId);
        }
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
