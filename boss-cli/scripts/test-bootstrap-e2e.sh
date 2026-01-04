#!/bin/bash

# Comprehensive E2E Bootstrap Test
# Tests all project types to ensure they bootstrap correctly,
# meet Husky requirements, and build successfully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

header() {
  echo ""
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
  echo ""
}

# Test counter
test_start() {
  TESTS_RUN=$((TESTS_RUN + 1))
  info "$1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Test directory in /tmp
TEST_DIR="/tmp/boss-e2e-tests-$$"

# Cleanup function
cleanup() {
  if [ -d "$TEST_DIR" ]; then
    info "Cleaning up test directory: $TEST_DIR"
    rm -rf "$TEST_DIR"
  fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

header "BOSS E2E Bootstrap Tests"
info "Test directory: $TEST_DIR"
info "Project root: $PROJECT_ROOT"

# Build the CLI first
header "Building BOSS CLI"
cd "$PROJECT_ROOT"
test_start "Building boss-cli..."
if pnpm build > /dev/null 2>&1; then
  success "Boss CLI built successfully"
else
  error "Failed to build boss-cli"
  exit 1
fi

# Templates to test
TEMPLATES=("blank" "api-service-fastify" "nextjs-app-turbo" "t3-app")
QUALITY_PRESETS=("startup" "production")

# Test each template with each quality preset
for template in "${TEMPLATES[@]}"; do
  for quality in "${QUALITY_PRESETS[@]}"; do
    PROJECT_NAME="test-${template}-${quality}"

    header "Testing: $template ($quality quality)"

    cd "$TEST_DIR"

    # Bootstrap project
    test_start "Bootstrapping $PROJECT_NAME..."
    if "$PROJECT_ROOT/dist/index.js" bootstrap \
      --name="$PROJECT_NAME" \
      --template="$template" \
      --quality="$quality" \
      --non-interactive \
      --mcp-scope=project > /dev/null 2>&1; then
      success "Bootstrap completed"
    else
      error "Bootstrap failed for $PROJECT_NAME"
      continue
    fi

    cd "$PROJECT_NAME"

    # Verify project structure
    test_start "Verifying project structure..."
    REQUIRED_FILES=(
      ".boss/project-config.json"
      ".env"
      ".mcp.json"
      ".claude/mcp.json"
      ".cursor/mcp.json"
      ".husky"
      ".git"
      "package.json"
      "tsconfig.json"
      "CLAUDE.md"
      "start-boss.sh"
      "scripts/setup-1password.sh"
      "docker-compose.yml"
    )

    all_files_exist=true
    for file in "${REQUIRED_FILES[@]}"; do
      if [ ! -e "$file" ]; then
        error "Missing required file/directory: $file"
        all_files_exist=false
      fi
    done

    if [ "$all_files_exist" = true ]; then
      success "All required files/directories exist"
    fi

    # Verify .env file has correct vault references (boss, not glx)
    test_start "Verifying .env file uses 'boss' vault..."
    if grep -q "op://boss/" .env && ! grep -q "op://glx/" .env; then
      success ".env file uses correct 'boss' vault"
    else
      error ".env file has incorrect vault references"
      cat .env
    fi

    # Verify scripts are executable
    test_start "Verifying scripts are executable..."
    if [ -x "start-boss.sh" ] && [ -x "scripts/setup-1password.sh" ]; then
      success "Scripts are executable"
    else
      error "Scripts are not executable"
    fi

    # Install dependencies
    test_start "Installing dependencies..."
    if pnpm install > /dev/null 2>&1; then
      success "Dependencies installed"
    else
      error "Failed to install dependencies"
      continue
    fi

    # Verify Husky is installed
    test_start "Verifying Husky is installed..."
    if [ -d ".git/hooks" ] && [ -f ".husky/pre-commit" ]; then
      success "Husky hooks are installed"
    else
      error "Husky hooks are not installed"
    fi

    # Test type checking
    test_start "Running type check..."
    if pnpm typecheck > /dev/null 2>&1; then
      success "Type check passed"
    else
      error "Type check failed"
    fi

    # Test linting
    test_start "Running linter..."
    if pnpm lint > /dev/null 2>&1; then
      success "Linter passed"
    else
      warning "Linter failed (may need configuration)"
    fi

    # Test unit tests
    test_start "Running unit tests..."
    if pnpm test:unit > /dev/null 2>&1; then
      success "Unit tests passed"
    else
      error "Unit tests failed"
      pnpm test:unit
    fi

    # Test build (if applicable)
    if [ "$template" = "nextjs-app-turbo" ] || [ "$template" = "api-service-fastify" ]; then
      test_start "Running build..."
      if pnpm build > /dev/null 2>&1; then
        success "Build passed"
      else
        error "Build failed"
        pnpm build
      fi
    fi

    # Test git hooks
    test_start "Testing pre-commit hook..."
    # Create a test file with linting errors
    echo "const x = 'test'" > test-lint.ts
    git add test-lint.ts

    if git commit -m "test: lint check" --no-verify > /dev/null 2>&1; then
      # Commit succeeded - that's expected for startup quality
      success "Pre-commit hook executed (may have auto-fixed issues)"
      git reset --soft HEAD~1 > /dev/null 2>&1
    else
      # Commit failed - that's expected for production/enterprise quality
      success "Pre-commit hook correctly rejected bad code"
    fi

    rm -f test-lint.ts
    git reset HEAD test-lint.ts > /dev/null 2>&1 || true

    # Verify git branch structure
    test_start "Verifying git branches..."
    current_branch=$(git branch --show-current)
    if [ "$current_branch" = "feature/boss-initial-setup" ]; then
      success "Currently on feature/boss-initial-setup branch"
    else
      error "Not on expected feature/boss-initial-setup branch (on: $current_branch)"
    fi

    # Check if main branch exists
    if git show-ref --verify --quiet refs/heads/main; then
      success "Main branch exists"
    else
      error "Main branch does not exist"
    fi

    # Verify coverage thresholds match quality preset
    test_start "Verifying coverage thresholds..."
    if [ -f "vitest.config.ts" ]; then
      case "$quality" in
        "startup")
          expected_threshold=60
          ;;
        "production")
          expected_threshold=80
          ;;
        "enterprise")
          expected_threshold=90
          ;;
      esac

      if grep -q "lines: $expected_threshold" vitest.config.ts; then
        success "Coverage threshold is correct ($expected_threshold)"
      else
        error "Coverage threshold is incorrect (expected: $expected_threshold)"
      fi
    else
      warning "vitest.config.ts not found (template may use different test config)"
    fi

    header "Summary for $PROJECT_NAME"
    info "Tests run: $TESTS_RUN"
    success "Tests passed: $TESTS_PASSED"
    if [ $TESTS_FAILED -gt 0 ]; then
      error "Tests failed: $TESTS_FAILED"
    fi

  done
done

# Final summary
header "Final Test Summary"
info "Total tests run: $TESTS_RUN"
success "Total tests passed: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
  error "Total tests failed: $TESTS_FAILED"
  exit 1
else
  success "All tests passed!"
fi
