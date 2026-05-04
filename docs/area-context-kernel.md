# AREA Context Kernel

AREA now has an initial local Context Kernel slice:

- `mcp/area-context-server/src/server.ts` exposes a small stdio JSON-RPC/MCP-compatible server.
- `mcp/area-context-server/src/cli.ts` provides a local command path for hooks and smoke tests.
- `context-store/migrations/0001_area_context_store.sql` defines the PostgreSQL-oriented context item schema.
- `context-store/local/context-items.jsonl` is created on first local use as a development store.
- `.codex/hooks/session_start_context.js` loads health and project brief context on `SessionStart`.
- `.agents/skills/area-context-kernel/SKILL.md` defines the first AREA-specific Codex skill.

The local JSONL store is a development bridge so the tools can run before a database-backed store is configured. Phase 3 added a selectable Postgres store implementation. Set `AREA_CONTEXT_STORE_DRIVER=postgres` and `AREA_CONTEXT_DATABASE_URL` or `DATABASE_URL` after applying the context-store migration.

PostgreSQL plus `jsonb` and pgvector remain the intended durable store shape for AREA context. [S-POSTGRES-JSONB] [S-PGVECTOR]

## Implemented Tools

- `context.healthcheck`
- `context.get_project_brief`
- `context.search`
- `context.fetch`
- `context.get_recent_changes`
- `context.write_observation`
- `context.propose_update`
- `context.log_decision`
- `context.get_active_tasks`
- `context.get_area_domain_rules`
- `context.index_codebase`
- `context.update_status`

## Implemented Agent Scaffolding

- Codex MCP config and lifecycle hooks under `.codex/`
- AREA Codex skills under `.agents/skills/`
- Claude Code MCP and hook compatibility under `.claude/`

## Phase 3 Additions

- `mcp/area-context-server/src/postgres-store.ts` implements the Postgres-backed store path.
- `mcp/area-context-server/src/store-factory.ts` selects file or Postgres storage.
- `mcp/area-context-server/src/http-server.ts` exposes local HTTP JSON-RPC at `/mcp`, with `/health` and `/tools` helpers.
- `context.update_status` provides a review workflow for proposed, accepted, rejected, superseded, stale, and archived context items.
- The file store now appends writes and merges bootstrap facts during reads to avoid losing context after concurrent local writes.

Local HTTP smoke:

```sh
pnpm run area:context:http
curl -s http://127.0.0.1:3333/health
```

The local HTTP server is a development endpoint. ChatGPT/App access still needs an HTTPS-capable deployment or tunnel in front of the same MCP server.

## Source Map

Source labels are inherited from `/Users/amar/Downloads/instructions.md`.
