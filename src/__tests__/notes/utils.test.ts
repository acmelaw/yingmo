/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from "vitest";
import {
  clone,
  createId,
  ensureFutureTimestamp,
  normalizeCategory,
} from "@/stores/notes/utils";

describe("Utility Functions", () => {
  describe("clone", () => {
    it("should deep clone objects", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = clone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it("should clone arrays", () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = clone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it("should handle primitives", () => {
      expect(clone(42)).toBe(42);
      expect(clone("string")).toBe("string");
      expect(clone(true)).toBe(true);
      expect(clone(null)).toBe(null);
    });

    it("should clone nested structures", () => {
      const original = {
        notes: [
          { id: "1", tags: ["a", "b"] },
          { id: "2", tags: ["c"] },
        ],
      };
      const cloned = clone(original);
      
      cloned.notes[0].tags.push("d");
      expect(original.notes[0].tags).toEqual(["a", "b"]);
      expect(cloned.notes[0].tags).toEqual(["a", "b", "d"]);
    });
  });

  describe("createId", () => {
    it("should generate unique IDs", () => {
      const id1 = createId();
      const id2 = createId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });

    it("should generate valid UUID format if crypto.randomUUID exists", () => {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        const id = createId();
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      }
    });

    it("should generate non-empty strings", () => {
      const id = createId();
      expect(id.length).toBeGreaterThan(0);
    });

    it("should be consistent in format", () => {
      const ids = Array.from({ length: 100 }, () => createId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100); // All unique
    });
  });

  describe("ensureFutureTimestamp", () => {
    it("should return current time if it's greater", () => {
      const past = Date.now() - 1000;
      const result = ensureFutureTimestamp(past);
      expect(result).toBeGreaterThan(past);
    });

    it("should increment timestamp if current time is not greater", () => {
      const now = Date.now();
      const result = ensureFutureTimestamp(now);
      expect(result).toBeGreaterThanOrEqual(now);
    });

    it("should handle future timestamps by incrementing", () => {
      const future = Date.now() + 10000;
      const result = ensureFutureTimestamp(future);
      expect(result).toBe(future + 1);
    });

    it("should ensure monotonically increasing timestamps", () => {
      let timestamp = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const next = ensureFutureTimestamp(timestamp);
        expect(next).toBeGreaterThan(timestamp);
        timestamp = next;
      }
    });
  });

  describe("normalizeCategory", () => {
    it("should trim whitespace", () => {
      expect(normalizeCategory("  test  ")).toBe("test");
    });

    it("should handle null as empty string", () => {
      expect(normalizeCategory(null)).toBe("");
    });

    it("should handle undefined as empty string", () => {
      expect(normalizeCategory(undefined)).toBe("");
    });

    it("should preserve non-whitespace content", () => {
      expect(normalizeCategory("My Category")).toBe("My Category");
    });

    it("should handle empty string", () => {
      expect(normalizeCategory("")).toBe("");
    });

    it("should handle whitespace-only strings", () => {
      expect(normalizeCategory("   ")).toBe("");
    });
  });
});
