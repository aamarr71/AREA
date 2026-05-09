import { readHookInput } from "./lib/context.js";

const input = readHookInput();
const text = JSON.stringify(input);
const warnings = [];
const blocks = [];

if (/\b(rm\s+-rf|git\s+reset\s+--hard|drop\s+database|truncate\s+table)\b/i.test(text)) {
  warnings.push("Potentially destructive command detected; require explicit user approval.");
}

if (/(api[_-]?key|authorization|bearer\s+[a-z0-9._-]+|password|secret|token)/i.test(text)) {
  blocks.push("Possible secret or credential material detected in tool input.");
}

if (blocks.length > 0) {
  console.error(blocks.join("\n"));
  process.exit(2);
}

if (warnings.length > 0) {
  console.log(JSON.stringify({ systemMessage: warnings.join("\n") }, null, 2));
}
