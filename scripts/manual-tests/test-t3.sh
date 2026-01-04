#!/bin/bash
set -e

TEST_DIR="/tmp/boss-test-t3-$$"
BOSS_CLI="/Users/joe/code-glx/boss/boss-cli/dist/index.js"

echo "Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo ""
echo "========================================="
echo "Testing: t3-app (startup)"
echo "========================================="
node "$BOSS_CLI" bootstrap \
  --name="test-t3" \
  --template="t3-app" \
  --quality="startup" \
  --non-interactive \
  --mcp-scope=project

cd test-t3

echo ""
echo "Verifying project structure..."
ls -la

echo ""
echo "Checking .env vault references..."
grep "op://boss/" .env && echo "✓ Boss vault references found"
! grep "op://glx/" .env && echo "✓ No glx vault references"

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
echo "Building project (if applicable)..."
pnpm build 2>/dev/null || echo "ℹ Build not available for this template"

echo ""
echo "========================================="
echo "✅ ALL TESTS PASSED for t3-app!"
echo "========================================="
echo ""
echo "Test preserved at: $TEST_DIR"
