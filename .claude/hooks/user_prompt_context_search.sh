#!/usr/bin/env sh
set -eu
cat | node .codex/hooks/user_prompt_context_search.js
