/**
 * NoteService Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema.js';
import { DefaultNoteService } from '../services/NoteService.js';
import { moduleRegistry } from '../services/ModuleRegistry.js';
import { initializeModules } from '../modules/index.js';
import { rm } from 'fs/promises';

describe('NoteService Integration Tests', () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let sqlite: Database.Database;
  let noteService: DefaultNoteService;
  const testDbPath = './test-notes.db';

  beforeEach(async () => {
    // Create test database
    sqlite = new Database(testDbPath);
    db = drizzle(sqlite, { schema }) as ReturnType<typeof drizzle<typeof schema>>;

    // Create tables
    sqlite.exec(`
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
        tiptap_content TEXT
      )
    `);

    // Initialize modules
    moduleRegistry.clear();
    await initializeModules();

    // Create service
    noteService = new DefaultNoteService(db);
  });

  afterEach(async () => {
    sqlite.close();
    try {
      await rm(testDbPath);
    } catch {
      // Ignore
    }
  });

  describe('CRUD Operations', () => {
    it('should create a text note', async () => {
      const note = await noteService.create('text', {
        text: 'Hello World',
        tags: ['test'],
      }, 'tenant1', 'user1');

      expect(note.id).toBeDefined();
      expect(note.type).toBe('text');
      expect(note.tenantId).toBe('tenant1');
      expect(note.userId).toBe('user1');
    });

    it('should retrieve a note by id', async () => {
      const created = await noteService.create('text', {
        text: 'Test Note',
      }, 'tenant1', 'user1');

      const retrieved = await noteService.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should update a note', async () => {
      const created = await noteService.create('text', {
        text: 'Original',
      }, 'tenant1', 'user1');

      const updated = await noteService.update(created.id, {
        text: 'Updated',
      });

      expect(updated.updated.getTime()).toBeGreaterThan(created.updated.getTime());
    });

    it('should delete a note', async () => {
      const created = await noteService.create('text', {
        text: 'To Delete',
      }, 'tenant1', 'user1');

      await noteService.delete(created.id);

      const retrieved = await noteService.get(created.id);
      expect(retrieved).toBeNull();
    });

    it('should list notes for a user', async () => {
      await noteService.create('text', { text: 'Note 1' }, 'tenant1', 'user1');
      await noteService.create('text', { text: 'Note 2' }, 'tenant1', 'user1');
      await noteService.create('text', { text: 'Note 3' }, 'tenant1', 'user2');

      const notes = await noteService.list('tenant1', 'user1');

      expect(notes).toHaveLength(2);
    });

    it('should filter notes by type', async () => {
      await noteService.create('text', { text: 'Text' }, 'tenant1', 'user1');
      await noteService.create('markdown', { markdown: '# MD' }, 'tenant1', 'user1');

      const textNotes = await noteService.list('tenant1', 'user1', { type: 'text' });
      const mdNotes = await noteService.list('tenant1', 'user1', { type: 'markdown' });

      expect(textNotes).toHaveLength(1);
      expect(mdNotes).toHaveLength(1);
    });

    it('should filter notes by archived status', async () => {
      await noteService.create('text', { text: 'Active', archived: false }, 'tenant1', 'user1');
      await noteService.create('text', { text: 'Archived', archived: true }, 'tenant1', 'user1');

      const activeNotes = await noteService.list('tenant1', 'user1', { archived: false });
      const archivedNotes = await noteService.list('tenant1', 'user1', { archived: true });

      expect(activeNotes).toHaveLength(1);
      expect(archivedNotes).toHaveLength(1);
    });
  });

  describe('Multiple Note Types', () => {
    it('should handle rich text notes', async () => {
      const note = await noteService.create('rich-text', {
        content: { type: 'doc', content: [] },
      }, 'tenant1', 'user1');

      expect(note.type).toBe('rich-text');
    });

    it('should handle markdown notes', async () => {
      const note = await noteService.create('markdown', {
        markdown: '# Hello World',
      }, 'tenant1', 'user1');

      expect(note.type).toBe('markdown');
    });

    it('should handle code notes', async () => {
      const note = await noteService.create('code', {
        code: 'console.log("test");',
        language: 'javascript',
      }, 'tenant1', 'user1');

      expect(note.type).toBe('code');
    });
  });

  describe('Validation', () => {
    it('should validate notes', async () => {
      const note = await noteService.create('text', {
        text: 'Valid Note',
      }, 'tenant1', 'user1');

      expect(noteService.validate(note)).toBe(true);
    });

    it('should throw error for invalid note type', async () => {
      await expect(
        noteService.create('invalid' as any, {}, 'tenant1', 'user1')
      ).rejects.toThrow();
    });
  });
});
