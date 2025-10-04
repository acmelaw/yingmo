/**
 * Data migration utilities for the notes store
 * Handles version upgrades and schema changes
 */

import type { NotesState } from "./notes";

const MIGRATION_KEY = "vue-notes.migration-status";

export interface MigrationStatus {
  lastMigratedVersion: string;
  migrationsApplied: string[];
  userPrompted: boolean;
}

export function getMigrationStatus(): MigrationStatus {
  const stored = localStorage.getItem(MIGRATION_KEY);
  if (!stored) {
    return {
      lastMigratedVersion: "1.0.0",
      migrationsApplied: [],
      userPrompted: false,
    };
  }
  return JSON.parse(stored);
}

export function setMigrationStatus(status: MigrationStatus) {
  localStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
}

/**
 * Check if migration is needed
 */
export function needsMigration(currentVersion: string): boolean {
  const status = getMigrationStatus();
  return status.lastMigratedVersion !== currentVersion;
}

/**
 * Migrate from v1.0.0 to v2.0.0
 * - Convert selectedTag (string) to selectedTags (array)
 * - Add autoExtractTags field
 * - Add cleanContentOnExtract field
 */
export function migrateV1ToV2(state: any): any {
  console.log("[Migration] Starting v1.0.0 → v2.0.0 migration");

  const migrated = { ...state };

  // Convert selectedTag to selectedTags
  if (typeof migrated.selectedTag !== "undefined") {
    migrated.selectedTags = migrated.selectedTag ? [migrated.selectedTag] : [];
    delete migrated.selectedTag;
    console.log("[Migration] Converted selectedTag to selectedTags");
  }

  // Add missing fields with defaults
  if (!migrated.selectedTags) {
    migrated.selectedTags = [];
  }

  if (typeof migrated.autoExtractTags === "undefined") {
    migrated.autoExtractTags = true;
  }

  if (typeof migrated.cleanContentOnExtract === "undefined") {
    migrated.cleanContentOnExtract = false; // Don't modify existing notes
  }

  console.log("[Migration] v1.0.0 → v2.0.0 migration complete");
  return migrated;
}

/**
 * Run all necessary migrations
 */
export function runMigrations(state: any, targetVersion: string): any {
  const status = getMigrationStatus();
  let migratedState = state;

  // Apply migrations in sequence
  if (!status.migrationsApplied.includes("v1-to-v2")) {
    migratedState = migrateV1ToV2(migratedState);
    status.migrationsApplied.push("v1-to-v2");
  }

  // Update migration status
  status.lastMigratedVersion = targetVersion;
  setMigrationStatus(status);

  return migratedState;
}

/**
 * Prompt user for migration choice
 * Returns: 'migrate' | 'clear' | 'cancel'
 */
export function promptUserMigration(): "migrate" | "clear" | "cancel" {
  const choice = confirm(
    "📦 Data Migration Available!\n\n" +
      "Your notes app has been updated with new features.\n\n" +
      "Options:\n" +
      "• OK = Migrate existing data (recommended)\n" +
      "• Cancel = Keep current data as-is\n\n" +
      "Click OK to migrate your data now."
  );

  if (choice) {
    return "migrate";
  }

  const clearData = confirm(
    "⚠️ Alternative: Start Fresh?\n\n" +
      "Would you like to clear all notes and start fresh?\n" +
      "This cannot be undone!\n\n" +
      "OK = Delete all notes\n" +
      "Cancel = Keep current data"
  );

  return clearData ? "clear" : "cancel";
}

/**
 * Clear all migration data (for fresh start)
 */
export function clearMigrationData() {
  localStorage.removeItem(MIGRATION_KEY);
  console.log("[Migration] Migration data cleared");
}
