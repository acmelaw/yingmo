/**
 * Copy migration files to dist folder after build
 */
import { cp, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "db", "migrations");
const destDir = path.join(__dirname, "..", "dist", "db", "migrations");

async function copyMigrations() {
  try {
    if (!existsSync(srcDir)) {
      console.log("No migrations to copy");
      return;
    }

    // Create destination directory
    await mkdir(destDir, { recursive: true });

    // Copy migrations
    await cp(srcDir, destDir, { recursive: true });

    console.log("✅ Migrations copied to dist/");
  } catch (error) {
    console.error("❌ Failed to copy migrations:", error);
    process.exit(1);
  }
}

copyMigrations();
