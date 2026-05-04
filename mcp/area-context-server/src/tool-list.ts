export const mcpTools = [
  {
    name: "context.healthcheck",
    description:
      "Report availability of the AREA context server, local store, retrieval backend, and write mode.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "context.get_project_brief",
    description: "Return the compact current AREA project brief for session startup.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        scope: { type: "string", enum: ["global", "repo", "feature", "task"], default: "repo" },
        max_tokens: { type: "integer", minimum: 1, maximum: 8000, default: 4000 },
      },
    },
  },
  {
    name: "context.search",
    description: "Retrieve relevant AREA context items with source references.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: {
        query: { type: "string", minLength: 1 },
        namespaces: { type: "array", items: { type: "string" }, default: [] },
        tags: { type: "array", items: { type: "string" }, default: [] },
        status: { type: "array", items: { type: "string" }, default: ["accepted"] },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        include_sources: { type: "boolean", default: true },
      },
    },
  },
  {
    name: "context.fetch",
    description: "Fetch a complete AREA context item by id.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "context.get_recent_changes",
    description: "Return recent accepted changes, pending proposals, and stale context items.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        since: { type: "string", default: "7d" },
        limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
    },
  },
  {
    name: "context.write_observation",
    description: "Record an auditable AREA context observation as a proposed item.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "body", "source_type", "source_ref"],
      properties: {
        namespace: { type: "string", default: "context_events" },
        title: { type: "string", minLength: 1 },
        body: { type: "string", minLength: 1 },
        source_type: { type: "string", minLength: 1 },
        source_ref: { type: "string", minLength: 1 },
        confidence: { type: "number", minimum: 0, maximum: 1, default: 0.5 },
        tags: { type: "array", items: { type: "string" }, default: [] },
        metadata: { type: "object", default: {} },
      },
    },
  },
  {
    name: "context.propose_update",
    description: "Propose a canonical AREA context update with evidence references.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["namespace", "title", "new_value", "reason"],
      properties: {
        namespace: { type: "string" },
        title: { type: "string", minLength: 1 },
        old_value: { type: "string", default: "" },
        new_value: { type: "string", minLength: 1 },
        reason: { type: "string", minLength: 1 },
        evidence_refs: { type: "array", items: { type: "string" }, default: [] },
        confidence: { type: "number", minimum: 0, maximum: 1, default: 0.75 },
        tags: { type: "array", items: { type: "string" }, default: [] },
      },
    },
  },
  {
    name: "context.log_decision",
    description: "Record an accepted AREA architecture, product, workflow, or domain decision.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "decision", "rationale", "impact"],
      properties: {
        title: { type: "string", minLength: 1 },
        decision: { type: "string", minLength: 1 },
        alternatives: { type: "array", items: { type: "string" }, default: [] },
        rationale: { type: "string", minLength: 1 },
        impact: { type: "string", minLength: 1 },
        evidence_refs: { type: "array", items: { type: "string" }, default: [] },
        tags: { type: "array", items: { type: "string" }, default: [] },
      },
    },
  },
  {
    name: "context.get_active_tasks",
    description: "Return active AREA tasks, blockers, and next-action context.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        scope: { type: "string", enum: ["global", "repo", "feature"], default: "repo" },
        include_blocked: { type: "boolean", default: true },
      },
    },
  },
  {
    name: "context.get_area_domain_rules",
    description: "Return AREA domain rules for real-estate workflows and QA topics.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        topic: {
          type: "string",
          enum: [
            "expose-url-analysis",
            "object-review",
            "maklertext",
            "pdf-export",
            "security",
            "testing",
            "general",
          ],
          default: "general",
        },
      },
    },
  },
  {
    name: "context.index_codebase",
    description: "Create proposed code_index context items for selected repository paths.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        paths: { type: "array", items: { type: "string" }, default: [] },
        reason: {
          type: "string",
          enum: ["startup", "manual", "post_change", "scheduled"],
          default: "manual",
        },
        max_files: { type: "integer", minimum: 1, maximum: 500, default: 200 },
      },
    },
  },
  {
    name: "context.update_status",
    description: "Review a context item by changing its status with an auditable reason.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "status", "reason", "source_ref"],
      properties: {
        id: { type: "string", minLength: 1 },
        status: {
          type: "string",
          enum: ["proposed", "accepted", "rejected", "superseded", "stale", "archived"],
        },
        reason: { type: "string", minLength: 1 },
        source_ref: { type: "string", minLength: 1 },
        supersedes_id: { type: "string", minLength: 1 },
      },
    },
  },
] as const;
