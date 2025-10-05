/**
 * useNotes Composable
 * Collection-level note management
 * Svelte stores + React Query inspired
 */

import { computed, ref, watch, type ComputedRef } from 'vue';
import type { Note, NoteType } from '@/types/note';
import { useNotesStore } from '@/stores/notes';

export interface UseNotesFilters {
  /**
   * Search query
   */
  search?: string;

  /**
   * Filter by tags (AND logic)
   */
  tags?: string[];

  /**
   * Filter by category
   */
  category?: string | null;

  /**
   * Filter by type
   */
  type?: NoteType;

  /**
   * Include archived notes
   */
  includeArchived?: boolean;

  /**
   * Only pinned notes
   */
  onlyPinned?: boolean;

  /**
   * Show only archived notes
   */
  onlyArchived?: boolean;
}

export interface UseNotesSort {
  by: 'created' | 'updated' | 'text';
  order: 'asc' | 'desc';
}

export interface UseNotesOptions {
  /**
   * Initial filters
   */
  filters?: UseNotesFilters;

  /**
   * Initial sort
   */
  sort?: UseNotesSort;

  /**
   * Limit number of notes
   */
  limit?: number;

  /**
   * Enable auto-sync
   */
  autoSync?: boolean;
}

export function useNotes(options: UseNotesOptions = {}) {
  const store = useNotesStore();

  // Reactive filters
  const filters = ref<UseNotesFilters>(options.filters ?? {});
  const sort = ref<UseNotesSort>(options.sort ?? { by: 'updated', order: 'desc' });
  const limit = ref(options.limit);

  /**
   * Filtered and sorted notes
   */
  const notes = computed(() => {
    let result = [...store.notes];

    // Filter: archived
    const includeArchived = filters.value.includeArchived ?? false;
    const onlyArchived = filters.value.onlyArchived ?? false;

    if (onlyArchived) {
      result = result.filter(n => n.archived);
    } else if (!includeArchived) {
      result = result.filter(n => !n.archived);
    }

    // Filter: pinned
    if (filters.value.onlyPinned) {
      result = result.filter(n => n.pinned);
    }

    // Filter: search
    if (filters.value.search) {
      const query = filters.value.search.toLowerCase();
      result = result.filter(n => {
        const content = n.content?.toLowerCase() ?? '';
        const title = n.title?.toLowerCase() ?? '';
        const category = n.category?.toLowerCase() ?? '';
        const tags = n.tags?.map(t => t.toLowerCase()).join(' ') ?? '';

        return (
          content.includes(query) ||
          title.includes(query) ||
          category.includes(query) ||
          tags.includes(query)
        );
      });
    }

    // Filter: tags (AND logic)
    if (filters.value.tags && filters.value.tags.length > 0) {
      result = result.filter(n => {
        const noteTags = new Set(n.tags ?? []);
        return filters.value.tags!.every(tag => noteTags.has(tag));
      });
    }

    // Filter: category
    if (filters.value.category !== undefined) {
      result = result.filter(n => n.category === filters.value.category);
    }

    // Filter: type
    if (filters.value.type) {
      result = result.filter(n => n.type === filters.value.type);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sort.value.by) {
        case 'created':
          aVal = a.created;
          bVal = b.created;
          break;
        case 'updated':
          aVal = a.updated;
          bVal = b.updated;
          break;
        case 'text':
          aVal = a.content?.toLowerCase() ?? '';
          bVal = b.content?.toLowerCase() ?? '';
          break;
        default:
          return 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.value.order === 'asc' ? comparison : -comparison;
    });

    // Limit
    if (limit.value) {
      result = result.slice(0, limit.value);
    }

    return result;
  });

  /**
   * Stats
   */
  const stats = computed(() => ({
    total: store.notes.length,
    active: store.notes.filter(n => !n.archived).length,
    archived: store.notes.filter(n => n.archived).length,
    pinned: store.notes.filter(n => n.pinned).length,
    visible: notes.value.length,
  }));

  /**
   * All unique tags across all notes
   */
  const allTags = computed(() => {
    const tags = new Set<string>();
    store.notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  /**
   * All unique categories
   */
  const allCategories = computed(() => {
    const categories = new Set<string>();
    store.notes.forEach(note => {
      if (note.category) categories.add(note.category);
    });
    return Array.from(categories).sort();
  });

  /**
   * Create a new note
   */
  async function create(
    type: NoteType,
    data: Record<string, unknown>,
    options?: { category?: string; tags?: string[] }
  ): Promise<string> {
    return await store.create(type, data, options?.category, options?.tags);
  }

  /**
   * Bulk delete notes
   */
  async function bulkDelete(noteIds: string[]): Promise<void> {
    await Promise.all(noteIds.map(id => store.remove(id)));
  }

  /**
   * Bulk archive notes
   */
  async function bulkArchive(noteIds: string[]): Promise<void> {
    await Promise.all(noteIds.map(id => store.archive(id)));
  }

  /**
   * Bulk unarchive notes
   */
  async function bulkUnarchive(noteIds: string[]): Promise<void> {
    await Promise.all(noteIds.map(id => store.unarchive(id)));
  }

  /**
   * Clear all filters
   */
  function clearFilters(): void {
    filters.value = {};
  }

  /**
   * Set filter
   */
  function setFilter<K extends keyof UseNotesFilters>(
    key: K,
    value: UseNotesFilters[K]
  ): void {
    filters.value[key] = value;
  }

  /**
   * Set sort
   */
  function setSort(by: UseNotesSort['by'], order: UseNotesSort['order']): void {
    sort.value = { by, order };
  }

  /**
   * Sync with server
   */
  async function sync(): Promise<void> {
    if (store.shouldSync) {
      await store.syncFromServer();
      await store.syncPendingNotes();
    }
  }

  // Auto-sync if enabled
  if (options.autoSync && store.shouldSync) {
    const syncInterval = setInterval(() => {
      sync().catch(console.error);
    }, 30000); // Every 30 seconds

    // Cleanup on unmount (will be handled by component)
    // In a real app, we'd use onUnmounted() but this is a composable
  }

  return {
    // State
    notes,
    stats,
    allTags,
    allCategories,
    filters: computed(() => filters.value),
    sort: computed(() => sort.value),

    // Sync state
    isSyncing: computed(() => store.syncing),
    syncError: computed(() => store.syncError),
    lastSyncedAt: computed(() => store.lastSyncedAt),
    pendingSync: computed(() => store.pendingSync),

    // Actions
    create,
    bulkDelete,
    bulkArchive,
    bulkUnarchive,
    clearFilters,
    setFilter,
    setSort,
    sync,
  };
}
