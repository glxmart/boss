---
name: workflow-debugging
description: Diagnoses and troubleshoots GitHub Actions workflow failures. Use when CI/CD fails, workflows error, or need to analyze build/test failures in GitHub Actions.
allowed-tools: mcp__github__*, WebFetch, Bash, Read
---

# Workflow Debugging

## Overview

This skill helps diagnose and troubleshoot GitHub Actions workflow failures using GitHub MCP. It provides automated analysis of failed runs, common pattern detection, and actionable recommendations for fixes.

## Quick Start

### Option 1: Automated Script (Recommended)

Run the automated troubleshooting script:

```bash
.claude/skills/workflow-debugging/troubleshoot-workflows.sh
```

The script will:

- List recent workflow runs with status
- Identify failed runs automatically
- Fetch and display detailed failure logs
- Provide actionable recommendations
- Suggest local reproduction commands

### Option 2: Ask Claude

Ask Claude to troubleshoot workflows:

- "Troubleshoot workflow failures"
- "Why did CI fail?"
- "Debug GitHub Actions"
- "Check workflow status"
- "Show failed workflow runs"

## How to Use This Skill

When this skill is invoked, Claude should perform the following 7-step analysis using **GitHub MCP tools directly** (not bash scripts):

### GitHub MCP Tools Available

Use these MCP tools for workflow troubleshooting:

- `mcp__github__list_commits` - Get recent commits
- `mcp__github__list_pull_requests` - Check PR status
- `mcp__github__search_issues` - Search for workflow-related issues
- `WebFetch(url: "https://api.github.com/repos/{owner}/{repo}/actions/runs")` - Get workflow runs

### Important Notes

- **Use WebFetch** for GitHub Actions API endpoints not covered by MCP tools
- **Repository**: `glxmart/boss`
- **API Base**: `https://api.github.com`
- **Required endpoints**:
  - `/repos/glxmart/boss/actions/runs` - List workflow runs
  - `/repos/glxmart/boss/actions/runs/{run_id}` - Get run details
  - `/repos/glxmart/boss/actions/runs/{run_id}/logs` - Get run logs

### Step-by-Step Troubleshooting Process

The workflow debugging process performs 7-step analysis:

### 1. Recent Workflow Runs

**Action**: Use WebFetch to list recent workflow runs

```typescript
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs?per_page=10',
  prompt:
    'Extract workflow runs with: id, name, status, conclusion, head_branch, created_at. Show in table format with status indicators (✅ success, ❌ failure, 🔄 in_progress)',
});
```

**Output Example:**

```
=== 1. Recent Workflow Runs ===

STATUS  NAME                    BRANCH              CREATED
✅      Test boss-cli          main                2026-01-04 08:30
❌      Integration Tests      feature/new         2026-01-04 08:25
✅      Test conductor-mcp     main                2026-01-04 08:20
```

### 2. Failure Details

**Action**: For each failed run, use WebFetch to get detailed information

```typescript
// Get run details
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs/{run_id}',
  prompt: 'Extract: workflow name, branch, commit message, status, conclusion, jobs URL',
});

// Get job details to find failures
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs/{run_id}/jobs',
  prompt:
    'List all jobs. For failed jobs, extract: name, conclusion, steps that failed with their conclusions',
});
```

**Output Example:**

```
=== 2. Failure Details ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== Run ID: 12345678 ===

Workflow: Integration Tests
Branch: feature/new-feature
Commit: feat: add new feature

=== Failed Jobs ===

Job: Test boss-cli
  Step: Run tests - FAILED
  Step: Build - SUCCESS

Job: Integration tests
  Step: Run integration tests - FAILED
```

### 3. Common Pattern Detection

**Action**: Analyze job/step names and failure patterns to categorize issues

Based on the failed jobs and steps, automatically detect patterns:

**Test Failures** (job/step names contain: "test", "jest", "vitest")

```
❌ Pattern: Test failures detected in run 12345678
  → Run tests locally: pnpm test
  → Check specific package: pnpm --filter @glxmart/boss-cli test
```

**Build Failures** (job/step names contain: "build", "compile", "tsc")

```
❌ Pattern: Build failures detected in run 12345678
  → Run build locally: pnpm build
  → Check TypeScript errors: pnpm typecheck
```

**Lint Failures** (job/step names contain: "lint", "eslint", "format")

```
❌ Pattern: Linting errors detected in run 12345678
  → Run lint locally: pnpm lint
  → Auto-fix: pnpm lint --fix
```

**Dependency Issues** (job/step names contain: "install", "dependencies", "pnpm")

```
❌ Pattern: Dependency issues detected in run 12345678
  → Clean install: rm -rf node_modules && pnpm install
  → Check lockfile: git status | grep pnpm-lock.yaml
```

### 4. Local Reproduction

**Action**: Provide commands to reproduce failures locally based on failure patterns

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

### 5. View Detailed Logs (Optional)

**Action**: Use WebFetch to get specific job logs for failed steps

```typescript
// Get job logs for detailed error messages
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/jobs/{job_id}/logs',
  prompt:
    'Extract error messages, stack traces, and failure context from the logs. Show the last 50 lines before the failure.',
});
```

### 6. Check Related PRs (Optional)

**Action**: Use mcp**github**list_pull_requests to check if there's an open PR related to this branch

```typescript
mcp__github__list_pull_requests({
  owner: 'glxmart',
  repo: 'boss',
  state: 'open',
  per_page: 10,
});
```

### 7. Summary & Next Steps

**Action**: Provide summary and actionable next steps

```
=== 7. Summary & Next Steps ===

Workflow Status:
  - Total runs checked: 10
  - Failed runs: 2
  - Success rate: 80%

Recommended Actions:
  1. Review failure details above
  2. Reproduce failures locally (see section 4)
  3. Fix issues and commit changes
  4. Push to trigger new workflow run

For More Details:
  - Workflow docs: .github/workflows/README.md
  - Debugging guide: CLAUDE.md (search 'Debugging GitHub Workflows')
  - Use WebFetch to view specific run: https://api.github.com/repos/glxmart/boss/actions/runs/{run_id}
```

## GitHub API Endpoints Reference

### Workflow Runs

- **List runs**: `GET /repos/glxmart/boss/actions/runs`
  - Query params: `per_page`, `status`, `conclusion`, `branch`
- **Get run**: `GET /repos/glxmart/boss/actions/runs/{run_id}`
- **List jobs**: `GET /repos/glxmart/boss/actions/runs/{run_id}/jobs`
- **Get job**: `GET /repos/glxmart/boss/actions/jobs/{job_id}`
- **Get logs**: `GET /repos/glxmart/boss/actions/jobs/{job_id}/logs`

### Using WebFetch

Always use WebFetch for GitHub Actions API calls:

```typescript
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs',
  prompt: 'Your extraction prompt here',
});
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

### "Cannot access GitHub API"

**Cause**: Rate limiting or authentication issues

**Solution**:

- GitHub API allows 60 requests/hour for unauthenticated requests
- MCP tools should handle authentication automatically
- If rate limited, wait an hour or use a different approach

### "Logs not available"

**Cause**: Logs may have expired or not been generated

**Solution**:

- Logs expire after 90 days on GitHub
- Some failed runs may not generate logs
- Check run status - logs only available for completed runs
- Use WebFetch to check run status first

### "Cannot find failed runs"

**Cause**: No recent failures or checking wrong branch

**Solution**:

```typescript
// Filter by branch
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs?branch=your-branch',
  prompt: 'List runs for this branch',
});

// Filter by conclusion
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs?conclusion=failure',
  prompt: 'List only failed runs',
});
```

## Common Gotchas

### 1. Correct gh-with-1password.sh Script Path

**Issue**: Trying to use `./scripts/gh-with-1password.sh` which doesn't exist at that path

**Error**:

```bash
./scripts/gh-with-1password.sh run view 31 --log-failed
# Error: no such file or directory: ./scripts/gh-with-1password.sh
```

**Solution**: The script exists at `.claude/skills/github-ops/tools/gh-with-1password.sh`

**Option A (Recommended)**: Use the correct script path:

```bash
.claude/skills/github-ops/tools/gh-with-1password.sh run list --branch feature/my-branch
.claude/skills/github-ops/tools/gh-with-1password.sh run view <run-id> --log-failed
```

**Option B**: Use `op run --env-file=.env -- gh` directly:

```bash
op run --env-file=.env -- gh run list --branch feature/my-branch
op run --env-file=.env -- gh run view <run-id> --log-failed
```

**Option C (Best)**: Use the automated troubleshooting script:

```bash
.claude/skills/workflow-debugging/troubleshoot-workflows.sh
```

### 2. Run IDs vs Display Numbers

**Issue**: Using sequential run numbers (31, 32, 33) instead of actual GitHub Actions run IDs

**Error**:

```bash
op run --env-file=.env -- gh run view 31 --log-failed
# Error: HTTP 404: Not Found (https://api.github.com/repos/glxmart/boss/actions/runs/31)
```

**Why**: The numbers shown in `gh run list` are just sequential display numbers, NOT the actual run IDs

**Solution**: Use `--json` flag to get the actual `databaseId`:

```bash
# Get actual run IDs
op run --env-file=.env -- gh run list --branch feature/my-branch --limit 10 --json databaseId,displayTitle,conclusion,workflowName,createdAt,status

# Returns something like:
# [
#   {"databaseId": 20687791548, "displayTitle": "feat: ...", "conclusion": "failure", ...},
#   {"databaseId": 20687791547, "displayTitle": "feat: ...", "conclusion": "success", ...}
# ]

# Then use the actual databaseId:
op run --env-file=.env -- gh run view 20687791548 --log-failed
```

### 3. Getting Detailed Failure Logs

**Issue**: Not knowing which run ID to use or how to get specific failure logs

**Solution**: Follow this workflow:

```bash
# Step 1: List recent runs with actual IDs
op run --env-file=.env -- gh run list \
  --branch feature/my-branch \
  --limit 10 \
  --json databaseId,displayTitle,conclusion,workflowName,createdAt,status

# Step 2: Identify failed runs (conclusion: "failure")
# Look for runs where "conclusion": "failure"

# Step 3: Get detailed logs for failed run
op run --env-file=.env -- gh run view <databaseId> --log-failed

# Example:
op run --env-file=.env -- gh run view 20687791548 --log-failed
```

### 4. Pre-Commit Hook Errors

**Issue**: Getting "PreToolUse:Bash hook error" messages that make output hard to read

**Why**: The `.claude/hooks/pre-tool-use` hook runs before every bash command

**Solution**: This is normal - the hook output appears but doesn't affect the command execution. The actual output follows after the hook messages.

### 5. Common Workflow Failure Patterns

**Changeset Check Failures**:

- **Cause**: Code changes detected but no changeset file added
- **Fix**: Create a changeset file in `.changeset/` directory:

  ```bash
  # Manually create changeset (interactive doesn't work in CLI)
  cat > .changeset/my-changeset.md << 'EOF'
  ---
  '@glxmart/boss-cli': minor
  ---

  Description of changes here
  EOF
  ```

**Prettier Format Failures**:

- **Cause**: Files not formatted according to prettier rules
- **Fix**: Run prettier on the affected files:
  ```bash
  pnpm prettier --write "path/to/file.md"
  # Or format all files:
  pnpm format
  ```
- **Prevention**: Update `lint-staged` pattern to include hidden directories:
  ```json
  {
    "lint-staged": {
      "**/*.{ts,tsx,js,jsx,json,md,yml,yaml}": ["prettier --write"]
    }
  }
  ```
  Note: Use `**/*.{...}` not `*.{...}` to match files in `.claude/` and other hidden directories

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

```typescript
// List runs for specific workflow
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/workflows',
  prompt: 'List all workflows with their IDs and names',
});

// Then get runs for that workflow
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/workflows/{workflow_id}/runs',
  prompt: 'List recent runs for this specific workflow',
});
```

### Check Specific Job Details

```typescript
// Get detailed job information
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/jobs/{job_id}',
  prompt: 'Get job status, steps, and detailed timing information',
});

// Get job logs
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/jobs/{job_id}/logs',
  prompt: 'Extract complete job logs with error messages and stack traces',
});
```

### Monitor Multiple Workflows

```typescript
// Check status across all workflows
WebFetch({
  url: 'https://api.github.com/repos/glxmart/boss/actions/runs?per_page=20',
  prompt:
    'Group runs by workflow name, show success/failure counts and latest status for each workflow',
});
```

## Tool Reference

| Tool             | Purpose                            | Usage                               |
| ---------------- | ---------------------------------- | ----------------------------------- |
| `WebFetch`       | Access GitHub Actions API          | Query workflow runs, jobs, and logs |
| `mcp__github__*` | GitHub repository operations       | List PRs, commits, issues           |
| Skill invocation | Automated workflow troubleshooting | "Troubleshoot workflows" to Claude  |

## Related Skills

- **[workflow-management](.claude/skills/workflow-management/SKILL.md)** - Complete development workflow
- **[github-ops](.claude/skills/github-ops/SKILL.md)** - GitHub CLI with 1Password
- **[quality-gates](.claude/skills/quality-gates/SKILL.md)** - Local quality validation

## Documentation

For complete workflow documentation:

- [COMMON-PATTERNS.md](COMMON-PATTERNS.md) - Common failure patterns and fixes
- [.github/workflows/README.md](../../../.github/workflows/README.md) - Workflow documentation
- [CLAUDE.md](../../../CLAUDE.md) - Search "Debugging GitHub Workflows"
