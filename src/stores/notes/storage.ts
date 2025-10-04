/**
 * Storage manager for handling persistence
 */

import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import type { Ref } from "vue";
import { clone } from "./utils";

export interface StorageOptions<T> {
  key: string;
  initialValue: T;
  /** Use in-memory storage for tests */
  testMode?: boolean;
}

/**
 * Create a storage ref that uses localStorage in production and in-memory in tests
 */
export function createStorageRef<T>(options: StorageOptions<T>) {
  const { key, initialValue, testMode = import.meta.env.MODE === "test" } = options;

  if (testMode) {
    return ref<T>(clone(initialValue));
  }

  return useStorage<T>(key, initialValue);
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  DATA: "vue-notes.data",
  VERSION: "vue-notes.version",
  SETTINGS: "vue-notes.settings",
  AUTH: "vue-notes.auth",
} as const;

/**
 * Current data version
 */
export const CURRENT_VERSION = "2.0.0";
