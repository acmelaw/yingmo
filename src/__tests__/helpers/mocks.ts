/**
 * Mock factories for testing
 * Provides reusable mock implementations
 */

import type {
  NoteModule,
  NoteTypeHandler,
  ModuleContext,
} from "@/types/module";
import type { Note, NoteType, TextNote } from "@/types/note";

/**
 * Create a mock module for testing
 */
export function createMockModule(
  overrides: Partial<NoteModule> = {}
): NoteModule {
  return {
    id: "mock-module",
    name: "Mock Module",
    version: "1.0.0",
    supportedTypes: ["mock" as NoteType],
    capabilities: {
      canCreate: true,
      canEdit: true,
      canTransform: false,
      canExport: true,
      canImport: true,
      supportsSearch: true,
    },
    ...overrides,
  };
}

/**
 * Create a mock type handler for testing
 */
export function createMockTypeHandler(
  overrides: Partial<NoteTypeHandler> = {}
): NoteTypeHandler {
  const generateId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    async create(data: any): Promise<Note> {
      return {
        id: generateId(),
        type: "mock" as NoteType,
        created: Date.now(),
        updated: Date.now(),
        archived: false,
        ...data,
      } as Note;
    },
    async update(note: Note, updates: Partial<Note>): Promise<Note> {
      return {
        ...note,
        ...updates,
        updated: Date.now(),
      } as Note;
    },
    async delete(note: Note): Promise<void> {
      // Mock delete implementation
    },
    validate(note: Note): boolean {
      return !!note.id && !!note.type && !!note.created;
    },
    serialize(note: Note): string {
      return JSON.stringify(note);
    },
    deserialize(data: string): Note {
      return JSON.parse(data) as Note;
    },
    ...overrides,
  };
}

/**
 * Create a mock module context for testing
 */
export function createMockContext(): ModuleContext {
  const typeHandlers = new Map<NoteType, NoteTypeHandler>();
  const components = new Map<string, any>();
  const actions = new Map<string, any>();
  const transforms = new Map<string, any>();
  const stores = new Map<string, any>();
  const services = new Map<string, any>();

  return {
    registerNoteType: (type, handler) => {
      typeHandlers.set(type, handler);
    },
    registerComponent: (name, component) => {
      components.set(name, component);
    },
    registerAction: (action) => {
      actions.set(action.id, action);
    },
    registerTransform: (transform) => {
      transforms.set(transform.id, transform);
    },
    getStore: (name) => stores.get(name),
    getService: (name) => services.get(name),
  };
}

/**
 * Create a mock note service
 */
export function createMockNoteService() {
  const notes: Note[] = [];

  return {
    async create(type: NoteType, data: any): Promise<Note> {
      const note = await createMockTypeHandler().create({ type, ...data });
      notes.push(note);
      return note;
    },
    async update(note: Note, updates: Partial<Note>): Promise<Note> {
      const updated = await createMockTypeHandler().update(note, updates);
      const index = notes.findIndex((n) => n.id === note.id);
      if (index !== -1) {
        notes[index] = updated;
      }
      return updated;
    },
    async delete(id: string): Promise<void> {
      const index = notes.findIndex((n) => n.id === id);
      if (index !== -1) {
        notes.splice(index, 1);
      }
    },
    async get(id: string): Promise<Note | null> {
      return notes.find((n) => n.id === id) || null;
    },
    async getAll(): Promise<Note[]> {
      return notes;
    },
    async search(query: string): Promise<Note[]> {
      return notes.filter((note: any) => {
        if (note.text && note.text.includes(query)) return true;
        if (note.category && note.category.includes(query)) return true;
        return false;
      });
    },
    validate(note: Note): boolean {
      return createMockTypeHandler().validate(note);
    },
    notes,
  };
}

/**
 * Create a spy function that records calls
 */
export function createSpyFunction<T extends (...args: any[]) => any>() {
  const calls: Array<{ args: Parameters<T>; timestamp: number }> = [];

  const spy = (...args: Parameters<T>) => {
    calls.push({ args, timestamp: Date.now() });
  };

  return {
    spy,
    calls,
    callCount: () => calls.length,
    lastCall: () => calls[calls.length - 1],
    reset: () => {
      calls.length = 0;
    },
    wasCalled: () => calls.length > 0,
    wasCalledWith: (...args: Parameters<T>) => {
      return calls.some((call) => call.args.every((arg, i) => arg === args[i]));
    },
  };
}

/**
 * Create a controllable promise for async testing
 */
export function createControllablePromise<T>() {
  let resolveFn: (value: T) => void;
  let rejectFn: (error: any) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  return {
    promise,
    resolve: (value: T) => resolveFn(value),
    reject: (error: any) => rejectFn(error),
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 10
): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create a batch of test notes
 */
export function createTestNotes(
  count: number,
  overrides: Partial<TextNote> = {}
): TextNote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-note-${i}`,
    type: "text" as const,
    text: `Test note ${i}`,
    created: Date.now() - (count - i) * 1000,
    updated: Date.now() - (count - i) * 1000,
    archived: false,
    ...overrides,
  }));
}
