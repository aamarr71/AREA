import { callContextTool, findRepoRoot, output, readHookInput } from "./lib/context.js";

const repoRoot = findRepoRoot();
const input = readHookInput();
const summary = String(input.summary ?? input.message ?? "Codex session reached Stop hook.");

const proposal = callContextTool(repoRoot, "context.propose_update", {
  namespace: "current_state",
  title: "Session memory proposal",
  old_value: "",
  new_value: summary.slice(0, 2000),
  reason: "Stop hook captured a compact end-of-turn memory proposal.",
  evidence_refs: [".codex/hooks/stop_memory_proposal.js"],
  confidence: 0.5,
  tags: ["session-summary", "active-task"],
});

output({ area_stop_memory_proposal: proposal });
