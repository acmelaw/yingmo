/**
 * NoteService Tests
 * Tests for the note service layer
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DefaultNoteService } from "@/services/NoteService";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import type { TextNote } from "@/types/note";

describe("NoteService", () => {
  let service: DefaultNoteService;
  let mockStore: any;

  beforeEach(async () => {
    moduleRegistry.clear();
    await moduleRegistry.register(textNoteModule);

    mockStore = {
      notes: [],
    };

    service = new DefaultNoteService(mockStore);
  });

  describe("create", () => {
    it("should create a text note", async () => {
      const note = await service.create("text", { text: "Test note" });

      expect(note.id).toBeDefined();
      expect(note.type).toBe("text");
      expect((note as TextNote).text).toBe("Test note");
      expect(note.created).toBeDefined();
      expect(note.updated).toBeDefined();
    });

    it("should create a note with category and tags", async () => {
      const note = await service.create("text", {
        text: "Test",
        category: "work",
        tags: ["important"],
      });

      expect(note.category).toBe("work");
      expect(note.tags).toEqual(["important"]);
    });

    it("should create a note with metadata", async () => {
      const note = await service.create("text", {
        text: "Test",
        metadata: { source: "api" },
      });

      expect(note.metadata).toEqual({ source: "api" });
    });

    it("should fallback to basic creation for unknown types", async () => {
      const note = await service.create("unknown" as any, { data: "test" });

      expect(note.id).toBeDefined();
      expect(note.type).toBe("unknown");
      expect(note.created).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update a note", async () => {
      const note = await service.create("text", { text: "Original" });
      const updated = await service.update(note, { text: "Updated" } as any);

      expect((updated as TextNote).text).toBe("Updated");
      expect(updated.updated).toBeGreaterThan(note.updated);
    });

    it("should preserve note type during update", async () => {
      const note = await service.create("text", { text: "Test" });
      const updated = await service.update(note, { text: "New text" } as any);

      expect(updated.type).toBe("text");
    });

    it("should update category and tags", async () => {
      const note = await service.create("text", { text: "Test" });
      const updated = await service.update(note, {
        category: "personal",
        tags: ["urgent"],
      } as any);

      expect(updated.category).toBe("personal");
      expect(updated.tags).toEqual(["urgent"]);
    });
  });

  describe("delete", () => {
    it("should call handler delete if available", async () => {
      const note = await service.create("text", { text: "To delete" });
      mockStore.notes = [note];

      const deleteSpy = vi.spyOn(console, "log");
      await service.delete(note.id);

      expect(deleteSpy).toHaveBeenCalledWith(
        expect.stringContaining("Deleting text note")
      );
    });

    it("should handle deleting non-existent note", async () => {
      await expect(service.delete("non-existent")).resolves.not.toThrow();
    });
  });

  describe("get", () => {
    it("should get a note by id", async () => {
      const created = await service.create("text", { text: "Test" });
      mockStore.notes = [created];

      const note = await service.get(created.id);

      expect(note).toBeDefined();
      expect(note?.id).toBe(created.id);
    });

    it("should return null for non-existent note", async () => {
      const note = await service.get("non-existent");

      expect(note).toBeNull();
    });
  });

  describe("getAll", () => {
    it("should get all notes", async () => {
      const note1 = await service.create("text", { text: "Note 1" });
      const note2 = await service.create("text", { text: "Note 2" });
      mockStore.notes = [note1, note2];

      const notes = await service.getAll();

      expect(notes).toHaveLength(2);
    });

    it("should return empty array when no notes", async () => {
      const notes = await service.getAll();

      expect(notes).toEqual([]);
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      const note1 = await service.create("text", {
        text: "JavaScript tutorial",
        category: "programming",
      });
      const note2 = await service.create("text", {
        text: "Python guide",
        tags: ["tutorial"],
      });
      const note3 = await service.create("text", {
        text: "Random thoughts",
        category: "personal",
      });

      mockStore.notes = [note1, note2, note3];
    });

    it("should search by text content", async () => {
      const results = await service.search("tutorial");

      expect(results).toHaveLength(1);
      expect((results[0] as TextNote).text).toContain("JavaScript tutorial");
    });

    it("should search by category", async () => {
      const results = await service.search("programming");

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("programming");
    });

    it("should search by tags", async () => {
      const results = await service.search("tutorial");

      expect(results.length).toBeGreaterThan(0);
    });

    it("should be case-insensitive", async () => {
      const results = await service.search("PYTHON");

      expect(results).toHaveLength(1);
    });

    it("should return empty array for no matches", async () => {
      const results = await service.search("nonexistent");

      expect(results).toEqual([]);
    });
  });

  describe("validate", () => {
    it("should validate a valid note", async () => {
      const note = await service.create("text", { text: "Valid note" });

      expect(service.validate(note)).toBe(true);
    });

    it("should invalidate note with missing id", async () => {
      const note = await service.create("text", { text: "Test" });
      const invalid = { ...note, id: "" };

      expect(service.validate(invalid as any)).toBe(false);
    });

    it("should invalidate note with invalid type", async () => {
      const note = await service.create("text", { text: "Test" });
      const invalid = { ...note, type: "invalid" as any };

      expect(service.validate(invalid)).toBe(false);
    });

    it("should validate using fallback for unknown types", async () => {
      const note = {
        id: "test-id",
        type: "unknown" as any,
        created: Date.now(),
        updated: Date.now(),
        archived: false,
      };

      expect(service.validate(note as any)).toBe(true);
    });
  });
});
