#!/bin/bash
# Test changed files script
# Runs tests related to staged TypeScript files
# Only runs if tests are fast enough (optional optimization)

set -e

# Get list of staged TypeScript files
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' || true)

if [ -z "$changed_files" ]; then
  echo "ℹ️  No TypeScript files changed, skipping tests"
  exit 0
fi

# Find related test files (exclude e2e, integration, and container tests)
test_files=""
for file in $changed_files; do
  # Skip e2e and integration tests - too slow for pre-commit
  if echo "$file" | grep -qE '(tests/(e2e|integration)/|\.(e2e|integration)\.test\.ts$)'; then
    continue
  fi
  
  # Skip if file is already a test file
  if echo "$file" | grep -q '\.test\.ts$'; then
    # Skip container tests that require Docker
    if echo "$file" | grep -qE '(mock-container|container.*test)'; then
      echo "  ⏭️  Skipping $file (requires containers/Docker)"
      continue
    fi
    if [ -f "$file" ]; then
      test_files="$test_files $file"
    fi
    continue
  fi

  # Convert src/foo/bar.ts -> tests/foo/bar.test.ts
  test_file=$(echo "$file" | sed 's|^src/|tests/|' | sed 's|\.ts$|.test.ts|')

  if [ -f "$test_file" ]; then
    # Skip e2e and integration tests - too slow for pre-commit
    if echo "$test_file" | grep -qE 'tests/(e2e|integration)/'; then
      echo "  ⏭️  Skipping $test_file (e2e/integration test)"
      continue
    fi
    # Skip container tests that require Docker
    if echo "$test_file" | grep -qE '(mock-container|container.*test)'; then
      echo "  ⏭️  Skipping $test_file (requires containers/Docker)"
      continue
    fi
    test_files="$test_files $test_file"
  fi
done

if [ -z "$test_files" ]; then
  echo "ℹ️  No related test files found for changed files"
  exit 0
fi

echo "🧪 Running tests for changed files..."
for test_file in $test_files; do
  echo "  Running: $test_file"
done

# Run the tests and capture output
test_output=$(pnpm vitest run $test_files --reporter=dot 2>&1 || true)
echo "$test_output"

# Check if tests actually passed (look for test summary before potential worker cleanup crash)
# vitest v4 output format: "Test Files  1 passed (1)" or "Tests  1 passed (1)"
if echo "$test_output" | grep -qE "(passed|✓)"; then
  # Tests passed, check for actual test failures
  if echo "$test_output" | grep -qE "(✗|FAIL|failed)"; then
    echo "❌ Tests for changed files failed"
    exit 1
  else
    echo "✅ Tests for changed files passed"
    exit 0
  fi
else
  # No test summary found, something went wrong
  echo "❌ Tests for changed files failed"
  exit 1
fi

