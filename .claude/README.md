# AREA Claude Code Compatibility

Claude Code compatibility uses the same AREA MCP server and Context Store as Codex:

```sh
node --import tsx mcp/area-context-server/src/server.ts
```

The shell hooks in `.claude/hooks` delegate to the Codex hook scripts so context retrieval and update behavior stays shared.

Do not create a separate Claude-only AREA memory store.
