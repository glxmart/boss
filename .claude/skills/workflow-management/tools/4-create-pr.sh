#!/usr/bin/env bash
# Create Pull Request
# Creates a PR using 1Password credentials
#
# Usage:
#   4-create-pr.sh [OPTIONS]
#
# Options:
#   --title "PR Title"         Override auto-generated PR title
#   --skip-quality-check      Skip quality checks before push
#   --no-verify               Skip git pre-push hooks (emergency only)
#   --skip-changeset          Continue without changeset (auto-add label)
#   --auto-commit "message"   Auto-commit uncommitted changes
#   --help                    Show this help message
#
# Examples:
#   4-create-pr.sh
#   4-create-pr.sh --title "fix: critical bug in template loader"
#   4-create-pr.sh --skip-quality-check --no-verify
#   4-create-pr.sh --auto-commit "chore: update docs"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default options
CUSTOM_TITLE=""
SKIP_QUALITY_CHECK=false
NO_VERIFY=false
SKIP_CHANGESET=false
AUTO_COMMIT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --title)
      CUSTOM_TITLE="$2"
      shift 2
      ;;
    --skip-quality-check)
      SKIP_QUALITY_CHECK=true
      shift
      ;;
    --no-verify)
      NO_VERIFY=true
      shift
      ;;
    --skip-changeset)
      SKIP_CHANGESET=true
      shift
      ;;
    --auto-commit)
      AUTO_COMMIT="$2"
      shift 2
      ;;
    --help)
      sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# //g'
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}📝 Creating Pull Request${NC}"
echo ""

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo -e "${RED}❌ Cannot create PR from main branch${NC}"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  if [[ -n "$AUTO_COMMIT" ]]; then
    echo -e "${BLUE}📝 Auto-committing changes:${NC}"
    git status --short
    echo ""
    git add .
    git commit -m "$AUTO_COMMIT"
    echo -e "${GREEN}✅ Changes committed${NC}"
  else
    echo -e "${RED}❌ You have uncommitted changes:${NC}"
    git status --short
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  1. Commit them manually: git add . && git commit -m \"message\""
    echo "  2. Use --auto-commit \"message\" flag"
    echo "  3. Stash them: git stash"
    exit 1
  fi
fi

# Get latest git log for context
echo ""
echo -e "${BLUE}📋 Recent commits:${NC}"
git log --oneline -5
echo ""

# Get changeset info if exists
CHANGESET_FILES=$(find .changeset -name "*.md" -not -name "README.md" 2>/dev/null || echo "")
if [[ -n "$CHANGESET_FILES" ]]; then
  echo -e "${GREEN}✅ Found changeset(s):${NC}"
  echo "$CHANGESET_FILES"
  echo ""
elif [[ "$SKIP_CHANGESET" == true ]]; then
  echo -e "${YELLOW}⚠️  No changeset found (will add skip-changeset label)${NC}"
  echo ""
else
  echo -e "${RED}❌ No changeset found${NC}"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  1. Create changeset: .claude/skills/workflow-management/tools/3-create-changeset.sh"
  echo "  2. Use --skip-changeset flag (docs/tests/config only)"
  exit 1
fi

# Quality checks
if [[ "$SKIP_QUALITY_CHECK" == true ]]; then
  echo -e "${YELLOW}⚠️  Skipping quality checks (--skip-quality-check flag)${NC}"
  echo ""
else
  echo -e "${BLUE}🔍 Running quality checks...${NC}"

  if ! "$PROJECT_ROOT/.claude/skills/workflow-management/tools/2-quality-check.sh"; then
    echo ""
    echo -e "${RED}❌ Quality checks failed${NC}"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  1. Fix the issues and re-run"
    echo "  2. Use --skip-quality-check flag (not recommended)"
    exit 1
  fi

  echo ""
  echo -e "${GREEN}✅ Quality checks passed${NC}"
  echo ""
fi

# Generate PR title
if [[ -n "$CUSTOM_TITLE" ]]; then
  PR_TITLE="$CUSTOM_TITLE"
  echo -e "${BLUE}Using custom PR title:${NC} $PR_TITLE"
else
  PR_TITLE=$(echo "$CURRENT_BRANCH" | sed -E 's|^([^/]+)/(.+)$|\1: \2|' | sed 's/-/ /g')
  echo -e "${BLUE}Auto-generated PR title:${NC} $PR_TITLE"
fi
echo ""

# Generate PR body
PR_BODY="## Summary

Brief description of the changes.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Tested locally
- [ ] Documentation updated

## Changeset

"

if [[ -n "$CHANGESET_FILES" ]]; then
  PR_BODY+="- [x] Changeset created
"
else
  PR_BODY+="- [ ] Will add \`skip-changeset\` label (docs/tests/config only)
"
fi

PR_BODY+="
---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
"

# Push branch
echo -e "${BLUE}📤 Pushing branch to origin...${NC}"

PUSH_CMD="git push -u origin $CURRENT_BRANCH"
if [[ "$NO_VERIFY" == true ]]; then
  echo -e "${YELLOW}⚠️  Skipping pre-push hooks (--no-verify flag)${NC}"
  PUSH_CMD="$PUSH_CMD --no-verify"
fi

# Try to push, capture exit code
if ! eval "$PUSH_CMD" 2>&1 | tee /tmp/push-output.txt; then
  PUSH_EXIT_CODE=$?
  PUSH_OUTPUT=$(cat /tmp/push-output.txt)

  # Check if it was a pre-push hook failure
  if echo "$PUSH_OUTPUT" | grep -q "pre-push"; then
    echo ""
    echo -e "${RED}❌ Pre-push hook failed (quality gates)${NC}"
    echo ""
    echo -e "${YELLOW}The pre-push hook runs quality checks (build, lint, tests) before pushing.${NC}"
    echo ""

    # Check what failed
    if echo "$PUSH_OUTPUT" | grep -q "Integration tests failing\|test:integration"; then
      echo -e "${YELLOW}Integration tests are failing.${NC}"
    fi

    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  1. Fix the issues and re-run: 4-create-pr.sh"
    echo "  2. Skip hooks (emergency only): 4-create-pr.sh --no-verify"
    echo ""
    echo -e "${RED}⚠️  Skipping quality gates means pushing potentially broken code!${NC}"
    echo ""

    rm -f /tmp/push-output.txt
    exit 1
  else
    # Some other push error
    echo ""
    echo -e "${RED}❌ Push failed${NC}"
    echo "$PUSH_OUTPUT"
    rm -f /tmp/push-output.txt
    exit 1
  fi
fi

rm -f /tmp/push-output.txt
echo -e "${GREEN}✅ Branch pushed successfully${NC}"
echo ""

# Create PR using 1Password
echo ""
echo -e "${BLUE}🔐 Creating PR with GitHub credentials from 1Password...${NC}"

cd "$PROJECT_ROOT"
if op run --env-file=.env -- gh pr create \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --base main; then

  echo ""
  echo -e "${GREEN}✅ Pull request created successfully!${NC}"
  echo ""

  # Get PR number
  PR_NUMBER=$(op run --env-file=.env -- gh pr list --head "$CURRENT_BRANCH" --json number --jq '.[0].number')

  if [[ -n "$PR_NUMBER" ]]; then
    echo -e "${BLUE}PR #${PR_NUMBER}${NC}"
    echo ""

    # Add skip-changeset label if needed
    if [[ -z "$CHANGESET_FILES" ]] || [[ "$SKIP_CHANGESET" == true ]]; then
      echo -e "${BLUE}Adding skip-changeset label...${NC}"
      op run --env-file=.env -- gh pr edit "$PR_NUMBER" --add-label skip-changeset
      echo -e "${GREEN}✅ Added skip-changeset label${NC}"
      echo ""
    fi

    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. View PR: op run --env-file=.env -- gh pr view $PR_NUMBER --web"
    echo "  2. Monitor workflow runs: op run --env-file=.env -- gh run list --branch $CURRENT_BRANCH"
    echo "  3. Wait for review and approval"
    echo "  4. Merge when ready: op run --env-file=.env -- gh pr merge $PR_NUMBER --squash --delete-branch"
  fi

  exit 0
else
  echo ""
  echo -e "${RED}❌ Failed to create pull request${NC}"
  exit 1
fi
