#!/usr/bin/env sh
set -eu
cat | node .codex/hooks/session_start_context.js
