import { computed } from "vue";
import { useStorage } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";

export interface Note {
  id: string;
  text: string;
  created: number;
}

const STORAGE_KEY = "chatapp.notes";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
}

export const useNotesStore = defineStore("notes", () => {
  const state = useStorage<Note[]>(STORAGE_KEY, []);
  const notes = computed(() => state.value);

  function add(text: string) {
    const payload = text.trim();
    if (!payload) return;
    state.value = [
      ...state.value,
      {
        id: createId(),
        text: payload,
        created: Date.now(),
      },
    ];
  }

  function remove(id: string) {
    state.value = state.value.filter((note) => note.id !== id);
  }

  return { notes, add, remove };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotesStore, import.meta.hot));
}
