/**
 * Utility functions for notes store
 */

import {
  createId as sharedCreateId,
  ensureFutureTimestamp as sharedEnsureFutureTimestamp,
} from "@/lib/utils";

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
 * @deprecated Use the shared utility from @/lib/utils instead
 */
export const createId = sharedCreateId;

/**
 * Ensure timestamp is in the future (for optimistic updates)
 * @deprecated Use the shared utility from @/lib/utils instead
 */
export const ensureFutureTimestamp = sharedEnsureFutureTimestamp;

/**
 * Normalize category name for consistent storage
 */
export function normalizeCategory(category: string | null | undefined): string {
  return category?.trim() || "";
}
