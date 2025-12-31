#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run pre-commit checks script
bash scripts/pre-commit-check.sh

