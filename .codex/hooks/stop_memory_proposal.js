import { callContextTool, findRepoRoot } from "./lib/context.js";

const repoRoot = findRepoRoot();
const recent = callContextTool(repoRoot, "context.get_recent_changes", {
  since: "2h",
  limit: 20,
});

const changes = Array.isArray(recent?.changes) ? recent.changes : [];
const sessionSummaryFound = changes.some((item) => item.type === "session_summary");

if (sessionSummaryFound) {
  console.log(JSON.stringify({ continue: true }, null, 2));
} else {
  console.log(
    JSON.stringify(
      {
        decision: "block",
        reason:
          "WARNUNG: Diese Session hat kein context.session_summary geschrieben. Der Kontext dieser Session geht verloren. Codex MUSS vor dem Beenden context.session_summary aufrufen.",
      },
      null,
      2,
    ),
  );
}
