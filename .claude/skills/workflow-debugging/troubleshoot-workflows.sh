#!/usr/bin/env bash
set -euo pipefail

# Troubleshoot GitHub Actions Workflows
# Automatically analyzes recent workflow runs and provides detailed failure information

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and find gh-with-1password.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GH_SCRIPT="${SCRIPT_DIR}/../github-ops/tools/gh-with-1password.sh"

# Fallback to op run if script not found
if [ -f "$GH_SCRIPT" ]; then
  GH_CMD="$GH_SCRIPT"
else
  echo -e "${YELLOW}⚠️  gh-with-1password.sh not found, using 'op run --env-file=.env -- gh' directly${NC}"
  GH_CMD="op run --env-file=.env -- gh"
fi

# Configuration
REPO_OWNER="${GITHUB_REPO_OWNER:-glxmart}"
REPO_NAME="${GITHUB_REPO_NAME:-boss}"
LIMIT="${LIMIT:-10}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  GitHub Actions Workflow Troubleshooter${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "Branch: ${BRANCH}"
echo "Checking last ${LIMIT} runs..."
echo ""

# Get recent workflow runs with actual IDs
echo -e "${BLUE}=== 1. Fetching Recent Workflow Runs ===${NC}"
RUNS_JSON=$($GH_CMD run list \
  --repo "${REPO_OWNER}/${REPO_NAME}" \
  --branch "${BRANCH}" \
  --limit "${LIMIT}" \
  --json databaseId,displayTitle,conclusion,workflowName,createdAt,status,headSha)

# Count total, failed, and successful runs
TOTAL_RUNS=$(echo "$RUNS_JSON" | jq '. | length')
FAILED_RUNS=$(echo "$RUNS_JSON" | jq '[.[] | select(.conclusion == "failure")] | length')
SUCCESS_RUNS=$(echo "$RUNS_JSON" | jq '[.[] | select(.conclusion == "success")] | length')
IN_PROGRESS=$(echo "$RUNS_JSON" | jq '[.[] | select(.status == "in_progress")] | length')

echo "Total runs: ${TOTAL_RUNS}"
echo -e "Failed runs: ${RED}${FAILED_RUNS}${NC}"
echo -e "Successful runs: ${GREEN}${SUCCESS_RUNS}${NC}"
echo -e "In progress: ${YELLOW}${IN_PROGRESS}${NC}"
echo ""

# Display runs summary
echo -e "${BLUE}=== 2. Workflow Runs Summary ===${NC}"
echo "$RUNS_JSON" | jq -r '.[] |
  if .conclusion == "failure" then
    "❌ [\(.databaseId)] \(.workflowName) - \(.displayTitle[0:50]) (\(.createdAt))"
  elif .conclusion == "success" then
    "✅ [\(.databaseId)] \(.workflowName) - \(.displayTitle[0:50]) (\(.createdAt))"
  elif .status == "in_progress" then
    "🔄 [\(.databaseId)] \(.workflowName) - \(.displayTitle[0:50]) (\(.createdAt))"
  else
    "⏸️  [\(.databaseId)] \(.workflowName) - \(.displayTitle[0:50]) (\(.createdAt))"
  end'
echo ""

# If no failures, exit early
if [ "$FAILED_RUNS" -eq 0 ]; then
  echo -e "${GREEN}✅ No failed runs found!${NC}"
  exit 0
fi

# Get failed run IDs
FAILED_RUN_IDS=$(echo "$RUNS_JSON" | jq -r '.[] | select(.conclusion == "failure") | .databaseId')

echo -e "${BLUE}=== 3. Analyzing Failed Runs ===${NC}"
echo ""

# Analyze each failed run
for RUN_ID in $FAILED_RUN_IDS; do
  WORKFLOW_NAME=$(echo "$RUNS_JSON" | jq -r ".[] | select(.databaseId == $RUN_ID) | .workflowName")
  DISPLAY_TITLE=$(echo "$RUNS_JSON" | jq -r ".[] | select(.databaseId == $RUN_ID) | .displayTitle")

  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}Failed Run: ${RUN_ID}${NC}"
  echo -e "${RED}Workflow: ${WORKFLOW_NAME}${NC}"
  echo -e "${RED}Commit: ${DISPLAY_TITLE}${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Get detailed logs for failed run
  echo "Fetching failure logs..."
  echo ""

  $GH_CMD run view "$RUN_ID" --log-failed 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not fetch logs for run ${RUN_ID}${NC}"
    echo ""
    continue
  }

  echo ""
done

echo -e "${BLUE}=== 4. Recommended Actions ===${NC}"
echo ""

# Analyze failure patterns and provide recommendations
CHANGESET_FAILURES=$(echo "$RUNS_JSON" | jq -r '.[] | select(.conclusion == "failure" and (.workflowName | contains("Changeset"))) | .databaseId' | wc -l | tr -d ' ')
FORMAT_FAILURES=$(echo "$RUNS_JSON" | jq -r '.[] | select(.conclusion == "failure" and (.workflowName | contains("Test"))) | .databaseId' | wc -l | tr -d ' ')

if [ "$CHANGESET_FAILURES" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Changeset Check Failures Detected${NC}"
  echo "  → Code changes detected but no changeset found"
  echo "  → Create a changeset file:"
  echo ""
  echo "    cat > .changeset/my-changeset.md << 'EOF'"
  echo "    ---"
  echo "    '@glxmart/boss-cli': minor"
  echo "    ---"
  echo ""
  echo "    Description of changes here"
  echo "    EOF"
  echo ""
fi

if [ "$FORMAT_FAILURES" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Test/Format Failures Detected${NC}"
  echo "  → Run quality checks locally:"
  echo ""
  echo "    pnpm format        # Format all files"
  echo "    pnpm lint          # Lint check"
  echo "    pnpm build         # Build check"
  echo "    pnpm test          # Unit tests"
  echo ""
fi

echo -e "${BLUE}General Recommendations:${NC}"
echo "  1. Review failure logs above for specific errors"
echo "  2. Reproduce failures locally using:"
echo "     pnpm run workflow:2-check"
echo "  3. Fix issues and commit changes"
echo "  4. Push to trigger new workflow run"
echo ""

echo -e "${BLUE}Quick Commands:${NC}"
if [ -f "$GH_SCRIPT" ]; then
  echo "  • View specific run: $GH_SCRIPT run view <run-id>"
  echo "  • Rerun failed jobs: $GH_SCRIPT run rerun <run-id> --failed"
  echo "  • Watch runs: $GH_SCRIPT run watch"
else
  echo "  • View specific run: op run --env-file=.env -- gh run view <run-id>"
  echo "  • Rerun failed jobs: op run --env-file=.env -- gh run rerun <run-id> --failed"
  echo "  • Watch runs: op run --env-file=.env -- gh run watch"
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Troubleshooting Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
