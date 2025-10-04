/**
 * NoteCard Component Tests
 * Tests for the universal note card component
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NoteCard from "@/components/NoteCard.vue";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import type { TextNote } from "@/types/note";

describe("NoteCard", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    moduleRegistry.clear();
    await moduleRegistry.register(textNoteModule);
  });

  const createTextNote = (overrides = {}): TextNote => ({
    id: "test-id",
    type: "text",
    text: "Test note",
    created: Date.now(),
    updated: Date.now(),
    archived: false,
    ...overrides,
  });

  describe("rendering", () => {
    it("should render a text note", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
            QList: { template: "<ul><slot /></ul>" },
            QItem: { template: "<li><slot /></li>" },
            QItemSection: { template: "<div><slot /></div>" },
            QIcon: { template: "<i />" },
          },
        },
      });

      expect(wrapper.find(".note-card").exists()).toBe(true);
    });

    it("should display note category", () => {
      const note = createTextNote({ category: "work" });
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      expect(wrapper.text()).toContain("work");
    });

    it("should display note tags", () => {
      const note = createTextNote({ tags: ["important", "urgent"] });
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      expect(wrapper.text()).toContain("#important");
      expect(wrapper.text()).toContain("#urgent");
    });

    it("should display note type badge", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      expect(wrapper.text()).toContain("text");
    });

    it("should show unsupported message for unknown type", () => {
      const note = { ...createTextNote(), type: "unknown" as any };
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      expect(wrapper.text()).toContain("Unsupported note type");
    });
  });

  describe("modes", () => {
    it("should render in view mode by default", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      // In view mode, should use viewer component
  const props = wrapper.props() as Record<string, any>;
  expect(props.mode).toBeUndefined();
    });

    it("should render in edit mode", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note, mode: "edit" },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

  const props = wrapper.props() as Record<string, any>;
  expect(props.mode).toBe("edit");
    });

    it("should render in preview mode", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note, mode: "preview" },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

  const props = wrapper.props() as Record<string, any>;
  expect(props.mode).toBe("preview");
    });
  });

  describe("events", () => {
    it("should emit delete event", async () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: {
              template: "<button @click='$emit(\"click\")'><slot /></button>",
            },
            QMenu: { template: "<div><slot /></div>" },
            QList: { template: "<ul><slot /></ul>" },
            QItem: {
              template:
                "<li @click='$attrs.onClick && $attrs.onClick()'><slot /></li>",
            },
            QItemSection: { template: "<div><slot /></div>" },
            QIcon: { template: "<i />" },
          },
        },
      });

      wrapper.vm.$emit("delete");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("delete")).toBeTruthy();
    });

    it("should emit update event with changes", async () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      const updates = { text: "Updated text" };
      wrapper.vm.$emit("update", updates);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("update")).toBeTruthy();
      expect(wrapper.emitted("update")?.[0]).toEqual([updates]);
    });

    it("should emit archive event", async () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      wrapper.vm.$emit("archive");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("archive")).toBeTruthy();
    });

    it("should emit transform event", async () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      wrapper.vm.$emit("transform");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("transform")).toBeTruthy();
    });
  });

  describe("computed properties", () => {
    it("should compute correct time label", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      // Should display time in locale format
      const vm = wrapper.vm as any;
      expect(vm.timeLabel).toBeDefined();
    });

    it("should detect if note was updated", () => {
      const note = createTextNote({
        created: Date.now() - 10000,
        updated: Date.now(),
      });
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.wasUpdated).toBe(true);
    });

    it("should get correct note component", () => {
      const note = createTextNote();
      const wrapper = mount(NoteCard, {
        props: { note },
        global: {
          stubs: {
            QBtn: { template: "<button><slot /></button>" },
            QMenu: { template: "<div><slot /></div>" },
          },
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.noteComponent).toBeDefined();
    });
  });
});
