# Troubleshoot Workflows

Diagnose and troubleshoot GitHub Actions workflow failures using GitHub MCP.

> **💡 Powered by**: [`workflow-debugging`](.claude/skills/workflow-debugging/SKILL.md) skill

## What This Does

Performs comprehensive 7-step analysis of CI/CD failures using GitHub MCP and WebFetch:

1. **Status Check** - Recent workflow runs via GitHub API
2. **Failure Details** - Failed job details and logs
3. **Pattern Detection** - Automatic failure categorization
4. **Local Reproduction** - Commands to reproduce locally
5. **View Logs** - Detailed error messages and stack traces
6. **Check PRs** - Related pull requests
7. **Summary** - Recommended next steps

## Usage

**Invoke with:** "Troubleshoot workflows" or "Debug CI failures"

Uses: GitHub MCP tools (`mcp__github__*`) and `WebFetch` for GitHub Actions API

## How It Works

When invoked, Claude will:

1. **Fetch recent workflow runs** using WebFetch to GitHub Actions API
2. **Identify failed runs** and extract failure details
3. **Analyze patterns** (tests, builds, lint, dependencies)
4. **Provide reproduction steps** based on failure type
5. **Show related PRs** using GitHub MCP
6. **Summarize findings** with actionable recommendations

## Common Patterns Detected

The tool automatically identifies:

- **Test failures** → `pnpm test`
- **Build errors** → `pnpm build`
- **Lint issues** → `pnpm lint --fix`
- **Dependency problems** → `rm -rf node_modules && pnpm install`

## Example Analysis

```
=== GitHub Workflow Status ===

Recent Runs (glxmart/boss):
✅ 3.0 - Release          main    #456  success  1h ago
❌ 2.0 - Integration      feat/x  #455  failure  2h ago
✅ 1.0 - Test boss-cli    main    #454  success  3h ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== Failed Run #455 ===

Workflow: 2.0 - Integration Tests
Branch: feature/new-worker
Commit: feat: add new worker type

Failed Jobs:
  • Integration tests (conductor-mcp)
    - Run E2E tests ❌
    - Build ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== Pattern Analysis ===

❌ Test failures detected
  → Run locally: pnpm --filter @glxmart/conductor-mcp test:e2e
  → Check: conductor-mcp/tests/e2e/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

=== Recommended Actions ===

1. Reproduce locally:
   pnpm run workflow:2-check

2. Review failure logs for details

3. Fix issues and push changes
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
