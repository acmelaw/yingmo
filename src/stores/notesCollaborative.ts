import { computed, ref, watch } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import * as Y from "yjs";
import {
  useCollaboration,
  getSharedType,
} from "@/composables/useCollaboration";

export interface Note {
  id: string;
  text: string;
  richContent?: string; // HTML from Tiptap
  created: number;
  updated: number;
  category?: string;
  tags?: string[];
  archived?: boolean;
  collaborators?: string[]; // User IDs who have edited this note
  isCollaborative?: boolean; // Whether this note uses CRDT sync
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
const CURRENT_VERSION = "2.0.0"; // Updated for collaborative features

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useNotesStore = defineStore("notes", () => {
  // Initialize storage with version check
  const version = useStorage(VERSION_KEY, CURRENT_VERSION);
  const state = useStorage<NotesState>(STORAGE_KEY, {
    notes: [],
    categories: [],
    searchQuery: "",
    selectedCategory: null,
    sortBy: "created",
    sortOrder: "desc",
  });

  // Collaboration state
  const collaborativeNotes = ref<Map<string, Y.Doc>>(new Map());
  const enableCollaboration = ref(
    import.meta.env.VITE_ENABLE_COLLAB === "true" || false
  );

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

  // Filtered and sorted notes
  const filteredNotes = computed(() => {
    let result = state.value.notes.filter((note) => !note.archived);

    // Filter by search query
    if (state.value.searchQuery) {
      const query = state.value.searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.text.toLowerCase().includes(query) ||
          note.richContent?.toLowerCase().includes(query) ||
          note.category?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (state.value.selectedCategory) {
      result = result.filter(
        (note) => note.category === state.value.selectedCategory
      );
    }

    // Sort
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
  const collaborativeNotesCount = computed(
    () => state.value.notes.filter((n) => n.isCollaborative).length
  );

  function add(
    text: string,
    category?: string,
    tags?: string[],
    collaborative: boolean = false
  ) {
    const payload = text.trim();
    if (!payload) return;

    const now = Date.now();
    const id = createId();
    const note: Note = {
      id,
      text: payload,
      created: now,
      updated: now,
      category,
      tags,
      archived: false,
      isCollaborative: collaborative,
    };

    state.value.notes = [...state.value.notes, note];

    // Update categories
    if (category && !state.value.categories.includes(category)) {
      state.value.categories = [...state.value.categories, category];
    }

    // Setup collaborative document if needed
    if (collaborative && enableCollaboration.value) {
      setupCollaborativeNote(id);
    }

    return id;
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

    // Update categories
    if (
      updated.category &&
      !state.value.categories.includes(updated.category)
    ) {
      state.value.categories = [...state.value.categories, updated.category];
    }
  }

  function remove(id: string) {
    // Clean up collaborative document
    const note = state.value.notes.find((n) => n.id === id);
    if (note?.isCollaborative) {
      const ydoc = collaborativeNotes.value.get(id);
      ydoc?.destroy();
      collaborativeNotes.value.delete(id);
    }

    state.value.notes = state.value.notes.filter((note) => note.id !== id);
  }

  function archive(id: string) {
    update(id, { archived: true });
  }

  function unarchive(id: string) {
    update(id, { archived: false });
  }

  function clearAll() {
    // Clean up all collaborative documents
    collaborativeNotes.value.forEach((doc) => doc.destroy());
    collaborativeNotes.value.clear();

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

  /**
   * Setup collaborative editing for a note
   */
  function setupCollaborativeNote(noteId: string): Y.Doc {
    if (collaborativeNotes.value.has(noteId)) {
      return collaborativeNotes.value.get(noteId)!;
    }

    const ydoc = new Y.Doc();
    collaborativeNotes.value.set(noteId, ydoc);

    // Initialize the document with existing content if any
    const note = state.value.notes.find((n) => n.id === noteId);
    if (note?.richContent) {
      const ytext = ydoc.getText("content");
      ytext.insert(0, note.richContent);
    }

    return ydoc;
  }

  /**
   * Get Yjs document for a note
   */
  function getCollaborativeDoc(noteId: string): Y.Doc | undefined {
    return collaborativeNotes.value.get(noteId);
  }

  /**
   * Enable collaborative editing for an existing note
   */
  function enableCollaborativeEditing(noteId: string) {
    const note = state.value.notes.find((n) => n.id === noteId);
    if (!note) return;

    update(noteId, { isCollaborative: true });
    setupCollaborativeNote(noteId);
  }

  /**
   * Disable collaborative editing for a note
   */
  function disableCollaborativeEditing(noteId: string) {
    const ydoc = collaborativeNotes.value.get(noteId);
    if (ydoc) {
      // Save final state before destroying
      const ytext = ydoc.getText("content");
      const finalContent = ytext.toString();
      update(noteId, { richContent: finalContent, isCollaborative: false });

      ydoc.destroy();
      collaborativeNotes.value.delete(noteId);
    }
  }

  // Auto-update categories when notes change
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
    // State
    notes,
    categories,
    searchQuery,
    selectedCategory,
    sortBy,
    sortOrder,
    enableCollaboration,
    // Computed
    filteredNotes,
    archivedNotes,
    totalNotes,
    activeNotes,
    collaborativeNotesCount,
    // Actions
    add,
    update,
    remove,
    archive,
    unarchive,
    clearAll,
    exportData,
    importData,
    // Collaborative actions
    setupCollaborativeNote,
    getCollaborativeDoc,
    enableCollaborativeEditing,
    disableCollaborativeEditing,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotesStore, import.meta.hot));
}
