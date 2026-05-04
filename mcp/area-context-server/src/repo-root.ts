import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export function findRepoRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (current !== dirname(current)) {
    if (existsSync(join(current, "package.json")) && existsSync(join(current, ".git"))) {
      return current;
    }
    current = dirname(current);
  }
  return resolve(start);
}
