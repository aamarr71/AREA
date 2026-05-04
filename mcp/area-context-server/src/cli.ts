import { findRepoRoot } from "./repo-root.ts";
import { createContextStore } from "./store-factory.ts";
import { callContextTool } from "./tools.ts";
import { isToolName } from "./validation.ts";

const [, , toolName, rawInput] = process.argv;

if (!toolName || !isToolName(toolName)) {
  console.error(`Usage: pnpm tsx mcp/area-context-server/src/cli.ts <context.tool> [jsonInput]`);
  process.exit(2);
}

const validatedToolName = toolName;

async function main(): Promise<void> {
  const input = rawInput ? JSON.parse(rawInput) : {};
  const repoRoot = findRepoRoot();
  const store = createContextStore(repoRoot);
  const result = await callContextTool(validatedToolName, input, { store, repoRoot });

  console.log(JSON.stringify(result, null, 2));
  await store.close?.();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
