import { z } from "zod";
import { CONTEXT_NAMESPACES, CONTEXT_STATUSES } from "./types.ts";

const namespaceSchema = z.enum(CONTEXT_NAMESPACES);
const statusSchema = z.enum(CONTEXT_STATUSES);

export const healthcheckInputSchema = z.object({}).strict();

export const projectBriefInputSchema = z
  .object({
    scope: z.enum(["global", "repo", "feature", "task"]).default("repo"),
    max_tokens: z.number().int().positive().max(8000).default(4000),
  })
  .strict();

export const searchInputSchema = z
  .object({
    query: z.string().min(1),
    namespaces: z.array(namespaceSchema).default([]),
    tags: z.array(z.string()).default([]),
    status: z.array(statusSchema).default(["accepted"]),
    limit: z.number().int().positive().max(50).default(10),
    include_sources: z.boolean().default(true),
  })
  .strict();

export const fetchInputSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const recentChangesInputSchema = z
  .object({
    since: z.string().default("7d"),
    limit: z.number().int().positive().max(200).default(50),
  })
  .strict();

export const writeObservationInputSchema = z
  .object({
    namespace: namespaceSchema.default("context_events"),
    title: z.string().min(1),
    body: z.string().min(1),
    source_type: z.string().min(1),
    source_ref: z.string().min(1),
    confidence: z.number().min(0).max(1).default(0.5),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

export const proposeUpdateInputSchema = z
  .object({
    namespace: namespaceSchema,
    title: z.string().min(1),
    old_value: z.string().default(""),
    new_value: z.string().min(1),
    reason: z.string().min(1),
    evidence_refs: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).default(0.75),
    tags: z.array(z.string()).default([]),
  })
  .strict();

export const logDecisionInputSchema = z
  .object({
    title: z.string().min(1),
    decision: z.string().min(1),
    alternatives: z.array(z.string()).default([]),
    rationale: z.string().min(1),
    impact: z.string().min(1),
    evidence_refs: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  })
  .strict();

export const activeTasksInputSchema = z
  .object({
    scope: z.enum(["global", "repo", "feature"]).default("repo"),
    include_blocked: z.boolean().default(true),
  })
  .strict();

export const areaDomainRulesInputSchema = z
  .object({
    topic: z
      .enum([
        "expose-url-analysis",
        "object-review",
        "maklertext",
        "pdf-export",
        "security",
        "testing",
        "general",
      ])
      .default("general"),
  })
  .strict();

export const indexCodebaseInputSchema = z
  .object({
    paths: z.array(z.string()).default([]),
    reason: z.enum(["startup", "manual", "post_change", "scheduled"]).default("manual"),
    max_files: z.number().int().positive().max(500).default(200),
  })
  .strict();

export const updateStatusInputSchema = z
  .object({
    id: z.string().min(1),
    status: statusSchema,
    reason: z.string().min(1),
    source_ref: z.string().min(1),
    supersedes_id: z.string().min(1).optional(),
  })
  .strict();

export const toolInputSchemas = {
  "context.healthcheck": healthcheckInputSchema,
  "context.get_project_brief": projectBriefInputSchema,
  "context.search": searchInputSchema,
  "context.fetch": fetchInputSchema,
  "context.get_recent_changes": recentChangesInputSchema,
  "context.write_observation": writeObservationInputSchema,
  "context.propose_update": proposeUpdateInputSchema,
  "context.log_decision": logDecisionInputSchema,
  "context.get_active_tasks": activeTasksInputSchema,
  "context.get_area_domain_rules": areaDomainRulesInputSchema,
  "context.index_codebase": indexCodebaseInputSchema,
  "context.update_status": updateStatusInputSchema,
} as const;

export type ToolName = keyof typeof toolInputSchemas;

export function isToolName(name: string): name is ToolName {
  return name in toolInputSchemas;
}
