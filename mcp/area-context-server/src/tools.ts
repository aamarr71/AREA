import { randomUUID } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type {
  ContextItem,
  ContextNamespace,
  ContextSearchResult,
  ContextStatus,
  ContextStore,
  ContextToolRuntime,
} from "./types.ts";
import { toolInputSchemas, type ToolName } from "./validation.ts";

type ToolContext = {
  store: ContextStore;
} & ContextToolRuntime;

const SECRET_PATTERNS = [
  /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["']?[a-z0-9._~+/=-]{8,}/i,
  /\bauthorization\b\s*[:=]\s*["']?bearer\s+[a-z0-9._~+/=-]{12,}/i,
  /\bbearer\s+[a-z0-9._~+/=-]{12,}/i,
];

function summarize(text: string, max = 280): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= max ? compact : `${compact.slice(0, max - 1).trim()}…`;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9äöüß_-]+/i)
    .filter((token) => token.length > 1);
}

function scoreItem(item: ContextItem, query: string): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;
  const haystack = tokenize(
    [item.title, item.summary, item.body, item.namespace, item.type, ...item.tags].join(" "),
  );
  const haystackSet = new Set(haystack);
  const matches = queryTokens.filter((token) => haystackSet.has(token)).length;
  const partialMatches = queryTokens.filter((token) =>
    haystack.some((candidate) => candidate.includes(token) || token.includes(candidate)),
  ).length;
  return Number(Math.min(1, (matches + partialMatches * 0.35) / queryTokens.length).toFixed(4));
}

function toSearchResult(item: ContextItem, query: string): ContextSearchResult {
  return {
    id: item.id,
    namespace: item.namespace,
    type: item.type,
    title: item.title,
    summary: item.summary,
    body_excerpt: summarize(item.body, 360),
    score: scoreItem(item, query),
    confidence: item.confidence,
    status: item.status,
    tags: item.tags,
    source_ref: item.sourceRef,
    updated_at: item.updatedAt,
  };
}

function createContextItem(input: {
  namespace: ContextNamespace;
  type: string;
  title: string;
  body: string;
  tags?: string[];
  sourceType: string;
  sourceRef: string;
  sourceUrlOrFile?: string | null;
  confidence?: number;
  status?: ContextStatus;
  metadata?: Record<string, unknown>;
}): ContextItem {
  const now = new Date().toISOString();
  return {
    id: `ctx_${randomUUID()}`,
    namespace: input.namespace,
    type: input.type,
    title: input.title,
    body: input.body,
    summary: summarize(input.body),
    tags: input.tags ?? [],
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    sourceUrlOrFile: input.sourceUrlOrFile ?? null,
    confidence: input.confidence ?? 0.5,
    status: input.status ?? "proposed",
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    supersedesId: null,
    version: 1,
    embedding: null,
    metadata: input.metadata ?? {},
  };
}

function cutoffFromSince(since: string): number {
  const parsed = Date.parse(since);
  if (!Number.isNaN(parsed)) return parsed;
  const match = /^(\d+)\s*([hdw])$/.exec(since.trim());
  if (!match) return Date.now() - 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const hours = unit === "h" ? amount : unit === "d" ? amount * 24 : amount * 24 * 7;
  return Date.now() - hours * 60 * 60 * 1000;
}

function includesSensitiveText(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

function bulletList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- none";
}

async function collectFiles(repoRoot: string, requestedPaths: string[], maxFiles: number): Promise<string[]> {
  const defaults = ["mcp/area-context-server/src", ".codex/hooks", ".agents/skills"];
  const queue = (requestedPaths.length > 0 ? requestedPaths : defaults).map((path) =>
    resolve(repoRoot, path),
  );
  const files: string[] = [];
  while (queue.length > 0 && files.length < maxFiles) {
    const next = queue.shift();
    if (!next || !next.startsWith(repoRoot)) continue;
    const rel = relative(repoRoot, next);
    if (
      rel.startsWith("node_modules/") ||
      rel.startsWith(".git/") ||
      rel.startsWith("dist/") ||
      rel.startsWith("context-store/local/") ||
      rel.endsWith(".local.json")
    ) {
      continue;
    }
    const info = await stat(next).catch(() => null);
    if (!info) continue;
    if (info.isDirectory()) {
      const entries = await readdir(next);
      for (const entry of entries) queue.push(join(next, entry));
      continue;
    }
    if (info.isFile() && /\.(ts|tsx|js|json|md|toml|sql)$/.test(next)) files.push(next);
  }
  return files;
}

export async function callContextTool(
  name: ToolName,
  input: unknown,
  context: ToolContext,
): Promise<unknown> {
  const args = toolInputSchemas[name].parse(input ?? {});

  switch (name) {
    case "context.healthcheck": {
      const health = await context.store.healthcheck();
      return {
        ok: health.store !== "unavailable",
        server: "area-context-server",
        store: health.store,
        retrieval: health.retrieval,
        write_mode: health.writeMode,
        warnings: health.warnings,
      };
    }

    case "context.get_project_brief": {
      const items = await context.store.listItems();
      const accepted = items.filter((item) => item.status === "accepted");
      const sourceIds = accepted.slice(0, 12).map((item) => item.id);
      const projectFactSummaries = accepted
        .filter((item) => item.namespace === "project_facts")
        .slice(0, 3)
        .map((item) => item.summary);
      return {
        project: "AREA",
        summary:
          projectFactSummaries.join(" ") ||
          "AREA project context is available, but no accepted project brief has been stored yet.",
        current_priorities: accepted
          .filter((item) => item.namespace === "current_state" && item.type !== "session_summary")
          .slice(0, 5)
          .map((item) => item.summary),
        architecture: accepted
          .filter((item) => item.namespace === "architecture_decisions")
          .slice(0, 5)
          .map((item) => item.summary),
        domain_rules: accepted
          .filter((item) => item.namespace === "domain_rules")
          .slice(0, 5)
          .map((item) => item.summary),
        active_tasks: accepted
          .filter((item) => item.tags.includes("active-task"))
          .slice(0, 5)
          .map((item) => item.summary),
        open_questions: accepted
          .filter((item) => item.tags.includes("open-question"))
          .slice(0, 5)
          .map((item) => item.summary),
        source_context_ids: sourceIds,
      };
    }

    case "context.search": {
      const searchArgs = args as {
        query: string;
        namespaces: ContextNamespace[];
        tags: string[];
        status: ContextStatus[];
        limit: number;
      };
      const items = await context.store.listItems();
      const results = items
        .filter((item) =>
          searchArgs.namespaces.length === 0 ? true : searchArgs.namespaces.includes(item.namespace),
        )
        .filter((item) => searchArgs.status.includes(item.status))
        .filter((item) =>
          searchArgs.tags.length === 0
            ? true
            : searchArgs.tags.every((tag) => item.tags.includes(tag)),
        )
        .map((item) => toSearchResult(item, searchArgs.query))
        .filter((item) => item.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.confidence - a.confidence ||
            Date.parse(b.updated_at) - Date.parse(a.updated_at),
        )
        .slice(0, searchArgs.limit);
      return { query: searchArgs.query, results };
    }

    case "context.fetch": {
      const fetchArgs = args as { id: string };
      const item = await context.store.fetch(fetchArgs.id);
      return {
        item: item
          ? {
              id: item.id,
              namespace: item.namespace,
              title: item.title,
              body: item.body,
              metadata: item.metadata,
              source_ref: item.sourceRef,
              created_at: item.createdAt,
              updated_at: item.updatedAt,
            }
          : null,
      };
    }

    case "context.get_recent_changes": {
      const recentArgs = args as { since: string; limit: number };
      const cutoff = cutoffFromSince(recentArgs.since);
      const items = (await context.store.listItems())
        .filter((item) => Date.parse(item.updatedAt) >= cutoff || Date.parse(item.createdAt) >= cutoff)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, recentArgs.limit);
      return {
        changes: items
          .filter((item) => item.status === "accepted")
          .map((item) => toSearchResult(item, item.title)),
        pending_proposals: items
          .filter((item) => item.status === "proposed")
          .map((item) => toSearchResult(item, item.title)),
        stale_items: items
          .filter((item) => item.status === "stale")
          .map((item) => toSearchResult(item, item.title)),
      };
    }

    case "context.write_observation": {
      const observationArgs = args as {
        namespace: ContextNamespace;
        title: string;
        body: string;
        source_type: string;
        source_ref: string;
        confidence: number;
        tags: string[];
        metadata: Record<string, unknown>;
      };
      if (includesSensitiveText(`${observationArgs.title}\n${observationArgs.body}`)) {
        throw new Error("Observation may contain sensitive secret-like material; redact it first.");
      }
      const item = createContextItem({
        namespace: observationArgs.namespace,
        type: "observation",
        title: observationArgs.title,
        body: observationArgs.body,
        tags: observationArgs.tags,
        sourceType: observationArgs.source_type,
        sourceRef: observationArgs.source_ref,
        confidence: observationArgs.confidence,
        status: "proposed",
        metadata: observationArgs.metadata,
      });
      const written = await context.store.write(item);
      return { id: written.id, status: written.status };
    }

    case "context.propose_update": {
      const updateArgs = args as {
        namespace: ContextNamespace;
        title: string;
        old_value: string;
        new_value: string;
        reason: string;
        evidence_refs: string[];
        confidence: number;
        tags: string[];
      };
      if (includesSensitiveText(`${updateArgs.title}\n${updateArgs.new_value}`)) {
        throw new Error("Proposed update may contain sensitive secret-like material; redact it first.");
      }
      const body = [
        updateArgs.old_value ? `Old value: ${updateArgs.old_value}` : "Old value: not recorded",
        `New value: ${updateArgs.new_value}`,
        `Reason: ${updateArgs.reason}`,
        `Evidence: ${updateArgs.evidence_refs.join(", ") || "not provided"}`,
      ].join("\n\n");
      const item = createContextItem({
        namespace: updateArgs.namespace,
        type: "memory_update_proposal",
        title: updateArgs.title,
        body,
        tags: Array.from(new Set(["memory-proposal", ...updateArgs.tags])),
        sourceType: "context_tool",
        sourceRef: updateArgs.evidence_refs.join(", ") || "context.propose_update",
        confidence: updateArgs.confidence,
        status: "proposed",
        metadata: {
          old_value: updateArgs.old_value,
          new_value: updateArgs.new_value,
          reason: updateArgs.reason,
          evidence_refs: updateArgs.evidence_refs,
        },
      });
      const written = await context.store.write(item);
      return { proposal_id: written.id, status: written.status };
    }

    case "context.log_decision": {
      const decisionArgs = args as {
        title: string;
        decision: string;
        alternatives: string[];
        rationale: string;
        impact: string;
        evidence_refs: string[];
        tags: string[];
      };
      const body = [
        `Decision: ${decisionArgs.decision}`,
        `Alternatives: ${decisionArgs.alternatives.join("; ") || "none recorded"}`,
        `Rationale: ${decisionArgs.rationale}`,
        `Impact: ${decisionArgs.impact}`,
        `Evidence: ${decisionArgs.evidence_refs.join(", ") || "not provided"}`,
      ].join("\n\n");
      const item = createContextItem({
        namespace: "architecture_decisions",
        type: "decision",
        title: decisionArgs.title,
        body,
        tags: Array.from(new Set(["decision", ...decisionArgs.tags])),
        sourceType: "context_tool",
        sourceRef: decisionArgs.evidence_refs.join(", ") || "context.log_decision",
        confidence: 0.85,
        status: "accepted",
        metadata: decisionArgs,
      });
      const written = await context.store.write(item);
      return { decision_id: written.id, status: written.status };
    }

    case "context.get_active_tasks": {
      const taskArgs = args as { include_blocked: boolean };
      const items = await context.store.listItems();
      const tasks = items
        .filter((item) => item.status === "accepted" || item.status === "proposed")
        .filter(
          (item) =>
            item.tags.includes("active-task") ||
            item.tags.includes("implementation-order") ||
            item.namespace === "current_state",
        )
        .filter((item) => taskArgs.include_blocked || !item.tags.includes("blocked"))
        .map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          status: item.status,
          tags: item.tags,
          source_ref: item.sourceRef,
        }));
      return { tasks };
    }

    case "context.get_area_domain_rules": {
      const ruleArgs = args as { topic: string };
      const items = await context.store.listItems();
      const rules = items
        .filter((item) => item.namespace === "domain_rules")
        .filter((item) => item.status === "accepted" || item.status === "proposed")
        .filter((item) => ruleArgs.topic === "general" || item.tags.includes(ruleArgs.topic))
        .map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          confidence: item.confidence,
          status: item.status,
          source_ref: item.sourceRef,
        }));
      return { rules, source_context_ids: rules.map((rule) => rule.id) };
    }

    case "context.index_codebase": {
      const indexArgs = args as { paths: string[]; reason: string; max_files: number };
      const repoRoot = context.repoRoot ?? process.cwd();
      const files = await collectFiles(repoRoot, indexArgs.paths, indexArgs.max_files);
      const updated: string[] = [];
      const warnings: string[] = [];
      for (const file of files) {
        const rel = relative(repoRoot, file);
        const content = await readFile(file, "utf8").catch((error: unknown) => {
          warnings.push(error instanceof Error ? error.message : `Could not read ${rel}`);
          return "";
        });
        if (!content || includesSensitiveText(content.slice(0, 4000))) {
          if (content) warnings.push(`Skipped ${rel}: possible sensitive material.`);
          continue;
        }
        const item = createContextItem({
          namespace: "code_index",
          type: "code_summary",
          title: rel,
          body: `Indexed ${rel} for ${indexArgs.reason}.\n\nExcerpt:\n${summarize(content, 1600)}`,
          tags: ["code-index", indexArgs.reason],
          sourceType: "file",
          sourceRef: rel,
          sourceUrlOrFile: file,
          confidence: 0.6,
          status: "proposed",
          metadata: { path: rel, reason: indexArgs.reason },
        });
        const written = await context.store.write(item);
        updated.push(written.id);
      }
      return { indexed_files: updated.length, updated_context_ids: updated, warnings };
    }

    case "context.update_status": {
      const statusArgs = args as {
        id: string;
        status: ContextStatus;
        reason: string;
        source_ref: string;
        supersedes_id?: string;
      };
      const existing = await context.store.fetch(statusArgs.id);
      if (!existing) throw new Error(`Context item not found: ${statusArgs.id}`);
      const now = new Date().toISOString();
      const updated: ContextItem = {
        ...existing,
        status: statusArgs.status,
        updatedAt: now,
        supersedesId: statusArgs.supersedes_id ?? existing.supersedesId,
        version: existing.version + 1,
        metadata: {
          ...existing.metadata,
          status_history: [
            ...((Array.isArray(existing.metadata.status_history)
              ? existing.metadata.status_history
              : []) as unknown[]),
            {
              status: statusArgs.status,
              reason: statusArgs.reason,
              source_ref: statusArgs.source_ref,
              updated_at: now,
            },
          ],
        },
      };
      const written = await context.store.write(updated);
      return { id: written.id, status: written.status, version: written.version };
    }

    case "context.session_summary": {
      const summaryArgs = args as {
        summary: string;
        decisions: string[];
        changes: string[];
        open_items: string[];
        next_session_needs: string;
        tags: string[];
      };
      const body = [
        `Session Summary: ${summaryArgs.summary}`,
        `Decisions:\n${bulletList(summaryArgs.decisions)}`,
        `Changes:\n${bulletList(summaryArgs.changes)}`,
        `Open Items:\n${bulletList(summaryArgs.open_items)}`,
        `Next Session Needs: ${summaryArgs.next_session_needs}`,
      ].join("\n\n");
      if (includesSensitiveText(body)) {
        throw new Error("Session summary may contain sensitive secret-like material; redact it first.");
      }
      const item = createContextItem({
        namespace: "current_state",
        type: "session_summary",
        title: `Session Summary ${new Date().toISOString()}`,
        body,
        tags: Array.from(new Set(["session-summary", ...summaryArgs.tags])),
        sourceType: "codex_session",
        sourceRef: "context.session_summary",
        confidence: 0.9,
        status: "accepted",
        metadata: summaryArgs,
      });
      const written = await context.store.write(item);
      return { id: written.id, status: written.status, summary: written.summary };
    }
  }
}
