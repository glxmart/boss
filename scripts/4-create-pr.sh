#!/usr/bin/env bash
# Create Pull Request
# Creates a PR using 1Password credentials

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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
  echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
  git status --short
  echo ""
  read -p "Commit them first? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Commit message: " COMMIT_MSG
    git add .
    git commit -m "$COMMIT_MSG"
  else
    echo -e "${RED}❌ Please commit or stash changes before creating PR${NC}"
    exit 1
  fi
fi

# Get latest git log for context
echo -e "${BLUE}📋 Recent commits:${NC}"
git log --oneline -5
echo ""

# Get changeset info if exists
CHANGESET_FILES=$(find .changeset -name "*.md" -not -name "README.md" 2>/dev/null || echo "")
if [[ -n "$CHANGESET_FILES" ]]; then
  echo -e "${GREEN}✅ Found changeset(s):${NC}"
  echo "$CHANGESET_FILES"
  echo ""
else
  echo -e "${YELLOW}⚠️  No changeset found${NC}"
  read -p "Continue without changeset? You'll need to add 'skip-changeset' label. (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted. Run scripts/3-create-changeset.sh first${NC}"
    exit 1
  fi
fi

# Generate PR title from branch name
PR_TITLE=$(echo "$CURRENT_BRANCH" | sed -E 's|^([^/]+)/(.+)$|\1: \2|' | sed 's/-/ /g')
echo ""
echo -e "${BLUE}Suggested PR title:${NC} $PR_TITLE"
read -p "Use this title? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  read -p "Enter PR title: " PR_TITLE
fi

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
echo ""
echo -e "${BLUE}📤 Pushing branch to origin...${NC}"
git push -u origin "$CURRENT_BRANCH"

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
    if [[ -z "$CHANGESET_FILES" ]]; then
      read -p "Add 'skip-changeset' label? (y/n) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        op run --env-file=.env -- gh pr edit "$PR_NUMBER" --add-label skip-changeset
        echo -e "${GREEN}✅ Added skip-changeset label${NC}"
      fi
    fi

    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Monitor workflow runs: op run --env-file=.env -- gh run list --branch $CURRENT_BRANCH"
    echo "  2. View PR: op run --env-file=.env -- gh pr view $PR_NUMBER"
    echo "  3. Wait for review and approval"
    echo "  4. Merge when ready: op run --env-file=.env -- gh pr merge $PR_NUMBER --squash --delete-branch"
  fi

  exit 0
else
  echo ""
  echo -e "${RED}❌ Failed to create pull request${NC}"
  exit 1
fi
