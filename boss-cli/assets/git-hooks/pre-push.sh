#!/bin/zsh
# Pre-push hook
# Prevents direct pushes to main and validates code before push

# Get the current branch name
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Prevent direct pushes to main (including initial push)
if [ "$current_branch" = "main" ]; then
  # Check if this is the very first push (no remote main exists yet)
  if ! git ls-remote --heads origin main > /dev/null 2>&1; then
    echo "⚠️  Warning: This appears to be the first push to main"
    echo "   For initial setup, this is allowed, but main branch protection will be enforced after setup"
    echo "   Future pushes to main will be blocked - use feature branches and PRs instead"
    # Allow first push but warn
  else
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
# Check if remote branch exists (for first push, it won't)
if git ls-remote --heads origin $current_branch > /dev/null 2>&1; then
  # Remote branch exists - check diff
  test_files=$(git diff origin/$current_branch..HEAD --name-only 2>/dev/null | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
else
  # First push - check all files in HEAD for test files
  test_files=$(git ls-tree -r HEAD --name-only | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
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
    exit 1
  fi
fi

echo "✅ Pre-push validation passed!"
echo ""

