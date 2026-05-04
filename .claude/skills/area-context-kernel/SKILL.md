---
name: area-context-kernel
description: Use for implementing or repairing the AREA Context Kernel and shared MCP context source.
---

# AREA Context Kernel

Use the same AREA MCP server as Codex: `node --import tsx mcp/area-context-server/src/server.ts`.

Before meaningful work, call `context.healthcheck`, `context.get_project_brief`, and `context.search`. Do not create a Claude-only memory source.
