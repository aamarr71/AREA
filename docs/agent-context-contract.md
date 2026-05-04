# AREA Agent Context Contract

All AREA agents use the same Context Kernel:

- Canonical API: `mcp/area-context-server/src/server.ts`
- Local CLI: `mcp/area-context-server/src/cli.ts`
- Development store: `context-store/local/context-items.jsonl`
- Durable schema target: `context-store/migrations/0001_area_context_store.sql`

## Required Startup Sequence

1. `context.healthcheck`
2. `context.get_project_brief`
3. `context.search` with the task-specific query

## Write Discipline

- `context.write_observation` records evidence-level observations.
- `context.propose_update` records proposed canonical memory changes.
- `context.log_decision` records accepted decisions when project/user confirmation exists.
- `context.update_status` reviews and transitions context items while preserving status history in metadata.

Do not store secrets, raw credentials, tokens, passwords, or unnecessary personal data.

## Client Paths

- Codex uses `.codex/config.toml` and `.codex/hooks.json`.
- Claude Code uses `.claude/settings.json` and hook wrappers in `.claude/hooks`.
- ChatGPT can connect once the same MCP server is exposed through an HTTPS-capable deployment path.

## Store Modes

Default local mode uses `context-store/local/context-items.jsonl`.

Postgres mode:

```sh
AREA_CONTEXT_STORE_DRIVER=postgres \
AREA_CONTEXT_DATABASE_URL=postgres://... \
node --import tsx mcp/area-context-server/src/server.ts
```

Apply `context-store/migrations/0001_area_context_store.sql` before enabling Postgres mode.
