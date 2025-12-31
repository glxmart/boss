#!/bin/zsh
# Pre-push hook
# Prevents direct pushes to main and validates code before push

# Get the current branch name
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Prevent direct pushes to main
if [ "$current_branch" = "main" ]; then
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
test_files=$(git diff origin/$current_branch..HEAD --name-only 2>/dev/null | grep -E 'test\.(ts|tsx|js|jsx)$' || true)
if [ -z "$test_files" ]; then
  echo "⚠️  Warning: No test files in commits being pushed"
  echo "   TDD Constitution requires tests before implementation"
  # Skip interactive prompt in CI environments
  if [ -z "${CI:-}" ] && [ -t 0 ]; then
    echo "   Continue? (y/N)"
    read -r response
    if [ "$response" != "y" ]; then
      echo "Push cancelled. Add tests first!"
      exit 1
    fi
  else
    echo "   (Skipping prompt in non-interactive environment)"
  fi
fi

echo "✅ Pre-push validation passed!"
echo ""

