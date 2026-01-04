#!/usr/bin/env bash
# Start Feature Branch
# Creates a new feature branch from latest main

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

echo -e "${BLUE}🚀 Starting new feature branch${NC}"
echo ""

# Check if we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo -e "${YELLOW}⚠️  Currently on branch: $CURRENT_BRANCH${NC}"
  read -p "Switch to main first? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout main
  else
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
  fi
fi

# Fetch latest changes
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch origin main

# Check if local main is behind
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)

if [[ "$LOCAL" != "$REMOTE" ]]; then
  echo -e "${YELLOW}⚠️  Local main is behind origin/main${NC}"
  read -p "Pull latest changes? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin main
  fi
fi

# Get feature name
echo ""
echo -e "${BLUE}Enter feature details:${NC}"
read -p "Feature type (feature/fix/chore/docs): " FEATURE_TYPE
read -p "Feature name (e.g., worker-resume): " FEATURE_NAME

if [[ -z "$FEATURE_TYPE" ]] || [[ -z "$FEATURE_NAME" ]]; then
  echo -e "${RED}❌ Feature type and name are required${NC}"
  exit 1
fi

BRANCH_NAME="${FEATURE_TYPE}/${FEATURE_NAME}"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo -e "${YELLOW}⚠️  Branch $BRANCH_NAME already exists${NC}"
  read -p "Switch to existing branch? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout "$BRANCH_NAME"
    echo -e "${GREEN}✅ Switched to $BRANCH_NAME${NC}"
    exit 0
  else
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
  fi
fi

# Create and checkout new branch
echo ""
echo -e "${BLUE}📝 Creating branch: $BRANCH_NAME${NC}"
git checkout -b "$BRANCH_NAME"

echo ""
echo -e "${GREEN}✅ Feature branch created successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Make your changes"
echo "  2. Run: .claude/skills/workflow-management/tools/2-quality-check.sh"
echo "  3. Run: .claude/skills/workflow-management/tools/3-create-changeset.sh"
echo "  4. Run: .claude/skills/workflow-management/tools/4-create-pr.sh"
echo ""
