/**
 * Performance baseline tests
 * These tests ensure the system maintains acceptable performance
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useNotesStore } from "@/stores/notesModular";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";

describe("Performance Baseline Tests", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    moduleRegistry.clear();
    await moduleRegistry.register(textNoteModule);
  });

  describe("Module Registration Performance", () => {
    it("should register a module in under 100ms", async () => {
      moduleRegistry.clear();

      const start = performance.now();
      await moduleRegistry.register(textNoteModule);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should unregister a module in under 50ms", async () => {
      await moduleRegistry.register(textNoteModule);

      const start = performance.now();
      await moduleRegistry.unregister("text-note");
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it("should get a module in under 1ms", async () => {
      await moduleRegistry.register(textNoteModule);

      const start = performance.now();
      moduleRegistry.getModule("text-note");
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1);
    });
  });

  describe("Note Creation Performance", () => {
    it("should create a note in under 10ms", async () => {
      const store = useNotesStore();

      const start = performance.now();
      await store.create("text", { text: "Test note" });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it("should create 100 notes in under 500ms", async () => {
      const store = useNotesStore();

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await store.create("text", { text: `Note ${i}` });
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      expect(store.notes).toHaveLength(100);
    });

    it("should create 1000 notes in under 3000ms", async () => {
      const store = useNotesStore();

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        await store.create("text", { text: `Note ${i}` });
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(3000);
      expect(store.notes).toHaveLength(1000);
    });
  });

  describe("Note Update Performance", () => {
    it("should update a note in under 10ms", async () => {
      const store = useNotesStore();
      const id = await store.create("text", { text: "Original" });

      const start = performance.now();
      await store.update(id, { text: "Updated" });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it("should update 100 notes in under 500ms", async () => {
      const store = useNotesStore();

      const ids = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          store.create("text", { text: `Note ${i}` })
        )
      );

      const start = performance.now();
      for (const id of ids) {
        await store.update(id, { text: "Updated" });
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("Search Performance", () => {
    beforeEach(async () => {
      const store = useNotesStore();

      // Create 100 notes for searching
      for (let i = 0; i < 100; i++) {
        await store.create("text", {
          text: `Note ${i}`,
          category: i % 2 === 0 ? "even" : "odd",
          tags: [`tag${i % 10}`],
        });
      }
    });

    it("should filter notes by search query in under 50ms", () => {
      const store = useNotesStore();

      const start = performance.now();
      store.searchQuery = "Note";
      const results = store.filteredNotes;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should filter notes by category in under 50ms", () => {
      const store = useNotesStore();

      const start = performance.now();
      store.selectedCategory = "even";
      const results = store.filteredNotes;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(results.length).toBe(50);
    });

    it("should filter with combined query and category in under 50ms", () => {
      const store = useNotesStore();

      const start = performance.now();
      store.searchQuery = "1";
      store.selectedCategory = "even";
      const results = store.filteredNotes;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Sorting Performance", () => {
    beforeEach(async () => {
      const store = useNotesStore();

      // Create 100 notes
      for (let i = 0; i < 100; i++) {
        await store.create("text", { text: `Note ${i}` });
      }
    });

    it("should sort by created date in under 50ms", () => {
      const store = useNotesStore();

      const start = performance.now();
      store.sortBy = "created";
      store.sortOrder = "desc";
      const sorted = store.filteredNotes;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(sorted).toHaveLength(100);
    });

    it("should sort by text in under 100ms", () => {
      const store = useNotesStore();

      const start = performance.now();
      store.sortBy = "text";
      store.sortOrder = "asc";
      const sorted = store.filteredNotes;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(sorted).toHaveLength(100);
    });
  });

  describe("Export/Import Performance", () => {
    it("should export 100 notes in under 100ms", async () => {
      const store = useNotesStore();

      for (let i = 0; i < 100; i++) {
        await store.create("text", { text: `Note ${i}` });
      }

      const start = performance.now();
      const exported = store.exportData();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(exported.data.notes).toHaveLength(100);
    });

    it("should import 100 notes in under 200ms", async () => {
      const store = useNotesStore();

      const data = {
        version: "2.0.0",
        data: {
          notes: Array.from({ length: 100 }, (_, i) => ({
            id: `note-${i}`,
            type: "text" as const,
            text: `Note ${i}`,
            created: Date.now(),
            updated: Date.now(),
            archived: false,
          })),
          categories: [],
          searchQuery: "",
          selectedCategory: null,
          sortBy: "created" as const,
          sortOrder: "desc" as const,
        },
      };

      const start = performance.now();
      store.importData(data);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(store.notes).toHaveLength(100);
    });
  });

  describe("Memory Performance", () => {
    it("should handle 1000 notes without excessive memory", async () => {
      const store = useNotesStore();

      // Create 1000 notes
      for (let i = 0; i < 1000; i++) {
        await store.create("text", { text: `Note ${i}` });
      }

      expect(store.notes).toHaveLength(1000);

      // Test that we can still perform operations efficiently
      const start = performance.now();
      store.searchQuery = "500";
      const results = store.filteredNotes;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
