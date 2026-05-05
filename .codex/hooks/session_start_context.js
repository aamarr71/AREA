import { callContextTool, findRepoRoot, output } from "./lib/context.js";

const repoRoot = findRepoRoot();
const health = callContextTool(repoRoot, "context.healthcheck", {});
const brief = callContextTool(repoRoot, "context.get_project_brief", {
  scope: "repo",
  max_tokens: 4000,
});
const sessionSummaries = callContextTool(repoRoot, "context.search", {
  query: "session-summary",
  tags: ["session-summary"],
  status: ["accepted"],
  limit: 5,
  include_sources: true,
});

output({
  area_context: {
    health,
    brief,
    session_summaries: sessionSummaries,
  },
});
