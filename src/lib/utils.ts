/**
 * Utility functions for shadcn-style components with UnoCSS
 */

import { type ClassValue, clsx } from "clsx";

/**
 * Merge classes with clsx - works with UnoCSS
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Generate a unique ID using crypto.randomUUID or fallback
 */
export function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Ensure timestamp is in the future (for optimistic updates)
 * Returns current time if greater than previous, otherwise previous + 1
 */
export function ensureFutureTimestamp(previousTimestamp: number): number {
  const now = Date.now();
  return now > previousTimestamp ? now : previousTimestamp + 1;
}
