/**
 * Refactored notes store with modular architecture support
 */

import { computed, ref, watch } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import type { Note, NoteType, TextNote } from "@/types/note";
import { DefaultNoteService } from "@/services/NoteService";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { apiClient } from "@/services/apiClient";

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

type CategoryKey = string;

function clone<T>(value: T): T {
  const structuredCloneFn = (globalThis as any).structuredClone;
  if (typeof structuredCloneFn === "function") {
    try {
      return structuredCloneFn(value);
    } catch (error) {
      // Fall through to JSON clone for values that cannot be structured cloned (reactive proxies, etc.)
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function createStorageRef<T>(key: string, initialValue: T) {
  if (import.meta.env.MODE === "test") {
    return ref<T>(clone(initialValue));
  }

  return useStorage<T>(key, initialValue);
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useNotesStore = defineStore("notes", () => {
  const version = createStorageRef(VERSION_KEY, CURRENT_VERSION);
  const state = createStorageRef<NotesState>(STORAGE_KEY, {
    notes: [],
    categories: [],
    searchQuery: "",
    selectedCategory: null,
    sortBy: "created",
    sortOrder: "desc",
  });

  const categoryCounts = new Map<CategoryKey, number>();

  rebuildCategoryIndex(state.value.notes);

  // Initialize service
  const noteService = new DefaultNoteService({
    get notes() {
      return state.value.notes;
    },
  });

  const auth = useAuthStore();
  const settings = useSettingsStore();
  const syncing = ref(false);
  const lastSyncedAt = ref<number | null>(null);
  const syncError = ref<string | null>(null);
  const remoteSearchResults = ref<Note[] | null>(null);
  const searchGeneration = ref(0);

  const hasRemoteSession = computed(
    () => Boolean(auth.token) && Boolean(auth.tenantId) && Boolean(auth.userId)
  );
  const shouldSync = computed(
    () => settings.syncEnabled && hasRemoteSession.value
  );

  // Register this store with the module registry
  moduleRegistry.registerStore("notes", {
    get notes() {
      return state.value.notes;
    },
    add: (note: Note) => {
      upsertNote(note);
    },
    update: (id: string, updates: Partial<Note>) => {
      const index = state.value.notes.findIndex((n) => n.id === id);
      if (index !== -1) {
        const updated = {
          ...state.value.notes[index],
          ...updates,
          updated: ensureFutureTimestamp(state.value.notes[index].updated),
        } as Note;
        upsertNote(updated);
      }
    },
    remove: (id: string) => {
      deleteFromState(id);
    },
  });

  async function syncFromServer(): Promise<void> {
    if (!shouldSync.value || !auth.tenantId || !auth.userId) {
      return;
    }

    if (syncing.value) {
      return;
    }

    syncing.value = true;
    try {
      const remoteNotes = await apiClient.listNotes({
        tenantId: auth.tenantId,
        userId: auth.userId,
      });

      const localNotes = state.value.notes;
      const localMap = new Map(localNotes.map((note) => [note.id, note]));
      const mergedMap = new Map<string, Note>();

      for (const remote of remoteNotes) {
        const local = localMap.get(remote.id);
        if (local && local.updated > remote.updated) {
          mergedMap.set(remote.id, local);
        } else {
          mergedMap.set(remote.id, remote);
        }
      }

      for (const local of localNotes) {
        if (!mergedMap.has(local.id)) {
          mergedMap.set(local.id, local);
        }
      }

      const merged = Array.from(mergedMap.values()).sort((a, b) =>
        a.created === b.created ? a.updated - b.updated : a.created - b.created
      );

      state.value.notes = merged;
      rebuildCategoryIndex(merged);
      lastSyncedAt.value = Date.now();
      syncError.value = null;
    } catch (error) {
      syncError.value =
        error instanceof Error ? error.message : String(error);
    } finally {
      syncing.value = false;
    }
  }

  function upsertNote(note: Note) {
    const index = state.value.notes.findIndex((existing) => existing.id === note.id);
    if (index === -1) {
      state.value.notes.push(note);
      trackCategory(note.category ?? null);
      return;
    }

    const previous = state.value.notes[index];
    state.value.notes[index] = note;
    reconcileCategories(previous.category ?? null, note.category ?? null);
  }

  function deleteFromState(id: string) {
    const index = state.value.notes.findIndex((note) => note.id === id);
    if (index !== -1) {
      const [removed] = state.value.notes.splice(index, 1);
      if (removed) {
        trackRemoval(removed.category ?? null);
      }
    }
  }

  watch(
    () => ({
      sync: shouldSync.value,
      tenantId: auth.tenantId,
      userId: auth.userId,
    }),
    async ({ sync, tenantId, userId }) => {
      if (sync && tenantId && userId) {
        await syncFromServer();
      }
    },
    { immediate: true }
  );

  watch(
    () => state.value.searchQuery,
    async (query) => {
      if (!shouldSync.value) {
        remoteSearchResults.value = null;
        return;
      }

      const trimmed = query.trim();
      if (!trimmed) {
        remoteSearchResults.value = null;
        return;
      }

      if (!auth.tenantId || !auth.userId) {
        return;
      }

      const generation = ++searchGeneration.value;

      try {
        const results = await apiClient.searchNotes(
          auth.tenantId,
          auth.userId,
          trimmed
        );

        if (generation === searchGeneration.value) {
          remoteSearchResults.value = results;
          syncError.value = null;
        }
      } catch (error) {
        if (generation === searchGeneration.value) {
          remoteSearchResults.value = null;
          syncError.value =
            error instanceof Error ? error.message : String(error);
        }
      }
    }
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

  const filteredNotes = computed(() => {
    const source = remoteSearchResults.value ?? state.value.notes;
    let result = source.filter((note) => !note.archived);

    if (!remoteSearchResults.value && state.value.searchQuery) {
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
    data: Record<string, unknown>,
    category?: string,
    tags?: string[]
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      ...data,
      archived: false,
    };

    if (category !== undefined) {
      payload.category = category;
    }

    if (tags !== undefined) {
      payload.tags = tags;
    }

    if (shouldSync.value && auth.tenantId && auth.userId) {
      try {
        const created = await apiClient.createNote(type, {
          ...payload,
          tenantId: auth.tenantId,
          userId: auth.userId,
        });
        upsertNote(created);
        lastSyncedAt.value = Date.now();
        syncError.value = null;
        return created.id;
      } catch (error) {
        syncError.value =
          error instanceof Error ? error.message : String(error);
      }
    }

    const note = await noteService.create(type, payload);
    upsertNote(note);
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

    upsertNote(note);

    return note.id;
  }

  /**
   * Update a note
   */
  async function update(id: string, updates: Partial<Note>): Promise<void> {
    const note = state.value.notes.find((n) => n.id === id);
    if (!note) return;

    if (shouldSync.value && auth.tenantId && auth.userId) {
      try {
        const remoteNote = await apiClient.updateNote(id, updates);
        upsertNote(remoteNote);
        lastSyncedAt.value = Date.now();
        syncError.value = null;
        return;
      } catch (error) {
        syncError.value =
          error instanceof Error ? error.message : String(error);
      }
    }

    const updatedNote = await noteService.update(note, updates);
    upsertNote(updatedNote);
  }

  /**
   * Remove a note
   */
  async function remove(id: string): Promise<void> {
    if (shouldSync.value && auth.tenantId && auth.userId) {
      try {
        await apiClient.deleteNote(id);
        lastSyncedAt.value = Date.now();
        syncError.value = null;
      } catch (error) {
        syncError.value =
          error instanceof Error ? error.message : String(error);
        return;
      }
    } else {
      await noteService.delete(id);
    }

    deleteFromState(id);
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
    categoryCounts.clear();
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
      data: clone(state.value),
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
          categories: [],
        };
        rebuildCategoryIndex(migratedNotes);
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
  hasRemoteSession,
  shouldSync,
  syncing,
  lastSyncedAt,
  syncError,
  syncFromServer,
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

  function trackCategory(category: string | null | undefined) {
    const key = normalizeCategory(category);
    if (!key) return;

    const nextCount = (categoryCounts.get(key) ?? 0) + 1;
    categoryCounts.set(key, nextCount);

    if (nextCount === 1) {
      state.value.categories = [...state.value.categories, key].sort();
    }
  }

  function trackRemoval(category: string | null | undefined) {
    const key = normalizeCategory(category);
    if (!key) return;

    const current = categoryCounts.get(key);
    if (!current) return;

    if (current === 1) {
      categoryCounts.delete(key);
      state.value.categories = state.value.categories.filter((c) => c !== key);
    } else {
      categoryCounts.set(key, current - 1);
    }
  }

  function reconcileCategories(previous: string | null, next: string | null) {
    if (normalizeCategory(previous) === normalizeCategory(next)) {
      return;
    }

    trackRemoval(previous);
    trackCategory(next);
  }

  function rebuildCategoryIndex(notes: Note[]) {
    categoryCounts.clear();
    state.value.categories = [];
    notes.forEach((note) => {
      trackCategory(note.category ?? null);
    });
  }

  function normalizeCategory(
    category: string | null | undefined
  ): string | null {
    if (!category) return null;
    const trimmed = category.trim();
    return trimmed.length ? trimmed : null;
  }

  function ensureFutureTimestamp(previous: number): number {
    const now = Date.now();
    return now > previous ? now : previous + 1;
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotesStore, import.meta.hot));
}
