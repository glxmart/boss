# Troubleshoot Workflows

Diagnose and troubleshoot GitHub Actions workflow failures.

> **💡 Powered by**: [`workflow-debugging`](.claude/skills/workflow-debugging/SKILL.md) skill

## What This Does

Performs comprehensive 7-step analysis of CI/CD failures:

1. **Status Check** - Recent workflow runs
2. **Failure Details** - Failed run logs
3. **Pattern Detection** - Common failure patterns
4. **Local Reproduction** - Commands to reproduce locally
5. **Log Download** (optional)
6. **Re-run** (optional)
7. **Summary** - Recommended next steps

## Usage

**Invoke with:** "Troubleshoot workflows" or "Debug CI failures"

Executes: `.claude/skills/workflow-debugging/tools/troubleshoot-workflows.sh`

## Options

```bash
# Quick status check
./tools/troubleshoot-workflows.sh

# Show only failures
./tools/troubleshoot-workflows.sh --failed-only

# Download logs for analysis
./tools/troubleshoot-workflows.sh --download-logs

# Re-run failed workflows
./tools/troubleshoot-workflows.sh --rerun

# Show last N runs
./tools/troubleshoot-workflows.sh --limit 10
```

## Common Patterns Detected

The tool automatically identifies:

- **Test failures** → `pnpm test`
- **Build errors** → `pnpm build`
- **Lint issues** → `pnpm lint --fix`
- **Dependency problems** → `rm -rf node_modules && pnpm install`

## Example Output

```
🔍 GitHub Workflow Troubleshooting

1. Recent Workflow Runs
━━━━━━━━━━━━━━━━━━━━━━━━
CI       main     #123  failure  2m ago

⚠️  Found 1 failed workflow(s)

2. Failure Details
━━━━━━━━━━━━━━━━━━━━━━━━
FAIL conductor-mcp/tests/unit/worker-loader.test.ts
  Expected: true
  Received: false

3. Analyzing Common Failure Patterns
━━━━━━━━━━━━━━━━━━━━━━━━
❌ Pattern: Test failures detected
  → Run tests locally: pnpm test

4. Reproduce Failures Locally
━━━━━━━━━━━━━━━━━━━━━━━━
pnpm run workflow:2-check
```

## Reproduce Locally

```bash
# Full quality check
pnpm run workflow:2-check

# Or individual checks
pnpm build
pnpm lint
pnpm test
pnpm --filter @glxmart/boss-cli test:integration
pnpm --filter @glxmart/conductor-mcp test:e2e
```

## Documentation

- [workflow-debugging skill](.claude/skills/workflow-debugging/SKILL.md)
- [COMMON-PATTERNS.md](.claude/skills/workflow-debugging/COMMON-PATTERNS.md)
- [.github/workflows/README.md](../.github/workflows/README.md)
