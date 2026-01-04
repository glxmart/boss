#!/bin/bash
set -e

TEST_DIR="/tmp/boss-test-nextjs-$$"
BOSS_CLI="/Users/joe/code-glx/boss/boss-cli/dist/index.js"

echo "Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo ""
echo "========================================="
echo "Testing: nextjs-app-turbo (startup)"
echo "========================================="
node "$BOSS_CLI" bootstrap \
  --name="test-nextjs" \
  --template="nextjs-app-turbo" \
  --quality="startup" \
  --non-interactive \
  --mcp-scope=project

cd test-nextjs

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
echo "Generating Prisma client..."
cd packages/database && pnpm db:generate && cd ../..

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
echo "Building project..."
pnpm build

echo ""
echo "========================================="
echo "✅ ALL TESTS PASSED for nextjs-app-turbo!"
echo "========================================="
echo ""
echo "Test preserved at: $TEST_DIR"
