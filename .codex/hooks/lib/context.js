import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export function findRepoRoot(start = process.cwd()) {
  let current = resolve(start);
  while (current !== dirname(current)) {
    if (existsSync(join(current, "package.json")) && existsSync(join(current, ".git"))) {
      return current;
    }
    current = dirname(current);
  }
  return resolve(start);
}

export function readHookInput() {
  try {
    const raw = readFileSync(0, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function callContextTool(repoRoot, name, input) {
  const result = spawnSync(
    "node",
    ["--import", "tsx", "mcp/area-context-server/src/cli.ts", name, JSON.stringify(input ?? {})],
    {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 25_000,
    },
  );

  if (result.status !== 0) {
    return {
      error: result.stderr.trim() || result.stdout.trim() || `Tool ${name} failed`,
    };
  }

  return JSON.parse(result.stdout);
}

export function output(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

export function outputAdditionalContext(hookEventName, payload) {
  console.log(
    JSON.stringify(
      {
        continue: true,
        hookSpecificOutput: {
          hookEventName,
          additionalContext: JSON.stringify(payload, null, 2),
        },
      },
      null,
      2,
    ),
  );
}
