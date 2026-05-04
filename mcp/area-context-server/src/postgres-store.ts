import postgres, { type JSONValue, type Sql } from "postgres";
import type { ContextItem, ContextStore, ContextStoreHealth } from "./types.ts";

function rowToItem(row: Record<string, unknown>): ContextItem {
  return {
    id: String(row.id),
    namespace: row.namespace as ContextItem["namespace"],
    type: String(row.type),
    title: String(row.title),
    body: String(row.body),
    summary: String(row.summary),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    sourceType: String(row.source_type),
    sourceRef: String(row.source_ref),
    sourceUrlOrFile: row.source_url_or_file ? String(row.source_url_or_file) : null,
    confidence: Number(row.confidence),
    status: row.status as ContextItem["status"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    expiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
    supersedesId: row.supersedes_id ? String(row.supersedes_id) : null,
    version: Number(row.version),
    embedding: null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
  };
}

export class PostgresContextStore implements ContextStore {
  private readonly sql: Sql;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, { max: 3 });
  }

  async healthcheck(): Promise<ContextStoreHealth> {
    try {
      const rows = await this.sql<{ exists: boolean }[]>`
        select to_regclass('public.context_items') is not null as exists
      `;
      if (!rows[0]?.exists) {
        return {
          store: "unavailable",
          retrieval: "unavailable",
          writeMode: "disabled",
          warnings: ["Postgres is reachable, but context_items table is missing. Run context-store migrations."],
        };
      }
      return {
        store: "available",
        retrieval: "degraded",
        writeMode: "enabled",
        warnings: ["Postgres context store is active; vector retrieval is not wired yet."],
      };
    } catch (error) {
      return {
        store: "unavailable",
        retrieval: "unavailable",
        writeMode: "disabled",
        warnings: [error instanceof Error ? error.message : "Unknown Postgres context store error"],
      };
    }
  }

  async listItems(): Promise<ContextItem[]> {
    const rows = await this.sql<Record<string, unknown>[]>`
      select id, namespace, type, title, body, summary, tags, source_type, source_ref,
        source_url_or_file, confidence, status, created_at, updated_at, expires_at,
        supersedes_id, version, metadata
      from context_items
      order by updated_at desc
      limit 2000
    `;
    return rows.map(rowToItem);
  }

  async fetch(id: string): Promise<ContextItem | null> {
    const rows = await this.sql<Record<string, unknown>[]>`
      select id, namespace, type, title, body, summary, tags, source_type, source_ref,
        source_url_or_file, confidence, status, created_at, updated_at, expires_at,
        supersedes_id, version, metadata
      from context_items
      where id = ${id}
      limit 1
    `;
    return rows[0] ? rowToItem(rows[0]) : null;
  }

  async write(item: ContextItem): Promise<ContextItem> {
    await this.sql`
      insert into context_items (
        id, namespace, type, title, body, summary, tags, source_type, source_ref,
        source_url_or_file, confidence, status, created_at, updated_at, expires_at,
        supersedes_id, version, metadata
      )
      values (
        ${item.id}, ${item.namespace}, ${item.type}, ${item.title}, ${item.body}, ${item.summary},
        ${item.tags}, ${item.sourceType}, ${item.sourceRef}, ${item.sourceUrlOrFile},
        ${item.confidence}, ${item.status}, ${item.createdAt}, ${item.updatedAt},
        ${item.expiresAt}, ${item.supersedesId}, ${item.version}, ${this.sql.json(item.metadata as JSONValue)}
      )
      on conflict (id) do update set
        namespace = excluded.namespace,
        type = excluded.type,
        title = excluded.title,
        body = excluded.body,
        summary = excluded.summary,
        tags = excluded.tags,
        source_type = excluded.source_type,
        source_ref = excluded.source_ref,
        source_url_or_file = excluded.source_url_or_file,
        confidence = excluded.confidence,
        status = excluded.status,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at,
        supersedes_id = excluded.supersedes_id,
        version = excluded.version,
        metadata = excluded.metadata
    `;
    return item;
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 2 });
  }
}
