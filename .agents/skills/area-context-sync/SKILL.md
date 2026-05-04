---
name: area-context-sync
description: Use when summarizing sessions, updating AREA memory, converting observations into context proposals, indexing code changes, or keeping current project context synchronized across agents.
metadata:
  short-description: Sync AREA context
---

# AREA Context Sync

Start with `context.healthcheck`, `context.get_project_brief`, and `context.get_recent_changes`.

Use `context.write_observation` for evidence-level facts and `context.propose_update` for canonical memory candidates. Preserve rejected, stale, and superseded facts instead of overwriting them. Do not store secrets or unnecessary personal data.
