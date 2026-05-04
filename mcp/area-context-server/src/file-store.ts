import { appendFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ContextItem, ContextStore, ContextStoreHealth } from "./types.ts";
import { createBootstrapItems } from "./bootstrap.ts";

function uniqueById(items: ContextItem[]): ContextItem[] {
  const byId = new Map<string, ContextItem>();
  for (const item of items) byId.set(item.id, item);
  return Array.from(byId.values());
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export class FileContextStore implements ContextStore {
  constructor(private readonly filePath: string) {}

  static fromRepoRoot(repoRoot: string): FileContextStore {
    return new FileContextStore(
      process.env.AREA_CONTEXT_STORE_PATH ??
        join(repoRoot, "context-store", "local", "context-items.jsonl"),
    );
  }

  async healthcheck(): Promise<ContextStoreHealth> {
    const warnings = [
      "Using local JSONL context store for development; promote accepted records to PostgreSQL when the database-backed store is enabled.",
    ];
    try {
      await this.ensureInitialized();
      await readFile(this.filePath, "utf8");
      return {
        store: "available",
        retrieval: "degraded",
        writeMode: "enabled",
        warnings,
      };
    } catch (error) {
      return {
        store: "unavailable",
        retrieval: "unavailable",
        writeMode: "disabled",
        warnings: [
          ...warnings,
          error instanceof Error ? error.message : "Unknown file store error",
        ],
      };
    }
  }

  async listItems(): Promise<ContextItem[]> {
    await this.ensureInitialized();
    const content = await readFile(this.filePath, "utf8");
    const parsed = content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ContextItem);
    return uniqueById([...createBootstrapItems(), ...parsed]);
  }

  async fetch(id: string): Promise<ContextItem | null> {
    const items = await this.listItems();
    return items.find((item) => item.id === id) ?? null;
  }

  async write(item: ContextItem): Promise<ContextItem> {
    await this.ensureInitialized();
    await appendFile(this.filePath, `${JSON.stringify(item)}\n`);
    return item;
  }

  private async ensureInitialized(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    if (await pathExists(this.filePath)) return;
    const items = createBootstrapItems();
    await writeFile(this.filePath, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`);
  }
}
