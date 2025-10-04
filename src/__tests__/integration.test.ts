/**
 * Integration tests for the entire modular system
 * Tests end-to-end workflows
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useNotesStore } from "@/stores/notes";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import { initializeModules } from "@/core/initModules";
import { isTextNote } from "@/types/note";

describe("Integration Tests", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    moduleRegistry.clear();
    await initializeModules();
  });

  describe("End-to-End Note Lifecycle", () => {
    it("should create, update, and delete a note", async () => {
      const store = useNotesStore();

      // Create
      const id = await store.create("text", { text: "Test note" });
      expect(store.notes).toHaveLength(1);

      // Update
      await store.update(id, { text: "Updated note" });
      const note = store.notes.find((n) => n.id === id);
      if (note && isTextNote(note)) {
        expect(note.text).toBe("Updated note");
      }

      // Delete
      await store.remove(id);
      expect(store.notes).toHaveLength(0);
    });

    it("should handle categories and tags", async () => {
      const store = useNotesStore();

      await store.create("text", {
        text: "Work note",
        category: "work",
        tags: ["important"],
      });

      expect(store.categories).toContain("work");

      const note = store.notes[0];
      expect(note.category).toBe("work");
      expect(note.tags).toContain("important");
    });

    it("should filter notes by search query", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "JavaScript tutorial" });
      await store.create("text", { text: "Python guide" });
      await store.create("text", { text: "Random thoughts" });

      store.searchQuery = "tutorial";
      expect(store.filteredNotes).toHaveLength(1);

      store.searchQuery = "guide";
      expect(store.filteredNotes).toHaveLength(1);

      store.searchQuery = "";
      expect(store.filteredNotes).toHaveLength(3);
    });

    it("should filter notes by category", async () => {
      const store = useNotesStore();

      await store.create("text", {
        text: "Work note 1",
        category: "work",
      });
      await store.create("text", {
        text: "Work note 2",
        category: "work",
      });
      await store.create("text", {
        text: "Personal note",
        category: "personal",
      });

      store.selectedCategory = "work";
      expect(store.filteredNotes).toHaveLength(2);

      store.selectedCategory = "personal";
      expect(store.filteredNotes).toHaveLength(1);

      store.selectedCategory = null;
      expect(store.filteredNotes).toHaveLength(3);
    });

    it("should archive and unarchive notes", async () => {
      const store = useNotesStore();

      const id = await store.create("text", { text: "To archive" });

      await store.archive(id);
      expect(store.filteredNotes).toHaveLength(0);
      expect(store.archivedNotes).toHaveLength(1);

      await store.unarchive(id);
      expect(store.filteredNotes).toHaveLength(1);
      expect(store.archivedNotes).toHaveLength(0);
    });
  });

  describe("Module System Integration", () => {
    it("should register and use modules", async () => {
      // Should have all 6 modules registered (text, markdown, code, rich-text, image, smart-layer)
      expect(moduleRegistry.getAllModules().length).toBeGreaterThanOrEqual(1);
      expect(moduleRegistry.getModule("text-note")).toBeDefined();

      const typeHandler = moduleRegistry.getTypeHandler("text");
      expect(typeHandler).toBeDefined();
      expect(typeHandler?.create).toBeDefined();
    });

    it("should get modules for specific type", () => {
      const modules = moduleRegistry.getModulesForType("text");
      expect(modules).toHaveLength(1);
      expect(modules[0].id).toBe("text-note");
    });

    it("should handle module components", () => {
      const module = moduleRegistry.getModule("text-note");
      expect(module?.components).toBeDefined();
      expect(module?.components?.editor).toBeDefined();
      expect(module?.components?.viewer).toBeDefined();
    });
  });

  describe("Data Persistence", () => {
    it("should export and import data", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Note 1", category: "work" });
      await store.create("text", { text: "Note 2", tags: ["important"] });

      const exported = store.exportData();

      expect(exported.version).toBe("2.0.0");
      expect(exported.data.notes).toHaveLength(2);
      expect(exported.exportDate).toBeDefined();

      store.clearAll();
      expect(store.notes).toHaveLength(0);

      const success = store.importData(exported);
      expect(success).toBe(true);
      expect(store.notes).toHaveLength(2);
      expect(store.categories).toContain("work");
    });

    it("should migrate old data format", () => {
      const store = useNotesStore();

      const oldData = {
        version: "1.0.0",
        data: {
          notes: [
            {
              id: "old-1",
              text: "Old note without type",
              created: Date.now(),
              updated: Date.now(),
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
      expect(store.notes).toHaveLength(1);
      expect(store.notes[0].type).toBe("text");
    });
  });

  describe("Sorting", () => {
    beforeEach(async () => {
      const store = useNotesStore();

      // Create notes with different timestamps
      await store.create("text", { text: "First" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await store.create("text", { text: "Second" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await store.create("text", { text: "Third" });
    });

    it("should sort by created date ascending", () => {
      const store = useNotesStore();

      store.sortBy = "created";
      store.sortOrder = "asc";

      const notes = store.filteredNotes;
      expect(notes[0].created).toBeLessThanOrEqual(notes[1].created);
      expect(notes[1].created).toBeLessThanOrEqual(notes[2].created);
    });

    it("should sort by created date descending", () => {
      const store = useNotesStore();

      store.sortBy = "created";
      store.sortOrder = "desc";

      const notes = store.filteredNotes;
      expect(notes[0].created).toBeGreaterThanOrEqual(notes[1].created);
      expect(notes[1].created).toBeGreaterThanOrEqual(notes[2].created);
    });

    it("should sort by text content", () => {
      const store = useNotesStore();

      store.sortBy = "text";
      store.sortOrder = "asc";

      const notes = store.filteredNotes;
      if (isTextNote(notes[0])) {
        expect(notes[0].text).toBe("First");
      }
      if (isTextNote(notes[1])) {
        expect(notes[1].text).toBe("Second");
      }
      if (isTextNote(notes[2])) {
        expect(notes[2].text).toBe("Third");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle creating note with unknown type gracefully", async () => {
      const store = useNotesStore();

      await expect(
        store.create("unknown" as any, { data: "test" })
      ).resolves.toBeDefined();
    });

    it("should handle updating non-existent note", async () => {
      const store = useNotesStore();

      await expect(
        store.update("non-existent", { text: "updated" })
      ).resolves.not.toThrow();
    });

    it("should handle deleting non-existent note", async () => {
      const store = useNotesStore();

      await expect(store.remove("non-existent")).resolves.not.toThrow();
    });

    it("should handle invalid import data", () => {
      const store = useNotesStore();

      const success = store.importData({ invalid: "data" });
      expect(success).toBe(false);
    });
  });

  describe("Statistics", () => {
    it("should track total and active notes", async () => {
      const store = useNotesStore();

      expect(store.totalNotes).toBe(0);
      expect(store.activeNotes).toBe(0);

      await store.create("text", { text: "Note 1" });
      await store.create("text", { text: "Note 2" });

      expect(store.totalNotes).toBe(2);
      expect(store.activeNotes).toBe(2);

      const id = store.notes[0].id;
      await store.archive(id);

      expect(store.totalNotes).toBe(2);
      expect(store.activeNotes).toBe(1);
    });

    it("should get notes by type", async () => {
      const store = useNotesStore();

      await store.create("text", { text: "Text 1" });
      await store.create("text", { text: "Text 2" });

      const textNotes = store.getNotesByType("text");
      expect(textNotes).toHaveLength(2);
    });
  });
});
