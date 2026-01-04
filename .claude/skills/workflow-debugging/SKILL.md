---
name: workflow-debugging
description: Diagnoses and troubleshoots GitHub Actions workflow failures. Use when CI/CD fails, workflows error, or need to analyze build/test failures in GitHub Actions.
allowed-tools: Bash, Read
---

# Workflow Debugging

## Overview

This skill helps diagnose and troubleshoot GitHub Actions workflow failures. It provides automated analysis of failed runs, common pattern detection, and actionable recommendations for fixes.

## Quick Start

### Troubleshoot Recent Failures

```bash
.claude/skills/workflow-debugging/tools/troubleshoot-workflows.sh
```

Or ask Claude:

- "Troubleshoot workflow failures"
- "Why did CI fail?"
- "Debug GitHub Actions"
- "Check workflow status"

### Show Only Failed Runs

```bash
.claude/skills/workflow-debugging/tools/troubleshoot-workflows.sh --failed-only
```

### Download Failed Logs

```bash
.claude/skills/workflow-debugging/tools/troubleshoot-workflows.sh --download-logs
```

### Re-run Failed Workflows

```bash
.claude/skills/workflow-debugging/tools/troubleshoot-workflows.sh --rerun
```

## How It Works

The troubleshoot-workflows tool performs 7-step analysis:

### 1. Recent Workflow Runs

Lists recent workflow runs with status:

- ✅ Success (green)
- ❌ Failure (red)
- 🔄 In progress (yellow)
- ⏭️ Skipped (gray)

**Output Example:**

```
=== 1. Recent Workflow Runs ===

STATUS  NAME                    BRANCH              TITLE
✓       Test boss-cli          feature/new-feature  feat: add new feature
✗       Integration Tests      feature/new-feature  feat: add new feature
✓       Test conductor-mcp     feature/new-feature  feat: add new feature
```

### 2. Failure Details

For each failed run, shows:

- Run ID
- Workflow name
- Branch and commit
- Failed job logs (first 100 lines)

**Output Example:**

```
=== 2. Failure Details ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== Run ID: 12345678 ===

Workflow: Integration Tests
Branch: feature/new-feature
Commit: feat: add new feature

=== Failed Job Logs ===

Error: Command failed: pnpm test
  ● Test suite failed to run
    Cannot find module './missing-file'
```

### 3. Common Pattern Detection

Automatically detects and categorizes failures:

**Test Failures**

```
❌ Pattern: Test failures detected in run 12345678
  → Run tests locally: pnpm test
  → Check specific failures: gh run view 12345678 --log-failed | grep -A 10 FAIL
```

**Build Failures**

```
❌ Pattern: Build failures detected in run 12345678
  → Run build locally: pnpm build
  → Check TypeScript errors: pnpm typecheck
```

**Lint Failures**

```
❌ Pattern: Linting errors detected in run 12345678
  → Run lint locally: pnpm lint
  → Auto-fix: pnpm lint --fix
```

**Dependency Issues**

```
❌ Pattern: Dependency issues detected in run 12345678
  → Clean install: rm -rf node_modules && pnpm install
  → Check lockfile: git status | grep pnpm-lock.yaml
```

### 4. Local Reproduction

Provides commands to reproduce failures locally:

```
=== 4. Reproduce Failures Locally ===

Run these commands to reproduce failures locally:

# Full quality check (recommended)
pnpm run workflow:2-check

# Or individual checks:
pnpm build                    # Build all packages
pnpm lint                     # Lint check
pnpm test                     # Unit tests
pnpm --filter @glxmart/boss-cli test:integration       # Integration tests
pnpm --filter @glxmart/conductor-mcp test:integration  # Integration tests
pnpm --filter @glxmart/conductor-mcp test:e2e          # E2E tests
```

### 5. Download Logs (Optional)

Downloads complete logs for offline analysis:

```
=== 5. Downloading Failed Run Logs ===

Downloading logs for run 12345678...
✅ Logs downloaded to: workflow-logs-20260104-143022
```

### 6. Re-run Workflows (Optional)

Re-triggers failed workflow runs:

```
=== 6. Re-running Failed Workflows ===

Re-running workflow 12345678...
✅ Failed workflows re-triggered
Monitor progress with: gh run list --limit 5
```

### 7. Summary & Next Steps

Provides summary and actionable next steps:

```
=== 7. Summary & Next Steps ===

Workflow Status:
  - Total runs checked: 5
  - Failed runs: 1

Recommended Actions:
  1. Review failure details above
  2. Reproduce failures locally (see section 4)
  3. Fix issues and commit changes
  4. Push to trigger new workflow run

Manual Investigation:
  - View specific run: gh run view <run-id>
  - Download logs: ./tools/troubleshoot-workflows.sh --download-logs
  - Re-run failed: ./tools/troubleshoot-workflows.sh --rerun

Get Help:
  - Workflow docs: .github/workflows/README.md
  - Debugging guide: CLAUDE.md (search 'Debugging GitHub Workflows')
```

## Command Options

### Basic Usage

```bash
# Default: Show last 5 runs with quick analysis
./tools/troubleshoot-workflows.sh
```

### Advanced Options

```bash
# Show only failed runs
./tools/troubleshoot-workflows.sh --failed-only

# Download logs from failed runs
./tools/troubleshoot-workflows.sh --download-logs

# Re-run failed workflows
./tools/troubleshoot-workflows.sh --rerun

# Show more runs (default: 5)
./tools/troubleshoot-workflows.sh --limit 10

# Combine options
./tools/troubleshoot-workflows.sh --failed-only --download-logs --limit 20

# Show help
./tools/troubleshoot-workflows.sh --help
```

## Common Failure Patterns

### Test Failures

**Symptoms**:

- "FAIL" in logs
- "AssertionError" messages
- "Error:.\*test" patterns

**Common Causes**:

- Broken tests
- Changed behavior
- Missing test setup
- Environment differences

**Fix**:

```bash
# Run tests locally
pnpm test

# Run specific test file
pnpm test src/utils/git.test.ts

# Debug with --verbose
pnpm test -- --verbose

# Fix and push
git add .
git commit -m "fix: resolve test failures"
git push
```

### Build Failures

**Symptoms**:

- "Build failed" in logs
- "TypeScript error" messages
- "npm ERR!" or "pnpm ERR!"

**Common Causes**:

- TypeScript errors
- Missing dependencies
- Compilation errors
- tsconfig issues

**Fix**:

```bash
# Run build locally
pnpm build

# Check TypeScript errors
pnpm typecheck

# Fix compilation errors
# Push changes
git add .
git commit -m "fix: resolve build errors"
git push
```

### Lint Failures

**Symptoms**:

- "ESLint" in logs
- "Linting" error messages
- Rule violation warnings

**Common Causes**:

- Code style violations
- ESLint rule changes
- Unused imports/variables
- Formatting issues

**Fix**:

```bash
# Run lint locally
pnpm lint

# Auto-fix if possible
pnpm lint --fix

# Fix remaining issues manually
# Push changes
git add .
git commit -m "fix: resolve linting errors"
git push
```

### Dependency Issues

**Symptoms**:

- "pnpm install failed"
- "Cannot find module"
- "Peer dependency" warnings
- "Lock file out of sync"

**Common Causes**:

- Missing dependencies
- Outdated lockfile
- Peer dependency conflicts
- Version mismatches

**Fix**:

```bash
# Clean install
rm -rf node_modules
pnpm install

# Update lockfile
pnpm install --no-frozen-lockfile

# Commit lockfile
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
git push
```

## Troubleshooting

### "GitHub CLI (gh) is not installed"

**Cause**: GitHub CLI not available

**Solution**:

```bash
# Install GitHub CLI
brew install gh

# Verify installation
gh --version

# Authenticate
gh auth login
```

### "1Password CLI not found, using system GitHub auth"

**Cause**: 1Password CLI not installed or configured

**Solution**:

```bash
# Install 1Password CLI
brew install --cask 1password-cli

# Verify installation
op --version

# Or continue with system auth (gh auth login)
```

### ".env file not found, using system GitHub auth"

**Cause**: Running from wrong directory or .env missing

**Solution**:

```bash
# Ensure you're in project root
cd /path/to/boss

# Verify .env exists
ls -la .env

# Run from project root
./.claude/skills/workflow-debugging/tools/troubleshoot-workflows.sh
```

### "Could not download logs"

**Cause**: Logs may not be available or already expired

**Solution**:

- Logs expire after 90 days on GitHub
- Some failed runs may not generate downloadable logs
- Use `gh run view <run-id> --log-failed` to view instead

### "Could not re-run workflow"

**Cause**: Workflow may already be re-running or run is too old

**Solution**:

```bash
# Check workflow status
gh run list --limit 5

# Re-run manually via GitHub UI
# Or trigger new workflow by pushing new commit
```

## Integration with Workflow

The workflow-debugging skill integrates with:

1. **workflow-management** - Debug failures from step 2 (quality-check)
2. **github-ops** - Uses gh-with-1password for authentication
3. **quality-gates** - Helps identify which gate failed

## Environment Variables

The tool uses:

- `CI` - Detect CI environment (affects bypass logic)
- `GITHUB_ACTIONS` - Detect GitHub Actions runner
- `GITHUB_TOKEN` - GitHub authentication (via 1Password or gh auth)

## Best Practices

1. **Check failures immediately**: Don't let them accumulate
2. **Reproduce locally first**: Faster debugging than CI
3. **Look for patterns**: Similar failures often have common cause
4. **Check recent changes**: What changed since last success?
5. **Review annotations**: GitHub shows inline error annotations

## Advanced Usage

### Filter by Workflow Name

```bash
# View specific workflow runs
gh run list --workflow="Test boss-cli" --limit 10

# Or use the troubleshoot tool on specific run
gh run view <run-id> --log-failed
```

### Check Specific Job

```bash
# List jobs for a run
gh run view <run-id>

# View specific job logs
gh run view <run-id> --job <job-id>

# Re-run specific job
gh run rerun <run-id> --job <job-id>
```

### Get JSON Output

```bash
# Get structured data for parsing
gh run list --json conclusion,name,status,headBranch

# Check if latest run passed
gh run list --limit 1 --json conclusion --jq '.[0].conclusion'
```

### Watch Workflow Progress

```bash
# Watch a running workflow
gh run watch <run-id>

# Or poll status
watch -n 5 'gh run list --limit 5'
```

## Tool Reference

| Tool                        | Purpose                    | Usage                                         |
| --------------------------- | -------------------------- | --------------------------------------------- |
| `troubleshoot-workflows.sh` | Diagnose workflow failures | `./tools/troubleshoot-workflows.sh [options]` |

**Options**:

- `--failed-only` - Show only failed runs
- `--download-logs` - Download failed run logs
- `--rerun` - Re-run failed workflows
- `--limit N` - Show last N runs (default: 5)
- `--help` - Show help message

## Related Skills

- **[workflow-management](.claude/skills/workflow-management/SKILL.md)** - Complete development workflow
- **[github-ops](.claude/skills/github-ops/SKILL.md)** - GitHub CLI with 1Password
- **[quality-gates](.claude/skills/quality-gates/SKILL.md)** - Local quality validation

## Documentation

For complete workflow documentation:

- [COMMON-PATTERNS.md](COMMON-PATTERNS.md) - Common failure patterns and fixes
- [.github/workflows/README.md](../../../.github/workflows/README.md) - Workflow documentation
- [CLAUDE.md](../../../CLAUDE.md) - Search "Debugging GitHub Workflows"
