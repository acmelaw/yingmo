/**
 * Database connection
 * SQLite-only setup for vue-notes sync server
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema.js";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use absolute path relative to the sync-server directory
const DATABASE_URL = process.env.DATABASE_URL || resolve(__dirname, "../data/vue-notes.db");

/**
 * Create SQLite database connection
 * Automatically creates the directory if it doesn't exist
 */
export function createDatabase() {
  // Ensure the directory exists
  const dbDir = dirname(DATABASE_URL);
  mkdirSync(dbDir, { recursive: true });
  
  const sqlite = new Database(DATABASE_URL);
  sqlite.pragma("journal_mode = WAL");
  return drizzle(sqlite, { schema });
}

export const db = createDatabase();
export { schema };

export type DB = ReturnType<typeof createDatabase>;
