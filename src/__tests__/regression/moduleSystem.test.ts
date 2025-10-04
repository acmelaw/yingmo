/**
 * Module system regression tests
 * These tests ensure backward compatibility and prevent breaking changes
 */

import { describe, it, expect, beforeEach } from "vitest";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { Note, NoteType } from "@/types/note";

describe("Module System Regression Tests", () => {
  beforeEach(() => {
    moduleRegistry.clear();
  });

  describe("Module Registration", () => {
    it("should maintain module id uniqueness", async () => {
      await moduleRegistry.register(textNoteModule);

      // Try to register the same module again
      await moduleRegistry.register(textNoteModule);

      // Should still only have one instance
      const modules = moduleRegistry.getAllModules();
      expect(modules).toHaveLength(1);
    });

    it("should preserve module properties after registration", async () => {
      await moduleRegistry.register(textNoteModule);

      const registered = moduleRegistry.getModule("text-note");
      expect(registered?.id).toBe(textNoteModule.id);
      expect(registered?.name).toBe(textNoteModule.name);
      expect(registered?.version).toBe(textNoteModule.version);
      expect(registered?.supportedTypes).toEqual(textNoteModule.supportedTypes);
    });

    it("should call install hook exactly once", async () => {
      let installCount = 0;

      const testModule: NoteModule = {
        id: "test-module",
        name: "Test Module",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          installCount++;
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(installCount).toBe(1);
    });

    it("should call uninstall hook on module removal", async () => {
      let uninstallCount = 0;

      const testModule: NoteModule = {
        id: "test-module",
        name: "Test Module",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async uninstall(context) {
          uninstallCount++;
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      await moduleRegistry.unregister("test-module");

      expect(uninstallCount).toBe(1);
    });
  });

  describe("Type Handler Compatibility", () => {
    it("should maintain create signature", async () => {
      await moduleRegistry.register(textNoteModule);
      const handler = moduleRegistry.getTypeHandler("text");

      expect(handler).toBeDefined();
      expect(typeof handler?.create).toBe("function");

      const note = await handler!.create({ text: "Test" });
      expect(note.id).toBeDefined();
      expect(note.type).toBe("text");
      expect(note.created).toBeDefined();
      expect(note.updated).toBeDefined();
    });

    it("should maintain update signature", async () => {
      await moduleRegistry.register(textNoteModule);
      const handler = moduleRegistry.getTypeHandler("text");

      const note = await handler!.create({ text: "Original" });
      const updated = await handler!.update(note, { text: "Updated" } as any);

      expect(updated.id).toBe(note.id);
      expect(updated.type).toBe(note.type);
      expect(updated.updated).toBeGreaterThanOrEqual(note.updated);
    });

    it("should maintain validate signature", async () => {
      await moduleRegistry.register(textNoteModule);
      const handler = moduleRegistry.getTypeHandler("text");

      const note = await handler!.create({ text: "Test" });

      expect(typeof handler?.validate).toBe("function");
      expect(handler!.validate(note)).toBe(true);
    });

    it("should maintain serialize/deserialize signatures", async () => {
      await moduleRegistry.register(textNoteModule);
      const handler = moduleRegistry.getTypeHandler("text");

      const note = await handler!.create({ text: "Test", tags: ["tag1"] });

      expect(typeof handler?.serialize).toBe("function");
      expect(typeof handler?.deserialize).toBe("function");

      const serialized = handler!.serialize!(note);
      expect(typeof serialized).toBe("string");

      const deserialized = handler!.deserialize!(serialized);
      expect(deserialized.id).toBe(note.id);
      expect(deserialized.type).toBe(note.type);
    });

    it("should handle optional delete method", async () => {
      await moduleRegistry.register(textNoteModule);
      const handler = moduleRegistry.getTypeHandler("text");

      const note = await handler!.create({ text: "Test" });

      if (handler?.delete) {
        await expect(handler.delete(note)).resolves.not.toThrow();
      }
    });
  });

  describe("Component Registration", () => {
    it("should register module components with correct keys", async () => {
      await moduleRegistry.register(textNoteModule);

      const editor = moduleRegistry.getComponent("text-note.editor");
      const viewer = moduleRegistry.getComponent("text-note.viewer");

      expect(editor).toBeDefined();
      expect(viewer).toBeDefined();
    });

    it("should handle modules without components", async () => {
      const testModule: NoteModule = {
        id: "no-components",
        name: "No Components",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        capabilities: {
          canCreate: true,
          canEdit: false,
        },
      };

      await expect(moduleRegistry.register(testModule)).resolves.not.toThrow();
    });

    it("should clean up components on unregister", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.unregister("text-note");

      const editor = moduleRegistry.getComponent("text-note.editor");
      const viewer = moduleRegistry.getComponent("text-note.viewer");

      expect(editor).toBeUndefined();
      expect(viewer).toBeUndefined();
    });
  });

  describe("Module Context API", () => {
    it("should provide registerNoteType to modules", async () => {
      let contextReceived: any = null;

      const testModule: NoteModule = {
        id: "context-test",
        name: "Context Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          contextReceived = context;
          expect(typeof context.registerNoteType).toBe("function");
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(contextReceived).not.toBeNull();
    });

    it("should provide registerComponent to modules", async () => {
      let hasRegisterComponent = false;

      const testModule: NoteModule = {
        id: "context-test",
        name: "Context Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          hasRegisterComponent =
            typeof context.registerComponent === "function";
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(hasRegisterComponent).toBe(true);
    });

    it("should provide registerAction to modules", async () => {
      let hasRegisterAction = false;

      const testModule: NoteModule = {
        id: "context-test",
        name: "Context Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          hasRegisterAction = typeof context.registerAction === "function";
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(hasRegisterAction).toBe(true);
    });

    it("should provide registerTransform to modules", async () => {
      let hasRegisterTransform = false;

      const testModule: NoteModule = {
        id: "context-test",
        name: "Context Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          hasRegisterTransform =
            typeof context.registerTransform === "function";
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(hasRegisterTransform).toBe(true);
    });

    it("should provide getStore to modules", async () => {
      let hasGetStore = false;

      const testModule: NoteModule = {
        id: "context-test",
        name: "Context Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          hasGetStore = typeof context.getStore === "function";
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(hasGetStore).toBe(true);
    });

    it("should provide getService to modules", async () => {
      let hasGetService = false;

      const testModule: NoteModule = {
        id: "context-test",
        name: "Context Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install(context) {
          hasGetService = typeof context.getService === "function";
        },
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      expect(hasGetService).toBe(true);
    });
  });

  describe("Backward Compatibility", () => {
    it("should support modules without install hook", async () => {
      const testModule: NoteModule = {
        id: "no-install",
        name: "No Install",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await expect(moduleRegistry.register(testModule)).resolves.not.toThrow();
    });

    it("should support modules without uninstall hook", async () => {
      const testModule: NoteModule = {
        id: "no-uninstall",
        name: "No Uninstall",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await moduleRegistry.register(testModule);
      await expect(
        moduleRegistry.unregister("no-uninstall")
      ).resolves.not.toThrow();
    });

    it("should support minimal module definition", async () => {
      const minimalModule: NoteModule = {
        id: "minimal",
        name: "Minimal",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        capabilities: {
          canCreate: true,
          canEdit: true,
        },
      };

      await expect(
        moduleRegistry.register(minimalModule)
      ).resolves.not.toThrow();

      const registered = moduleRegistry.getModule("minimal");
      expect(registered).toBeDefined();
    });
  });
});
