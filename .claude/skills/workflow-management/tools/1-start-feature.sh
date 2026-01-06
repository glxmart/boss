#!/usr/bin/env bash
# Start Feature Branch
# Creates a new feature branch from latest main
#
# Usage: 1-start-feature.sh <type> <name>
#   type: feature|fix|chore|docs
#   name: branch name in kebab-case (e.g., worker-resume)
#
# Examples:
#   1-start-feature.sh feature worker-resume
#   1-start-feature.sh fix validation-error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"

# Change to project root for all git operations
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
FEATURE_TYPE="${1:-}"
FEATURE_NAME="${2:-}"

# Show usage if no arguments
if [[ -z "$FEATURE_TYPE" ]] || [[ -z "$FEATURE_NAME" ]]; then
  echo -e "${RED}Usage: $0 <type> <name>${NC}"
  echo ""
  echo "Types: feature, fix, chore, docs"
  echo "Name:  kebab-case branch name (e.g., worker-resume)"
  echo ""
  echo "Examples:"
  echo "  $0 feature worker-resume"
  echo "  $0 fix validation-error"
  exit 1
fi

# Validate feature type
case "$FEATURE_TYPE" in
  feature|fix|chore|docs) ;;
  *)
    echo -e "${RED}❌ Invalid type: $FEATURE_TYPE${NC}"
    echo "Valid types: feature, fix, chore, docs"
    exit 1
    ;;
esac

BRANCH_NAME="${FEATURE_TYPE}/${FEATURE_NAME}"

echo -e "${BLUE}🚀 Starting new feature branch: $BRANCH_NAME${NC}"
echo ""

# Stash any local changes
STASHED=false
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo -e "${YELLOW}📦 Stashing local changes...${NC}"
  git stash push -m "auto-stash before branch creation"
  STASHED=true
fi

# Switch to main if not already there
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo -e "${BLUE}🔄 Switching to main...${NC}"
  git checkout main
fi

# Fetch and pull latest changes
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch origin main
git pull origin main --ff-only 2>/dev/null || git pull origin main --rebase

# Check if branch already exists locally
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo -e "${YELLOW}⚠️  Branch $BRANCH_NAME already exists locally${NC}"
  echo -e "${BLUE}🔄 Switching to existing branch...${NC}"
  git checkout "$BRANCH_NAME"

  # Restore stashed changes if any
  if [[ "$STASHED" == "true" ]]; then
    echo -e "${BLUE}📦 Restoring stashed changes...${NC}"
    git stash pop || true
  fi

  echo ""
  echo -e "${GREEN}✅ Switched to existing branch: $BRANCH_NAME${NC}"
  exit 0
fi

# Check if branch exists on remote
if git show-ref --verify --quiet "refs/remotes/origin/$BRANCH_NAME"; then
  echo -e "${YELLOW}⚠️  Branch $BRANCH_NAME exists on remote${NC}"
  echo -e "${BLUE}🔄 Checking out remote branch...${NC}"
  git checkout -b "$BRANCH_NAME" "origin/$BRANCH_NAME"

  # Restore stashed changes if any
  if [[ "$STASHED" == "true" ]]; then
    echo -e "${BLUE}📦 Restoring stashed changes...${NC}"
    git stash pop || true
  fi

  echo ""
  echo -e "${GREEN}✅ Checked out remote branch: $BRANCH_NAME${NC}"
  exit 0
fi

# Create and checkout new branch
echo -e "${BLUE}📝 Creating branch: $BRANCH_NAME${NC}"
git checkout -b "$BRANCH_NAME"

# Restore stashed changes if any
if [[ "$STASHED" == "true" ]]; then
  echo -e "${BLUE}📦 Restoring stashed changes...${NC}"
  git stash pop || true
fi

echo ""
echo -e "${GREEN}✅ Feature branch created: $BRANCH_NAME${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Make your changes"
echo "  2. Run: /2-quality-check"
echo "  3. Run: /3-create-changeset"
echo "  4. Run: /4-create-pr"
echo ""
