import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./connection";
import { logger } from "../middleware/logger";

/**
 * Apply any pending Drizzle migrations against the connected DB.
 * Drizzle keeps a `__drizzle_migrations` table to track applied migrations,
 * so this is safe to run on every server startup.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.join(process.cwd(), "drizzle", "migrations");
  try {
    await migrate(db, { migrationsFolder });
    logger.info({ msg: "db_migrations_applied", folder: migrationsFolder });
  } catch (err: any) {
    logger.error({ msg: "db_migrations_failed", error: err?.message ?? String(err) });
    throw err;
  }
}
