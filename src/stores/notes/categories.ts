/**
 * Category management utilities
 */

import { normalizeCategory } from "./utils";

export class CategoryManager {
  private categoryCounts = new Map<string, number>();
  private categories: string[] = [];

  /**
   * Rebuild the category index from scratch
   */
  rebuild(notes: Array<{ category?: string | null }>): void {
    this.categoryCounts.clear();
    this.categories = [];

    notes.forEach((note) => {
      this.track(note.category);
    });
  }

  /**
   * Track a category (increment count)
   */
  track(category: string | null | undefined): void {
    const key = normalizeCategory(category);
    if (!key) return;

    const nextCount = (this.categoryCounts.get(key) ?? 0) + 1;
    this.categoryCounts.set(key, nextCount);

    if (nextCount === 1) {
      this.categories = [...this.categories, key].sort();
    }
  }

  /**
   * Untrack a category (decrement count)
   */
  untrack(category: string | null | undefined): void {
    const key = normalizeCategory(category);
    if (!key) return;

    const currentCount = this.categoryCounts.get(key) ?? 0;
    const nextCount = Math.max(0, currentCount - 1);

    if (nextCount === 0) {
      this.categoryCounts.delete(key);
      this.categories = this.categories.filter((c) => c !== key);
    } else {
      this.categoryCounts.set(key, nextCount);
    }
  }

  /**
   * Get all categories
   */
  getAll(): string[] {
    return this.categories;
  }

  /**
   * Get category count
   */
  getCount(category: string): number {
    return this.categoryCounts.get(normalizeCategory(category)) ?? 0;
  }

  /**
   * Clear all categories
   */
  clear(): void {
    this.categoryCounts.clear();
    this.categories = [];
  }
}
