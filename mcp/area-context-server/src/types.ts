export const CONTEXT_NAMESPACES = [
  "project_facts",
  "product_decisions",
  "architecture_decisions",
  "domain_rules",
  "prompt_rules",
  "code_index",
  "current_state",
  "object_analysis_patterns",
  "accepted_memory_updates",
  "rejected_memory_updates",
  "source_references",
  "context_events",
  "context_links",
] as const;

export const CONTEXT_STATUSES = [
  "proposed",
  "accepted",
  "rejected",
  "superseded",
  "stale",
  "archived",
] as const;

export type ContextNamespace = (typeof CONTEXT_NAMESPACES)[number];
export type ContextStatus = (typeof CONTEXT_STATUSES)[number];

export type ContextItem = {
  id: string;
  namespace: ContextNamespace;
  type: string;
  title: string;
  body: string;
  summary: string;
  tags: string[];
  sourceType: string;
  sourceRef: string;
  sourceUrlOrFile: string | null;
  confidence: number;
  status: ContextStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  supersedesId: string | null;
  version: number;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
};

export type ContextSearchResult = {
  id: string;
  namespace: ContextNamespace;
  type: string;
  title: string;
  summary: string;
  body_excerpt: string;
  score: number;
  confidence: number;
  status: ContextStatus;
  tags: string[];
  source_ref: string;
  updated_at: string;
};

export type ContextStoreHealth = {
  store: "available" | "unavailable" | "offline_queue";
  retrieval: "available" | "degraded" | "unavailable";
  writeMode: "enabled" | "disabled" | "offline_queue";
  warnings: string[];
};

export type ContextStore = {
  healthcheck(): Promise<ContextStoreHealth>;
  listItems(): Promise<ContextItem[]>;
  fetch(id: string): Promise<ContextItem | null>;
  write(item: ContextItem): Promise<ContextItem>;
};

export type ContextStoreWithLifecycle = ContextStore & {
  close?(): Promise<void>;
};

export type ContextToolRuntime = {
  repoRoot?: string;
};
