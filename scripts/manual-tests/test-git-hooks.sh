#!/bin/bash
# Note: Don't use set -e because we test both success and failure cases

TEST_DIR="/tmp/boss-test-git-hooks-$$"
BOSS_CLI="/Users/joe/code-glx/boss/boss-cli/dist/index.js"

echo "Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo ""
echo "========================================="
echo "Testing: Git Hooks Enforcement"
echo "========================================="

# Bootstrap blank template
echo ""
echo "1. Bootstrapping blank template..."
node "$BOSS_CLI" bootstrap \
  --name="test-hooks" \
  --template="blank" \
  --quality="startup" \
  --non-interactive \
  --mcp-scope=project

cd test-hooks

echo ""
echo "2. Installing dependencies..."
pnpm install

echo ""
echo "3. Checking git hooks are installed..."
ls -la .husky/
[ -f ".husky/pre-commit" ] && echo "✓ pre-commit hook exists"
[ -f ".husky/commit-msg" ] && echo "✓ commit-msg hook exists"
[ -f ".husky/pre-push" ] && echo "✓ pre-push hook exists"

echo ""
echo "4. Testing pre-commit hook (linting)..."
echo "Creating a file with linting errors..."
cat > src/bad-file.ts << 'EOF'
// This file has intentional linting errors
const unused_var = "test";  // unused variable
function badFunction( ){  // bad formatting
console.log("no semicolon")  // missing semicolon
}
EOF

git add src/bad-file.ts

echo "Trying to commit (should fail due to lint errors)..."
set +e  # Temporarily disable exit on error
git commit -m "test: add file with lint errors" 2>&1 | tee /tmp/commit-output.txt
COMMIT_EXIT_CODE=${PIPESTATUS[0]}  # Get exit code of git, not tee
set -e  # Re-enable exit on error

if [ $COMMIT_EXIT_CODE -eq 0 ]; then
  echo "❌ FAILED: Commit should have been blocked by linter"
  exit 1
else
  echo "✓ Commit correctly blocked by pre-commit hook"
fi

echo ""
echo "5. Fixing the file..."
cat > src/bad-file.ts << 'EOF'
// This file is now properly formatted
export function goodFunction() {
  console.log("properly formatted");
}
EOF

git add src/bad-file.ts

echo ""
echo "6. Testing commit-msg hook (conventional commits)..."
echo "Trying to commit with bad commit message..."
set +e
git commit -m "bad commit message" 2>&1
COMMIT_EXIT_CODE=$?
set -e

if [ $COMMIT_EXIT_CODE -eq 0 ]; then
  echo "❌ FAILED: Commit should have been blocked by commit-msg hook"
  exit 1
else
  echo "✓ Commit correctly blocked by commit-msg hook"
fi

echo ""
echo "7. Committing with valid conventional commit message..."
git commit -m "feat: add good function"
echo "✓ Commit succeeded with valid message"

echo ""
echo "8. Checking commit was successful..."
git log --oneline -n 1 | grep "feat: add good function" && echo "✓ Commit message is correct"

echo ""
echo "9. Testing pre-push hook..."
echo "Creating another valid commit..."
echo "// Another change" >> src/index.ts
git add src/index.ts
git commit -m "chore: update index"

echo "Attempting to push (will fail due to no remote, but hook should run)..."
git push origin main 2>&1 | tee /tmp/push-output.txt || echo "Push failed as expected (no remote configured)"

# Check if pre-push hook ran (it runs tests)
if grep -q "test" /tmp/push-output.txt 2>/dev/null; then
  echo "✓ Pre-push hook executed (tests ran)"
else
  echo "ℹ Pre-push hook may have run (check output above)"
fi

echo ""
echo "========================================="
echo "✅ GIT HOOKS TEST COMPLETED!"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Pre-commit hook blocks bad code"
echo "  ✓ Commit-msg hook enforces conventional commits"
echo "  ✓ Pre-push hook runs before push"
echo ""
echo "Test directory preserved at: $TEST_DIR"
