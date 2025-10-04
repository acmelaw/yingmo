/**
 * Database connection and initialization
 * Supports SQLite, PostgreSQL, and MySQL
 */

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import Database from "better-sqlite3";
import postgres from "postgres";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const DATABASE_TYPE = process.env.DATABASE_TYPE || "sqlite";
const DATABASE_URL = process.env.DATABASE_URL || "data/vue-notes.db";

export type DatabaseType = "sqlite" | "postgres" | "mysql";

/**
 * Create database connection based on type
 */
export function createDatabase() {
  const dbType = DATABASE_TYPE.toLowerCase() as DatabaseType;

  switch (dbType) {
    case "postgres": {
      const connection = postgres(DATABASE_URL);
      return drizzlePostgres(connection, { schema });
    }

    case "mysql": {
      const connection = mysql.createPool(DATABASE_URL);
      return drizzleMysql(connection, { schema, mode: "default" });
    }

    case "sqlite":
    default: {
      const sqlite = new Database(DATABASE_URL);
      sqlite.pragma("journal_mode = WAL");
      return drizzleSqlite(sqlite, { schema });
    }
  }
}

export const db = createDatabase();
export { schema };

export type DB = ReturnType<typeof createDatabase>;
