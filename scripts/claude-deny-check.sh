#!/bin/bash
DENY_PATTERNS=(
  "--no-verify"
  "op read"
  "rm -rf /"
  "sudo"
)

for pattern in "${DENY_PATTERNS[@]}"; do
  if [[ "$CLAUDE_TOOL_INPUT" == *"$pattern"* ]]; then
    exit 1
  fi
done
exit 0