import { FileContextStore } from "./file-store.ts";
import { PostgresContextStore } from "./postgres-store.ts";
import type { ContextStoreWithLifecycle } from "./types.ts";

export function createContextStore(repoRoot: string): ContextStoreWithLifecycle {
  const driver = process.env.AREA_CONTEXT_STORE_DRIVER ?? "file";
  if (driver === "postgres") {
    const databaseUrl = process.env.AREA_CONTEXT_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("AREA_CONTEXT_STORE_DRIVER=postgres requires AREA_CONTEXT_DATABASE_URL or DATABASE_URL.");
    }
    return new PostgresContextStore(databaseUrl);
  }
  return FileContextStore.fromRepoRoot(repoRoot);
}
