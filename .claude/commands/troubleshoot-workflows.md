# Troubleshoot GitHub Workflows

**Command**: `/troubleshoot-workflows`
**Purpose**: Diagnose and fix GitHub Actions workflow failures
**When**: After PR creation, when workflows fail in CI, before merging PRs

## Overview

This command provides automated troubleshooting for GitHub Actions workflow failures. It analyzes recent workflow runs, identifies common failure patterns, suggests local reproduction steps, and can automatically re-run failed workflows.

## Quick Start

```bash
# Quick status check (default)
./scripts/troubleshoot-workflows.sh

# Show only failed runs
./scripts/troubleshoot-workflows.sh --failed-only

# Download logs for offline analysis
./scripts/troubleshoot-workflows.sh --download-logs

# Re-run failed workflows
./scripts/troubleshoot-workflows.sh --rerun

# Show more history
./scripts/troubleshoot-workflows.sh --limit 10
```

## What It Does

The troubleshooting script performs **7 automated checks**:

### 1. Recent Workflow Runs

- Lists last N workflow runs (default: 5)
- Shows status, conclusion, branch, commit
- Counts total failures

### 2. Failure Details

- For each failed run:
  - Workflow name and branch
  - Commit message
  - First 100 lines of failed job logs
- Provides command to view full logs

### 3. Common Failure Pattern Detection

**Automatically detects:**

- ❌ **Test failures** - AssertionError, FAIL patterns
- ❌ **Build failures** - TypeScript errors, compile errors
- ❌ **Lint failures** - ESLint violations
- ❌ **Dependency issues** - pnpm install failures, missing modules

**For each pattern, suggests:**

- Local reproduction command
- Fix command
- Investigation command

### 4. Local Reproduction Steps

Provides exact commands to reproduce failures locally:

```bash
# Full quality check (recommended)
pnpm run workflow:2-check

# Or individual checks:
pnpm build                                           # Build all packages
pnpm lint                                            # Lint check
pnpm test                                            # Unit tests
pnpm --filter @glxmart/boss-cli test:integration    # Integration tests
pnpm --filter @glxmart/conductor-mcp test:e2e       # E2E tests
```

### 5. Download Logs (Optional)

With `--download-logs` flag:

- Downloads all logs from failed runs
- Creates timestamped directory: `workflow-logs-YYYYMMDD-HHMMSS/`
- Useful for offline analysis

### 6. Re-run Failed Workflows (Optional)

With `--rerun` flag:

- Re-triggers all failed workflow runs
- Only re-runs failed jobs (not entire workflow)
- Monitors re-run progress

### 7. Summary & Next Steps

Provides:

- Workflow status summary
- Recommended actions
- Manual investigation commands
- Links to documentation

## Common Troubleshooting Workflows

### Workflow 1: After PR Creation

**Scenario**: You created a PR and some workflows failed

```bash
# 1. Check what failed
./scripts/troubleshoot-workflows.sh --failed-only

# 2. Reproduce locally
pnpm run workflow:2-check

# 3. Fix issues
# ... edit code ...

# 4. Commit and push
git add .
git commit -m "fix: address workflow failures"
git push

# 5. Monitor new run
./scripts/troubleshoot-workflows.sh --limit 1
```

### Workflow 2: Investigating Specific Failure

**Scenario**: One workflow keeps failing but you're not sure why

```bash
# 1. Get failure details and pattern analysis
./scripts/troubleshoot-workflows.sh

# 2. Download logs for deep analysis
./scripts/troubleshoot-workflows.sh --download-logs

# 3. Analyze downloaded logs
cd workflow-logs-YYYYMMDD-HHMMSS/
grep -r "Error" .
grep -r "FAIL" .

# 4. Check specific workflow file
cat .github/workflows/1.0-test-boss-cli.yml

# 5. Fix and test locally
# ... reproduce and fix ...
pnpm test

# 6. Push fix
git add .
git commit -m "fix: resolve test failures"
git push
```

### Workflow 3: Flaky Test Investigation

**Scenario**: Test passes locally but fails in CI

```bash
# 1. Check if it's a consistent failure
./scripts/troubleshoot-workflows.sh --limit 10

# 2. Re-run to check if flaky
./scripts/troubleshoot-workflows.sh --rerun

# 3. Wait for re-run and check again
sleep 60
./scripts/troubleshoot-workflows.sh --limit 1

# 4. If still failing, investigate environment differences
# - File paths (use path.join, not hardcoded)
# - Environment variables
# - Git state (CI starts clean)
# - Timing/race conditions

# 5. Add debug logging to test
# ... edit test file ...
git commit -m "test: add debug logging for CI investigation"
git push
```

### Workflow 4: Pre-Merge Quality Check

**Scenario**: Before merging PR, ensure all workflows pass

```bash
# 1. Check current workflow status
./scripts/troubleshoot-workflows.sh

# 2. If any failures, identify and fix
pnpm run workflow:2-check

# 3. Verify all workflows green
./scripts/troubleshoot-workflows.sh --failed-only
# (Should show no results)

# 4. Check PR status
op run --env-file=.env -- gh pr checks <pr-number>

# 5. Merge when all green
op run --env-file=.env -- gh pr merge <pr-number> --squash
```

## Command Options

| Option            | Description                    | Example                                               |
| ----------------- | ------------------------------ | ----------------------------------------------------- |
| `--rerun`         | Re-run failed workflows        | `./scripts/troubleshoot-workflows.sh --rerun`         |
| `--download-logs` | Download logs from failed runs | `./scripts/troubleshoot-workflows.sh --download-logs` |
| `--failed-only`   | Show only failed runs          | `./scripts/troubleshoot-workflows.sh --failed-only`   |
| `--limit N`       | Show last N runs (default: 5)  | `./scripts/troubleshoot-workflows.sh --limit 10`      |
| `--help`          | Show help message              | `./scripts/troubleshoot-workflows.sh --help`          |

## Output Explanation

### Status Indicators

- ✅ **pass** - Workflow completed successfully
- ❌ **failure** - Workflow failed
- ⚠️ **warning** - Non-critical issue detected
- 🔄 **in_progress** - Workflow currently running

### Common Failure Patterns

**Test Failures**

```
Pattern: Test failures detected in run 12345678
→ Run tests locally: pnpm test
→ Check specific failures: gh run view 12345678 --log-failed | grep -A 10 FAIL
```

**Build Failures**

```
Pattern: Build failures detected in run 12345678
→ Run build locally: pnpm build
→ Check TypeScript errors: pnpm typecheck
```

**Lint Failures**

```
Pattern: Linting errors detected in run 12345678
→ Run lint locally: pnpm lint
→ Auto-fix: pnpm lint --fix
```

**Dependency Issues**

```
Pattern: Dependency issues detected in run 12345678
→ Clean install: rm -rf node_modules && pnpm install
→ Check lockfile: git status | grep pnpm-lock.yaml
```

## Manual Troubleshooting Operations

When automated troubleshooting isn't enough, use these manual commands:

### View Specific Workflow Run

```bash
# Get run details
op run --env-file=.env -- gh run view <run-id>

# View failed logs only
op run --env-file=.env -- gh run view <run-id> --log-failed

# Download all logs
op run --env-file=.env -- gh run download <run-id>
```

### Check Workflow Status

```bash
# List recent runs
op run --env-file=.env -- gh run list --limit 5

# List runs for specific workflow
op run --env-file=.env -- gh run list --workflow "1.0 - Test boss-cli"

# List runs for specific branch
op run --env-file=.env -- gh run list --branch feature/my-feature
```

### Re-run Workflows

```bash
# Re-run entire workflow
op run --env-file=.env -- gh run rerun <run-id>

# Re-run only failed jobs
op run --env-file=.env -- gh run rerun <run-id> --failed

# Re-run specific job
op run --env-file=.env -- gh run rerun <run-id> --job <job-id>
```

### Check PR Workflow Status

```bash
# View PR checks
op run --env-file=.env -- gh pr checks <pr-number>

# View PR details
op run --env-file=.env -- gh pr view <pr-number>

# View PR diff
op run --env-file=.env -- gh pr diff <pr-number>
```

### Analyze Workflow JSON

```bash
# Get JSON output for parsing
op run --env-file=.env -- gh run list --limit 3 --json conclusion,name,status,headBranch

# Check if latest run passed
op run --env-file=.env -- gh run list --limit 1 --json conclusion --jq '.[0].conclusion'
# Output: "success", "failure", "cancelled", etc.
```

## Pre-Push Hooks

**IMPORTANT**: Most workflow failures should be caught by pre-push hooks before reaching CI.

Pre-push hooks run:

- ✅ Build all packages
- ✅ Lint check
- ✅ Security checks
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests

If workflows are failing in CI but passed locally:

1. Ensure pre-push hooks are installed: `pnpm prepare`
2. Check hooks are executable: `ls -la .git/hooks/pre-push`
3. Verify hooks content matches: `cat .git/hooks/pre-push`
4. Run hooks manually: `bash scripts/pre-push.sh`

## Workflow Documentation

For complete workflow documentation, see:

- **Workflow overview**: `.github/workflows/README.md`
- **Individual workflow files**: `.github/workflows/*.yml`
- **Release process**: `docs/RELEASE.md`
- **Debugging guide**: Search "Debugging GitHub Workflows" in `CLAUDE.md`

## Troubleshooting Tips

### Always Check the First Error

Often subsequent errors are cascading failures from the first error. Focus on fixing the first error first.

### Compare with Previous Successful Runs

```bash
# Find last successful run
op run --env-file=.env -- gh run list --json conclusion,databaseId | jq '.[] | select(.conclusion == "success") | .databaseId' | head -1

# Compare failed run with successful run
op run --env-file=.env -- gh run view <failed-run-id>
op run --env-file=.env -- gh run view <successful-run-id>
```

### Check Workflow File Changes

```bash
# See if workflow files changed recently
git log --oneline --all -- .github/workflows/

# View specific workflow file
cat .github/workflows/1.0-test-boss-cli.yml
```

### Test Workflow Locally with Act

For complex workflow debugging, use [act](https://github.com/nektos/act) to run workflows locally:

```bash
# Install act
brew install act

# Run specific workflow
act -j "test-boss-cli"

# Run with specific event
act pull_request
```

## Common Issues & Solutions

### Issue: "Missing required token scopes"

**Solution**: Update GitHub token in 1Password

```bash
# 1. Generate new token with required scopes
open https://github.com/settings/tokens/new

# 2. Update 1Password
op item edit boss/github --field token="ghp_YOUR_NEW_TOKEN_HERE"

# 3. Verify
op run --env-file=.env -- gh auth status
```

### Issue: Workflow triggered but not running

**Solution**: Check workflow path triggers

```bash
# View workflow file
cat .github/workflows/1.0-test-boss-cli.yml

# Check if your changes match path triggers
git diff origin/main --name-only
```

### Issue: Tests pass locally but fail in CI

**Checklist**:

- [ ] File paths use `path.join()`, not hardcoded
- [ ] Environment variables set in workflow
- [ ] Git state clean (CI starts fresh)
- [ ] Dependencies in `package.json`
- [ ] Lockfile committed (`pnpm-lock.yaml`)

### Issue: "Resource not accessible by integration"

**Solution**: Check GitHub Actions permissions

```yaml
# In workflow file, ensure permissions are set
permissions:
  contents: write
  pull-requests: write
```

## Success Criteria

✅ All workflows passing (4/4 checks green)
✅ No failed runs in recent history
✅ Pre-push hooks catching failures locally
✅ Workflow logs clear and actionable
✅ Quick feedback loop (< 2 minutes)

## Related Commands

- `/1-start-feature` - Start feature branch
- `/2-quality-check` - Run local quality validation
- `/3-create-changeset` - Create changeset
- `/4-create-pr` - Create pull request

## Examples

### Example 1: Quick Workflow Check

```bash
$ ./scripts/troubleshoot-workflows.sh

=== GitHub Workflow Troubleshooting ===

=== 1. Recent Workflow Runs ===

completed  success  feat: customize worker files  2.0 - Integration Tests  feature/...  pull_request  20685746418  31s  2026-01-04T01:32:39Z
completed  success  feat: customize worker files  1.0 - Test boss-cli       feature/...  pull_request  20685746406  31s  2026-01-04T01:32:39Z
completed  success  feat: customize worker files  0.5 - Changeset Check     feature/...  pull_request  20685746399  10s  2026-01-04T01:32:39Z

✅ No failed workflows in last 5 runs
```

### Example 2: Failure Detection and Fix

```bash
$ ./scripts/troubleshoot-workflows.sh --failed-only

=== GitHub Workflow Troubleshooting ===

=== 1. Recent Workflow Runs ===

⚠️  Found 1 failed workflow(s)

=== 2. Failure Details ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
=== Run ID: 12345678 ===

Workflow: 1.1 - Test conductor-mcp
Branch: feature/my-feature
Commit: fix: update tests

=== Failed Job Logs ===

❌ Pattern: Test failures detected in run 12345678
  → Run tests locally: pnpm test
  → Check specific failures: gh run view 12345678 --log-failed | grep -A 10 FAIL

=== 4. Reproduce Failures Locally ===

# Full quality check (recommended)
pnpm run workflow:2-check

=== 7. Summary & Next Steps ===

Recommended Actions:
  1. Review failure details above
  2. Reproduce failures locally (see section 4)
  3. Fix issues and commit changes
  4. Push to trigger new workflow run
```

## Notes

- Script uses 1Password CLI for GitHub authentication (falls back to system auth if unavailable)
- Downloads logs only when explicitly requested (saves bandwidth)
- Re-runs only failed jobs, not entire workflow (saves CI minutes)
- Automatically detects monorepo root for correct .env file location
- Works with both `gh` CLI and `op` (1Password CLI)

## Getting Help

If troubleshooting script doesn't help:

1. Check workflow documentation: `.github/workflows/README.md`
2. Review debugging guide in `CLAUDE.md`
3. Check recent commits for workflow file changes
4. Compare with successful runs
5. Ask in PR comments for team help
