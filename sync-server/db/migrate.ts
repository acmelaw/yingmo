/**
 * Database migration script
 */

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { migrate as migrateMysql } from "drizzle-orm/mysql2/migrator";
import { db } from "./index";
import path from "path";

const DATABASE_TYPE = process.env.DATABASE_TYPE || "sqlite";

async function runMigrations() {
  console.log("🔄 Running database migrations...");

  const migrationsFolder = path.join(process.cwd(), "db/migrations");

  try {
    switch (DATABASE_TYPE.toLowerCase()) {
      case "postgres":
        await migratePostgres(db as any, { migrationsFolder });
        break;
      case "mysql":
        await migrateMysql(db as any, { migrationsFolder });
        break;
      case "sqlite":
      default:
        await migrate(db as any, { migrationsFolder });
        break;
    }

    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

runMigrations();
