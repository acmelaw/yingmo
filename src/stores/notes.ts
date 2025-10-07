/**
 * Refactored notes store with modular architecture
 */

import { computed, ref, watch } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import type { Note, NoteType, TextNote } from "@/types/note";
import { getNoteContent } from "@/types/note";
import { DefaultNoteService } from "@/services/NoteService";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { apiClient } from "@/services/apiClient";

// Modular utilities
import { createId, ensureFutureTimestamp } from "./notes/utils";
import {
  extractHashtags,
  mergeTags,
  stripHashtags,
  cleanTag,
  extractAllTags,
  filterByTags,
} from "./notes/tags";
import { SyncManager } from "./notes/sync";
import { CategoryManager } from "./notes/categories";
import {
  createStorageRef,
  STORAGE_KEYS,
  CURRENT_VERSION,
} from "./notes/storage";

export interface NotesState {
  notes: Note[];
  categories: string[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  sortBy: "created" | "updated" | "text";
  sortOrder: "asc" | "desc";
  autoExtractTags: boolean;
  cleanContentOnExtract: boolean;
  pendingSync: string[];
}

export const useNotesStore = defineStore("notes", () => {
  // ===========================
  // State Management
  // ===========================

  const version = createStorageRef({
    key: STORAGE_KEYS.VERSION,
    initialValue: CURRENT_VERSION,
  });

  const state = createStorageRef<NotesState>({
    key: STORAGE_KEYS.DATA,
    initialValue: {
      notes: [],
      categories: [],
      searchQuery: "",
      selectedCategory: null,
      selectedTags: [],
      sortBy: "created",
      sortOrder: "desc",
      autoExtractTags: true,
      cleanContentOnExtract: false,
      pendingSync: [],
    },
  });

  // ===========================
  // Dependencies
  // ===========================

  const auth = useAuthStore();
  const settings = useSettingsStore();

  const noteService = new DefaultNoteService({
    get notes() {
      return state.value.notes;
    },
  });

  const categoryManager = new CategoryManager();
  categoryManager.rebuild(state.value.notes);

  const syncManager = new SyncManager({
    apiClient,
    getTenantId: () => auth.tenantId,
    getUserId: () => auth.userId,
    getToken: () => auth.token,
  });

  // Restore pending sync state
  if (state.value.pendingSync) {
    syncManager.setState(state.value.pendingSync);
  }

  // ===========================
  // Reactive State
  // ===========================

  const syncing = ref(false);
  const lastSyncedAt = ref<number | null>(null);
  const syncError = ref<string | null>(null);
  const remoteSearchResults = ref<Note[] | null>(null);
  const searchGeneration = ref(0);

  // ===========================
  // Computed Properties
  // ===========================

  const hasRemoteSession = computed(
    () => Boolean(auth.token) && Boolean(auth.tenantId) && Boolean(auth.userId)
  );

  const shouldSync = computed(
    () => settings.syncEnabled && hasRemoteSession.value
  );

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

  const selectedTags = computed({
    get: () => state.value.selectedTags,
    set: (value: string[]) => {
      state.value.selectedTags = value;
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

  const pendingSync = computed(() => syncManager.getPendingNotes());

  const allTags = computed(() => extractAllTags(state.value.notes));

  const notes = computed(() => state.value.notes);

  const categories = computed(() => categoryManager.getAll());

  const filteredNotes = computed(() => {
    const source = remoteSearchResults.value ?? state.value.notes;
    let result = source.filter((note) => !note.archived);

    // Local search filtering
    if (!remoteSearchResults.value && state.value.searchQuery) {
      const query = state.value.searchQuery.toLowerCase();
      result = result.filter((note) => {
        const content = getNoteContent(note).toLowerCase();
        if (content.includes(query)) return true;
        if (note.category?.toLowerCase().includes(query)) return true;
        if (note.tags?.some((tag) => tag.toLowerCase().includes(query)))
          return true;
        return false;
      });
    }

    // Category filtering
    if (state.value.selectedCategory) {
      result = result.filter(
        (note) => note.category === state.value.selectedCategory
      );
    }

    // Tag filtering (AND logic)
    result = filterByTags(result, state.value.selectedTags);

    // Sorting
    result = result.slice().sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (state.value.sortBy) {
        case "created":
          aVal = a.created;
          bVal = b.created;
          break;
        case "updated":
          aVal = a.updated;
          bVal = b.updated;
          break;
        case "text":
          aVal = getNoteContent(a).toLowerCase();
          bVal = getNoteContent(b).toLowerCase();
          break;
        default:
          return 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return state.value.sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  });

  const archivedNotes = computed(() =>
    state.value.notes.filter((note) => note.archived)
  );

  const totalNotes = computed(() => state.value.notes.length);

  const activeNotes = computed(
    () => totalNotes.value - archivedNotes.value.length
  );

  const getNotesByType = computed(
    () => (type: NoteType) =>
      state.value.notes.filter((note) => note.type === type)
  );

  // ===========================
  // Internal Helpers
  // ===========================

  function upsertNote(note: Note): void {
    const index = state.value.notes.findIndex((n) => n.id === note.id);
    if (index !== -1) {
      const oldNote = state.value.notes[index];
      // Replace entire array element to trigger reactivity
      const newNotes = [...state.value.notes];
      newNotes[index] = note;
      state.value.notes = newNotes;

      if (oldNote.category !== note.category) {
        categoryManager.untrack(oldNote.category);
        categoryManager.track(note.category);
      }
    } else {
      // Direct array mutation for useStorage reactivity
      state.value.notes.push(note);
      categoryManager.track(note.category);
    }
  }

  function deleteFromState(id: string): void {
    const index = state.value.notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      const removed = state.value.notes[index];
      // Direct array mutation for useStorage reactivity
      state.value.notes.splice(index, 1);
      categoryManager.untrack(removed.category ?? null);
    }
  }

  // ===========================
  // Sync Operations
  // ===========================

  async function syncFromServer(): Promise<void> {
    if (!shouldSync.value || syncing.value) return;

    syncing.value = true;
    try {
      const serverNotes = await syncManager.fetchFromServer();

      // Merge server notes with local notes
      serverNotes.forEach((serverNote) => {
        const localNote = state.value.notes.find((n) => n.id === serverNote.id);

        if (!localNote) {
          // New note from server
          upsertNote(serverNote);
        } else if (serverNote.updated > localNote.updated) {
          // Server version is newer
          upsertNote(serverNote);
          syncManager.removeFromPendingQueue(serverNote.id);
        }
      });

      lastSyncedAt.value = Date.now();
      syncError.value = null;
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : String(error);
    } finally {
      syncing.value = false;
    }
  }

  async function syncPendingNotes(): Promise<void> {
    if (!shouldSync.value) return;

    const result = await syncManager.syncPendingNotes(state.value.notes);

    // Update state with sync results
    state.value.pendingSync = syncManager.getPendingNotes();

    if (result.synced > 0) {
      lastSyncedAt.value = Date.now();
    }

    if (result.failed > 0) {
      syncError.value = `Failed to sync ${result.failed} notes`;
    }
  }

  // ===========================
  // CRUD Operations
  // ===========================

  async function create(
    type: NoteType,
    data: Record<string, unknown>,
    category?: string,
    tags?: string[]
  ): Promise<string> {
    // Work on a shallow copy so we don't mutate caller data
    const payloadData: Record<string, unknown> = { ...data };

    // Extract hashtags if enabled
    let finalTags = tags;

    if (type === "text") {
      const initialText =
        typeof payloadData.text === "string"
          ? payloadData.text
          : typeof payloadData.content === "string"
          ? (payloadData.content as string)
          : "";

      if (state.value.autoExtractTags && initialText) {
        finalTags = mergeTags(initialText, tags, true);
      }

      let workingText = initialText;

      if (state.value.autoExtractTags && state.value.cleanContentOnExtract) {
        workingText = stripHashtags(initialText);
      }

      payloadData.text = workingText;
      payloadData.content = workingText;
    }

    const payload: Record<string, unknown> = {
      ...payloadData,
      archived: false,
    };

    if (category !== undefined) {
      payload.category = category;
    }

    if (finalTags !== undefined && finalTags.length > 0) {
      payload.tags = finalTags;
    }

    // Clear any remote overlay so local state is shown immediately
    remoteSearchResults.value = null;

    // Optimistic local create first for instant UI feedback
    const note = await noteService.create(type, payload);
    upsertNote(note);

    // Queue for sync (non-blocking)
    if (settings.syncEnabled) {
      syncManager.addToPendingQueue(note.id);
      state.value.pendingSync = syncManager.getPendingNotes();

      // Kick off a background sync attempt; ignore errors for UI responsiveness
      void (async () => {
        try {
          await syncPendingNotes();
        } catch (e) {
          // swallow - pending queue will retry later
        }
      })();
    }

    return note.id;
  }

  /**
   * Legacy: Add a text note (synchronous wrapper)
   * @deprecated Use create() instead
   */
  function add(
    text: string,
    category?: string,
    tags?: string[]
  ): string | undefined {
    const payload = text.trim();
    if (!payload) return;

    // Auto-extract tags if enabled
    const finalTags = state.value.autoExtractTags
      ? mergeTags(payload, tags, true)
      : tags;

    // Clean content if auto-extract and clean are both enabled
    const finalText =
      state.value.autoExtractTags && state.value.cleanContentOnExtract
        ? stripHashtags(payload)
        : payload;

    const now = Date.now();
    const note: TextNote = {
      id: createId(),
      type: "text",
      content: finalText,
      text: finalText,
      created: now,
      updated: now,
      category,
      tags: finalTags && finalTags.length > 0 ? finalTags : undefined,
      archived: false,
    };

    upsertNote(note);

    // Add to pending sync queue if needed
    if (settings.syncEnabled) {
      syncManager.addToPendingQueue(note.id);
      state.value.pendingSync = syncManager.getPendingNotes();
    }

    return note.id;
  }

  async function update(id: string, updates: Partial<Note>): Promise<void> {
    const note = state.value.notes.find((n) => n.id === id);
    if (!note) return;

    // Try to update on server if online
    if (shouldSync.value) {
      const serverNote = await syncManager.updateOnServer(id, updates);

      if (serverNote) {
        upsertNote(serverNote);
        lastSyncedAt.value = Date.now();
        syncError.value = null;
        syncManager.removeFromPendingQueue(id);
        return;
      }
    }

    // Update locally
    const updatedNote = await noteService.update(note, updates);
    upsertNote(updatedNote);

    // Add to pending sync if needed
    if (settings.syncEnabled) {
      syncManager.addToPendingQueue(id);
      state.value.pendingSync = syncManager.getPendingNotes();
    }
  }

  async function remove(id: string): Promise<void> {
    // Try to delete on server if online
    if (shouldSync.value) {
      const success = await syncManager.deleteOnServer(id);

      if (success) {
        deleteFromState(id);
        syncManager.removeFromPendingQueue(id);
        lastSyncedAt.value = Date.now();
        syncError.value = null;
        return;
      }
    }

    // Delete locally
    await noteService.delete(id);
    deleteFromState(id);
    syncManager.removeFromPendingQueue(id);
    state.value.pendingSync = syncManager.getPendingNotes();
  }

  // Bulk operations
  async function bulkUpdate(ids: string[], updates: Partial<Note>): Promise<void> {
    if (!ids || ids.length === 0) return;
    // Run updates in parallel; update() will handle sync/pending queue logic
    await Promise.all(ids.map((id) => update(id, updates)));
  }

  async function bulkRemove(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    // Run removals in parallel; remove() will handle server/local logic
    await Promise.all(ids.map((id) => remove(id)));
  }

  // ===========================
  // Tag Operations
  // ===========================

  async function addTag(noteId: string, tag: string): Promise<void> {
    const note = state.value.notes.find((n) => n.id === noteId);
    if (!note) return;

    const cleanedTag = cleanTag(tag);
    const currentTags = note.tags || [];

    if (!currentTags.includes(cleanedTag)) {
      await update(noteId, {
        tags: [...currentTags, cleanedTag].sort(),
      });
    }
  }

  async function removeTag(noteId: string, tag: string): Promise<void> {
    const note = state.value.notes.find((n) => n.id === noteId);
    if (!note || !note.tags) return;

    const cleanedTag = cleanTag(tag);
    const updatedTags = note.tags.filter((t) => t !== cleanedTag);

    await update(noteId, {
      tags: updatedTags.length > 0 ? updatedTags : undefined,
    });
  }

  function toggleTag(tag: string): void {
    const cleanedTag = cleanTag(tag);
    const currentTags = state.value.selectedTags;

    if (currentTags.includes(cleanedTag)) {
      state.value.selectedTags = currentTags.filter((t) => t !== cleanedTag);
    } else {
      state.value.selectedTags = [...currentTags, cleanedTag];
    }
  }

  function clearTagFilters(): void {
    state.value.selectedTags = [];
  }

  // ===========================
  // Other Operations
  // ===========================

  async function archive(id: string): Promise<void> {
    await update(id, { archived: true });
  }

  async function unarchive(id: string): Promise<void> {
    await update(id, { archived: false });
  }

  function clearAll(): void {
    state.value.notes = [];
    state.value.selectedCategory = null;
    state.value.selectedTags = [];
    state.value.searchQuery = "";
    categoryManager.clear();
    syncManager.clear();
    state.value.pendingSync = [];
  }

  function exportData() {
    return {
      version: version.value,
      exportDate: Date.now(),
      data: {
        notes: state.value.notes,
        categories: state.value.categories,
        searchQuery: state.value.searchQuery,
        selectedCategory: state.value.selectedCategory,
        sortBy: state.value.sortBy,
        sortOrder: state.value.sortOrder,
      },
    };
  }

  function importData(data: any): boolean {
    try {
      // Validate data structure
      if (!data || typeof data !== "object") {
        return false;
      }

      // Handle both old and new data formats
      let notes: Note[] = [];

      if (data.data?.notes) {
        // New format with nested data
        notes = data.data.notes;
      } else if (data.notes) {
        // Old format with notes at top level
        notes = data.notes;
      } else {
        // No valid notes found
        return false;
      }

      // Migrate old data: ensure all notes have required fields
      const migratedNotes = notes.map((note: any) => {
        const next: any = {
          ...note,
          type: note.type || "text", // Default to text if missing
          archived: note.archived ?? false, // Default to false if missing
        };

        if (next.type === "text") {
          const textValue =
            typeof next.text === "string"
              ? next.text
              : typeof next.content === "string"
              ? next.content
              : "";
          next.text = textValue;
          next.content = textValue;
        }

        return next as Note;
      });

      state.value.notes = migratedNotes;

      // Import other state if available
      if (data.data) {
        if (data.data.categories) state.value.categories = data.data.categories;
        if (data.data.searchQuery !== undefined)
          state.value.searchQuery = data.data.searchQuery;
        if (data.data.selectedCategory !== undefined)
          state.value.selectedCategory = data.data.selectedCategory;
        if (data.data.sortBy) state.value.sortBy = data.data.sortBy;
        if (data.data.sortOrder) state.value.sortOrder = data.data.sortOrder;
      }

      categoryManager.rebuild(state.value.notes);
      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  // ===========================
  // Watchers
  // ===========================

  watch(
    () => ({
      sync: shouldSync.value,
      tenantId: auth.tenantId,
      userId: auth.userId,
    }),
    async ({ sync, tenantId, userId }) => {
      if (!sync || !tenantId || !userId) {
        searchGeneration.value++;
        remoteSearchResults.value = null;
        return;
      }

      await syncFromServer();
      await syncPendingNotes();
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

      const trimmed = query?.trim() || "";
      if (!trimmed) {
        remoteSearchResults.value = null;
        return;
      }

      const currentGeneration = ++searchGeneration.value;

      try {
        const results = await apiClient.searchNotes(
          auth.tenantId!,
          auth.userId!,
          trimmed
        );

        if (currentGeneration === searchGeneration.value) {
          remoteSearchResults.value = results;
        }
      } catch (error) {
        console.error("Search failed:", error);
        if (currentGeneration === searchGeneration.value) {
          remoteSearchResults.value = null;
        }
      }
    }
  );

  // ===========================
  // Public API
  // ===========================

  return {
    // State
    notes,
    categories,
    searchQuery,
    selectedCategory,
    selectedTags,
    sortBy,
    sortOrder,
    autoExtractTags,
    cleanContentOnExtract,
    pendingSync,

    // Computed
    allTags,
    filteredNotes,
    archivedNotes,
    totalNotes,
    activeNotes,
    getNotesByType,

    // Sync state
    hasRemoteSession,
    shouldSync,
    syncing,
    lastSyncedAt,
    syncError,

    // Sync operations
    syncFromServer,
    syncPendingNotes,

    // CRUD
    create,
    add, // Legacy compatibility
    update,
    remove,
    archive,
    unarchive,
    bulkUpdate,
    bulkRemove,

    // Tag operations
    addTag,
    removeTag,
    toggleTag,
    clearTagFilters,

    // Other
    clearAll,
    exportData,
    importData,
    noteService,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotesStore, import.meta.hot));
}
