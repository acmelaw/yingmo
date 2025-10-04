/**
 * Refactored notes store with modular architecture support
 */

import { computed, watch } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import type { Note, NoteType, TextNote } from "@/types/note";
import { DefaultNoteService } from "@/services/NoteService";
import { moduleRegistry } from "@/core/ModuleRegistry";

export interface NotesState {
  notes: Note[];
  categories: string[];
  searchQuery: string;
  selectedCategory: string | null;
  sortBy: "created" | "updated" | "text";
  sortOrder: "asc" | "desc";
}

const STORAGE_KEY = "vue-notes.data";
const VERSION_KEY = "vue-notes.version";
const CURRENT_VERSION = "2.0.0";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useNotesStore = defineStore("notes", () => {
  const version = useStorage(VERSION_KEY, CURRENT_VERSION);
  const state = useStorage<NotesState>(STORAGE_KEY, {
    notes: [],
    categories: [],
    searchQuery: "",
    selectedCategory: null,
    sortBy: "created",
    sortOrder: "desc",
  });

  // Initialize service
  const noteService = new DefaultNoteService({
    get notes() {
      return state.value.notes;
    },
  });

  // Register this store with the module registry
  moduleRegistry.registerStore("notes", {
    get notes() {
      return state.value.notes;
    },
    add: (note: Note) => {
      state.value.notes = [...state.value.notes, note];
    },
    update: (id: string, updates: Partial<Note>) => {
      const index = state.value.notes.findIndex((n) => n.id === id);
      if (index !== -1) {
        const updated = {
          ...state.value.notes[index],
          ...updates,
          updated: Date.now(),
        } as Note;
        state.value.notes = [
          ...state.value.notes.slice(0, index),
          updated,
          ...state.value.notes.slice(index + 1),
        ];
      }
    },
    remove: (id: string) => {
      state.value.notes = state.value.notes.filter((n) => n.id !== id);
    },
  });

  const notes = computed(() => state.value.notes);
  const categories = computed(() => state.value.categories);

  const searchQuery = computed({
    get: () => state.value.searchQuery,
    set: (value: string) => {
      state.value.searchQuery = value;
    },
  });

  const selectedCategory = computed({
    get: () => state.value.selectedCategory,
    set: (value: string | null) => {
      state.value.selectedCategory = value;
    },
  });

  const sortBy = computed({
    get: () => state.value.sortBy,
    set: (value: "created" | "updated" | "text") => {
      state.value.sortBy = value;
    },
  });

  const sortOrder = computed({
    get: () => state.value.sortOrder,
    set: (value: "asc" | "desc") => {
      state.value.sortOrder = value;
    },
  });

  const filteredNotes = computed(() => {
    let result = state.value.notes.filter((note) => !note.archived);

    if (state.value.searchQuery) {
      const query = state.value.searchQuery.toLowerCase();
      result = result.filter((note) => {
        // Basic text search
        if ("text" in note && typeof note.text === "string") {
          if (note.text.toLowerCase().includes(query)) return true;
        }

        // Search in category and tags
        if (note.category?.toLowerCase().includes(query)) return true;
        if (note.tags?.some((tag) => tag.toLowerCase().includes(query)))
          return true;

        return false;
      });
    }

    if (state.value.selectedCategory) {
      result = result.filter(
        (note) => note.category === state.value.selectedCategory
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (state.value.sortBy) {
        case "created":
          comparison = a.created - b.created;
          break;
        case "updated":
          comparison = a.updated - b.updated;
          break;
        case "text":
          // Try to get text content for sorting
          const aText = "text" in a ? String(a.text) : "";
          const bText = "text" in b ? String(b.text) : "";
          comparison = aText.localeCompare(bText);
          break;
      }
      return state.value.sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  });

  const archivedNotes = computed(() =>
    state.value.notes.filter((note) => note.archived)
  );

  const totalNotes = computed(() => state.value.notes.length);
  const activeNotes = computed(() => filteredNotes.value.length);

  // Get notes by type
  const getNotesByType = computed(() => (type: NoteType) => {
    return state.value.notes.filter((note) => note.type === type);
  });

  /**
   * Create a new note (supports all note types via modules)
   */
  async function create(
    type: NoteType,
    data: any,
    category?: string,
    tags?: string[]
  ): Promise<string> {
    const note = await noteService.create(type, {
      ...data,
      category,
      tags,
      archived: false,
    });

    state.value.notes = [...state.value.notes, note];

    if (category && !state.value.categories.includes(category)) {
      state.value.categories = [...state.value.categories, category];
    }

    return note.id;
  }

  /**
   * Add a text note (legacy compatibility)
   */
  function add(
    text: string,
    category?: string,
    tags?: string[]
  ): string | undefined {
    const payload = text.trim();
    if (!payload) return;

    const now = Date.now();
    const note: TextNote = {
      id: createId(),
      type: "text",
      text: payload,
      created: now,
      updated: now,
      category,
      tags,
      archived: false,
    };

    state.value.notes = [...state.value.notes, note];

    if (category && !state.value.categories.includes(category)) {
      state.value.categories = [...state.value.categories, category];
    }

    return note.id;
  }

  /**
   * Update a note
   */
  async function update(id: string, updates: Partial<Note>): Promise<void> {
    const note = state.value.notes.find((n) => n.id === id);
    if (!note) return;

    const updatedNote = await noteService.update(note, updates);

    const index = state.value.notes.findIndex((n) => n.id === id);
    state.value.notes = [
      ...state.value.notes.slice(0, index),
      updatedNote,
      ...state.value.notes.slice(index + 1),
    ];

    if (
      updatedNote.category &&
      !state.value.categories.includes(updatedNote.category)
    ) {
      state.value.categories = [
        ...state.value.categories,
        updatedNote.category,
      ];
    }
  }

  /**
   * Remove a note
   */
  async function remove(id: string): Promise<void> {
    await noteService.delete(id);
    state.value.notes = state.value.notes.filter((note) => note.id !== id);
  }

  /**
   * Archive a note
   */
  async function archive(id: string): Promise<void> {
    await update(id, { archived: true });
  }

  /**
   * Unarchive a note
   */
  async function unarchive(id: string): Promise<void> {
    await update(id, { archived: false });
  }

  /**
   * Clear all notes
   */
  function clearAll(): void {
    state.value.notes = [];
    state.value.categories = [];
    state.value.searchQuery = "";
    state.value.selectedCategory = null;
  }

  /**
   * Export data
   */
  function exportData() {
    return {
      version: CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      data: state.value,
    };
  }

  /**
   * Import data with migration support
   */
  function importData(data: any): boolean {
    try {
      if (data.version && data.data) {
        // Migrate old notes to new format if needed
        const migratedNotes = migrateNotes(data.data.notes || []);

        state.value = {
          ...state.value,
          ...data.data,
          notes: migratedNotes,
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }

  /**
   * Migrate old note format to new modular format
   */
  function migrateNotes(oldNotes: any[]): Note[] {
    return oldNotes.map((oldNote) => {
      // If already in new format, return as is
      if (oldNote.type) return oldNote;

      // Migrate old format to TextNote
      const migratedNote: TextNote = {
        id: oldNote.id || createId(),
        type: "text",
        text: oldNote.text || "",
        created: oldNote.created || Date.now(),
        updated: oldNote.updated || Date.now(),
        category: oldNote.category,
        tags: oldNote.tags,
        archived: oldNote.archived || false,
      };

      return migratedNote;
    });
  }

  // Watch for category changes
  watch(
    () => state.value.notes,
    (notes) => {
      const cats = new Set<string>();
      notes.forEach((note) => {
        if (note.category) cats.add(note.category);
      });
      state.value.categories = Array.from(cats).sort();
    },
    { deep: true }
  );

  return {
    notes,
    categories,
    searchQuery,
    selectedCategory,
    sortBy,
    sortOrder,
    filteredNotes,
    archivedNotes,
    totalNotes,
    activeNotes,
    getNotesByType,
    create,
    add,
    update,
    remove,
    archive,
    unarchive,
    clearAll,
    exportData,
    importData,
    noteService,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotesStore, import.meta.hot));
}
