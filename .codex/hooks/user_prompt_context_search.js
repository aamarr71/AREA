import { callContextTool, findRepoRoot, outputAdditionalContext, readHookInput } from "./lib/context.js";

const repoRoot = findRepoRoot();
const input = readHookInput();
const prompt = String(input.prompt ?? input.user_prompt ?? input.message ?? "");

const taskClass = /security|auth|secret|token/i.test(prompt)
  ? "security"
  : /pdf|export|print|layout/i.test(prompt)
    ? "pdf-export"
    : /typescript|react|trpc|zod|schema|api/i.test(prompt)
      ? "code"
      : /context|mcp|hook|skill|agent/i.test(prompt)
        ? "context-infra"
        : "general";

const search = callContextTool(repoRoot, "context.search", {
  query: prompt || `AREA ${taskClass} task`,
  namespaces: [
    "project_facts",
    "architecture_decisions",
    "domain_rules",
    "prompt_rules",
    "current_state",
    "code_index",
  ],
  status: ["accepted", "proposed"],
  limit: 8,
  include_sources: true,
});

outputAdditionalContext("UserPromptSubmit", {
  area_context_search: {
    task_class: taskClass,
    search,
  },
});
