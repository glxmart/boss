#!/bin/bash
# Pre-push hook (monorepo version)
# Prevents direct pushes to main and validates code before push

# Get the current branch name
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Allow GitHub Actions to push tags (for release workflow)
# When pushing tags, git calls the hook but we want to allow it in CI
if [ -n "${CI:-}" ] && [ -n "${GITHUB_ACTIONS:-}" ]; then
  # Check if we're pushing tags (not commits to branch)
  # In GitHub Actions during release, we're pushing tags like @glxmart/package@version
  # We can detect this by checking if the refname being pushed is a tag
  while read local_ref local_sha remote_ref remote_sha; do
    if [[ "$remote_ref" =~ refs/tags/ ]]; then
      echo "✅ GitHub Actions tag push detected - allowing release tag creation"
      exit 0
    fi
  done
fi

# Prevent direct pushes to main (including initial push)
FIRST_PUSH_TO_MAIN=false
if [ "$current_branch" = "main" ]; then
  # Allow GitHub Actions to push to main (after PR merge, changesets may push version commits)
  if [ -n "${CI:-}" ] && [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "✅ GitHub Actions detected - allowing automated push to main"
    echo "🔍 Running pre-push validation..."
  fi

  # Check if this is the very first push (no remote main exists yet)
  if ! git ls-remote --heads origin main > /dev/null 2>&1; then
    echo "⚠️  Warning: This appears to be the first push to main"
    echo "   For initial setup, empty main is allowed, but main branch protection will be enforced after setup"
    echo "   Future pushes to main will be blocked - use feature branches and PRs instead"
    FIRST_PUSH_TO_MAIN=true

    # Check if main branch is empty (only empty commit or minimal files like README/.gitignore)
    # Count non-trivial files (exclude .gitignore, README.md, LICENSE, etc.)
    file_count=$(git ls-tree -r HEAD --name-only 2>/dev/null | grep -v -E '^(README\.md|LICENSE|\.gitignore|\.gitattributes)$' | wc -l | tr -d ' ')

    if [ "$file_count" -eq 0 ]; then
      echo "✅ Main branch is empty - skipping validation checks for initial empty push"
      echo "✅ Pre-push validation passed!"
      exit 0
    else
      echo "⚠️  Main branch contains files - validation checks will run"
    fi
  else
    # Block direct pushes to main UNLESS it's GitHub Actions
    if [ -z "${CI:-}" ] || [ -z "${GITHUB_ACTIONS:-}" ]; then
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
  fi
fi

echo "🔍 Running pre-push validation..."

# Build both packages
echo "  ✓ Building packages..."
if ! pnpm build > /dev/null 2>&1; then
  echo "❌ Build errors detected. Fix them before pushing."
  pnpm build
  exit 1
fi

# Run linting on both packages
echo "  ✓ Running lint check..."
lint_failed=0
for package in boss-cli conductor-mcp; do
  if ! pnpm --filter @glxmart/$package lint > /dev/null 2>&1; then
    echo "❌ Linting errors detected in $package. Fix them before pushing."
    pnpm --filter @glxmart/$package lint
    lint_failed=1
  fi
done

if [ $lint_failed -eq 1 ]; then
  exit 1
fi

# Run security checks
echo "  ✓ Running security checks..."
if ! bash scripts/security-check.sh; then
  echo "❌ Security checks failed. Review and fix before pushing."
  exit 1
fi

# Run unit tests for both packages (fast, exclude integration/e2e tests)
echo "  ✓ Running unit tests..."
test_failed=0

# Run boss-cli tests (excluding integration)
if ! pnpm --filter @glxmart/boss-cli test > /dev/null 2>&1; then
  echo "❌ Unit tests failing in boss-cli. Fix them before pushing."
  pnpm --filter @glxmart/boss-cli test
  test_failed=1
fi

# Run conductor-mcp unit tests only
if ! pnpm --filter @glxmart/conductor-mcp test:unit > /dev/null 2>&1; then
  echo "❌ Unit tests failing in conductor-mcp. Fix them before pushing."
  pnpm --filter @glxmart/conductor-mcp test:unit
  test_failed=1
fi

if [ $test_failed -eq 1 ]; then
  exit 1
fi

# Run integration tests (to catch template/bootstrap issues before CI)
# Skip for first empty push to main
if [ "$FIRST_PUSH_TO_MAIN" != "true" ]; then
  echo "  ✓ Running integration tests..."
  integration_failed=0

  # Run boss-cli integration tests
  if ! pnpm --filter @glxmart/boss-cli test:integration > /dev/null 2>&1; then
    echo "❌ Integration tests failing in boss-cli. Fix them before pushing."
    pnpm --filter @glxmart/boss-cli test:integration
    integration_failed=1
  fi

  # Run conductor-mcp integration tests
  if ! pnpm --filter @glxmart/conductor-mcp test:integration > /dev/null 2>&1; then
    echo "❌ Integration tests failing in conductor-mcp. Fix them before pushing."
    pnpm --filter @glxmart/conductor-mcp test:integration
    integration_failed=1
  fi

  # Run conductor-mcp E2E tests
  if ! pnpm --filter @glxmart/conductor-mcp test:e2e > /dev/null 2>&1; then
    echo "❌ E2E tests failing in conductor-mcp. Fix them before pushing."
    pnpm --filter @glxmart/conductor-mcp test:e2e
    integration_failed=1
  fi

  if [ $integration_failed -eq 1 ]; then
    exit 1
  fi
fi

# Warn if no tests in staged commits (skip for first empty push to main)
if [ "$FIRST_PUSH_TO_MAIN" != "true" ]; then
  echo "  ✓ Checking for tests..."
  # Check if remote branch exists (for first push, it won't)
  if git ls-remote --heads origin $current_branch > /dev/null 2>&1; then
    # Remote branch exists - check diff
    test_files=$(git diff origin/$current_branch..HEAD --name-only 2>/dev/null | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
  else
    # First push - check all files in HEAD for test files
    # Use git ls-tree to check committed files
    test_files=$(git ls-tree -r HEAD --name-only 2>/dev/null | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
  fi

  # If test_files is empty, try alternative detection methods
  if [ -z "$test_files" ]; then
    # Method 1: Check all files in HEAD
    all_files=$(git ls-tree -r HEAD --name-only 2>/dev/null || true)
    if [ -n "$all_files" ]; then
      test_files_alt=$(echo "$all_files" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
      if [ -n "$test_files_alt" ]; then
        test_files="$test_files_alt"
      fi
    fi

    # Method 2: If still empty, check working directory (for uncommitted test files)
    if [ -z "$test_files" ]; then
      test_files_wd=$(find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.js" -o -name "*.test.jsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.js" -o -name "*.spec.jsx" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | head -5 || true)
      if [ -n "$test_files_wd" ]; then
        # Only use working directory files if they're tracked by git
        for file in $test_files_wd; do
          if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            test_files="${test_files:+$test_files }$file"
          fi
        done
      fi
    fi
  fi

  if [ -z "$test_files" ]; then
    echo "⚠️  Warning: No test files in commits being pushed"
    echo "   TDD Constitution requires tests before implementation"
    # Allow bypass only in CI environments, but block in all other cases (including BOSS automated pushes)
    if [ -n "${CI:-}" ]; then
      echo "   (Allowing in CI environment, but tests should still be added)"
    elif [ -t 0 ]; then
      # Interactive terminal - ask user
      echo "   Continue? (y/N)"
      read -r response
      if [ "$response" != "y" ]; then
        echo "Push cancelled. Add tests first!"
        exit 1
      fi
    else
      # Non-interactive but not CI (e.g., BOSS automated push) - block it
      echo "❌ Push blocked: TDD Constitution requires tests before implementation"
      echo "   Add test files and commit them before pushing."
      echo "   Expected pattern: *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx (or .js/.jsx variants)"
      exit 1
    fi
  else
    # Show found test files (limit to first 3 to avoid clutter)
    test_file_count=$(echo "$test_files" | wc -l | tr -d ' ')
    if [ "$test_file_count" -le 3 ]; then
      echo "   ✓ Found test files: $(echo "$test_files" | tr '\n' ' ')"
    else
      echo "   ✓ Found $test_file_count test files (showing first 3): $(echo "$test_files" | head -3 | tr '\n' ' ')"
    fi
  fi
fi

echo "✅ Pre-push validation passed!"
echo ""
