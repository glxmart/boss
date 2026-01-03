#!/bin/bash
# Pre-commit hook script
#
# Runs static analysis on staged files only to ensure code quality
# before commits. Fast enough to run on every commit.

set -e

echo "🔍 Running pre-commit checks..."

# Run lint-staged (handles staged files only: Prettier formatting)
# lint-staged is configured in package.json to run on staged files
echo "  ✓ Running lint-staged (Prettier formatting on staged files)..."
pnpm exec lint-staged

# Note: Tests run in pre-push hook for faster commits
# Run `pnpm test` manually if you want to test before committing

echo "✅ Pre-commit checks passed!"

