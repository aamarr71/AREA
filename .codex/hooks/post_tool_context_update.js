import { callContextTool, findRepoRoot, output, readHookInput } from "./lib/context.js";

const repoRoot = findRepoRoot();
const input = readHookInput();
const toolName = String(input.tool_name ?? input.tool ?? "unknown_tool");
const status = String(input.status ?? input.exit_code ?? "unknown");
const body = JSON.stringify(input).slice(0, 3000);

const observation = callContextTool(repoRoot, "context.write_observation", {
  namespace: "context_events",
  title: `Tool result observed: ${toolName}`,
  body: `Observed ${toolName} result with status ${status}. Payload excerpt: ${body}`,
  source_type: "codex_hook",
  source_ref: ".codex/hooks/post_tool_context_update.js",
  confidence: 0.45,
  tags: ["hook-observation", "tool-result"],
  metadata: { tool_name: toolName, status },
});

output({ area_post_tool_context_update: observation });
