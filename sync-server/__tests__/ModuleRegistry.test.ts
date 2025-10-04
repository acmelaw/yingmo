/**
 * Module Registry Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { moduleRegistry } from "../services/ModuleRegistry.js";
import { textNoteModule } from "../modules/text.js";
import { richTextNoteModule } from "../modules/rich-text.js";
import type { NoteModule } from "../types/module.js";
import type { NoteType } from "../types/note.js";

describe("ModuleRegistry", () => {
  beforeEach(() => {
    moduleRegistry.clear();
  });

  describe("Module Registration", () => {
    it("should register a module successfully", async () => {
      await moduleRegistry.register(textNoteModule);

      const module = moduleRegistry.getModule("text-note");
      expect(module).toBeDefined();
      expect(module?.name).toBe("Text Notes");
      expect(module?.version).toBe("1.0.0");
    });

    it("should not register duplicate modules", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.register(textNoteModule);

      const modules = moduleRegistry.getAllModules();
      expect(modules).toHaveLength(1);
    });

    it("should register multiple modules", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.register(richTextNoteModule);

      const modules = moduleRegistry.getAllModules();
      expect(modules).toHaveLength(2);
    });

    it("should call install hook during registration", async () => {
      let installCalled = false;

      const testModule: NoteModule = {
        id: "test-module",
        name: "Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async install() {
          installCalled = true;
        },
      };

      await moduleRegistry.register(testModule);
      expect(installCalled).toBe(true);
    });

    it("should unregister a module", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.unregister("text-note");

      const module = moduleRegistry.getModule("text-note");
      expect(module).toBeUndefined();
    });

    it("should call uninstall hook during unregistration", async () => {
      let uninstallCalled = false;

      const testModule: NoteModule = {
        id: "test-module",
        name: "Test",
        version: "1.0.0",
        supportedTypes: ["test" as NoteType],
        async uninstall() {
          uninstallCalled = true;
        },
      };

      await moduleRegistry.register(testModule);
      await moduleRegistry.unregister("test-module");

      expect(uninstallCalled).toBe(true);
    });
  });

  describe("Type Handlers", () => {
    it("should register type handler", async () => {
      await moduleRegistry.register(textNoteModule);

      const handler = moduleRegistry.getTypeHandler("text");
      expect(handler).toBeDefined();
      expect(handler?.create).toBeDefined();
      expect(handler?.update).toBeDefined();
      expect(handler?.validate).toBeDefined();
    });

    it("should check if type handler exists", async () => {
      await moduleRegistry.register(textNoteModule);

      expect(moduleRegistry.hasTypeHandler("text")).toBe(true);
      expect(moduleRegistry.hasTypeHandler("nonexistent" as NoteType)).toBe(
        false
      );
    });

    it("should get all registered note types", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.register(richTextNoteModule);

      const types = moduleRegistry.getRegisteredNoteTypes();
      expect(types).toContain("text");
      expect(types).toContain("rich-text");
    });
  });

  describe("Module Queries", () => {
    it("should get modules for specific type", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.register(richTextNoteModule);

      const textModules = moduleRegistry.getModulesForType("text");
      expect(textModules).toHaveLength(1);
      expect(textModules[0].id).toBe("text-note");
    });

    it("should get all modules", async () => {
      await moduleRegistry.register(textNoteModule);
      await moduleRegistry.register(richTextNoteModule);

      const modules = moduleRegistry.getAllModules();
      expect(modules).toHaveLength(2);
    });
  });

  describe("Service Registry", () => {
    it("should register and retrieve services", () => {
      const testService = { test: true };
      moduleRegistry.registerService("test", testService);

      const retrieved = moduleRegistry.getService("test");
      expect(retrieved).toBe(testService);
    });
  });
});
