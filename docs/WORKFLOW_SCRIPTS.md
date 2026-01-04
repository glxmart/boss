# Workflow Scripts Guide

This guide explains the numbered workflow scripts for BOSS development.

## Quick Reference

| Script                  | Purpose                                 | Command                           | Shortcut                        |
| ----------------------- | --------------------------------------- | --------------------------------- | ------------------------------- |
| 1️⃣ **Start Feature**    | Create feature branch from main         | `./scripts/1-start-feature.sh`    | `pnpm run workflow:1-start`     |
| 2️⃣ **Quality Check**    | Run build, lint, tests, security        | `./scripts/2-quality-check.sh`    | `pnpm run workflow:2-check`     |
| 3️⃣ **Create Changeset** | Interactive changeset creation          | `./scripts/3-create-changeset.sh` | `pnpm run workflow:3-changeset` |
| 4️⃣ **Create PR**        | Submit pull request with 1Password auth | `./scripts/4-create-pr.sh`        | `pnpm run workflow:4-pr`        |

## Typical Workflow

```bash
# 1. Start new feature
pnpm run workflow:1-start
# → Prompts for feature type and name
# → Creates branch: feature/my-feature

# 2. Make your changes
# ... edit code ...
git add .
git commit -m "feat: implement feature"

# 3. Run quality checks
pnpm run workflow:2-check
# → Runs build, lint, tests, security
# → Must pass before proceeding

# 4. Create changeset
pnpm run workflow:3-changeset
# → Interactive prompts
# → Generates .changeset/*.md file

# 5. Create pull request
pnpm run workflow:4-pr
# → Runs quality checks (skip with --skip-quality-check)
# → Uses 1Password for GitHub auth
# → Creates PR with conventional format
# → Triggers CI workflows
```

## Script Details

### 1️⃣ Start Feature (`1-start-feature.sh`)

**Purpose**: Create a clean feature branch from latest main.

**What it does**:

1. Checks if you're on main branch
2. Fetches latest changes from origin
3. Prompts for feature type and name
4. Creates and checks out new branch

**Example interaction**:

```bash
$ pnpm run workflow:1-start

🚀 Starting new feature branch

📥 Fetching latest changes...

Enter feature details:
Feature type (feature/fix/chore/docs): feature
Feature name (e.g., worker-resume): parallel-spawning

📝 Creating branch: feature/parallel-spawning
✅ Feature branch created successfully!

Next steps:
  1. Make your changes
  2. Run: scripts/2-quality-check.sh
  3. Run: scripts/3-create-changeset.sh
  4. Run: scripts/4-create-pr.sh
```

**Valid feature types**:

- `feature` - New features
- `fix` - Bug fixes
- `chore` - Maintenance, tooling
- `docs` - Documentation only

### 2️⃣ Quality Check (`2-quality-check.sh`)

**Purpose**: Comprehensive quality validation before committing.

**What it checks**:

1. **Build** - TypeScript compilation for both packages
2. **Lint** - ESLint with strict TypeScript rules
3. **Type Check** - `tsc --noEmit` for type safety
4. **Tests** - Unit tests for both packages
5. **Security** - Secrets detection, dependency audit

**Example output**:

```bash
$ pnpm run workflow:2-check

🔍 Running Quality Checks

📦 Building packages...
✅ Build passed

🔧 Running lint check...
✅ Lint passed

📝 Running type check...
✅ Type check passed

🧪 Running tests...
✅ Tests passed

🔒 Running security checks...
✅ Security checks passed

✅ All quality checks passed!

Next steps:
  1. Create changeset: scripts/3-create-changeset.sh
  2. Create PR: scripts/4-create-pr.sh
```

**Exit codes**:

- `0` - All checks passed
- `1` - One or more checks failed (fix before proceeding)

### 3️⃣ Create Changeset (`3-create-changeset.sh`)

**Purpose**: Create versioning changeset for release automation.

**What it does**:

1. Shows unstaged changes
2. Runs interactive changeset CLI
3. Prompts for packages, version bump, summary
4. Generates `.changeset/*.md` file

**Example interaction**:

```bash
$ pnpm run workflow:3-changeset

📝 Creating Changeset

Current changes (not committed):
 M boss-cli/src/commands/bootstrap.ts
 M conductor-mcp/src/tools.ts

🎯 Creating changeset...

Which packages would you like to include?
◉ @glxmart/boss-cli
◉ @glxmart/conductor-mcp

What kind of change is this for @glxmart/boss-cli?
  patch (bug fix)
❯ minor (new feature)
  major (breaking change)

What kind of change is this for @glxmart/conductor-mcp?
  patch
❯ minor
  major

Please enter a summary:
Add parallel worker spawning support

✅ Changeset created: .changeset/pink-tigers-wave.md
```

**When to skip**:

- Documentation-only changes
- Test-only changes
- CI/CD config changes
- Use `skip-changeset` label on PR

### 4️⃣ Create PR (`4-create-pr.sh`)

**Purpose**: Create GitHub PR using 1Password credentials (non-interactive, parameter-based).

**What it does**:

1. Checks for uncommitted changes (auto-commit with `--auto-commit`)
2. Shows recent commits
3. Detects changeset files (or skip with `--skip-changeset`)
4. Runs quality checks (or skip with `--skip-quality-check`)
5. Generates PR title (auto or custom with `--title`)
6. Pushes branch to origin (with optional `--no-verify`)
7. Creates PR using `op run --env-file=.env -- gh pr create`
8. Automatically adds `skip-changeset` label if needed

**Options**:

```bash
--title "PR Title"         # Override auto-generated PR title
--skip-quality-check      # Skip quality checks before push
--no-verify               # Skip git pre-push hooks (emergency only)
--skip-changeset          # Continue without changeset (auto-add label)
--auto-commit "message"   # Auto-commit uncommitted changes
--help                    # Show help message
```

**Example usage**:

```bash
# Basic usage (auto-generated title, runs quality checks)
$ pnpm run workflow:4-pr

# Custom PR title
$ pnpm run workflow:4-pr --title "fix: critical bug in template loader"

# Skip quality checks (if already run separately)
$ pnpm run workflow:4-pr --skip-quality-check

# Emergency push with hook bypass (NOT recommended)
$ pnpm run workflow:4-pr --no-verify

# Documentation change (no changeset needed)
$ pnpm run workflow:4-pr --skip-changeset

# Auto-commit pending changes
$ pnpm run workflow:4-pr --auto-commit "docs: update workflow guide"

# Combine multiple options
$ pnpm run workflow:4-pr --title "docs: update API" --skip-changeset --skip-quality-check
```

**Example output**:

```bash
$ pnpm run workflow:4-pr

📝 Creating Pull Request

📋 Recent commits:
e0556a1 fix: use ErrorCategory enum instead of string literal
d06f42b fix: resolve ESLint errors and improve type safety
1b7660b chore: add changeset for quality gates setup

✅ Found changeset(s):
.changeset/pink-tigers-wave.md

🔍 Running quality checks...
✅ Quality checks passed

Auto-generated PR title: feature: parallel spawning

📤 Pushing branch to origin...
🔐 Creating PR with GitHub credentials from 1Password...

✅ Pull request created successfully!

PR #6

Next steps:
  1. View PR: op run --env-file=.env -- gh pr view 6 --web
  2. Monitor workflows: op run --env-file=.env -- gh run list --branch feature/parallel-spawning
  3. Wait for review and approval
  4. Merge when ready: op run --env-file=.env -- gh pr merge 6 --squash --delete-branch
```

**Error handling**:

If pre-push hook fails (quality gates):

```bash
❌ Pre-push hook failed (quality gates)

The pre-push hook runs quality checks (build, lint, tests) before pushing.

Options:
  1. Fix the issues and re-run: 4-create-pr.sh
  2. Skip hooks (emergency only): 4-create-pr.sh --no-verify

⚠️  Skipping quality gates means pushing potentially broken code!
```

**Prerequisites**:

- 1Password CLI installed and configured
- GitHub token in 1Password at `boss/github/token`
- Token must have correct scopes (see [GITHUB_TOKEN_SETUP.md](./GITHUB_TOKEN_SETUP.md))

## Using 1Password for GitHub Commands

All scripts use 1Password to inject GitHub credentials from `.env`:

```bash
# The scripts use this pattern:
op run --env-file=.env -- gh <command>

# You can use the same pattern for any gh command:
pnpm run gh pr list
pnpm run gh run list
pnpm run gh pr view 5
pnpm run gh run view <run-id> --log-failed
```

**Shortcut**: Add to your shell:

```bash
# Add to ~/.zshrc
alias ghp='op run --env-file=/Users/joe/code-glx/boss/.env -- gh'

# Then use:
ghp pr list
ghp run list
ghp pr view 5
```

## Troubleshooting

### "Missing required token scopes" Error

**Problem**: GitHub token lacks `read:org` scope.

**Solution**: Follow the guide in [GITHUB_TOKEN_SETUP.md](./GITHUB_TOKEN_SETUP.md) to add required scopes:

```bash
# Quick fix:
op run --env-file=.env -- gh auth refresh -h github.com -s read:org,read:discussion

# Then update token in 1Password:
op item edit boss/github --field token="$(op run --env-file=.env -- gh auth token)"
```

### Quality Check Fails

**Problem**: `workflow:2-check` fails with build/lint/test errors.

**Solution**:

```bash
# Fix specific issues:
pnpm build          # If build fails
pnpm lint:fix       # If linting fails (auto-fix)
pnpm test           # If tests fail

# Re-run quality check
pnpm run workflow:2-check
```

### 1Password Not Found

**Problem**: `op: command not found` or `bash: op: command not found`

**Solution**:

```bash
# Install 1Password CLI
brew install --cask 1password-cli

# Verify installation
op --version

# Sign in
op signin
```

### Changeset Already Exists

**Problem**: Multiple changeset files for same PR.

**Solution**:

```bash
# List changesets
ls -la .changeset/*.md

# Remove old changesets if needed
rm .changeset/old-changeset.md

# Create new changeset
pnpm run workflow:3-changeset
```

## Advanced Usage

### Running All Steps in Sequence

```bash
# Not recommended (no validation between steps), but possible:
pnpm run workflow:1-start && \
pnpm run workflow:2-check && \
pnpm run workflow:3-changeset && \
pnpm run workflow:4-pr
```

### Custom PR Title

The script auto-generates a PR title from the branch name, but you can override it:

```bash
# Custom title
pnpm run workflow:4-pr --title "fix: critical security vulnerability"

# Auto-generated title (default)
# Branch: feature/user-auth → Title: "feature: user auth"
# Branch: fix/memory-leak → Title: "fix: memory leak"
pnpm run workflow:4-pr

# Edit PR body after creation in GitHub UI
```

### Skip Changeset

For docs/tests/config changes:

```bash
# Skip changeset creation (step 3)
pnpm run workflow:1-start
# ... make changes ...
pnpm run workflow:2-check
pnpm run workflow:4-pr --skip-changeset
# Automatically adds skip-changeset label
```

## Integration with Claude Code Commands

These scripts complement the `.claude/commands/` workflow:

| Claude Command        | Script Equivalent               |
| --------------------- | ------------------------------- |
| `/1-start-feature`    | `pnpm run workflow:1-start`     |
| `/2-quality-check`    | `pnpm run workflow:2-check`     |
| `/3-create-changeset` | `pnpm run workflow:3-changeset` |
| `/4-create-pr`        | `pnpm run workflow:4-pr`        |

Use Claude commands for guided workflow, or run scripts directly for automation.

## References

- [GitHub Token Setup Guide](./GITHUB_TOKEN_SETUP.md)
- [Release Process](./RELEASE.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)
