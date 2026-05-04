import { callContextTool, findRepoRoot, output } from "./lib/context.js";

const repoRoot = findRepoRoot();
const health = callContextTool(repoRoot, "context.healthcheck", {});
const brief = callContextTool(repoRoot, "context.get_project_brief", {
  scope: "repo",
  max_tokens: 4000,
});

output({
  area_context: {
    health,
    brief,
  },
});
