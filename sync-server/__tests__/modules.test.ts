/**
 * Note Type Module Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { moduleRegistry } from "../services/ModuleRegistry.js";
import { textNoteModule } from "../modules/text.js";
import { richTextNoteModule } from "../modules/rich-text.js";
import { markdownNoteModule } from "../modules/markdown.js";
import { codeNoteModule } from "../modules/code.js";
import type {
  BaseNote,
  TextNote,
  RichTextNote,
  MarkdownNote,
  CodeNote,
} from "../types/note.js";

describe("Note Type Modules", () => {
  beforeEach(() => {
    moduleRegistry.clear();
  });

  describe("Text Note Module", () => {
    beforeEach(async () => {
      await moduleRegistry.register(textNoteModule);
    });

    it("should create a text note", async () => {
      const handler = moduleRegistry.getTypeHandler("text");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "text",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create({ text: "Hello World" }, baseNote);

      expect(note.type).toBe("text");
      expect((note as TextNote).text).toBe("Hello World");
    });

    it("should update a text note", async () => {
      const handler = moduleRegistry.getTypeHandler("text");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "text",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create({ text: "Original" }, baseNote);
      const updated = await handler!.update(note, { text: "Updated" });

      expect((updated as TextNote).text).toBe("Updated");
    });

    it("should validate a text note", async () => {
      const handler = moduleRegistry.getTypeHandler("text");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "text",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create({ text: "Valid" }, baseNote);
      expect(handler!.validate(note)).toBe(true);
    });

    it("should serialize and deserialize", async () => {
      const handler = moduleRegistry.getTypeHandler("text");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "text",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create(
        { text: "Test", editHistory: [] },
        baseNote
      );
      const serialized = handler!.serialize(note);
      const deserialized = handler!.deserialize(serialized, baseNote);

      expect((deserialized as TextNote).text).toBe("Test");
    });
  });

  describe("Rich Text Note Module", () => {
    beforeEach(async () => {
      await moduleRegistry.register(richTextNoteModule);
    });

    it("should create a rich text note", async () => {
      const handler = moduleRegistry.getTypeHandler("rich-text");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "rich-text",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const content = { type: "doc", content: [] };
      const note = await handler!.create({ content }, baseNote);

      expect(note.type).toBe("rich-text");
      expect((note as RichTextNote).content).toEqual(content);
    });

    it("should validate rich text note", async () => {
      const handler = moduleRegistry.getTypeHandler("rich-text");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "rich-text",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create(
        { content: { type: "doc", content: [] } },
        baseNote
      );
      expect(handler!.validate(note)).toBe(true);
    });
  });

  describe("Markdown Note Module", () => {
    beforeEach(async () => {
      await moduleRegistry.register(markdownNoteModule);
    });

    it("should create a markdown note", async () => {
      const handler = moduleRegistry.getTypeHandler("markdown");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "markdown",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create({ markdown: "# Hello" }, baseNote);

      expect(note.type).toBe("markdown");
      expect((note as MarkdownNote).markdown).toBe("# Hello");
    });
  });

  describe("Code Note Module", () => {
    beforeEach(async () => {
      await moduleRegistry.register(codeNoteModule);
    });

    it("should create a code note", async () => {
      const handler = moduleRegistry.getTypeHandler("code");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "code",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create(
        {
          code: 'console.log("test");',
          language: "javascript",
        },
        baseNote
      );

      expect(note.type).toBe("code");
      expect((note as CodeNote).code).toBe('console.log("test");');
      expect((note as CodeNote).language).toBe("javascript");
    });

    it("should default to javascript language", async () => {
      const handler = moduleRegistry.getTypeHandler("code");
      const baseNote: BaseNote = {
        id: "test-1",
        type: "code",
        tenantId: "default",
        userId: "user1",
        created: new Date(),
        updated: new Date(),
      };

      const note = await handler!.create({ code: "test" }, baseNote);

      expect((note as CodeNote).language).toBe("javascript");
    });
  });
});
