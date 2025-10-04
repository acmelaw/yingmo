/**
 * Tag Management Routes
 * Hashtag CRUD operations with statistics
 */

import type { FastifyInstance } from "fastify";
import { eq, and, desc, sql } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { DB } from "../db/index.js";
import { randomUUID } from "crypto";

export async function registerTagRoutes(fastify: FastifyInstance, db: DB) {
  /**
   * List all tags with statistics
   * GET /api/tags?tenantId=xxx
   */
  fastify.get<{
    Querystring: {
      tenantId: string;
      sort?: "name" | "count" | "recent";
      limit?: number;
    };
  }>("/api/tags", async (request, reply) => {
    const { tenantId, sort = "count", limit = 100 } = request.query;

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      const tags = await db
        .select({
          id: schema.tags.id,
          name: schema.tags.name,
          displayName: schema.tags.displayName,
          useCount: schema.tags.useCount,
          color: schema.tags.color,
          description: schema.tags.description,
          createdAt: schema.tags.createdAt,
          lastUsed: schema.tags.lastUsed,
        })
        .from(schema.tags)
        .where(eq(schema.tags.tenantId, tenantId))
        .orderBy(
          sort === "name"
            ? schema.tags.name
            : sort === "recent"
              ? desc(schema.tags.lastUsed)
              : desc(schema.tags.useCount)
        )
        .limit(limit);

      return { tags, total: tags.length };
    } catch (error) {
      fastify.log.error(`List tags error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Get tag details with related notes
   * GET /api/tags/:name?tenantId=xxx
   */
  fastify.get<{
    Params: {
      name: string;
    };
    Querystring: {
      tenantId: string;
    };
  }>("/api/tags/:name", async (request, reply) => {
    const { name } = request.params;
    const { tenantId } = request.query;
    const decodedName = decodeURIComponent(name);

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      const [tag] = await db
        .select()
        .from(schema.tags)
        .where(
          and(
            eq(schema.tags.name, decodedName),
            eq(schema.tags.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!tag) {
        reply.code(404);
        return { error: "Tag not found" };
      }

      // Get notes with this tag
      const notes = await db
        .select({
          id: schema.notes.id,
          type: schema.notes.type,
          content: schema.notes.content,
          createdAt: schema.notes.created,
          updatedAt: schema.notes.updated,
        })
        .from(schema.notes)
        .where(
          and(
            sql`json_extract(${schema.notes.tags}, '$') LIKE ${"%" + decodedName + "%"}`,
            eq(schema.notes.tenantId, tenantId)
          )
        );

      return {
        tag,
        notes,
        noteCount: notes.length,
      };
    } catch (error) {
      fastify.log.error(`Get tag error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Create or update tag
   * POST /api/tags
   */
  fastify.post<{
    Body: {
      name: string;
      color?: string;
      description?: string;
      displayName?: string;
      tenantId: string;
    };
  }>("/api/tags", async (request, reply) => {
    const { name, color, description, displayName, tenantId } = request.body;

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      // Check if tag exists
      const [existing] = await db
        .select()
        .from(schema.tags)
        .where(
          and(eq(schema.tags.name, name), eq(schema.tags.tenantId, tenantId))
        )
        .limit(1);

      if (existing) {
        // Update existing tag
        const [updated] = await db
          .update(schema.tags)
          .set({
            color: color || existing.color,
            description: description || existing.description,
            displayName: displayName || existing.displayName,
            lastUsed: new Date(),
          })
          .where(eq(schema.tags.id, existing.id))
          .returning();

        return { tag: updated, created: false };
      } else {
        // Create new tag
        const [created] = await db
          .insert(schema.tags)
          .values({
            id: randomUUID(),
            name,
            displayName,
            color,
            description,
            tenantId,
            useCount: 0,
            createdAt: new Date(),
          })
          .returning();

        return { tag: created, created: true };
      }
    } catch (error) {
      fastify.log.error(`Create/update tag error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Update tag (rename, change color, etc.)
   * PUT /api/tags/:name
   */
  fastify.put<{
    Params: {
      name: string;
    };
    Body: {
      newName?: string;
      color?: string;
      description?: string;
      displayName?: string;
      tenantId: string;
    };
  }>("/api/tags/:name", async (request, reply) => {
    const { name } = request.params;
    const { newName, color, description, displayName, tenantId } = request.body;
    const decodedName = decodeURIComponent(name);

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      const [existing] = await db
        .select()
        .from(schema.tags)
        .where(
          and(
            eq(schema.tags.name, decodedName),
            eq(schema.tags.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!existing) {
        reply.code(404);
        return { error: "Tag not found" };
      }

      // Update tag
      const [updated] = await db
        .update(schema.tags)
        .set({
          name: newName || existing.name,
          displayName: displayName || existing.displayName,
          color: color || existing.color,
          description: description || existing.description,
          lastUsed: new Date(),
        })
        .where(eq(schema.tags.id, existing.id))
        .returning();

      // If renamed, update all notes with this tag
      if (newName && newName !== decodedName) {
        const notesWithTag = await db
          .select()
          .from(schema.notes)
          .where(
            and(
              sql`json_extract(${schema.notes.tags}, '$') LIKE ${"%" + decodedName + "%"}`,
              eq(schema.notes.tenantId, tenantId)
            )
          );

        for (const note of notesWithTag) {
          const tags = (note.tags as string[]) || [];
          const updatedTags = tags.map((t) =>
            t === decodedName ? newName : t
          );

          await db
            .update(schema.notes)
            .set({ tags: updatedTags })
            .where(eq(schema.notes.id, note.id));
        }
      }

      return { tag: updated };
    } catch (error) {
      fastify.log.error(`Update tag error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Delete tag
   * DELETE /api/tags/:name?tenantId=xxx&removeFromNotes=true
   */
  fastify.delete<{
    Params: {
      name: string;
    };
    Querystring: {
      tenantId: string;
      removeFromNotes?: boolean;
    };
  }>("/api/tags/:name", async (request, reply) => {
    const { name } = request.params;
    const { tenantId, removeFromNotes = false } = request.query;
    const decodedName = decodeURIComponent(name);

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      // Delete tag
      await db
        .delete(schema.tags)
        .where(
          and(
            eq(schema.tags.name, decodedName),
            eq(schema.tags.tenantId, tenantId)
          )
        );

      // Optionally remove from notes
      if (removeFromNotes) {
        const notesWithTag = await db
          .select()
          .from(schema.notes)
          .where(
            and(
              sql`json_extract(${schema.notes.tags}, '$') LIKE ${"%" + decodedName + "%"}`,
              eq(schema.notes.tenantId, tenantId)
            )
          );

        for (const note of notesWithTag) {
          const tags = (note.tags as string[]) || [];
          const updatedTags = tags.filter((t) => t !== decodedName);

          await db
            .update(schema.notes)
            .set({ tags: updatedTags })
            .where(eq(schema.notes.id, note.id));
        }
      }

      return { success: true, removed: removeFromNotes };
    } catch (error) {
      fastify.log.error(`Delete tag error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Merge multiple tags into one
   * POST /api/tags/merge
   */
  fastify.post<{
    Body: {
      sourceTags: string[];
      targetTag: string;
      tenantId: string;
    };
  }>("/api/tags/merge", async (request, reply) => {
    const { sourceTags, targetTag, tenantId } = request.body;

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      // Ensure target tag exists
      let [target] = await db
        .select()
        .from(schema.tags)
        .where(
          and(eq(schema.tags.name, targetTag), eq(schema.tags.tenantId, tenantId))
        )
        .limit(1);

      if (!target) {
        // Create target tag
        [target] = await db
          .insert(schema.tags)
          .values({
            id: randomUUID(),
            name: targetTag,
            tenantId,
            useCount: 0,
            createdAt: new Date(),
          })
          .returning();
      }

      let totalMerged = 0;

      // Update all notes with source tags
      for (const sourceTag of sourceTags) {
        if (sourceTag === targetTag) continue;

        const notesWithTag = await db
          .select()
          .from(schema.notes)
          .where(
            and(
              sql`json_extract(${schema.notes.tags}, '$') LIKE ${"%" + sourceTag + "%"}`,
              eq(schema.notes.tenantId, tenantId)
            )
          );

        for (const note of notesWithTag) {
          const tags = (note.tags as string[]) || [];
          const updatedTags = tags
            .map((t) => (t === sourceTag ? targetTag : t))
            .filter((t, i, arr) => arr.indexOf(t) === i); // Remove duplicates

          await db
            .update(schema.notes)
            .set({ tags: updatedTags })
            .where(eq(schema.notes.id, note.id));

          totalMerged++;
        }

        // Delete source tag
        await db
          .delete(schema.tags)
          .where(
            and(
              eq(schema.tags.name, sourceTag),
              eq(schema.tags.tenantId, tenantId)
            )
          );
      }

      // Update target tag use count
      const [updated] = await db
        .update(schema.tags)
        .set({
          useCount: (target.useCount || 0) + totalMerged,
          lastUsed: new Date(),
        })
        .where(eq(schema.tags.id, target.id))
        .returning();

      return {
        tag: updated,
        mergedCount: totalMerged,
        removedTags: sourceTags.length,
      };
    } catch (error) {
      fastify.log.error(`Merge tags error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  /**
   * Get tag statistics
   * GET /api/tags/stats?tenantId=xxx
   */
  fastify.get<{
    Querystring: {
      tenantId: string;
    };
  }>("/api/tags/stats", async (request, reply) => {
    const { tenantId } = request.query;

    if (!tenantId) {
      reply.code(400);
      return { error: "tenantId is required" };
    }

    try {
      const stats = await db
        .select({
          totalTags: sql<number>`count(*)`,
          totalUses: sql<number>`sum(${schema.tags.useCount})`,
          avgUsesPerTag: sql<number>`avg(${schema.tags.useCount})`,
        })
        .from(schema.tags)
        .where(eq(schema.tags.tenantId, tenantId));

      const topTags = await db
        .select({
          name: schema.tags.name,
          useCount: schema.tags.useCount,
        })
        .from(schema.tags)
        .where(eq(schema.tags.tenantId, tenantId))
        .orderBy(desc(schema.tags.useCount))
        .limit(10);

      return {
        ...stats[0],
        topTags,
      };
    } catch (error) {
      fastify.log.error(`Get tag stats error: ${error}`);
      reply.code(500);
      return { error: String(error) };
    }
  });

  fastify.log.info("Tag routes registered");
}
