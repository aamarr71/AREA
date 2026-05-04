import type { ContextItem } from "./types.ts";

const now = "2026-05-04T00:00:00.000Z";
const sourceFile = "/Users/amar/Downloads/instructions.md";

export function createBootstrapItems(): ContextItem[] {
  return [
    {
      id: "ctx_bootstrap_area_kernel_mission",
      namespace: "project_facts",
      type: "bootstrap_instruction",
      title: "AREA Context Kernel is the agent infrastructure priority",
      body: "AREA needs a persistent Context Kernel, queryable Context Store, AREA MCP Server, lifecycle hooks, and AREA-specific skills so Codex, Claude Code, and ChatGPT can retrieve and refresh shared project context.",
      summary:
        "Build shared AREA agent context infrastructure: Context Store, MCP tools, hooks, and skills for Codex, Claude Code, and ChatGPT.",
      tags: ["area", "context-kernel", "agent-infrastructure"],
      sourceType: "external_doc",
      sourceRef: "AREA Codex Instructions 2026-05-04 sections 1 and 5",
      sourceUrlOrFile: sourceFile,
      confidence: 0.95,
      status: "accepted",
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      supersedesId: null,
      version: 1,
      embedding: null,
      metadata: { bootstrap: true },
    },
    {
      id: "ctx_bootstrap_smallest_slice",
      namespace: "current_state",
      type: "bootstrap_instruction",
      title: "Build the smallest reliable Context Kernel slice first",
      body: "The first reliable slice is the Context Store schema, context.healthcheck, context.get_project_brief, context.search, context.fetch, Codex SessionStart hook, and one area-context-kernel skill.",
      summary:
        "Initial implementation should prioritize schema, core read tools, SessionStart hook, and the area-context-kernel skill.",
      tags: ["area", "bootstrap", "implementation-order"],
      sourceType: "external_doc",
      sourceRef: "AREA Codex Instructions 2026-05-04 section 16",
      sourceUrlOrFile: sourceFile,
      confidence: 0.95,
      status: "accepted",
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      supersedesId: null,
      version: 1,
      embedding: null,
      metadata: { bootstrap: true },
    },
    {
      id: "ctx_bootstrap_store_contract",
      namespace: "architecture_decisions",
      type: "bootstrap_contract",
      title: "Context items must be structured and source referenced",
      body: "Context items need namespace, type, title, body, summary, tags, source information, confidence, status, timestamps, supersession/version fields, optional embedding, and metadata. Canonical facts should preserve previous versions instead of being overwritten.",
      summary:
        "Context records are structured, auditable, source-referenced, and version-aware.",
      tags: ["area", "context-store", "schema"],
      sourceType: "external_doc",
      sourceRef: "AREA Codex Instructions 2026-05-04 sections 5.3 and 5.4",
      sourceUrlOrFile: sourceFile,
      confidence: 0.95,
      status: "accepted",
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      supersedesId: null,
      version: 1,
      embedding: null,
      metadata: { bootstrap: true },
    },
  ];
}
