#!/bin/bash
set -e

TEST_DIR="/tmp/boss-bootstrap-test-$$"
BOSS_CLI="/Users/joe/code-glx/boss/boss-cli/dist/index.js"

echo "Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo ""
echo "========================================="
echo "Testing: blank template (startup quality)"
echo "========================================="
node "$BOSS_CLI" bootstrap \
  --name="test-blank" \
  --template="blank" \
  --quality="startup" \
  --non-interactive \
  --mcp-scope=project

cd test-blank

echo ""
echo "Checking bootstrapped files..."
ls -la

echo ""
echo "Checking .env vault references..."
grep "op://boss/" .env || echo "ERROR: Missing boss vault references"
grep "op://glx/" .env && echo "ERROR: Found glx vault references (should be boss)"

echo ""
echo "Checking setup script..."
ls -la scripts/setup-1password.sh

echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "Running type check..."
pnpm typecheck

echo ""
echo "Running lint..."
pnpm lint

echo ""
echo "Running tests..."
pnpm test:unit

echo ""
echo "========================================="
echo "All tests passed for blank template!"
echo "========================================="

cd ..
echo ""
echo "Test directory preserved at: $TEST_DIR"
echo "To clean up: rm -rf $TEST_DIR"
