#!/usr/bin/env bash
# Quality Check
# Runs build, lint, tests, and coverage checks

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

echo -e "${BLUE}🔍 Running Quality Checks${NC}"
echo ""

# Track failures
FAILED=0

# 1. Build
echo -e "${BLUE}📦 Building packages...${NC}"
if pnpm build; then
  echo -e "${GREEN}✅ Build passed${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  FAILED=1
fi
echo ""

# 2. Lint
echo -e "${BLUE}🔧 Running lint check...${NC}"
if pnpm lint; then
  echo -e "${GREEN}✅ Lint passed${NC}"
else
  echo -e "${RED}❌ Lint failed${NC}"
  FAILED=1
fi
echo ""

# 3. Type check
echo -e "${BLUE}📝 Running type check...${NC}"
if pnpm -r exec tsc --noEmit; then
  echo -e "${GREEN}✅ Type check passed${NC}"
else
  echo -e "${RED}❌ Type check failed${NC}"
  FAILED=1
fi
echo ""

# 4. Tests
echo -e "${BLUE}🧪 Running tests...${NC}"
if pnpm test; then
  echo -e "${GREEN}✅ Tests passed${NC}"
else
  echo -e "${RED}❌ Tests failed${NC}"
  FAILED=1
fi
echo ""

# 5. Security check
echo -e "${BLUE}🔒 Running security checks...${NC}"
# Reference quality-gates skill (fallback to old location if not yet migrated)
SECURITY_CHECK_SCRIPT="${PROJECT_ROOT}/.claude/skills/quality-gates/tools/security-check.sh"
if [[ ! -f "$SECURITY_CHECK_SCRIPT" ]]; then
  SECURITY_CHECK_SCRIPT="${PROJECT_ROOT}/scripts/security-check.sh"
fi

if "$SECURITY_CHECK_SCRIPT"; then
  echo -e "${GREEN}✅ Security checks passed${NC}"
else
  echo -e "${YELLOW}⚠️  Security checks found warnings (not blocking)${NC}"
fi
echo ""

# Summary
if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ All quality checks passed!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Create changeset: .claude/skills/workflow-management/tools/3-create-changeset.sh"
  echo "  2. Create PR: .claude/skills/workflow-management/tools/4-create-pr.sh"
  exit 0
else
  echo -e "${RED}❌ Quality checks failed. Fix the errors above before proceeding.${NC}"
  exit 1
fi
