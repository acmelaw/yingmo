/**
 * TextNoteEditor Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/composables/useCollaborationDoc", async () => {
  const { ref } = await import("vue");

  class FakeYText {
    private value: string;
    private observers = new Set<(event: unknown) => void>();

    constructor(initial = "") {
      this.value = initial;
    }

    toString(): string {
      return this.value;
    }

    get length(): number {
      return this.value.length;
    }

    insert(index: number, content: string) {
      this.value =
        this.value.slice(0, index) + content + this.value.slice(index);
      this.notify();
    }

    delete(index: number, length: number) {
      this.value =
        this.value.slice(0, index) + this.value.slice(index + length);
      this.notify();
    }

    observe(callback: (event: unknown) => void) {
      this.observers.add(callback);
    }

    unobserve(callback: (event: unknown) => void) {
      this.observers.delete(callback);
    }

    set(value: string) {
      this.value = value;
      this.notify();
    }

    private notify() {
      this.observers.forEach((callback) => callback({}));
    }
  }

  const createDoc = () => {
    const text = new FakeYText();
    const doc = {
      getText: () => text,
      transact: (fn: () => void) => fn(),
    };
    return { doc, text };
  };

  const instances: any[] = [];

  const useCollaborationDocMock = vi.fn(() => {
    let { doc, text } = createDoc();
    const docRef = ref<any>(null);
    const status = ref<"disconnected" | "connecting" | "connected">(
      "disconnected"
    );

    let lastUrl: string | undefined;

    const connect = vi.fn((baseUrl?: string) => {
      lastUrl = baseUrl;
      docRef.value = doc;
      status.value = "connected";
    });

    const disconnect = vi.fn(() => {
      status.value = "disconnected";
      docRef.value = null;
    });

    const dispose = vi.fn(() => {
      status.value = "disconnected";
      docRef.value = null;
    });

    const instance = {
      doc: docRef,
      status,
      connect,
      disconnect,
      dispose,
      __getLastUrl: () => lastUrl,
      __setRemoteValue: (value: string) => {
        text.set(value);
      },
      __getText: () => text,
      __resetDoc: () => {
        const next = createDoc();
        doc = next.doc;
        text = next.text;
        docRef.value = doc;
      },
    };

    instances.push(instance);
    return instance;
  });

  return {
    useCollaborationDoc: useCollaborationDocMock,
    __collaborationInstances: instances,
  };
});

import TextNoteEditor from "@/modules/text/components/TextNoteEditor.vue";
import type { TextNote } from "@/types/note";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
// @ts-expect-error - Mock-only export provided for test assertions
import { __collaborationInstances } from "@/composables/useCollaborationDoc";

type EditorProps = {
  note: TextNote;
  readonly?: boolean;
};

type CollaborationMockInstance = {
  doc: { value: unknown };
  status: { value: string };
  connect: Mock;
  disconnect: Mock;
  dispose: Mock;
  __getLastUrl?: () => string | undefined;
  __setRemoteValue?: (value: string) => void;
};

const mountedWrappers: VueWrapper[] = [];
const collaborationInstances =
  __collaborationInstances as unknown as CollaborationMockInstance[];

function latestCollaborationInstance(): CollaborationMockInstance | null {
  return collaborationInstances[collaborationInstances.length - 1] ?? null;
}

function createTextNote(text = "Test note"): TextNote {
  const timestamp = Date.now();
  return {
    id: "test-id",
    type: "text",
    content: text,
    text,
    created: timestamp,
    updated: timestamp,
    archived: false,
  };
}

function mountEditor(props?: Partial<EditorProps>) {
  const wrapper = mount(TextNoteEditor, {
    props: {
      note: props?.note ?? createTextNote(),
      readonly: props?.readonly ?? false,
    },
  });

  mountedWrappers.push(wrapper);
  return wrapper;
}

function unmountWrapper(wrapper: VueWrapper) {
  const index = mountedWrappers.indexOf(wrapper);
  if (index >= 0) {
    mountedWrappers.splice(index, 1);
  }
  wrapper.unmount();
}

describe("TextNoteEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collaborationInstances.length = 0;

    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    const pinia = createPinia();
    setActivePinia(pinia);

    const auth = useAuthStore();
    auth.clearSession();

    const settings = useSettingsStore();
    settings.reset();
    settings.syncEnabled = false;
  });

  afterEach(() => {
    while (mountedWrappers.length) {
      mountedWrappers.pop()?.unmount();
    }
    vi.useRealTimers();
  });

  function enableCollaborationSession(baseUrl = "https://api.example.com") {
    const auth = useAuthStore();
    auth.state.token = "test-token";
    auth.state.tenantId = "tenant-id";
    auth.state.userId = "user-id";
    auth.state.baseUrl = baseUrl;

    const settings = useSettingsStore();
    settings.syncEnabled = true;
  }

  describe("rendering", () => {
    it("should render textarea", () => {
      const wrapper = mountEditor();
      expect(wrapper.find("textarea").exists()).toBe(true);
    });

    it("should display note text", () => {
      const note = createTextNote("Hello World");
      const wrapper = mountEditor({ note });

      expect(wrapper.find("textarea").element.value).toBe("Hello World");
    });

    it("should render as readonly when specified", () => {
      const note = createTextNote();
      const wrapper = mountEditor({ note, readonly: true });

      expect(wrapper.find("textarea").element.readOnly).toBe(true);
    });

    it("should not be readonly by default", () => {
      const note = createTextNote();
      const wrapper = mountEditor({ note });

      expect(wrapper.find("textarea").element.readOnly).toBe(false);
    });
  });

  describe("editing", () => {
    it("should update local text on input", async () => {
      const note = createTextNote();
      const wrapper = mountEditor({ note });

      const textarea = wrapper.find("textarea");
      await textarea.setValue("New text");

      expect((textarea.element as HTMLTextAreaElement).value).toBe("New text");
    });

    it("should emit update on blur", async () => {
      const note = createTextNote("Original");
      const wrapper = mountEditor({ note });

      const textarea = wrapper.find("textarea");
      await textarea.setValue("Updated text");
      await textarea.trigger("blur");

      expect(wrapper.emitted("update")).toBeTruthy();
      expect(wrapper.emitted("update")?.[0]).toEqual([
        { text: "Updated text", content: "Updated text" },
      ]);
    });

    it("should not emit update if text unchanged", async () => {
      const note = createTextNote("Same text");
      const wrapper = mountEditor({ note });

      const textarea = wrapper.find("textarea");
      await textarea.trigger("blur");

      expect(wrapper.emitted("update")).toBeFalsy();
    });

    it("should not emit update when readonly", async () => {
      const note = createTextNote();
      const wrapper = mountEditor({ note, readonly: true });

      const textarea = wrapper.find("textarea");
      await textarea.setValue("New text");
      await textarea.trigger("blur");

      expect(wrapper.emitted("update")).toBeFalsy();
    });
  });

  describe("reactivity", () => {
    it("should update local text when note prop changes", async () => {
      const note = createTextNote("Original");
      const wrapper = mountEditor({ note });

      const updatedNote = createTextNote("Updated from parent");
      await wrapper.setProps({ note: updatedNote });
      await nextTick();

      expect(wrapper.find("textarea").element.value).toBe(
        "Updated from parent"
      );
    });

    it("should watch for note text changes", async () => {
      const note = createTextNote("Original");
      const wrapper = mountEditor({ note });

      const updatedNote = { ...note, text: "Changed" };
      await wrapper.setProps({ note: updatedNote });
      await nextTick();

      const vm = wrapper.vm as unknown as { localText: string };
      expect(vm.localText).toBe("Changed");
    });
  });

  describe("collaboration", () => {
    it("should not initialize collaboration when sync is disabled", () => {
      mountEditor();

      const instance = latestCollaborationInstance();
      expect(instance).toBeTruthy();
      expect(instance?.connect).not.toHaveBeenCalled();
      expect(instance?.doc.value).toBeNull();
    });

    it("should connect to collaboration service when sync is active", async () => {
      enableCollaborationSession();

      mountEditor();
      await nextTick();

      const instance = latestCollaborationInstance();
      expect(instance).toBeTruthy();
      expect(instance?.connect).toHaveBeenCalledWith("https://api.example.com");
      expect(instance?.status.value).toBe("connected");
      expect(instance?.doc.value).not.toBeNull();
    });

    it("should disconnect when sync is disabled after being active", async () => {
      enableCollaborationSession();

      mountEditor();
      await nextTick();

      const instance = latestCollaborationInstance();
      expect(instance).toBeTruthy();

      const settings = useSettingsStore();
      settings.syncEnabled = false;
      await nextTick();

      expect(instance?.disconnect).toHaveBeenCalledTimes(1);
      expect(instance?.doc.value).toBeNull();
      expect(instance?.status.value).toBe("disconnected");
    });

    it("should not connect when readonly even if sync is enabled", () => {
      enableCollaborationSession();

      mountEditor({ readonly: true });

      const instance = latestCollaborationInstance();
      expect(instance).toBeTruthy();
      expect(instance?.connect).not.toHaveBeenCalled();
    });

    it("should dispose of collaboration resources on unmount", () => {
      enableCollaborationSession();

      const wrapper = mountEditor();
      const instance = latestCollaborationInstance();
      expect(instance).toBeTruthy();

      unmountWrapper(wrapper);

      expect(instance?.dispose).toHaveBeenCalledTimes(1);
      expect(instance?.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("placeholder", () => {
    it("should show placeholder for empty note", () => {
      const note = createTextNote("");
      const wrapper = mountEditor({ note });

      expect(wrapper.find("textarea").attributes("placeholder")).toBe(
        "Write your note..."
      );
    });
  });
});
