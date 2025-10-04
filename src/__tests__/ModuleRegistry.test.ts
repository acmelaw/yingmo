import { describe, it, expect, beforeEach } from "vitest";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import { isTextNote } from "@/types/note";
import type { NoteModule } from "@/types/module";

describe("ModuleRegistry", () => {
  beforeEach(() => {
    moduleRegistry.clear();
  });

  it("should register a module", async () => {
    await moduleRegistry.register(textNoteModule);

    const module = moduleRegistry.getModule("text-note");
    expect(module).toBeDefined();
    expect(module?.name).toBe("Text Notes");
  });

  it("should get modules for a specific type", async () => {
    await moduleRegistry.register(textNoteModule);

    const modules = moduleRegistry.getModulesForType("text");
    expect(modules).toHaveLength(1);
    expect(modules[0].id).toBe("text-note");
  });

  it("should register type handler during module installation", async () => {
    await moduleRegistry.register(textNoteModule);

    const handler = moduleRegistry.getTypeHandler("text");
    expect(handler).toBeDefined();
    expect(handler?.create).toBeDefined();
    expect(handler?.update).toBeDefined();
  });

  it("should unregister a module", async () => {
    await moduleRegistry.register(textNoteModule);
    await moduleRegistry.unregister("text-note");

    const module = moduleRegistry.getModule("text-note");
    expect(module).toBeUndefined();
  });

  it("should get all registered modules", async () => {
    await moduleRegistry.register(textNoteModule);

    const modules = moduleRegistry.getAllModules();
    expect(modules).toHaveLength(1);
  });
});

describe("TextNoteModule", () => {
  beforeEach(() => {
    moduleRegistry.clear();
  });

  it("should create a text note", async () => {
    await moduleRegistry.register(textNoteModule);
    const handler = moduleRegistry.getTypeHandler("text");

    const note = await handler!.create({ text: "Hello World" });

    expect(note.type).toBe("text");
    if (isTextNote(note)) {
      expect(note.text).toBe("Hello World");
    }
    expect(note.id).toBeDefined();
    expect(note.created).toBeDefined();
  });

  it("should update a text note", async () => {
    await moduleRegistry.register(textNoteModule);
    const handler = moduleRegistry.getTypeHandler("text");

    const note = await handler!.create({ text: "Hello World" });
    const updated = await handler!.update(note, { text: "Updated text" });

    if (isTextNote(updated)) {
      expect(updated.text).toBe("Updated text");
    }
    expect(updated.updated).toBeGreaterThan(note.created);
  });

  it("should validate a text note", async () => {
    await moduleRegistry.register(textNoteModule);
    const handler = moduleRegistry.getTypeHandler("text");

    const note = await handler!.create({ text: "Hello World" });
    expect(handler!.validate(note)).toBe(true);

    const invalidNote = { ...note, id: "" };
    expect(handler!.validate(invalidNote as any)).toBe(false);
  });

  it("should serialize and deserialize a text note", async () => {
    await moduleRegistry.register(textNoteModule);
    const handler = moduleRegistry.getTypeHandler("text");

    const note = await handler!.create({ text: "Hello World", tags: ["test"] });
    const serialized = handler!.serialize(note);
    const deserialized = handler!.deserialize(serialized);

    expect(deserialized).toEqual(note);
  });
});
