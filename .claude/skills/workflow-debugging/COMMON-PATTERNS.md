# Common Workflow Failure Patterns

## Overview

This document catalogs common GitHub Actions workflow failure patterns seen in BOSS projects, their causes, and solutions.

## Test Failures

### Pattern: Unit Test Failures

**Detection**:

```
FAIL src/utils/git.test.ts
  ● Test suite failed to run
    Error: Command failed: git status
```

**Common Causes**:

1. Tests depend on git state
2. Missing test fixtures
3. Changed implementation behavior
4. Flaky tests (timing issues)

**Solutions**:

- Fix git-dependent tests with flexible assertions
- Add proper test fixtures in beforeEach
- Fix flaky tests with proper waits and deterministic mocks

### Pattern: Integration Test Failures

**Detection**:

```
FAIL tests/integration/bootstrap.test.ts
  ● Bootstrap integration tests › creates project structure
    Expected directory to exist: /tmp/test-project/.boss
```

**Common Causes**:

1. File system operations failed
2. Missing dependencies
3. Permission issues
4. Temp directory cleanup

**Solutions**:

- Ensure cleanup in afterEach hooks
- Check permissions before tests
- Verify dependencies in beforeAll

### Pattern: E2E Test Failures

**Detection**:

```
FAIL tests/e2e/boss-workflow.test.ts
  ● BOSS workflow › spawns worker and completes task
    Error: Worker spawn timed out after 180000ms
```

**Common Causes**:

1. Network issues
2. Container startup timeout
3. OAuth token issues
4. Resource constraints

**Solutions**:

- Increase timeouts for slow operations
- Verify OAuth token is set correctly
- Add retry logic for transient failures

## Build Failures

### Pattern: TypeScript Compilation Errors

**Detection**:

```
Error: src/generators/claude-md.ts(45,7): error TS2322:
  Type 'string | undefined' is not assignable to type 'string'.
```

**Common Causes**:

1. Missing null checks
2. Incorrect types
3. Missing imports
4. tsconfig changes

**Solutions**:

- Add null checks with ?? operator
- Fix type errors or use type assertions
- Update imports

### Pattern: Missing Dependencies

**Detection**:

```
Error: Cannot find module '@glxmart/conductor-mcp'
```

**Common Causes**:

1. Forgot to install after adding dependency
2. Wrong workspace reference
3. Missing in package.json
4. Lockfile out of sync

**Solutions**:

- Install dependency with pnpm add
- Fix workspace reference to use "workspace:\*"
- Update lockfile with pnpm install

## Lint Failures

### Pattern: ESLint Rule Violations

**Detection**:

```
Error: 'unused-var' is defined but never used  @typescript-eslint/no-unused-vars
```

**Common Causes**:

1. Unused imports
2. Unused variables
3. Code style violations

**Solutions**:

- Remove unused code
- Auto-fix with pnpm lint --fix
- Prefix unused params with underscore

## Security Failures

### Pattern: Hardcoded Secrets

**Detection**:

```
⚠️  Warning: Potential hardcoded secrets detected
   src/config/api.ts
```

**Solutions**:

- Use environment variables
- Use 1Password references (op://)
- Mark test fixtures as fake

### Pattern: Dependency Vulnerabilities

**Detection**:

```
⚠️  Warning: Security vulnerabilities found in dependencies
```

**Solutions**:

- Auto-fix with pnpm audit fix
- Manually update packages
- Document accepted risks

## Recovery Strategies

### Quick Fixes

1. **Re-run Workflow**: Transient failures often pass on retry
2. **Clear Cache**: Delete workflow cache
3. **Update Dependencies**: pnpm update && pnpm install
4. **Rebuild**: rm -rf dist node_modules && pnpm install && pnpm build

### Investigation Tools

```bash
# View detailed logs
gh run view <run-id> --log-failed

# Download logs
gh run download <run-id>

# Check workflow runs
gh run list --workflow "Test" --limit 10
```

### Prevention

1. **Run Local Checks**: Use quality gates before pushing
2. **Keep Dependencies Updated**: Regular pnpm update
3. **Monitor Workflows**: Check status dashboard
4. **Review Changes**: Careful code review
5. **Add Tests**: Prevent regressions

## Pattern Detection Strings

Quick reference for automated pattern detection:

| Pattern           | Detection String                           | Category   |
| ----------------- | ------------------------------------------ | ---------- |
| Test failures     | `FAIL\|AssertionError\|Error:.*test`       | Test       |
| Build failures    | `Build failed\|TypeScript error\|npm ERR!` | Build      |
| Lint failures     | `ESLint\|Linting`                          | Lint       |
| Dependency issues | `pnpm install failed\|Cannot find module`  | Dependency |
| Security issues   | `hardcoded.*secret\|vulnerability`         | Security   |

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [BOSS Workflow Documentation](../../../.github/workflows/README.md)
- [Vitest Troubleshooting](https://vitest.dev/guide/debugging.html)
- [TypeScript Compiler Errors](https://www.typescriptlang.org/docs/handbook/error-messages.html)
- [ESLint Rules](https://eslint.org/docs/rules/)
