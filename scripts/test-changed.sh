#!/bin/bash
# Test changed files script (monorepo version)
# Runs tests related to staged TypeScript files in each package
# Only runs if tests are fast enough (optional optimization)

set -e

# Get list of staged TypeScript files
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' || true)

if [ -z "$changed_files" ]; then
  echo "ℹ️  No TypeScript files changed, skipping tests"
  exit 0
fi

# Separate files by package
boss_cli_files=""
conductor_mcp_files=""

for file in $changed_files; do
  if echo "$file" | grep -q "^boss-cli/"; then
    boss_cli_files="$boss_cli_files $file"
  elif echo "$file" | grep -q "^conductor-mcp/"; then
    conductor_mcp_files="$conductor_mcp_files $file"
  fi
done

# Function to find and run tests for a package
run_package_tests() {
  local package_name=$1
  local package_path=$2
  local files=$3

  if [ -z "$files" ]; then
    return 0
  fi

  echo "🧪 Running tests for $package_name..."

  # Find related test files (exclude e2e, integration, and container tests)
  test_files=""
  for file in $files; do
    # Remove package prefix (e.g., boss-cli/ or conductor-mcp/)
    local_file=$(echo "$file" | sed "s|^$package_path/||")

    # Skip e2e and integration tests - too slow for pre-commit
    if echo "$local_file" | grep -qE '(tests/(e2e|integration)/|\.(e2e|integration)\.test\.ts$)'; then
      continue
    fi

    # Skip if file is already a test file
    if echo "$local_file" | grep -q '\.test\.ts$'; then
      # Skip container tests that require Docker
      if echo "$local_file" | grep -qE '(mock-container|container.*test)'; then
        echo "  ⏭️  Skipping $file (requires containers/Docker)"
        continue
      fi
      if [ -f "$file" ]; then
        test_files="$test_files $file"
      fi
      continue
    fi

    # Convert src/foo/bar.ts -> tests/foo/bar.test.ts or __tests__
    test_file_tests=$(echo "$file" | sed 's|/src/|/tests/|' | sed 's|\.ts$|.test.ts|')
    test_file_tests_alt=$(echo "$file" | sed 's|\.ts$|.test.ts|')

    if [ -f "$test_file_tests" ]; then
      # Skip e2e and integration tests
      if echo "$test_file_tests" | grep -qE 'tests/(e2e|integration)/'; then
        echo "  ⏭️  Skipping $test_file_tests (e2e/integration test)"
        continue
      fi
      # Skip container tests
      if echo "$test_file_tests" | grep -qE '(mock-container|container.*test)'; then
        echo "  ⏭️  Skipping $test_file_tests (requires containers/Docker)"
        continue
      fi
      test_files="$test_files $test_file_tests"
    elif [ -f "$test_file_tests_alt" ]; then
      if echo "$test_file_tests_alt" | grep -qE 'tests/(e2e|integration)/'; then
        echo "  ⏭️  Skipping $test_file_tests_alt (e2e/integration test)"
        continue
      fi
      if echo "$test_file_tests_alt" | grep -qE '(mock-container|container.*test)'; then
        echo "  ⏭️  Skipping $test_file_tests_alt (requires containers/Docker)"
        continue
      fi
      test_files="$test_files $test_file_tests_alt"
    fi
  done

  if [ -z "$test_files" ]; then
    echo "  ℹ️  No related test files found for $package_name"
    return 0
  fi

  echo "  Running tests:"
  for test_file in $test_files; do
    echo "    - $test_file"
  done

  # Run the tests in the package directory
  cd "$package_path"
  test_output=$(pnpm test -- $test_files --reporter=dot 2>&1 || true)
  echo "$test_output"
  cd - > /dev/null

  # Check if tests actually passed
  if echo "$test_output" | grep -q "✓.*tests"; then
    # Tests passed, check for actual test failures
    if echo "$test_output" | grep -qE "(✗|FAIL|failed)"; then
      echo "❌ Tests for $package_name failed"
      return 1
    else
      echo "✅ Tests for $package_name passed"
      return 0
    fi
  else
    # No test summary found, something went wrong
    echo "❌ Tests for $package_name failed"
    return 1
  fi
}

# Run tests for each package
exit_code=0

if [ -n "$boss_cli_files" ]; then
  if ! run_package_tests "boss-cli" "boss-cli" "$boss_cli_files"; then
    exit_code=1
  fi
fi

if [ -n "$conductor_mcp_files" ]; then
  if ! run_package_tests "conductor-mcp" "conductor-mcp" "$conductor_mcp_files"; then
    exit_code=1
  fi
fi

exit $exit_code

