#!/bin/bash
# Workflow troubleshooting script
# Diagnoses and fixes GitHub Actions workflow failures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Parse command line arguments
RERUN=false
DOWNLOAD_LOGS=false
SHOW_FAILED_ONLY=false
LIMIT=5

while [[ $# -gt 0 ]]; do
  case $1 in
    --rerun)
      RERUN=true
      shift
      ;;
    --download-logs)
      DOWNLOAD_LOGS=true
      shift
      ;;
    --failed-only)
      SHOW_FAILED_ONLY=true
      shift
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --rerun           Re-run failed workflows"
      echo "  --download-logs   Download logs from failed runs"
      echo "  --failed-only     Show only failed runs"
      echo "  --limit N         Show last N runs (default: 5)"
      echo "  --help            Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                              # Quick status check"
      echo "  $0 --failed-only                # Show only failures"
      echo "  $0 --download-logs              # Download failed run logs"
      echo "  $0 --rerun                      # Re-run failed workflows"
      echo "  $0 --limit 10                   # Show last 10 runs"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

print_header "GitHub Workflow Troubleshooting"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  print_error "Not in a git repository"
  exit 1
fi

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  print_error "GitHub CLI (gh) is not installed"
  echo "Install with: brew install gh"
  exit 1
fi

# Check if 1Password is available for authentication
if ! command -v op &> /dev/null; then
  print_warning "1Password CLI not found, using system GitHub auth"
  GH_CMD="gh"
else
  # Use 1Password for authentication
  REPO_ROOT="$(git rev-parse --show-toplevel)"
  if [ -f "$REPO_ROOT/.env" ]; then
    GH_CMD="op run --env-file=$REPO_ROOT/.env -- gh"
  else
    print_warning ".env file not found, using system GitHub auth"
    GH_CMD="gh"
  fi
fi

# 1. Quick Status Check
print_header "1. Recent Workflow Runs"

if [ "$SHOW_FAILED_ONLY" = true ]; then
  echo "Showing failed runs only..."
  RUNS=$($GH_CMD run list --limit "$LIMIT" --json conclusion,name,status,headBranch,databaseId,displayTitle --jq '.[] | select(.conclusion == "failure")')
else
  RUNS=$($GH_CMD run list --limit "$LIMIT")
fi

echo "$RUNS"
echo ""

# Count failures
FAILED_COUNT=$($GH_CMD run list --limit "$LIMIT" --json conclusion --jq '[.[] | select(.conclusion == "failure")] | length')

if [ "$FAILED_COUNT" -eq 0 ]; then
  print_success "No failed workflows in last $LIMIT runs"
  exit 0
fi

print_warning "Found $FAILED_COUNT failed workflow(s)"

# 2. Detailed Failure Analysis
print_header "2. Failure Details"

FAILED_RUN_IDS=$($GH_CMD run list --limit "$LIMIT" --json conclusion,databaseId --jq '.[] | select(.conclusion == "failure") | .databaseId')

for RUN_ID in $FAILED_RUN_IDS; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_header "Run ID: $RUN_ID"

  # Get run details
  RUN_INFO=$($GH_CMD run view "$RUN_ID" --json name,headBranch,conclusion,displayTitle)
  WORKFLOW_NAME=$(echo "$RUN_INFO" | jq -r '.name')
  BRANCH=$(echo "$RUN_INFO" | jq -r '.headBranch')
  TITLE=$(echo "$RUN_INFO" | jq -r '.displayTitle')

  echo "Workflow: $WORKFLOW_NAME"
  echo "Branch: $BRANCH"
  echo "Commit: $TITLE"
  echo ""

  # Show failed logs
  print_header "Failed Job Logs"
  $GH_CMD run view "$RUN_ID" --log-failed | head -100

  echo ""
  print_warning "Showing first 100 lines. Run 'gh run view $RUN_ID --log-failed' for full logs"
done

# 3. Common Failure Pattern Detection
print_header "3. Analyzing Common Failure Patterns"

# Check for common patterns in failed logs
for RUN_ID in $FAILED_RUN_IDS; do
  LOGS=$($GH_CMD run view "$RUN_ID" --log-failed 2>/dev/null || echo "")

  # Test failures
  if echo "$LOGS" | grep -q "FAIL\|AssertionError\|Error:.*test"; then
    print_error "Pattern: Test failures detected in run $RUN_ID"
    echo "  → Run tests locally: pnpm test"
    echo "  → Check specific failures: gh run view $RUN_ID --log-failed | grep -A 10 FAIL"
  fi

  # Build failures
  if echo "$LOGS" | grep -q "Build failed\|TypeScript error\|npm ERR!"; then
    print_error "Pattern: Build failures detected in run $RUN_ID"
    echo "  → Run build locally: pnpm build"
    echo "  → Check TypeScript errors: pnpm typecheck"
  fi

  # Lint failures
  if echo "$LOGS" | grep -q "ESLint\|Linting"; then
    print_error "Pattern: Linting errors detected in run $RUN_ID"
    echo "  → Run lint locally: pnpm lint"
    echo "  → Auto-fix: pnpm lint --fix"
  fi

  # Dependency issues
  if echo "$LOGS" | grep -q "pnpm install failed\|Cannot find module"; then
    print_error "Pattern: Dependency issues detected in run $RUN_ID"
    echo "  → Clean install: rm -rf node_modules && pnpm install"
    echo "  → Check lockfile: git status | grep pnpm-lock.yaml"
  fi
done

# 4. Suggested Local Reproduction
print_header "4. Reproduce Failures Locally"

echo "Run these commands to reproduce failures locally:"
echo ""
echo "# Full quality check (recommended)"
echo "pnpm run workflow:2-check"
echo ""
echo "# Or individual checks:"
echo "pnpm build                    # Build all packages"
echo "pnpm lint                     # Lint check"
echo "pnpm test                     # Unit tests"
echo "pnpm --filter @glxmart/boss-cli test:integration       # Integration tests"
echo "pnpm --filter @glxmart/conductor-mcp test:integration  # Integration tests"
echo "pnpm --filter @glxmart/conductor-mcp test:e2e          # E2E tests"
echo ""

# 5. Download Logs (if requested)
if [ "$DOWNLOAD_LOGS" = true ]; then
  print_header "5. Downloading Failed Run Logs"

  LOGS_DIR="workflow-logs-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$LOGS_DIR"

  for RUN_ID in $FAILED_RUN_IDS; do
    echo "Downloading logs for run $RUN_ID..."
    $GH_CMD run download "$RUN_ID" --dir "$LOGS_DIR/$RUN_ID" 2>/dev/null || {
      print_warning "Could not download logs for run $RUN_ID (may not be available)"
    }
  done

  print_success "Logs downloaded to: $LOGS_DIR"
fi

# 6. Re-run Failed Workflows (if requested)
if [ "$RERUN" = true ]; then
  print_header "6. Re-running Failed Workflows"

  for RUN_ID in $FAILED_RUN_IDS; do
    echo "Re-running workflow $RUN_ID..."
    $GH_CMD run rerun "$RUN_ID" --failed 2>/dev/null || {
      print_warning "Could not re-run workflow $RUN_ID (may already be re-running)"
    }
  done

  print_success "Failed workflows re-triggered"
  echo "Monitor progress with: gh run list --limit 5"
fi

# 7. Summary and Next Steps
print_header "7. Summary & Next Steps"

echo "Workflow Status:"
echo "  - Total runs checked: $LIMIT"
echo "  - Failed runs: $FAILED_COUNT"
echo ""

if [ "$FAILED_COUNT" -gt 0 ]; then
  echo "Recommended Actions:"
  echo "  1. Review failure details above"
  echo "  2. Reproduce failures locally (see section 4)"
  echo "  3. Fix issues and commit changes"
  echo "  4. Push to trigger new workflow run"
  echo ""
  echo "Manual Investigation:"
  echo "  - View specific run: gh run view <run-id>"
  echo "  - Download logs: ./scripts/troubleshoot-workflows.sh --download-logs"
  echo "  - Re-run failed: ./scripts/troubleshoot-workflows.sh --rerun"
  echo ""
  echo "Get Help:"
  echo "  - ./scripts/troubleshoot-workflows.sh --help"
  echo "  - Workflow docs: .github/workflows/README.md"
  echo "  - Debugging guide: CLAUDE.md (search 'Debugging GitHub Workflows')"
else
  print_success "All workflows passing! 🎉"
fi
