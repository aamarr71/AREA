#!/usr/bin/env sh
set -eu
cat | node .codex/hooks/stop_memory_proposal.js
