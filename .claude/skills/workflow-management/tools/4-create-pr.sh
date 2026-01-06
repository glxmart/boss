#!/usr/bin/env bash
# Create Pull Request
# Creates a PR using 1Password credentials
#
# Usage: 4-create-pr.sh [options]
#   --title <title>       PR title (default: generated from branch name)
#   --body <body>         PR body/description (default: auto-generated template)
#   --skip-changeset      Add skip-changeset label (for docs/tests/config only)
#   --draft               Create as draft PR
#
# Examples:
#   4-create-pr.sh
#   4-create-pr.sh --title "fix: resolve validation error"
#   4-create-pr.sh --skip-changeset
#   4-create-pr.sh --title "docs: update API reference" --skip-changeset

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

# Parse arguments
PR_TITLE=""
PR_BODY=""
SKIP_CHANGESET=false
DRAFT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --title)
      PR_TITLE="$2"
      shift 2
      ;;
    --body)
      PR_BODY="$2"
      shift 2
      ;;
    --skip-changeset)
      SKIP_CHANGESET=true
      shift
      ;;
    --draft)
      DRAFT=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
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
  echo "Create a feature branch first with: .claude/skills/workflow-management/tools/1-start-feature.sh <type> <name>"
  exit 1
fi

# Check for uncommitted changes (excluding .claude/settings.local.json)
UNCOMMITTED=$(git status --porcelain | grep -v '.claude/settings.local.json' || true)
if [[ -n "$UNCOMMITTED" ]]; then
  echo -e "${RED}❌ You have uncommitted changes:${NC}"
  git status --short
  echo ""
  echo "Please commit changes first before creating a PR."
  exit 1
fi

# Check for changeset
CHANGESET_FILES=$(find .changeset -name "*.md" -not -name "README.md" 2>/dev/null || echo "")
if [[ -z "$CHANGESET_FILES" ]] && [[ "$SKIP_CHANGESET" == "false" ]]; then
  echo -e "${YELLOW}⚠️  No changeset found${NC}"
  echo ""
  echo "Either:"
  echo "  1. Create a changeset: .claude/skills/workflow-management/tools/3-create-changeset.sh <type> <packages> <message>"
  echo "  2. Re-run with --skip-changeset flag (for docs/tests/config only)"
  exit 1
fi

if [[ -n "$CHANGESET_FILES" ]]; then
  echo -e "${GREEN}✅ Found changeset(s):${NC}"
  echo "$CHANGESET_FILES"
  echo ""
fi

# Generate PR title from branch name if not provided
if [[ -z "$PR_TITLE" ]]; then
  # Convert "fix/my-feature-name" to "fix: my feature name"
  PR_TITLE=$(echo "$CURRENT_BRANCH" | sed -E 's|^([^/]+)/(.+)$|\1: \2|' | sed 's/-/ /g')
fi

echo -e "${BLUE}PR Title:${NC} $PR_TITLE"

# Get commit summary for body
COMMIT_LOG=$(git log main..HEAD --oneline 2>/dev/null || git log -5 --oneline)

# Generate PR body if not provided
if [[ -z "$PR_BODY" ]]; then
  PR_BODY="## Summary

<!-- Brief description of the changes -->

## Changes

$COMMIT_LOG

## Testing

- [ ] Quality checks pass (\`/2-quality-check\`)
- [ ] Tested locally

## Changeset
"

  if [[ -n "$CHANGESET_FILES" ]]; then
    PR_BODY+="
- [x] Changeset included"
  else
    PR_BODY+="
- [x] Skip changeset (docs/tests/config only)"
  fi

  PR_BODY+="

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

# Push branch
echo ""
echo -e "${BLUE}📤 Pushing branch to origin...${NC}"
git push -u origin "$CURRENT_BRANCH"

# Build gh command
GH_CMD="gh pr create --title \"$PR_TITLE\" --base main"

if [[ "$DRAFT" == "true" ]]; then
  GH_CMD+=" --draft"
fi

# Create PR using 1Password
echo ""
echo -e "${BLUE}🔐 Creating PR with GitHub credentials from 1Password...${NC}"

# Use heredoc for body to handle multiline
if op run --env-file=.env -- gh pr create \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --base main \
  ${DRAFT:+--draft}; then

  echo ""
  echo -e "${GREEN}✅ Pull request created successfully!${NC}"
  echo ""

  # Get PR URL
  PR_URL=$(op run --env-file=.env -- gh pr view --json url --jq '.url' 2>/dev/null || echo "")
  PR_NUMBER=$(op run --env-file=.env -- gh pr view --json number --jq '.number' 2>/dev/null || echo "")

  if [[ -n "$PR_URL" ]]; then
    echo -e "${BLUE}PR:${NC} $PR_URL"
  fi

  # Add skip-changeset label if requested
  if [[ "$SKIP_CHANGESET" == "true" ]] && [[ -n "$PR_NUMBER" ]]; then
    echo ""
    echo -e "${BLUE}Adding skip-changeset label...${NC}"
    op run --env-file=.env -- gh pr edit "$PR_NUMBER" --add-label skip-changeset
    echo -e "${GREEN}✅ Added skip-changeset label${NC}"
  fi

  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Monitor CI: op run --env-file=.env -- gh run list --branch $CURRENT_BRANCH"
  echo "  2. Wait for review and approval"
  echo "  3. Merge when ready"

  exit 0
else
  echo ""
  echo -e "${RED}❌ Failed to create pull request${NC}"
  exit 1
fi
