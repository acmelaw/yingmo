/**
 * Test utilities and helpers
 */

import type { Note, TextNote, NoteType } from "@/types/note";

export function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTextNote(overrides: Partial<TextNote> = {}): TextNote {
  return {
    id: createId(),
    type: "text",
    text: "Test note",
    created: Date.now(),
    updated: Date.now(),
    archived: false,
    ...overrides,
  };
}

export function createBaseNote(
  type: NoteType,
  overrides: Partial<Note> = {}
): Note {
  return {
    id: createId(),
    type,
    created: Date.now(),
    updated: Date.now(),
    archived: false,
    ...overrides,
  } as Note;
}

/**
 * Wait for next tick and additional timeout
 */
export async function waitFor(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock store helper
 */
export function createMockStore(initialNotes: Note[] = []) {
  const notes: Note[] = [...initialNotes];

  return {
    get notes() {
      return notes;
    },
    set notes(value: Note[]) {
      notes.length = 0;
      notes.push(...value);
    },
    add(note: Note) {
      notes.push(note);
    },
    update(id: string, updates: Partial<Note>) {
      const index = notes.findIndex((n) => n.id === id);
      if (index !== -1) {
        notes[index] = {
          ...notes[index],
          ...updates,
          updated: Date.now(),
        } as Note;
      }
    },
    remove(id: string) {
      const index = notes.findIndex((n) => n.id === id);
      if (index !== -1) {
        notes.splice(index, 1);
      }
    },
    find(id: string) {
      return notes.find((n) => n.id === id);
    },
  };
}

/**
 * Create a spy that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>() {
  const calls: Array<Parameters<T>> = [];

  const spy = (...args: Parameters<T>) => {
    calls.push(args);
  };

  spy.calls = calls;
  spy.callCount = () => calls.length;
  spy.reset = () => {
    calls.length = 0;
  };

  return spy;
}
