/**
 * Utility functions for notes store
 */

/**
 * Deep clone a value using structuredClone or JSON fallback
 */
export function clone<T>(value: T): T {
  const structuredCloneFn = (globalThis as any).structuredClone;
  if (typeof structuredCloneFn === "function") {
    try {
      return structuredCloneFn(value);
    } catch {
      // Fall through to JSON clone for values that cannot be structured cloned
    }
  }
  return JSON.parse(JSON.stringify(value));
}

/**
 * Generate a unique ID
 */
export function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Ensure timestamp is in the future (for optimistic updates)
 */
export function ensureFutureTimestamp(previousTimestamp: number): number {
  const now = Date.now();
  return now > previousTimestamp ? now : previousTimestamp + 1;
}

/**
 * Normalize category name for consistent storage
 */
export function normalizeCategory(category: string | null | undefined): string {
  return category?.trim() || "";
}
