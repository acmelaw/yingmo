import { defineStore } from "pinia";

export interface Note {
  id: string;
  text: string;
  created: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useNotesStore = defineStore("notes", {
  state: () => ({
    notes: [] as Note[],
  }),
  actions: {
    add(text: string) {
      this.notes.push({ id: uid(), text, created: Date.now() });
    },
    remove(id: string) {
      this.notes = this.notes.filter((n) => n.id !== id);
    },
  },
});
