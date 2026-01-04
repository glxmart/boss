#!/bin/bash
set -e

TEST_DIR="/tmp/boss-test-api-service-$$"
BOSS_CLI="/Users/joe/code-glx/boss/boss-cli/dist/index.js"

echo "Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo ""
echo "========================================="
echo "Testing: api-service-fastify (startup)"
echo "========================================="
node "$BOSS_CLI" bootstrap \
  --name="test-api-service" \
  --template="api-service-fastify" \
  --quality="startup" \
  --non-interactive \
  --mcp-scope=project

cd test-api-service

echo ""
echo "Verifying project structure..."
ls -la

echo ""
echo "Checking .env vault references..."
grep "op://boss/" .env && echo "✓ Boss vault references found"
! grep "op://glx/" .env && echo "✓ No glx vault references"

echo ""
echo "Checking setup script..."
[ -x "scripts/setup-1password.sh" ] && echo "✓ Setup script is executable"

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
echo "Building project..."
pnpm build

echo ""
echo "Checking build output..."
[ -d "dist" ] && echo "✓ Build output created"

echo ""
echo "========================================="
echo "✅ ALL TESTS PASSED for api-service-fastify!"
echo "========================================="
echo ""
echo "Test preserved at: $TEST_DIR"
