#!/bin/bash
# Pre-commit hook script
#
# Runs static analysis on staged files only to ensure code quality
# before commits. Fast enough to run on every commit.

set -e

echo "🔍 Running pre-commit checks..."

# Run lint-staged (handles staged files only: ESLint, Prettier, TypeScript)
# lint-staged is configured in package.json to run on staged files
echo "  ✓ Running lint-staged (ESLint + Prettier + TypeScript on staged files)..."
pnpm exec lint-staged

# Run tests for changed files
echo ""
bash scripts/test-changed.sh

echo "✅ Pre-commit checks passed!"

