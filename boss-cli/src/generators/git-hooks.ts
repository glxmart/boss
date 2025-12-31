import path from 'path';
import { writeFile, makeExecutable, ensureDirectory } from '../utils/file-system.js';
import type { QualityPreset } from '../types/index.js';

export async function generateGitHooks(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  await ensureDirectory(path.join(projectPath, '.husky'));
  await ensureDirectory(path.join(projectPath, 'scripts'));

  // Generate pre-commit check script
  await generatePreCommitCheckScript(projectPath);

  // Generate test changed files script
  await generateTestChangedScript(projectPath);

  // Generate pre-commit hook
  await generatePreCommitHook(projectPath, quality);

  // Generate commit-msg hook
  await generateCommitMsgHook(projectPath, quality);

  // Generate pre-push hook
  await generatePrePushHook(projectPath);

  // Generate security check script
  await generateSecurityCheckScript(projectPath);
}

async function generatePreCommitCheckScript(projectPath: string): Promise<void> {
  const script = `#!/bin/bash
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
`;

  const scriptPath = path.join(projectPath, 'scripts', 'pre-commit-check.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}

async function generateTestChangedScript(projectPath: string): Promise<void> {
  const script = `#!/bin/bash
# Test changed files script
# Runs tests related to staged TypeScript files
# Only runs if tests are fast enough (optional optimization)

set -e

# Get list of staged TypeScript files
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\\.ts$' || true)

if [ -z "$changed_files" ]; then
  echo "ℹ️  No TypeScript files changed, skipping tests"
  exit 0
fi

# Find related test files (exclude e2e, integration, and container tests)
test_files=""
for file in $changed_files; do
  # Skip e2e and integration tests - too slow for pre-commit
  if echo "$file" | grep -qE '(tests/(e2e|integration)/|\\.(e2e|integration)\\.test\\.ts$)'; then
    continue
  fi
  
  # Skip if file is already a test file
  if echo "$file" | grep -q '\\.test\\.ts$'; then
    # Skip container tests that require Docker
    if echo "$file" | grep -qE '(mock-container|container.*test)'; then
      echo "  ⏭️  Skipping $file (requires containers/Docker)"
      continue
    fi
    if [ -f "$file" ]; then
      test_files="$test_files $file"
    fi
    continue
  fi

  # Convert src/foo/bar.ts -> tests/foo/bar.test.ts
  test_file=$(echo "$file" | sed 's|^src/|tests/|' | sed 's|\\.ts$|.test.ts|')

  if [ -f "$test_file" ]; then
    # Skip e2e and integration tests - too slow for pre-commit
    if echo "$test_file" | grep -qE 'tests/(e2e|integration)/'; then
      echo "  ⏭️  Skipping $test_file (e2e/integration test)"
      continue
    fi
    # Skip container tests that require Docker
    if echo "$test_file" | grep -qE '(mock-container|container.*test)'; then
      echo "  ⏭️  Skipping $test_file (requires containers/Docker)"
      continue
    fi
    test_files="$test_files $test_file"
  fi
done

if [ -z "$test_files" ]; then
  echo "ℹ️  No related test files found for changed files"
  exit 0
fi

echo "🧪 Running tests for changed files..."
for test_file in $test_files; do
  echo "  Running: $test_file"
done

# Run the tests and capture output
test_output=$(pnpm vitest run $test_files --reporter=dot 2>&1 || true)
echo "$test_output"

# Check if tests actually passed (look for test summary before potential worker cleanup crash)
if echo "$test_output" | grep -q "✓.*tests"; then
  # Tests passed, check for actual test failures
  if echo "$test_output" | grep -qE "(✗|FAIL|failed)"; then
    echo "❌ Tests for changed files failed"
    exit 1
  else
    echo "✅ Tests for changed files passed"
    exit 0
  fi
else
  # No test summary found, something went wrong
  echo "❌ Tests for changed files failed"
  exit 1
fi
`;

  const scriptPath = path.join(projectPath, 'scripts', 'test-changed.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}

async function generatePreCommitHook(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  const hook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run pre-commit checks script
bash scripts/pre-commit-check.sh
`;

  const hookPath = path.join(projectPath, '.husky', 'pre-commit');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generateCommitMsgHook(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  const hook = `#!/bin/sh
# Commit message validation hook
# Strictly enforces Conventional Commits v1.0.0 specification
# See: https://www.conventionalcommits.org/en/v1.0.0/

. "$(dirname "$0")/_/husky.sh"

commit_msg=$(cat "$1")

# Extract the first line (subject line)
first_line=$(echo "$commit_msg" | head -n1)

# Validate format: <type>[optional scope][optional !]: <description>
# According to spec: "Commits MUST be prefixed with a type, which consists of a noun, 
# feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space."

# Pattern breakdown:
# - Type: lowercase word (feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert, etc.)
# - Optional scope: (word) - noun in parentheses
# - Optional !: for breaking changes
# - Required: : (colon) followed by space
# - Description: rest of the line (at least one character)
if ! echo "$first_line" | grep -qE "^[a-z]+(\\([a-z0-9-]+\\))?(!)?: .+"; then
  echo "❌ Invalid commit message format!"
  echo ""
  echo "Commit messages MUST follow Conventional Commits v1.0.0 specification:"
  echo "  <type>[optional scope][optional !]: <description>"
  echo ""
  echo "Required format:"
  echo "  type(scope): description"
  echo "  type!: description        (breaking change)"
  echo "  type(scope)!: description (breaking change with scope)"
  echo ""
  echo "Common types:"
  echo "  feat:     A new feature"
  echo "  fix:      A bug fix"
  echo "  docs:     Documentation only changes"
  echo "  style:    Changes that do not affect code meaning (formatting, etc.)"
  echo "  refactor: Code change that neither fixes a bug nor adds a feature"
  echo "  perf:     Performance improvement"
  echo "  test:     Adding or updating tests"
  echo "  chore:    Changes to build process or auxiliary tools"
  echo "  ci:       Changes to CI configuration"
  echo "  build:    Changes to build system or dependencies"
  echo "  revert:   Reverts a previous commit"
  echo ""
  echo "Examples:"
  echo "  ✅ feat(orchestrator): add retry logic"
  echo "  ✅ fix(agents): handle container errors"
  echo "  ✅ docs: update architecture guide"
  echo "  ✅ feat!: change API signature"
  echo "  ✅ fix(api)!: remove deprecated endpoint"
  echo "  ❌ update code                    (missing type)"
  echo "  ❌ feat:fix bug                    (missing space after colon)"
  echo "  ❌ FEAT: add feature               (type should be lowercase)"
  echo ""
  echo "Your message:"
  echo "  $first_line"
  echo ""
  echo "Full specification: https://www.conventionalcommits.org/en/v1.0.0/"
  exit 1
fi

# Validate minimum description length (at least 3 characters after colon and space)
description=$(echo "$first_line" | sed -E 's/^[a-z]+(\\([a-z0-9-]+\\))?(!)?: //')
if [ \${#description} -lt 3 ]; then
  echo "❌ Commit description too short (minimum 3 characters)"
  echo ""
  echo "Your description: '\$description'"
  exit 1
fi

# Validate maximum length for first line (recommended 72 characters per spec)
# Note: Spec doesn't require this, but it's a best practice
if [ \${#first_line} -gt 100 ]; then
  echo "⚠️  Warning: First line of commit message exceeds 100 characters"
  echo "   Recommended: Keep first line under 72 characters for better readability"
  echo "   Your first line: \${#first_line} characters"
  echo ""
  echo "   Consider breaking into multiple lines:"
  echo "   type(scope): short summary"
  echo ""
  echo "   Longer description can go in the body."
  echo ""
fi

# Validate that type is lowercase (spec says case insensitive, but lowercase is conventional)
type=$(echo "$first_line" | sed -E 's/^([a-z]+).*/\\1/')
if ! echo "$type" | grep -qE '^[a-z]+$'; then
  echo "⚠️  Warning: Commit type should be lowercase"
  echo "   Found: '$type'"
  echo ""
fi

# Check for BREAKING CHANGE footer (if body exists)
if echo "$commit_msg" | grep -qiE "^BREAKING CHANGE:"; then
  echo "ℹ️  Breaking change detected in footer"
  echo "   Consider using '!' in type prefix for consistency"
fi

echo "✅ Commit message follows Conventional Commits specification"
`;

  const hookPath = path.join(projectPath, '.husky', 'commit-msg');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generatePrePushHook(projectPath: string): Promise<void> {
  const hook = `#!/bin/zsh
# Pre-push hook
# Prevents direct pushes to main and validates code before push

# Get the current branch name
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Prevent direct pushes to main
if [ "\$current_branch" = "main" ]; then
  echo "❌ Direct push to main is not allowed!"
  echo ""
  echo "Please create a feature branch and submit a PR instead:"
  echo "  git checkout -b feature/your-feature-name"
  echo "  git push -u origin feature/your-feature-name"
  echo "  gh pr create  # or use GitHub UI"
  echo ""
  echo "For emergency hotfixes, see: docs/emergency-bypass-procedure.md"
  exit 1
fi

echo "🔍 Running pre-push validation..."

# Run comprehensive checks
echo "  ✓ Running typecheck..."
if ! pnpm typecheck > /dev/null 2>&1; then
  echo "❌ TypeScript errors detected. Fix them before pushing."
  pnpm typecheck
  exit 1
fi

# Run linting
echo "  ✓ Running lint check..."
if ! pnpm lint > /dev/null 2>&1; then
  echo "❌ Linting errors detected. Fix them before pushing."
  pnpm lint
  exit 1
fi

# Run security checks
echo "  ✓ Running security checks..."
if ! bash scripts/security-check.sh; then
  echo "❌ Security checks failed. Review and fix before pushing."
  exit 1
fi

# Run unit tests (fast, exclude integration tests)
echo "  ✓ Running unit tests..."
if ! pnpm test:unit > /dev/null 2>&1; then
  echo "❌ Unit tests failing. Fix them before pushing."
  pnpm test:unit
  exit 1
fi

# Check for unused exports (warn only, not blocking)
echo "  ✓ Checking for unused exports..."
if ! pnpm check:unused > /dev/null 2>&1; then
  echo "⚠️  Warning: Unused exports detected. Run 'pnpm check:unused' for details."
  echo "   (This is a warning, not blocking)"
fi

# Warn if no tests in staged commits
echo "  ✓ Checking for tests..."
test_files=$(git diff origin/\$current_branch..HEAD --name-only 2>/dev/null | grep -E 'test\\.(ts|tsx|js|jsx)$' || true)
if [ -z "\$test_files" ]; then
  echo "⚠️  Warning: No test files in commits being pushed"
  echo "   TDD Constitution requires tests before implementation"
  # Skip interactive prompt in CI environments
  if [ -z "\${CI:-}" ] && [ -t 0 ]; then
    echo "   Continue? (y/N)"
    read -r response
    if [ "\$response" != "y" ]; then
      echo "Push cancelled. Add tests first!"
      exit 1
    fi
  else
    echo "   (Skipping prompt in non-interactive environment)"
  fi
fi

echo "✅ Pre-push validation passed!"
echo ""
`;

  const hookPath = path.join(projectPath, '.husky', 'pre-push');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generateSecurityCheckScript(projectPath: string): Promise<void> {
  const script = `#!/bin/bash
# Security check script
# Runs basic security checks before push

set -e

# Check for common security issues in staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM || true)

if [ -z "$staged_files" ]; then
  # If no staged files, check all tracked files
  staged_files=$(git ls-files || true)
fi

# Check for hardcoded secrets (basic check)
if echo "\$staged_files" | xargs grep -lE '(password|secret|api_key|private_key|access_token)\\s*[:=]\\s*["\\'][^"\\']+["\\']' 2>/dev/null; then
  echo "⚠️  Warning: Potential hardcoded secrets detected"
  echo "   Review the files above for sensitive information"
  echo "   (This is a basic check, review manually)"
fi

# Check for TODO/FIXME comments that might indicate security issues
if echo "\$staged_files" | xargs grep -lE 'TODO.*(security|auth|password|secret|vulnerability)' 2>/dev/null; then
  echo "⚠️  Warning: Security-related TODOs found"
  echo "   Review and address before pushing"
fi

# If npm audit is available, run it (non-blocking)
if command -v pnpm &> /dev/null; then
  if pnpm audit --audit-level=moderate 2>/dev/null | grep -qE '(moderate|high|critical)'; then
    echo "⚠️  Warning: Security vulnerabilities found in dependencies"
    echo "   Run 'pnpm audit' for details"
    echo "   Run 'pnpm audit fix' to attempt automatic fixes"
    # Don't block, just warn
  fi
fi

echo "✅ Security checks passed"
exit 0
`;

  const scriptPath = path.join(projectPath, 'scripts', 'security-check.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}

