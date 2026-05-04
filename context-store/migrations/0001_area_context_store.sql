CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."context_namespace" AS ENUM(
  'project_facts',
  'product_decisions',
  'architecture_decisions',
  'domain_rules',
  'prompt_rules',
  'code_index',
  'current_state',
  'object_analysis_patterns',
  'accepted_memory_updates',
  'rejected_memory_updates',
  'source_references',
  'context_events',
  'context_links'
);
--> statement-breakpoint
CREATE TYPE "public"."context_status" AS ENUM(
  'proposed',
  'accepted',
  'rejected',
  'superseded',
  'stale',
  'archived'
);
--> statement-breakpoint
CREATE TABLE "context_items" (
  "id" varchar(80) PRIMARY KEY NOT NULL,
  "namespace" "context_namespace" NOT NULL,
  "type" varchar(120) NOT NULL,
  "title" varchar(500) NOT NULL,
  "body" text NOT NULL,
  "summary" text NOT NULL,
  "tags" text[] DEFAULT '{}' NOT NULL,
  "source_type" varchar(120) NOT NULL,
  "source_ref" text NOT NULL,
  "source_url_or_file" text,
  "confidence" double precision DEFAULT 0.5 NOT NULL,
  "status" "context_status" DEFAULT 'proposed' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  "supersedes_id" varchar(80),
  "version" integer DEFAULT 1 NOT NULL,
  "embedding" vector(1536),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "context_items_namespace_status_idx" ON "context_items" ("namespace", "status");
--> statement-breakpoint
CREATE INDEX "context_items_tags_idx" ON "context_items" USING gin ("tags");
--> statement-breakpoint
CREATE INDEX "context_items_metadata_idx" ON "context_items" USING gin ("metadata");
--> statement-breakpoint
CREATE INDEX "context_items_updated_at_idx" ON "context_items" ("updated_at");
