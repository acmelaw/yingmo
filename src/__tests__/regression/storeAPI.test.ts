/**
 * Store regression tests
 * These tests ensure the store API remains stable
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useNotesStore } from "@/stores/notes";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import type { Note } from "@/types/note";

describe("Store Regression Tests", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    moduleRegistry.clear();
    await moduleRegistry.register(textNoteModule);
  });

  describe("API Stability", () => {
    it("should maintain create method signature", async () => {
      const store = useNotesStore();

      // Signature: create(type, data, category?, tags?)
      const id1 = await store.create("text", { text: "Test" });
      expect(id1).toBeDefined();

      const id2 = await store.create("text", { text: "Test" }, "work");
      expect(store.notes.find((n) => n.id === id2)?.category).toBe("work");

      const id3 = await store.create("text", { text: "Test" }, undefined, [
        "tag1",
      ]);
      expect(store.notes.find((n) => n.id === id3)?.tags).toContain("tag1");

      const id4 = await store.create("text", { text: "Test" }, "personal", [
        "tag2",
      ]);
      const note4 = store.notes.find((n) => n.id === id4);
      expect(note4?.category).toBe("personal");
      expect(note4?.tags).toContain("tag2");
    });

    it("should maintain add method signature (legacy)", () => {
      const store = useNotesStore();

      // Signature: add(text, category?, tags?)
      const id1 = store.add("Test");
      expect(id1).toBeDefined();

      const id2 = store.add("Test", "work");
      expect(store.notes.find((n) => n.id === id2)?.category).toBe("work");

      const id3 = store.add("Test", undefined, ["tag1"]);
      expect(store.notes.find((n) => n.id === id3)?.tags).toContain("tag1");

      const id4 = store.add("Test", "personal", ["tag2"]);
      const note4 = store.notes.find((n) => n.id === id4);
      expect(note4?.category).toBe("personal");
      expect(note4?.tags).toContain("tag2");
    });

    it("should maintain update method signature", async () => {
      const store = useNotesStore();

      const id = await store.create("text", { text: "Original" });

      // Signature: update(id, updates)
      await store.update(id, { text: "Updated" });
      await store.update(id, { category: "work" });
      await store.update(id, { tags: ["tag1"] });
      await store.update(id, {
        text: "Final",
        category: "personal",
        tags: ["tag2"],
      });

      const note = store.notes.find((n) => n.id === id);
      expect(note).toBeDefined();
    });

    it("should maintain remove method signature", async () => {
      const store = useNotesStore();

      const id = await store.create("text", { text: "To remove" });

      // Signature: remove(id)
      await store.remove(id);

      expect(store.notes.find((n) => n.id === id)).toBeUndefined();
    });

    it("should maintain archive/unarchive method signatures", async () => {
      const store = useNotesStore();

      const id = await store.create("text", { text: "To archive" });

      // Signature: archive(id)
      await store.archive(id);
      expect(store.archivedNotes.find((n) => n.id === id)).toBeDefined();

      // Signature: unarchive(id)
      await store.unarchive(id);
      expect(store.filteredNotes.find((n) => n.id === id)).toBeDefined();
    });

    it("should maintain clearAll method", () => {
      const store = useNotesStore();

      store.add("Note 1");
      store.add("Note 2");

      // Signature: clearAll()
      store.clearAll();

      expect(store.notes).toHaveLength(0);
      expect(store.categories).toHaveLength(0);
      expect(store.searchQuery).toBe("");
      expect(store.selectedCategory).toBeNull();
    });

    it("should maintain exportData method signature", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test" });

      // Signature: exportData()
      const exported = store.exportData();

      expect(exported).toHaveProperty("version");
      expect(exported).toHaveProperty("exportDate");
      expect(exported).toHaveProperty("data");
      expect(exported.data).toHaveProperty("notes");
    });

    it("should maintain importData method signature", () => {
      const store = useNotesStore();

      const data = {
        version: "2.0.0",
        data: {
          notes: [],
          categories: [],
          searchQuery: "",
          selectedCategory: null,
          sortBy: "created" as const,
          sortOrder: "desc" as const,
        },
      };

      // Signature: importData(data) => boolean
      const success = store.importData(data);

      expect(typeof success).toBe("boolean");
    });
  });

  describe("Computed Properties Stability", () => {
    it("should maintain notes property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test" });

      expect(Array.isArray(store.notes)).toBe(true);
      expect(store.notes.length).toBeGreaterThan(0);
    });

    it("should maintain categories property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test", category: "work" });

      expect(Array.isArray(store.categories)).toBe(true);
    });

    it("should maintain filteredNotes property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test" });

      expect(Array.isArray(store.filteredNotes)).toBe(true);
    });

    it("should maintain archivedNotes property", async () => {
      const store = useNotesStore();

      const id = await store.create("text", { text: "Test" });
      await store.archive(id);

      expect(Array.isArray(store.archivedNotes)).toBe(true);
      expect(store.archivedNotes).toHaveLength(1);
    });

    it("should maintain totalNotes property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test" });

      expect(typeof store.totalNotes).toBe("number");
      expect(store.totalNotes).toBe(1);
    });

    it("should maintain activeNotes property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test" });

      expect(typeof store.activeNotes).toBe("number");
      expect(store.activeNotes).toBe(1);
    });

    it("should maintain getNotesByType property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test" });

      expect(typeof store.getNotesByType).toBe("function");

      const textNotes = store.getNotesByType("text");
      expect(Array.isArray(textNotes)).toBe(true);
    });
  });

  describe("State Properties Stability", () => {
    it("should maintain searchQuery property", () => {
      const store = useNotesStore();

      store.searchQuery = "test query";
      expect(store.searchQuery).toBe("test query");

      store.searchQuery = "";
      expect(store.searchQuery).toBe("");
    });

    it("should maintain selectedCategory property", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Test", category: "work" });

      store.selectedCategory = "work";
      expect(store.selectedCategory).toBe("work");

      store.selectedCategory = null;
      expect(store.selectedCategory).toBeNull();
    });

    it("should maintain sortBy property", () => {
      const store = useNotesStore();

      store.sortBy = "created";
      expect(store.sortBy).toBe("created");

      store.sortBy = "updated";
      expect(store.sortBy).toBe("updated");

      store.sortBy = "text";
      expect(store.sortBy).toBe("text");
    });

    it("should maintain sortOrder property", () => {
      const store = useNotesStore();

      store.sortOrder = "asc";
      expect(store.sortOrder).toBe("asc");

      store.sortOrder = "desc";
      expect(store.sortOrder).toBe("desc");
    });
  });

  describe("Data Migration Stability", () => {
    it("should migrate v1.0.0 data format", () => {
      const store = useNotesStore();

      const oldData = {
        version: "1.0.0",
        data: {
          notes: [
            {
              id: "old-1",
              text: "Old note",
              created: Date.now(),
              updated: Date.now(),
            },
          ],
          categories: ["work"],
          searchQuery: "test",
          selectedCategory: "work",
          sortBy: "created",
          sortOrder: "desc",
        },
      };

      const success = store.importData(oldData);

      expect(success).toBe(true);
      expect(store.notes).toHaveLength(1);
      expect(store.notes[0].type).toBe("text");
      expect(store.searchQuery).toBe("test");
      expect(store.selectedCategory).toBe("work");
    });

    it("should handle missing fields in old data", () => {
      const store = useNotesStore();

      const oldData = {
        version: "1.0.0",
        data: {
          notes: [
            {
              id: "old-1",
              text: "Old note",
              created: Date.now(),
              updated: Date.now(),
              // Missing: category, tags, archived
            },
          ],
          categories: [],
          searchQuery: "",
          selectedCategory: null,
          sortBy: "created",
          sortOrder: "desc",
        },
      };

      const success = store.importData(oldData);

      expect(success).toBe(true);
      expect(store.notes[0].archived).toBe(false);
    });
  });

  describe("Error Handling Stability", () => {
    it("should handle empty text in add", () => {
      const store = useNotesStore();

      const id = store.add("");

      expect(id).toBeUndefined();
      expect(store.notes).toHaveLength(0);
    });

    it("should handle whitespace-only text in add", () => {
      const store = useNotesStore();

      const id = store.add("   ");

      expect(id).toBeUndefined();
      expect(store.notes).toHaveLength(0);
    });

    it("should handle update of non-existent note gracefully", async () => {
      const store = useNotesStore();

      await expect(
        store.update("non-existent", { text: "test" })
      ).resolves.not.toThrow();
    });

    it("should handle archive of non-existent note gracefully", async () => {
      const store = useNotesStore();

      await expect(store.archive("non-existent")).resolves.not.toThrow();
    });

    it("should handle unarchive of non-existent note gracefully", async () => {
      const store = useNotesStore();

      await expect(store.unarchive("non-existent")).resolves.not.toThrow();
    });
  });

  describe("Service Integration Stability", () => {
    it("should expose noteService property", () => {
      const store = useNotesStore();

      expect(store.noteService).toBeDefined();
      expect(typeof store.noteService.create).toBe("function");
      expect(typeof store.noteService.update).toBe("function");
      expect(typeof store.noteService.delete).toBe("function");
      expect(typeof store.noteService.validate).toBe("function");
    });
  });
});
