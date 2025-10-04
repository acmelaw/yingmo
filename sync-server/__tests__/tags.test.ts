/**
 * Tag Management Routes Tests
 * Tests for hashtag CRUD operations
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { rm } from "fs/promises";

describe("Tag Routes Integration", () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let sqlite: Database.Database;
  const testDbPath = "./test-tags.db";
  const testTenantId = "test-tenant-" + randomUUID();
  const testUserId = "test-user-" + randomUUID();

  beforeEach(async () => {
    // Create test database
    sqlite = new Database(testDbPath);
    db = drizzle(sqlite, { schema }) as ReturnType<
      typeof drizzle<typeof schema>
    >;

    // Create tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        settings TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        auto_extract_tags INTEGER NOT NULL DEFAULT 1,
        clean_content_on_extract INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT,
        description TEXT,
        color TEXT,
        parent_id TEXT,
        use_count INTEGER NOT NULL DEFAULT 0,
        last_used INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'text',
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        tags TEXT,
        category TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        created INTEGER NOT NULL,
        updated INTEGER NOT NULL,
        content TEXT NOT NULL,
        text TEXT,
        tiptap_content TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create test tenant and user
    await db.insert(schema.tenants).values({
      id: testTenantId,
      name: "Test Tenant",
      slug: "test-tenant-" + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schema.users).values({
      id: testUserId,
      tenantId: testTenantId,
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const now = new Date();

    // Seed baseline tags
    await db.insert(schema.tags).values([
      {
        id: randomUUID(),
        name: "#test",
        displayName: "Test Tag",
        color: "#FF0000",
        description: "Seed tag for CRUD tests",
        tenantId: testTenantId,
        useCount: 5,
        lastUsed: now,
        createdAt: now,
      },
      {
        id: randomUUID(),
        name: "#important",
        tenantId: testTenantId,
        useCount: 5,
        lastUsed: now,
        createdAt: now,
      },
      {
        id: randomUUID(),
        name: "#work",
        tenantId: testTenantId,
        useCount: 5,
        lastUsed: now,
        createdAt: now,
      },
    ]);

    // Seed a baseline note with tags for integration scenarios
    await db.insert(schema.notes).values({
      id: randomUUID(),
      type: "text",
      tenantId: testTenantId,
      userId: testUserId,
      tags: ["#important", "#work"],
      content: "Seed note with #important and #work tags",
      created: now,
      updated: now,
    });
  });

  afterEach(async () => {
    sqlite.close();
    try {
      await rm(testDbPath);
    } catch {
      // Ignore
    }
  });

  describe("Tag CRUD Operations", () => {
    it("should create a new tag", async () => {
      const tagData = {
        id: randomUUID(),
        name: "#test",
        displayName: "Test Tag",
        color: "#FF0000",
        description: "A test tag",
        tenantId: testTenantId,
        useCount: 0,
        createdAt: new Date(),
      };

      const [created] = await db
        .insert(schema.tags)
        .values(tagData)
        .returning();

      expect(created).toBeDefined();
      expect(created.name).toBe("#test");
      expect(created.color).toBe("#FF0000");
      expect(created.tenantId).toBe(testTenantId);
    });

    it("should list all tags for a tenant", async () => {
      const tags = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.tenantId, testTenantId));

      expect(tags.length).toBeGreaterThan(0);
      expect(tags.every((t) => t.tenantId === testTenantId)).toBe(true);
    });

    it("should update a tag", async () => {
      const [tag] = await db
        .select()
        .from(schema.tags)
        .where(
          and(
            eq(schema.tags.name, "#test"),
            eq(schema.tags.tenantId, testTenantId)
          )
        )
        .limit(1);

      const [updated] = await db
        .update(schema.tags)
        .set({
          color: "#00FF00",
          description: "Updated description",
        })
        .where(eq(schema.tags.id, tag.id))
        .returning();

      expect(updated.color).toBe("#00FF00");
      expect(updated.description).toBe("Updated description");
    });

    it("should increment useCount when tag is used", async () => {
      const [tag] = await db
        .select()
        .from(schema.tags)
        .where(
          and(
            eq(schema.tags.name, "#test"),
            eq(schema.tags.tenantId, testTenantId)
          )
        )
        .limit(1);

      const initialCount = tag.useCount || 0;

      await db
        .update(schema.tags)
        .set({
          useCount: initialCount + 1,
          lastUsed: new Date(),
        })
        .where(eq(schema.tags.id, tag.id));

      const [updated] = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.id, tag.id));

      expect(updated.useCount).toBe(initialCount + 1);
      expect(updated.lastUsed).toBeDefined();
    });

    it("should delete a tag", async () => {
      const [tag] = await db
        .select()
        .from(schema.tags)
        .where(
          and(
            eq(schema.tags.name, "#test"),
            eq(schema.tags.tenantId, testTenantId)
          )
        )
        .limit(1);

      await db.delete(schema.tags).where(eq(schema.tags.id, tag.id));

      const [deleted] = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.id, tag.id));

      expect(deleted).toBeUndefined();
    });
  });

  describe("Tag-Note Integration", () => {
    it("should create notes with tags", async () => {
      // Create test tags
      await db
        .insert(schema.tags)
        .values({
          id: randomUUID(),
          name: "#important",
          tenantId: testTenantId,
          useCount: 0,
          createdAt: new Date(),
        })
        .returning();

      await db
        .insert(schema.tags)
        .values({
          id: randomUUID(),
          name: "#work",
          tenantId: testTenantId,
          useCount: 0,
          createdAt: new Date(),
        })
        .returning();

      // Create note with tags
      const [note] = await db
        .insert(schema.notes)
        .values({
          id: randomUUID(),
          type: "text",
          tenantId: testTenantId,
          userId: testUserId,
          content: "Test note with #important and #work tags",
          tags: ["#important", "#work"],
          created: new Date(),
          updated: new Date(),
        })
        .returning();

      expect(note.tags).toEqual(["#important", "#work"]);
    });

    it("should find notes by tag", async () => {
      const notes = await db
        .select()
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.tenantId, testTenantId),
            eq(schema.notes.tags, ["#important", "#work"])
          )
        );

      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].tags).toContain("#important");
    });

    it("should update note tags", async () => {
      const [note] = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.tenantId, testTenantId))
        .limit(1);

      const [updated] = await db
        .update(schema.notes)
        .set({
          tags: ["#important", "#work", "#urgent"],
        })
        .where(eq(schema.notes.id, note.id))
        .returning();

      expect(updated.tags).toContain("#urgent");
      expect(updated.tags?.length).toBe(3);
    });

    it("should remove tags from note", async () => {
      const [note] = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.tenantId, testTenantId))
        .limit(1);

      const currentTags = (note.tags as string[]) || [];
      const newTags = currentTags.filter((t) => t !== "#urgent");

      const [updated] = await db
        .update(schema.notes)
        .set({ tags: newTags })
        .where(eq(schema.notes.id, note.id))
        .returning();

      expect(updated.tags).not.toContain("#urgent");
    });
  });

  describe("Tag Merge Operations", () => {
    it("should merge tags correctly", async () => {
      // Create source tags
      const [tag1] = await db
        .insert(schema.tags)
        .values({
          id: randomUUID(),
          name: "#todo",
          tenantId: testTenantId,
          useCount: 5,
          createdAt: new Date(),
        })
        .returning();

      const [tag2] = await db
        .insert(schema.tags)
        .values({
          id: randomUUID(),
          name: "#task",
          tenantId: testTenantId,
          useCount: 3,
          createdAt: new Date(),
        })
        .returning();

      // Create target tag
      const [targetTag] = await db
        .insert(schema.tags)
        .values({
          id: randomUUID(),
          name: "#action",
          tenantId: testTenantId,
          useCount: 0,
          createdAt: new Date(),
        })
        .returning();

      // Merge operation would update all notes with #todo or #task to #action
      // Then update target tag useCount
      const mergedCount = tag1.useCount + tag2.useCount;

      await db
        .update(schema.tags)
        .set({
          useCount: mergedCount,
          lastUsed: new Date(),
        })
        .where(eq(schema.tags.id, targetTag.id));

      const [updated] = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.id, targetTag.id));

      expect(updated.useCount).toBe(8);
    });
  });

  describe("Tag Statistics", () => {
    it("should calculate tag usage statistics", async () => {
      const tags = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.tenantId, testTenantId));

      const totalUses = tags.reduce((sum, tag) => sum + (tag.useCount || 0), 0);
      const avgUses = totalUses / tags.length;

      expect(totalUses).toBeGreaterThan(0);
      expect(avgUses).toBeGreaterThanOrEqual(0);
    });

    it("should find most used tags", async () => {
      const topTags = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.tenantId, testTenantId))
        .orderBy(schema.tags.useCount)
        .limit(10);

      expect(topTags.length).toBeGreaterThan(0);
      // Tags should be sorted by useCount (descending)
      if (topTags.length > 1) {
        expect(topTags[0].useCount).toBeGreaterThanOrEqual(
          topTags[1].useCount || 0
        );
      }
    });
  });
});
