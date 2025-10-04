import { computed, watch } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

export interface Note {
  id: string;
  text: string;
  created: number;
  updated: number;
  category?: string;
  tags?: string[];
  archived?: boolean;
}

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
const CURRENT_VERSION = "1.0.0";

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
      result = result.filter(
        (note) =>
          note.text.toLowerCase().includes(query) ||
          note.category?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
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
          comparison = a.text.localeCompare(b.text);
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

  function add(text: string, category?: string, tags?: string[]) {
    const payload = text.trim();
    if (!payload) return;

    const now = Date.now();
    const note: Note = {
      id: createId(),
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

  function update(id: string, updates: Partial<Note>) {
    const index = state.value.notes.findIndex((note) => note.id === id);
    if (index === -1) return;

    const note = state.value.notes[index];
    const updated = {
      ...note,
      ...updates,
      updated: Date.now(),
    };

    state.value.notes = [
      ...state.value.notes.slice(0, index),
      updated,
      ...state.value.notes.slice(index + 1),
    ];

    if (
      updated.category &&
      !state.value.categories.includes(updated.category)
    ) {
      state.value.categories = [...state.value.categories, updated.category];
    }
  }

  function remove(id: string) {
    state.value.notes = state.value.notes.filter((note) => note.id !== id);
  }

  function archive(id: string) {
    update(id, { archived: true });
  }

  function unarchive(id: string) {
    update(id, { archived: false });
  }

  function clearAll() {
    state.value.notes = [];
    state.value.categories = [];
    state.value.searchQuery = "";
    state.value.selectedCategory = null;
  }

  function exportData() {
    return {
      version: CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      data: state.value,
    };
  }

  function importData(data: any) {
    try {
      if (data.version && data.data) {
        state.value = {
          ...state.value,
          ...data.data,
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }

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
    add,
    update,
    remove,
    archive,
    unarchive,
    clearAll,
    exportData,
    importData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotesStore, import.meta.hot));
}
