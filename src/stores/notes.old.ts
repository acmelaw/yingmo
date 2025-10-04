import { computed, watch } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import {
  needsMigration,
  runMigrations,
  getMigrationStatus,
  promptUserMigration,
} from "./migration";

export interface NoteEdit {
  timestamp: number;
  text: string;
  tags?: string[];
  userId?: string; // For future collaboration
}

export interface Note {
  id: string;
  text: string; // Main content (may or may not contain hashtags)
  created: number;
  updated: number;
  category?: string;
  tags?: string[]; // Hashtags stored separately (without # symbol)
  archived?: boolean;
  editHistory?: NoteEdit[]; // Track edits for undo/redo
  tiptapContent?: any; // Store TipTap JSON content if using rich editor
}

export interface NotesState {
  notes: Note[];
  categories: string[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[]; // Support multiple tag filtering
  sortBy: "created" | "updated" | "text";
  sortOrder: "asc" | "desc";
  autoExtractTags: boolean; // Extract hashtags on note creation
  cleanContentOnExtract: boolean; // Remove hashtags from text when extracting
}

const STORAGE_KEY = "vue-notes.data";
const VERSION_KEY = "vue-notes.version";
const CURRENT_VERSION = "2.0.0";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Enhanced Unicode-aware hashtag extraction
// Supports: #hello, #café, #日本語, #hello123, #hello_world
function extractHashtags(text: string): string[] {
  // Match # followed by unicode word characters, numbers, and underscores
  // \p{L} = any unicode letter, \p{N} = any unicode number
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  if (!matches) return [];
  // Remove # and return unique tags (case-insensitive deduplication)
  const tags = matches.map((tag) => tag.substring(1));
  return [...new Set(tags.map((t) => t.toLowerCase()))].map(
    (lowered) => tags.find((t) => t.toLowerCase() === lowered) || lowered
  );
}

// Helper function to merge tags from text and explicit tags (only on creation)
function mergeTags(
  text: string,
  explicitTags?: string[],
  autoExtract = true
): string[] {
  const extractedTags = autoExtract ? extractHashtags(text) : [];
  const allTags = [...extractedTags, ...(explicitTags || [])];
  return [...new Set(allTags.map((t) => t.toLowerCase()))]
    .map(
      (lowered) => allTags.find((t) => t.toLowerCase() === lowered) || lowered
    )
    .sort();
}

// Remove hashtags from text for clean content display
function stripHashtags(text: string): string {
  return text
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const useNotesStore = defineStore("notes", () => {
  const version = useStorage(VERSION_KEY, CURRENT_VERSION);

  // Initialize state with proper defaults
  const state = useStorage<NotesState>(STORAGE_KEY, {
    notes: [],
    categories: [],
    searchQuery: "",
    selectedCategory: null,
    selectedTags: [],
    sortBy: "created",
    sortOrder: "desc",
    autoExtractTags: true,
    cleanContentOnExtract: false,
  });

  // Handle migration if needed
  if (needsMigration(CURRENT_VERSION)) {
    const migrationStatus = getMigrationStatus();

    if (!migrationStatus.userPrompted) {
      const choice = promptUserMigration();

      if (choice === "migrate") {
        console.log("[Store] Running migrations...");
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            const migrated = runMigrations(parsed, CURRENT_VERSION);
            state.value = migrated;
            console.log("[Store] Migration successful!");
          } catch (error) {
            console.error("[Store] Migration failed:", error);
          }
        }
      } else if (choice === "clear") {
        console.log("[Store] Clearing all data...");
        state.value = {
          notes: [],
          categories: [],
          searchQuery: "",
          selectedCategory: null,
          selectedTags: [],
          sortBy: "created",
          sortOrder: "desc",
          autoExtractTags: true,
          cleanContentOnExtract: false,
        };
      }

      // Mark as prompted
      const newStatus = getMigrationStatus();
      newStatus.userPrompted = true;
      import("./migration").then((m) => m.setMigrationStatus(newStatus));
    }
  }

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
  const selectedTags = computed({
    get: () => state.value.selectedTags,
    set: (value: string[]) => {
      state.value.selectedTags = value;
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
  const autoExtractTags = computed({
    get: () => state.value.autoExtractTags,
    set: (value: boolean) => {
      state.value.autoExtractTags = value;
    },
  });
  const cleanContentOnExtract = computed({
    get: () => state.value.cleanContentOnExtract,
    set: (value: boolean) => {
      state.value.cleanContentOnExtract = value;
    },
  });

  // Extract all unique tags from notes
  const allTags = computed(() => {
    const tagSet = new Set<string>();
    state.value.notes.forEach((note) => {
      if (note.tags) {
        note.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
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

    // Filter by multiple tags (AND logic - note must have all selected tags)
    if (state.value.selectedTags && state.value.selectedTags.length > 0) {
      result = result.filter((note) =>
        state.value.selectedTags.every((tag) => note.tags?.includes(tag))
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

    // Auto-extract tags if enabled
    const mergedTags = state.value.autoExtractTags
      ? mergeTags(payload, tags, true)
      : tags || [];

    // Clean content only if both auto-extract AND clean are enabled
    const cleanText =
      state.value.autoExtractTags && state.value.cleanContentOnExtract
        ? stripHashtags(payload)
        : payload;

    const note: Note = {
      id: createId(),
      text: cleanText,
      created: now,
      updated: now,
      category,
      tags: mergedTags.length > 0 ? mergedTags : undefined,
      archived: false,
      editHistory: [
        {
          timestamp: now,
          text: cleanText,
          tags: mergedTags.length > 0 ? mergedTags : undefined,
        },
      ],
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
    const now = Date.now();

    // NEVER auto-extract or modify text on edit - only explicit updates
    // User must manage tags manually through the UI when editing
    let finalUpdates = { ...updates };

    // Add to edit history
    const editHistory = note.editHistory || [];
    editHistory.push({
      timestamp: now,
      text: updates.text !== undefined ? updates.text : note.text,
      tags: updates.tags !== undefined ? updates.tags : note.tags,
    });

    const updated = {
      ...note,
      ...finalUpdates,
      updated: now,
      editHistory,
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

  function removeTag(noteId: string, tag: string) {
    const note = state.value.notes.find((n) => n.id === noteId);
    if (!note || !note.tags) return;

    const updatedTags = note.tags.filter((t) => t !== tag);

    // DON'T modify the text - just update the tags array
    update(noteId, {
      tags: updatedTags.length > 0 ? updatedTags : undefined,
    });
  }

  function addTag(noteId: string, tag: string) {
    const note = state.value.notes.find((n) => n.id === noteId);
    if (!note) return;

    const cleanTag = tag.replace(/^#/, "").toLowerCase(); // Remove # if present
    const currentTags = note.tags || [];

    if (currentTags.includes(cleanTag)) return; // Tag already exists

    // DON'T modify the text - just add to tags array
    update(noteId, {
      tags: [...currentTags, cleanTag],
    });
  }

  function toggleTag(tag: string) {
    const currentTags = state.value.selectedTags;
    if (currentTags.includes(tag)) {
      state.value.selectedTags = currentTags.filter((t) => t !== tag);
    } else {
      state.value.selectedTags = [...currentTags, tag];
    }
  }

  function clearTagFilters() {
    state.value.selectedTags = [];
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
    allTags,
    searchQuery,
    selectedCategory,
    selectedTags,
    sortBy,
    sortOrder,
    autoExtractTags,
    cleanContentOnExtract,
    filteredNotes,
    archivedNotes,
    totalNotes,
    activeNotes,
    add,
    update,
    remove,
    removeTag,
    addTag,
    toggleTag,
    clearTagFilters,
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
