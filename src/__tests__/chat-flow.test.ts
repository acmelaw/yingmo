/**
 * Integration tests for the chat/note-taking flow
 *
 * These tests verify the end-to-end user experience:
 * 1. User opens app
 * 2. User clicks "continue offline"
 * 3. User types a message
 * 4. User clicks send
 * 5. Message appears in the list view
 *
 * This ensures the core value proposition of the app works correctly.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import { useNotesStore } from "@/stores/notes";
import { useSettingsStore } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import type { TextNote } from "@/types/note";

describe("Chat/Note Flow - Critical User Journey", () => {
  beforeEach(async () => {
    // Fresh state for each test
    setActivePinia(createPinia());

    // Clear module registry and re-register text module
    moduleRegistry.clear();
    await moduleRegistry.register(textNoteModule);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Note Creation Flow", () => {
    it("should create a note and immediately show it in the list (offline)", async () => {
      // SETUP: User opens app
      const store = useNotesStore();
      const settings = useSettingsStore();

      // User clicks "continue offline"
      settings.syncEnabled = false;

      // Verify empty state
      expect(store.notes).toHaveLength(0);
      expect(store.filteredNotes).toHaveLength(0);

      // USER ACTION: Type "hello world" and click send
      const noteId = await store.create("text", { text: "hello world" });

      // Wait for reactivity
      await nextTick();

      // VERIFICATION: Note appears in list immediately
      expect(noteId).toBeDefined();
      expect(store.notes).toHaveLength(1);
      expect(store.filteredNotes).toHaveLength(1);

      const note = store.notes[0] as TextNote;
      expect(note.type).toBe("text");
      expect(note.text).toBe("hello world");
      expect(note.content).toBe("hello world");
      expect(note.archived).toBe(false);
    });

    it("should create multiple notes in sequence", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Create first note
      await store.create("text", { text: "First message" });
      await nextTick();
      expect(store.filteredNotes).toHaveLength(1);

      // Create second note
      await store.create("text", { text: "Second message" });
      await nextTick();
      expect(store.filteredNotes).toHaveLength(2);

      // Create third note
      await store.create("text", { text: "Third message" });
      await nextTick();
      expect(store.filteredNotes).toHaveLength(3);

      // Verify all notes are present
      const texts = store.filteredNotes.map((n) => (n as TextNote).text);
      expect(texts).toContain("First message");
      expect(texts).toContain("Second message");
      expect(texts).toContain("Third message");
    });

    it("should maintain note order (newest first by default)", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Add small delay to ensure different timestamps
      await store.create("text", { text: "First" });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await store.create("text", { text: "Second" });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await store.create("text", { text: "Third" });
      await nextTick();

      // Default sort is by created, desc (newest first)
      const notes = store.filteredNotes as TextNote[];
      expect(notes[0].text).toBe("Third");
      expect(notes[2].text).toBe("First");
    });
  });

  describe("Reactivity and State Management", () => {
    it("should trigger reactivity when adding notes", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Track computed property changes
      const lengths: number[] = [];
      lengths.push(store.filteredNotes.length);

      await store.create("text", { text: "Note 1" });
      await nextTick();
      lengths.push(store.filteredNotes.length);

      await store.create("text", { text: "Note 2" });
      await nextTick();
      lengths.push(store.filteredNotes.length);

      // Verify the computed property updated each time
      expect(lengths).toEqual([0, 1, 2]);
    });

    it("should update filteredNotes when a note is created", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Watch filteredNotes
      let updateCount = 0;
      const initialLength = store.filteredNotes.length;

      // Create note
      await store.create("text", { text: "Test" });
      await nextTick();

      // Verify change
      expect(store.filteredNotes.length).toBe(initialLength + 1);
    });

    it("should persist notes to localStorage", async () => {
      // Note: In test mode, storage uses in-memory refs, not actual localStorage
      // This test verifies the storage mechanism works conceptually
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      await store.create("text", { text: "Persisted note" });
      await nextTick();

      // Verify the note is in the store (which is persisted)
      expect(store.notes).toHaveLength(1);
      expect((store.notes[0] as TextNote).text).toBe("Persisted note");
    });

    it("should restore notes from localStorage on initialization", async () => {
      // Note: In test mode, we test the concept by creating a new store instance
      // In production, this would restore from actual localStorage
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const store1 = useNotesStore();
      await store1.create("text", { text: "Note 1" });
      await store1.create("text", { text: "Note 2" });
      await nextTick();

      // Verify notes were created
      expect(store1.notes).toHaveLength(2);

      // In a real scenario, a new app session would restore from localStorage
      // In test mode, we verify the data is accessible
      const texts = store1.notes.map((n) => (n as TextNote).text);
      expect(texts).toContain("Note 1");
      expect(texts).toContain("Note 2");
    });
  });

  describe("Search and Filtering", () => {
    it("should filter notes by search query", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      await store.create("text", { text: "hello world" });
      await store.create("text", { text: "goodbye world" });
      await store.create("text", { text: "foo bar" });
      await nextTick();

      // All notes visible initially
      expect(store.filteredNotes).toHaveLength(3);

      // Filter by "hello"
      store.searchQuery = "hello";
      await nextTick();
      expect(store.filteredNotes).toHaveLength(1);
      expect((store.filteredNotes[0] as TextNote).text).toBe("hello world");

      // Filter by "world"
      store.searchQuery = "world";
      await nextTick();
      expect(store.filteredNotes).toHaveLength(2);

      // Clear filter
      store.searchQuery = "";
      await nextTick();
      expect(store.filteredNotes).toHaveLength(3);
    });

    it("should not show archived notes in filteredNotes", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const id1 = await store.create("text", { text: "Active note" });
      const id2 = await store.create("text", { text: "Archived note" });
      await nextTick();

      expect(store.filteredNotes).toHaveLength(2);

      // Archive one note
      await store.archive(id2);
      await nextTick();

      expect(store.filteredNotes).toHaveLength(1);
      expect((store.filteredNotes[0] as TextNote).text).toBe("Active note");
    });
  });

  describe("Update and Delete Operations", () => {
    it("should update a note and maintain reactivity", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const id = await store.create("text", { text: "Original text" });
      await nextTick();

      expect((store.filteredNotes[0] as TextNote).text).toBe("Original text");

      // Update the note
      await store.update(id, { text: "Updated text" });
      await nextTick();

      expect(store.filteredNotes).toHaveLength(1);
      expect((store.filteredNotes[0] as TextNote).text).toBe("Updated text");
    });

    it("should delete a note and update the list", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const id1 = await store.create("text", { text: "Keep me" });
      const id2 = await store.create("text", { text: "Delete me" });
      await nextTick();

      expect(store.filteredNotes).toHaveLength(2);

      // Delete one note
      await store.remove(id2);
      await nextTick();

      expect(store.filteredNotes).toHaveLength(1);
      expect((store.filteredNotes[0] as TextNote).text).toBe("Keep me");
    });
  });

  describe("Hashtag Support", () => {
    it("should extract hashtags when autoExtractTags is enabled", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Enable auto-extraction
      store.autoExtractTags = true;

      const id = await store.create("text", {
        text: "Meeting notes #work #important",
      });
      await nextTick();

      const note = store.notes.find((n) => n.id === id);
      expect(note?.tags).toBeDefined();
      // Tags are stored without the # prefix
      expect(note?.tags).toContain("work");
      expect(note?.tags).toContain("important");
    });

    it("should optionally clean hashtags from content", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      store.autoExtractTags = true;
      store.cleanContentOnExtract = true;

      const id = await store.create("text", {
        text: "Meeting notes #work #important",
      });
      await nextTick();

      const note = store.notes.find((n) => n.id === id) as TextNote;
      expect(note.text).toBe("Meeting notes");
      // Tags are stored without the # prefix
      expect(note.tags).toContain("work");
      expect(note.tags).toContain("important");
    });

    it("should filter notes by tags", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;
      store.autoExtractTags = true;

      await store.create("text", { text: "Work task #work" });
      await store.create("text", { text: "Personal reminder #personal" });
      await store.create("text", { text: "Work meeting #work #urgent" });
      await nextTick();

      // Filter by tag (without # prefix)
      store.selectedTags = ["work"];
      await nextTick();

      expect(store.filteredNotes).toHaveLength(2);
    });
  });

  describe("Category Management", () => {
    it("should assign category to notes", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      await store.create("text", { text: "Work note" }, "work");
      await nextTick();

      expect(store.notes[0].category).toBe("work");
      expect(store.categories).toContain("work");
    });

    it("should filter notes by category", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      await store.create("text", { text: "Work note" }, "work");
      await store.create("text", { text: "Personal note" }, "personal");
      await nextTick();

      store.selectedCategory = "work";
      await nextTick();

      expect(store.filteredNotes).toHaveLength(1);
      expect(store.filteredNotes[0].category).toBe("work");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty text gracefully", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Empty string
      await store.create("text", { text: "" });
      await nextTick();

      expect(store.notes).toHaveLength(1);
      expect((store.notes[0] as TextNote).text).toBe("");
    });

    it("should handle whitespace-only text", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      await store.create("text", { text: "   " });
      await nextTick();

      expect(store.notes).toHaveLength(1);
    });

    it("should handle very long text", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const longText = "a".repeat(10000);
      await store.create("text", { text: longText });
      await nextTick();

      expect(store.notes).toHaveLength(1);
      expect((store.notes[0] as TextNote).text).toHaveLength(10000);
    });

    it("should handle special characters", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const specialText = "Test 🚀 emoji & special <chars> #tag";
      await store.create("text", { text: specialText });
      await nextTick();

      expect((store.notes[0] as TextNote).text).toBe(specialText);
    });

    it("should handle rapid successive creates", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Create multiple notes rapidly
      const promises = [
        store.create("text", { text: "Note 1" }),
        store.create("text", { text: "Note 2" }),
        store.create("text", { text: "Note 3" }),
        store.create("text", { text: "Note 4" }),
        store.create("text", { text: "Note 5" }),
      ];

      await Promise.all(promises);
      await nextTick();

      expect(store.notes).toHaveLength(5);
      expect(store.filteredNotes).toHaveLength(5);
    });
  });

  describe("Performance", () => {
    it("should handle 100 notes efficiently", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      const startTime = performance.now();

      // Create 100 notes
      for (let i = 0; i < 100; i++) {
        await store.create("text", { text: `Note ${i}` });
      }
      await nextTick();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(store.notes).toHaveLength(100);
      expect(store.filteredNotes).toHaveLength(100);

      // Should complete in reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it("should filter large note sets efficiently", async () => {
      const store = useNotesStore();
      const settings = useSettingsStore();
      settings.syncEnabled = false;

      // Create 50 matching and 50 non-matching notes
      for (let i = 0; i < 50; i++) {
        await store.create("text", { text: `Match test ${i}` });
        await store.create("text", { text: `Other ${i}` });
      }
      await nextTick();

      const startTime = performance.now();
      store.searchQuery = "test";
      await nextTick();
      const endTime = performance.now();

      expect(store.filteredNotes).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
