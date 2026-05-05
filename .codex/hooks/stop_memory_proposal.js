import { callContextTool, findRepoRoot, output } from "./lib/context.js";

const repoRoot = findRepoRoot();
const recent = callContextTool(repoRoot, "context.get_recent_changes", {
  since: "2h",
  limit: 20,
});

const changes = Array.isArray(recent?.changes) ? recent.changes : [];
const sessionSummaryFound = changes.some((item) => item.type === "session_summary");

output({
  area_stop_check: sessionSummaryFound
    ? { session_summary_found: true }
    : {
        session_summary_found: false,
        warning:
          "WARNUNG: Diese Session hat kein context.session_summary geschrieben. Der Kontext dieser Session geht verloren. Codex MUSS vor dem Beenden context.session_summary aufrufen.",
      },
});
