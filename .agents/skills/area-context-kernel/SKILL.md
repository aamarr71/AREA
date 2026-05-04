---
name: area-context-kernel
description: Use for implementing or repairing the AREA Context Kernel, Context Store, Retrieval Engine, MCP tools, context schemas, and agent interoperability for Codex, Claude Code, and ChatGPT.
metadata:
  short-description: Build AREA shared agent context
---

# AREA Context Kernel

Before planning or coding, retrieve AREA context:

1. Call `context.healthcheck`.
2. Call `context.get_project_brief` with `scope: "repo"`.
3. Call `context.search` with the task wording and relevant namespaces.

If the MCP tools are unavailable, repair or extend `mcp/area-context-server` before non-urgent feature work.

## Working Rules

- Treat the Context Store and MCP tools as the canonical agent context path; `.md` files are bootstrap or documentation only.
- Preserve interoperability for Codex, Claude Code, and ChatGPT by keeping tools structured, explicit, and client-neutral.
- Validate tool inputs strictly and return structured JSON.
- Keep writes auditable with source references, confidence, status, timestamps, and metadata.
- Store uncertain discoveries as proposed observations or proposals, not accepted facts.
- Do not store secrets, raw credentials, tokens, or unnecessary personal data.

## Implementation Preference

- Use the repository-native TypeScript stack.
- Keep the first slice small: schema, `context.healthcheck`, `context.get_project_brief`, `context.search`, `context.fetch`, SessionStart hook, and this skill.
- Add or update tests for every tool behavior you touch.
- After meaningful changes, record an observation with `context.write_observation` and propose stable memory updates when supported.
