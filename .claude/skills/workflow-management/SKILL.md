---
name: workflow-management
description: Guides through BOSS numbered development workflow (feature branch → quality check → changeset → PR). Use when starting features, running checks, creating changesets, or submitting PRs.
allowed-tools: Bash, Read, Grep
---

# Workflow Management

## Overview

This skill guides you through the BOSS numbered development workflow, a streamlined 4-step process for feature development:

1. **Start Feature** - Create feature branch from main
2. **Quality Check** - Validate code quality (build, lint, test, security)
3. **Create Changeset** - Generate version bump specification
4. **Create PR** - Submit pull request with proper formatting

## Quick Start

### Start a New Feature

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh
```

Or ask Claude:

- "Start a new feature"
- "Create a feature branch"
- "Begin new work"

### Run Quality Checks

```bash
.claude/skills/workflow-management/tools/2-quality-check.sh
```

Or ask Claude:

- "Run quality checks"
- "Validate my code"
- "Check if ready to commit"

### Create Changeset

```bash
.claude/skills/workflow-management/tools/3-create-changeset.sh patch "boss-cli" "Fix validation error"
```

Or ask Claude:

- "Create a changeset"
- "Prepare for release"

### Create Pull Request

```bash
.claude/skills/workflow-management/tools/4-create-pr.sh
```

Or ask Claude:

- "Create a pull request"
- "Submit my changes"
- "Open a PR"

## Workflow Steps Explained

### Step 1: Start Feature

**What it does:**

- Checks if you're on main branch
- Fetches latest changes from origin
- Creates properly named feature branch
- Provides next steps

**Branch naming convention:**

```
{type}/{name}

Types: feature, fix, chore, docs
Example: feature/worker-resume
```

**Safety checks:**

- Prevents creating branches from outdated main
- Handles existing branch conflicts
- Validates branch naming

### Step 2: Quality Check

**What it validates:**

- ✅ Build passes (TypeScript compilation)
- ✅ Linting passes (ESLint)
- ✅ Type checking passes (tsc --noEmit)
- ✅ Tests pass (unit + integration)
- ✅ Security checks pass (hardcoded secrets, vulnerabilities)

**Blocking vs Warning:**

- Build, lint, types, tests → **BLOCKING** (must pass)
- Security issues → **WARNING** (review manually)

**Performance:**
Runs in ~60-120 seconds depending on test suite size.

### Step 3: Create Changeset

**What it creates:**
A changeset file in `.changeset/` describing:

- Which packages are affected
- Version bump type (patch/minor/major)
- Description of changes

**When to create:**

- After code is complete
- Before creating PR
- For ANY source code changes

**When to skip:**

- Documentation only changes (add `skip-changeset` label to PR)
- Test-only changes
- Config-only changes

**Format:**

```markdown
---
'@glxmart/boss-cli': patch
'@glxmart/conductor-mcp': minor
---

Brief description of changes.
```

### Step 4: Create PR

**What it does:**

- Validates branch state (not on main, no uncommitted changes)
- Shows recent commits for context
- Checks for changeset (warns if missing)
- Generates PR title from branch name
- Creates PR body template with checklist
- Pushes branch to origin
- Creates PR using GitHub CLI (with 1Password credentials)
- Optionally adds `skip-changeset` label

**PR Template:**

```markdown
## Summary

Brief description of the changes.

## Changes

- Change 1
- Change 2

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Tested locally
- [ ] Documentation updated

## Changeset

- [x] Changeset created

---

🤖 Generated with Claude Code
```

## Complete Workflow Example

```bash
# 1. Start feature
.claude/skills/workflow-management/tools/1-start-feature.sh
# → Enter: feature
# → Enter: add-worker-resume
# → Creates: feature/add-worker-resume

# 2. Make changes
# ... edit code ...
git add .
git commit -m "feat: add worker resume optimization"

# 3. Validate quality
.claude/skills/workflow-management/tools/2-quality-check.sh
# → Runs all checks
# → All pass ✅

# 4. Create changeset
.claude/skills/workflow-management/tools/3-create-changeset.sh minor "conductor-mcp" "Add worker resume optimization"
# → Creates: .changeset/happy-dogs-run.md

git add .changeset/
git commit -m "chore: add changeset"

# 5. Create PR
.claude/skills/workflow-management/tools/4-create-pr.sh
# → Pushes branch
# → Creates PR
# → PR #42 created ✅
```

## Tool Reference

All tools are located in `.claude/skills/workflow-management/tools/`:

| Tool                    | Purpose               | Arguments                     |
| ----------------------- | --------------------- | ----------------------------- |
| `1-start-feature.sh`    | Create feature branch | Interactive                   |
| `2-quality-check.sh`    | Run quality gates     | None                          |
| `3-create-changeset.sh` | Create changeset      | `<bump> <packages> <message>` |
| `4-create-pr.sh`        | Create pull request   | Interactive                   |

## Integration with Package Scripts

These tools are also available via pnpm scripts:

```bash
pnpm run workflow:1-start      # Same as tool 1
pnpm run workflow:2-check      # Same as tool 2
pnpm run workflow:3-changeset  # Same as tool 3
pnpm run workflow:4-pr         # Same as tool 4
```

## Troubleshooting

### "Cannot create PR from main branch"

You're on the main branch. Create a feature branch first:

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh
```

### "Quality checks failed"

Review the specific failures and fix them:

```bash
# Re-run to see details
.claude/skills/workflow-management/tools/2-quality-check.sh

# Fix specific issues
pnpm build              # Build errors
pnpm lint --fix         # Auto-fix linting
pnpm test               # See test failures
```

### "No changeset found"

Create a changeset before PR:

```bash
.claude/skills/workflow-management/tools/3-create-changeset.sh patch "boss-cli" "Your message"
```

Or add `skip-changeset` label if this is docs/tests only.

### "GitHub authentication failed"

Ensure 1Password CLI is set up:

```bash
# Check if 1Password CLI is available
op --version

# Verify .env file exists
ls -la .env

# Test GitHub auth
op run --env-file=.env -- gh auth status
```

See [github-ops skill](.claude/skills/github-ops/SKILL.md) for token setup.

## Best Practices

1. **Always start from main**: Use tool 1 to ensure you're on latest
2. **Run checks before changeset**: Catch issues early
3. **Create changeset before PR**: Required for version management
4. **Use conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`
5. **Keep PRs focused**: One feature per PR

## Advanced Usage

### Skip Interactive Prompts

All tools support non-interactive mode for automation:

```bash
# Create feature branch non-interactively
FEATURE_TYPE=feature FEATURE_NAME=my-feature ./tools/1-start-feature.sh

# Create changeset non-interactively
./tools/3-create-changeset.sh minor "conductor-mcp" "Add new feature"

# Create PR with custom title
PR_TITLE="feat: my custom title" ./tools/4-create-pr.sh
```

### CI/CD Integration

Quality checks run automatically in GitHub Actions:

- Pre-commit hook: Security checks
- Pre-push hook: Build, lint, tests
- PR workflow: Full validation

See [quality-gates skill](.claude/skills/quality-gates/SKILL.md) for hook management.

## Related Skills

- **[github-ops](.claude/skills/github-ops/SKILL.md)** - GitHub CLI with 1Password
- **[quality-gates](.claude/skills/quality-gates/SKILL.md)** - Git hooks and validation
- **[workflow-debugging](.claude/skills/workflow-debugging/SKILL.md)** - Troubleshoot CI failures

## Documentation

For complete workflow documentation, see:

- [REFERENCE.md](REFERENCE.md) - Detailed workflow guide
- [docs/RELEASE.md](../../../docs/RELEASE.md) - Release process
- [.github/workflows/README.md](../../../.github/workflows/README.md) - CI/CD workflows
