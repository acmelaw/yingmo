/**
 * TextNoteEditor Component Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import TextNoteEditor from "@/modules/text/components/TextNoteEditor.vue";
import type { TextNote } from "@/types/note";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

describe("TextNoteEditor", () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const auth = useAuthStore();
    auth.clearSession();

    const settings = useSettingsStore();
    settings.reset();
    settings.syncEnabled = false;
  });

  const createTextNote = (text = "Test note"): TextNote => ({
    id: "test-id",
    type: "text",
    content: text,
    text,
    created: Date.now(),
    updated: Date.now(),
    archived: false,
  });

  describe("rendering", () => {
    it("should render textarea", () => {
      const note = createTextNote();
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      expect(wrapper.find("textarea").exists()).toBe(true);
    });

    it("should display note text", () => {
      const note = createTextNote("Hello World");
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      expect(wrapper.find("textarea").element.value).toBe("Hello World");
    });

    it("should render as readonly when specified", () => {
      const note = createTextNote();
      const wrapper = mount(TextNoteEditor, {
        props: { note, readonly: true },
      });

      expect(wrapper.find("textarea").element.readOnly).toBe(true);
    });

    it("should not be readonly by default", () => {
      const note = createTextNote();
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      expect(wrapper.find("textarea").element.readOnly).toBe(false);
    });
  });

  describe("editing", () => {
    it("should update local text on input", async () => {
      const note = createTextNote();
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      const textarea = wrapper.find("textarea");
      await textarea.setValue("New text");

      expect((textarea.element as HTMLTextAreaElement).value).toBe("New text");
    });

    it("should emit update on blur", async () => {
      const note = createTextNote("Original");
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

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
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      const textarea = wrapper.find("textarea");
      await textarea.trigger("blur");

      expect(wrapper.emitted("update")).toBeFalsy();
    });

    it("should not emit update when readonly", async () => {
      const note = createTextNote();
      const wrapper = mount(TextNoteEditor, {
        props: { note, readonly: true },
      });

      const textarea = wrapper.find("textarea");
      await textarea.setValue("New text");
      await textarea.trigger("blur");

      expect(wrapper.emitted("update")).toBeFalsy();
    });
  });

  describe("reactivity", () => {
    it("should update local text when note prop changes", async () => {
      const note = createTextNote("Original");
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      const updatedNote = createTextNote("Updated from parent");
      await wrapper.setProps({ note: updatedNote });
      await nextTick();

      expect(wrapper.find("textarea").element.value).toBe(
        "Updated from parent"
      );
    });

    it("should watch for note text changes", async () => {
      const note = createTextNote("Original");
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      // Create a new note object with updated text
      const updatedNote = { ...note, text: "Changed" };
      await wrapper.setProps({ note: updatedNote });
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.localText).toBe("Changed");
    });
  });

  describe("placeholder", () => {
    it("should show placeholder for empty note", () => {
      const note = createTextNote("");
      const wrapper = mount(TextNoteEditor, {
        props: { note },
      });

      expect(wrapper.find("textarea").attributes("placeholder")).toBe(
        "Write your note..."
      );
    });
  });
});
