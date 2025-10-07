/**
 * useNote Composable
 * React hooks + Svelte stores inspired
 * Fine-grained reactivity for individual notes
 */

import { computed, ref, watch, type Ref } from "vue";
import type { Note } from "@/types/note";
import { useNotesStore } from "@/stores/notes";

export interface UseNoteOptions {
  /**
   * Enable optimistic updates (Solid.js inspired)
   */
  optimistic?: boolean;

  /**
   * Auto-save debounce delay in ms
   */
  autoSaveDelay?: number;

  /**
   * Callback when note is updated
   */
  onUpdate?: (note: Note) => void;

  /**
   * Callback when update fails
   */
  onError?: (error: Error) => void;
}

export function useNote(
  noteId: string | Ref<string>,
  options: UseNoteOptions = {}
) {
  const { optimistic = true, autoSaveDelay = 500, onUpdate, onError } = options;

  const store = useNotesStore();
  const id = ref(noteId);

  // Fine-grained reactive note
  const note = computed(
    () => store.notes.find((n) => n.id === id.value) ?? null
  );

  // Local state for optimistic updates
  const localNote = ref<Note | null>(null);
  const isSaving = ref(false);
  const error = ref<Error | null>(null);

  // Computed: use local if optimistic update pending
  const displayNote = computed(() =>
    optimistic && localNote.value ? localNote.value : note.value
  );

  /**
   * Update note with optimistic UI
   */
  async function update(updates: Partial<Note>): Promise<void> {
    if (!note.value) return;

    error.value = null;

    // Optimistic update
    if (optimistic) {
      localNote.value = { ...note.value, ...updates } as Note;
    }

    isSaving.value = true;

    try {
      await store.update(id.value, updates);
      onUpdate?.(note.value!);
      localNote.value = null; // Clear optimistic state
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      onError?.(error.value);
      // Revert optimistic update on error
      localNote.value = null;
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Delete note
   */
  async function remove(): Promise<void> {
    if (!note.value) return;

    try {
      await store.remove(id.value);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      onError?.(error.value);
      throw error.value;
    }
  }

  /**
   * Archive note
   */
  async function archive(): Promise<void> {
    await update({ archived: true });
  }

  /**
   * Unarchive note
   */
  async function unarchive(): Promise<void> {
    await update({ archived: false });
  }

  /**
   * Toggle pin status
   */
  async function togglePin(): Promise<void> {
    if (!note.value) return;
    await update({ pinned: !note.value.pinned });
  }

  /**
   * Add tag
   */
  async function addTag(tag: string): Promise<void> {
    if (!note.value) return;
    const tags = new Set(note.value.tags ?? []);
    tags.add(tag);
    await update({ tags: Array.from(tags) });
  }

  /**
   * Remove tag
   */
  async function removeTag(tag: string): Promise<void> {
    if (!note.value) return;
    const tags = (note.value.tags ?? []).filter((t) => t !== tag);
    await update({ tags });
  }

  /**
   * Change view mode
   */
  async function setViewAs(viewType: string | undefined): Promise<void> {
    await update({ viewAs: viewType as any });
  }

  return {
    // State
    note: displayNote,
    isSaving,
    error,
    exists: computed(() => note.value !== null),
    isArchived: computed(() => note.value?.archived ?? false),
    isPinned: computed(() => note.value?.pinned ?? false),
    tags: computed(() => note.value?.tags ?? []),

    // Actions
    update,
    remove,
    archive,
    unarchive,
    togglePin,
    addTag,
    removeTag,
    setViewAs,
  };
}
