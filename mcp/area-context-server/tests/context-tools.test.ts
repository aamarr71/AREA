import type { ContextItem, ContextStore, ContextStoreHealth } from "../src/types.ts";
import { createBootstrapItems } from "../src/bootstrap.ts";
import { callContextTool } from "../src/tools.ts";

class MemoryStore implements ContextStore {
  private items = createBootstrapItems();

  async healthcheck(): Promise<ContextStoreHealth> {
    return { store: "available", retrieval: "degraded", writeMode: "enabled", warnings: [] };
  }

  async listItems(): Promise<ContextItem[]> {
    return this.items;
  }

  async fetch(id: string): Promise<ContextItem | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async write(item: ContextItem): Promise<ContextItem> {
    this.items = [...this.items, item];
    return item;
  }
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

const store = new MemoryStore();

console.log("\nAREA context tools");

{
  const result = (await callContextTool("context.healthcheck", {}, { store })) as any;
  assert(result.ok === true, "healthcheck reports ok");
  assert(result.server === "area-context-server", "healthcheck reports server name");
}

{
  const result = (await callContextTool(
    "context.get_project_brief",
    { scope: "repo", max_tokens: 1000 },
    { store },
  )) as any;
  assert(result.project === "AREA", "project brief names AREA");
  assert(result.source_context_ids.length > 0, "project brief includes source context ids");
  assert(result.summary.includes("AREA analysiert Immobilien-Exposés"), "project brief includes AREA product facts");
  assert(
    result.architecture.some((entry: string) => entry.includes("React/Vite/TypeScript")),
    "project brief includes AREA stack facts",
  );
  assert(
    result.current_priorities.some((entry: string) => entry.includes("Phase 2")),
    "project brief includes AREA phase facts",
  );
}

{
  const result = (await callContextTool(
    "context.search",
    { query: "Context Kernel MCP Server hooks", limit: 5 },
    { store },
  )) as any;
  assert(result.results.length > 0, "search returns relevant bootstrap context");
  assert(result.results[0].source_ref.length > 0, "search results include source refs");
}

{
  const result = (await callContextTool("context.fetch", { id: "ctx_bootstrap_smallest_slice" }, { store })) as any;
  assert(result.item?.id === "ctx_bootstrap_smallest_slice", "fetch returns complete item");
}

{
  const result = (await callContextTool(
    "context.write_observation",
    {
      title: "Test observation",
      body: "The test suite verified that observations are written as proposed context items.",
      source_type: "tool_output",
      source_ref: "mcp/area-context-server/tests/context-tools.test.ts",
      confidence: 0.8,
      tags: ["test"],
    },
    { store },
  )) as any;
  assert(result.status === "proposed", "write_observation records proposed status");
  assert(Boolean(await store.fetch(result.id)), "write_observation stores the item");
}

{
  const result = (await callContextTool(
    "context.propose_update",
    {
      namespace: "current_state",
      title: "Test proposal",
      new_value: "The context tool test can create proposed memory updates.",
      reason: "Tool contract coverage",
      evidence_refs: ["mcp/area-context-server/tests/context-tools.test.ts"],
      confidence: 0.7,
      tags: ["test"],
    },
    { store },
  )) as any;
  assert(result.status === "proposed", "propose_update returns proposed status");
  assert(Boolean(await store.fetch(result.proposal_id)), "propose_update stores proposal");
}

{
  const result = (await callContextTool(
    "context.log_decision",
    {
      title: "Test decision",
      decision: "Decision logging stores accepted architecture context.",
      rationale: "Tool contract coverage",
      impact: "Tests can verify accepted decision records.",
      evidence_refs: ["mcp/area-context-server/tests/context-tools.test.ts"],
      tags: ["test"],
    },
    { store },
  )) as any;
  assert(result.status === "accepted", "log_decision returns accepted status");
  assert(Boolean(await store.fetch(result.decision_id)), "log_decision stores decision");
}

{
  const result = (await callContextTool(
    "context.get_recent_changes",
    { since: "30d", limit: 10 },
    { store },
  )) as any;
  assert(Array.isArray(result.pending_proposals), "recent changes returns pending proposals");
  assert(Array.isArray(result.changes), "recent changes returns accepted changes");
}

{
  const result = (await callContextTool(
    "context.get_active_tasks",
    { scope: "repo", include_blocked: true },
    { store },
  )) as any;
  assert(Array.isArray(result.tasks), "get_active_tasks returns tasks array");
}

{
  const result = (await callContextTool(
    "context.get_area_domain_rules",
    { topic: "general" },
    { store },
  )) as any;
  assert(Array.isArray(result.rules), "get_area_domain_rules returns rules array");
}

{
  const result = (await callContextTool(
    "context.index_codebase",
    { paths: ["mcp/area-context-server/src/types.ts"], reason: "manual", max_files: 1 },
    { store, repoRoot: process.cwd() },
  )) as any;
  assert(result.indexed_files === 1, "index_codebase indexes requested file");
  assert(result.updated_context_ids.length === 1, "index_codebase returns updated context ids");
}

{
  const proposal = (await callContextTool(
    "context.propose_update",
    {
      namespace: "current_state",
      title: "Status workflow proposal",
      new_value: "Status updates can accept proposed context items.",
      reason: "Tool contract coverage",
      evidence_refs: ["mcp/area-context-server/tests/context-tools.test.ts"],
      tags: ["test-status"],
    },
    { store },
  )) as any;
  const result = (await callContextTool(
    "context.update_status",
    {
      id: proposal.proposal_id,
      status: "accepted",
      reason: "Test accepted the proposal.",
      source_ref: "mcp/area-context-server/tests/context-tools.test.ts",
    },
    { store },
  )) as any;
  assert(result.status === "accepted", "update_status changes item status");
  assert(result.version === 2, "update_status increments item version");
}

{
  const result = (await callContextTool(
    "context.session_summary",
    {
      summary: "Implemented a durable session summary tool for AREA context continuity.",
      decisions: ["Session summaries are accepted facts."],
      changes: ["mcp/area-context-server/src/tools.ts"],
      open_items: ["Wire summaries into production Postgres."],
      next_session_needs: "Load session summaries at startup before planning.",
      tags: ["test-summary"],
    },
    { store },
  )) as any;
  const item = (await store.fetch(result.id)) as ContextItem;
  assert(result.status === "accepted", "session_summary returns accepted status");
  assert(item.status === "accepted", "session_summary stores accepted item");
  assert(item.tags.includes("session-summary"), "session_summary stores session-summary tag");
}

{
  for (const index of [1, 2, 3]) {
    await callContextTool(
      "context.session_summary",
      {
        summary: `Session summary search fixture number ${index} with enough detail.`,
        decisions: [`Decision ${index}`],
        changes: [`Change ${index}`],
        open_items: [`Open item ${index}`],
        next_session_needs: `Next session needs fixture ${index}.`,
        tags: ["search-fixture"],
      },
      { store },
    );
  }
  const result = (await callContextTool(
    "context.search",
    {
      query: "session-summary",
      tags: ["session-summary"],
      status: ["accepted"],
      limit: 10,
    },
    { store },
  )) as any;
  const fixtureResults = result.results.filter((item: any) => item.tags.includes("search-fixture"));
  assert(fixtureResults.length >= 3, "session summary search returns written summaries");
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
