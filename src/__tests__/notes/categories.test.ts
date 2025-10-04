/**
 * Unit tests for CategoryManager
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CategoryManager } from "@/stores/notes/categories";

describe("CategoryManager", () => {
  let manager: CategoryManager;

  beforeEach(() => {
    manager = new CategoryManager();
  });

  describe("rebuild", () => {
    it("should rebuild category index from notes", () => {
      const notes = [
        { category: "work" },
        { category: "personal" },
        { category: "work" },
        { category: null },
        { category: undefined },
      ];

      manager.rebuild(notes);

      const categories = manager.getAll();
      expect(categories).toEqual(["personal", "work"]);
      expect(manager.getCount("work")).toBe(2);
      expect(manager.getCount("personal")).toBe(1);
    });

    it("should clear previous state", () => {
      manager.track("old");
      expect(manager.getAll()).toContain("old");

      manager.rebuild([{ category: "new" }]);
      expect(manager.getAll()).not.toContain("old");
      expect(manager.getAll()).toContain("new");
    });

    it("should handle empty notes", () => {
      manager.rebuild([]);
      expect(manager.getAll()).toEqual([]);
    });
  });

  describe("track", () => {
    it("should add new category", () => {
      manager.track("work");
      expect(manager.getAll()).toContain("work");
      expect(manager.getCount("work")).toBe(1);
    });

    it("should increment count for existing category", () => {
      manager.track("work");
      manager.track("work");
      expect(manager.getCount("work")).toBe(2);
      expect(manager.getAll()).toEqual(["work"]);
    });

    it("should maintain sorted order", () => {
      manager.track("zebra");
      manager.track("apple");
      manager.track("middle");
      expect(manager.getAll()).toEqual(["apple", "middle", "zebra"]);
    });

    it("should ignore null and undefined", () => {
      manager.track(null);
      manager.track(undefined);
      expect(manager.getAll()).toEqual([]);
    });

    it("should ignore empty strings", () => {
      manager.track("");
      manager.track("   ");
      expect(manager.getAll()).toEqual([]);
    });

    it("should trim whitespace", () => {
      manager.track("  work  ");
      expect(manager.getAll()).toContain("work");
      expect(manager.getCount("work")).toBe(1);
    });
  });

  describe("untrack", () => {
    it("should decrement count", () => {
      manager.track("work");
      manager.track("work");
      expect(manager.getCount("work")).toBe(2);

      manager.untrack("work");
      expect(manager.getCount("work")).toBe(1);
      expect(manager.getAll()).toContain("work");
    });

    it("should remove category when count reaches zero", () => {
      manager.track("work");
      manager.untrack("work");

      expect(manager.getAll()).not.toContain("work");
      expect(manager.getCount("work")).toBe(0);
    });

    it("should not go below zero", () => {
      manager.untrack("nonexistent");
      expect(manager.getCount("nonexistent")).toBe(0);
    });

    it("should ignore null and undefined", () => {
      manager.track("work");
      manager.untrack(null);
      manager.untrack(undefined);
      expect(manager.getAll()).toContain("work");
    });

    it("should handle multiple decrements gracefully", () => {
      manager.track("work");
      manager.untrack("work");
      manager.untrack("work");
      manager.untrack("work");

      expect(manager.getCount("work")).toBe(0);
      expect(manager.getAll()).not.toContain("work");
    });
  });

  describe("getAll", () => {
    it("should return sorted array of categories", () => {
      manager.track("c");
      manager.track("a");
      manager.track("b");
      expect(manager.getAll()).toEqual(["a", "b", "c"]);
    });

    it("should return empty array initially", () => {
      expect(manager.getAll()).toEqual([]);
    });

    it("should not include duplicates", () => {
      manager.track("work");
      manager.track("work");
      manager.track("work");
      expect(manager.getAll()).toEqual(["work"]);
    });
  });

  describe("getCount", () => {
    it("should return count for existing category", () => {
      manager.track("work");
      manager.track("work");
      expect(manager.getCount("work")).toBe(2);
    });

    it("should return 0 for non-existent category", () => {
      expect(manager.getCount("nonexistent")).toBe(0);
    });

    it("should handle empty string", () => {
      expect(manager.getCount("")).toBe(0);
    });
  });

  describe("clear", () => {
    it("should remove all categories", () => {
      manager.track("work");
      manager.track("personal");
      manager.track("hobby");

      manager.clear();

      expect(manager.getAll()).toEqual([]);
      expect(manager.getCount("work")).toBe(0);
      expect(manager.getCount("personal")).toBe(0);
    });

    it("should allow tracking after clear", () => {
      manager.track("old");
      manager.clear();
      manager.track("new");

      expect(manager.getAll()).toEqual(["new"]);
      expect(manager.getCount("new")).toBe(1);
    });
  });

  describe("complex scenarios", () => {
    it("should handle interleaved track/untrack operations", () => {
      manager.track("work");
      manager.track("personal");
      manager.track("work");
      manager.untrack("work");
      manager.track("hobby");
      manager.untrack("personal");

      expect(manager.getAll()).toEqual(["hobby", "work"]);
      expect(manager.getCount("work")).toBe(1);
      expect(manager.getCount("hobby")).toBe(1);
      expect(manager.getCount("personal")).toBe(0);
    });

    it("should handle rebuilding with existing state", () => {
      manager.track("old1");
      manager.track("old2");

      const notes = [{ category: "new1" }, { category: "new2" }];
      manager.rebuild(notes);

      expect(manager.getAll()).toEqual(["new1", "new2"]);
      expect(manager.getCount("old1")).toBe(0);
    });
  });
});
