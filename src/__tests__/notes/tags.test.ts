/**
 * Unit tests for tag utilities
 */

import { describe, it, expect } from "vitest";
import {
  extractHashtags,
  mergeTags,
  stripHashtags,
  cleanTag,
  extractAllTags,
  filterByTags,
} from "@/stores/notes/tags";

describe("Tag Utilities", () => {
  describe("extractHashtags", () => {
    it("should extract basic hashtags", () => {
      const text = "This is a note with #test and #important tags";
      expect(extractHashtags(text)).toEqual(["test", "important"]);
    });

    it("should support Unicode hashtags", () => {
      const text = "Testing #café #日本語 #hello_world #test123";
      expect(extractHashtags(text)).toEqual([
        "café",
        "日本語",
        "hello_world",
        "test123",
      ]);
    });

    it("should handle case-insensitive deduplication", () => {
      const text = "Testing #Test #TEST #test";
      const tags = extractHashtags(text);
      expect(tags.length).toBe(1);
      expect(tags[0]?.toLowerCase()).toBe("test");
    });

    it("should return empty array for no hashtags", () => {
      expect(extractHashtags("No hashtags here")).toEqual([]);
    });

    it("should not extract # followed by space", () => {
      expect(extractHashtags("# not a tag")).toEqual([]);
    });

    it("should handle multiple hashtags in sequence", () => {
      expect(extractHashtags("#one#two#three")).toEqual([
        "one",
        "two",
        "three",
      ]);
    });
  });

  describe("mergeTags", () => {
    it("should merge extracted and explicit tags", () => {
      const text = "Note with #extracted tag";
      const explicit = ["explicit", "manual"];
      const result = mergeTags(text, explicit, true);

      expect(result).toContain("extracted");
      expect(result).toContain("explicit");
      expect(result).toContain("manual");
      expect(result).toEqual(result.slice().sort()); // Should be sorted
    });

    it("should deduplicate merged tags", () => {
      const text = "Note with #tag1 and #tag2";
      const explicit = ["tag1", "tag3"];
      const result = mergeTags(text, explicit, true);

      expect(result).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should skip extraction when autoExtract is false", () => {
      const text = "Note with #ignored tag";
      const explicit = ["explicit"];
      const result = mergeTags(text, explicit, false);

      expect(result).not.toContain("ignored");
      expect(result).toContain("explicit");
    });

    it("should handle undefined explicit tags", () => {
      const text = "Note with #tag";
      const result = mergeTags(text, undefined, true);

      expect(result).toEqual(["tag"]);
    });

    it("should handle empty text and no explicit tags", () => {
      expect(mergeTags("", undefined, true)).toEqual([]);
    });
  });

  describe("stripHashtags", () => {
    it("should remove hashtags from text", () => {
      const text = "This is a note with #test and #important tags";
      expect(stripHashtags(text)).toBe("This is a note with and tags");
    });

    it("should normalize whitespace", () => {
      const text = "Multiple   #spaces   between    #words";
      expect(stripHashtags(text)).toBe("Multiple between");
    });

    it("should handle Unicode hashtags", () => {
      const text = "Text with #café and #日本語";
      expect(stripHashtags(text)).toBe("Text with and");
    });

    it("should trim result", () => {
      const text = "  #start and #end  ";
      expect(stripHashtags(text)).toBe("and");
    });
  });

  describe("cleanTag", () => {
    it("should remove # prefix", () => {
      expect(cleanTag("#tag")).toBe("tag");
    });

    it("should convert to lowercase", () => {
      expect(cleanTag("#TAG")).toBe("tag");
      expect(cleanTag("TAG")).toBe("tag");
    });

    it("should handle tag without #", () => {
      expect(cleanTag("tag")).toBe("tag");
    });
  });

  describe("extractAllTags", () => {
    it("should extract all unique tags from notes", () => {
      const notes = [
        { tags: ["tag1", "tag2"] },
        { tags: ["tag2", "tag3"] },
        { tags: ["tag1", "tag3"] },
      ];

      const result = extractAllTags(notes);
      expect(result).toEqual(["tag1", "tag2", "tag3"]);
      expect(result).toEqual(result.slice().sort());
    });

    it("should handle notes without tags", () => {
      const notes = [{ tags: ["tag1"] }, {}, { tags: undefined }];

      expect(extractAllTags(notes)).toEqual(["tag1"]);
    });

    it("should return empty array for empty notes", () => {
      expect(extractAllTags([])).toEqual([]);
    });
  });

  describe("filterByTags", () => {
    const notes = [
      { id: "1", tags: ["tag1", "tag2"] },
      { id: "2", tags: ["tag1"] },
      { id: "3", tags: ["tag2"] },
      { id: "4", tags: ["tag1", "tag2", "tag3"] },
      { id: "5", tags: undefined },
    ];

    it("should filter notes with AND logic", () => {
      const result = filterByTags(notes, ["tag1", "tag2"]);
      expect(result.length).toBe(2);
      expect(result.map((n) => n.id)).toEqual(["1", "4"]);
    });

    it("should return all notes when no tags selected", () => {
      const result = filterByTags(notes, []);
      expect(result.length).toBe(5);
    });

    it("should filter by single tag", () => {
      const result = filterByTags(notes, ["tag1"]);
      expect(result.length).toBe(3);
      expect(result.map((n) => n.id)).toEqual(["1", "2", "4"]);
    });

    it("should return empty array when no matches", () => {
      const result = filterByTags(notes, ["nonexistent"]);
      expect(result.length).toBe(0);
    });

    it("should exclude notes without tags", () => {
      const result = filterByTags(notes, ["tag1"]);
      expect(result.find((n) => n.id === "5")).toBeUndefined();
    });
  });
});
