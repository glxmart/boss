# Feature Development Workflow

Complete guide to the BOSS feature development workflow using focused commands.

## Quick Start

BOSS provides focused commands for each stage of development:

1. **`/1-start-feature`** - Create feature branch from main
2. Make your code changes
3. **`/2-quality-check`** - Run lint, tests, coverage
4. **`/3-create-changeset`** - Create changeset (if code changes)
5. **`/4-create-pr`** - Submit pull request

## Development Flow

### 1. Start Feature (`/1-start-feature`)

Creates a new feature branch from latest main.

**Usage:** "Start a new feature"

**What it does:**
- Switches to main and pulls latest
- Creates feature branch with proper naming
- Verifies clean starting point

**Branch types:**
- `feature/` - New features (minor version)
- `fix/` - Bug fixes (patch version)
- `docs/` - Documentation (skip changeset)
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Tooling/config

---

### 2. Make Changes (Manual)

**Develop your feature:**
```bash
# Edit files
# Make commits as you work
git add .
git commit -m "work in progress"
```

**Test locally:**
```bash
# Build packages
pnpm build

# Run specific package tests
cd boss-cli && pnpm test
cd conductor-mcp && pnpm test
```

---

### 3. Quality Check (`/2-quality-check`)

Validates code meets quality standards before submitting.

**Usage:** "Run quality check"

**What it does:**
- Builds all packages
- Runs linting
- Executes test suites
- Checks coverage thresholds
- Reports results

**Quality gates:**
- Build must succeed
- Lint must pass
- All tests must pass
- Coverage must meet thresholds (50%/80%/90% based on preset)

---

### 4. Create Changeset (`/3-create-changeset`)

Describes changes for automated versioning.

**Usage:** "Create a changeset"

**What it does:**
- Runs `pnpm changeset`
- Guides through package selection
- Helps choose version bump type
- Creates changeset file
- Stages changeset

**When to create:**
- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes

**When to skip:**
- ❌ Documentation only (use `skip-changeset` label)
- ❌ Tests only
- ❌ CI/CD config only

**Version types:**
- **patch** (0.0.X) - Bug fixes, minor updates
- **minor** (0.X.0) - New features, backwards compatible
- **major** (X.0.0) - Breaking changes

---

### 5. Create PR (`/4-create-pr`)

Submits pull request with proper formatting.

**Usage:** "Create a pull request"

**What it does:**
- Pushes branch to origin
- Generates conventional commit title
- Creates comprehensive PR description
- Submits PR via GitHub CLI
- Adds labels if needed

**PR format:**
- Title: Conventional commit format (`feat:`, `fix:`, etc.)
- Description: Summary, changes, testing, changeset info
- Labels: `skip-changeset` if docs/tests only

**Automated workflows:**
- Changeset validation
- Package-specific tests
- Integration tests
- Docker builds (if applicable)

---

## Complete Examples

### New Feature

```bash
# 1. Start
"Start a new feature"
# → Creates feature/my-feature branch

# 2. Develop
# ... make changes ...
git add .
git commit -m "feat: implement new feature"

# 3. Validate
"Run quality check"
# → ✅ All checks pass

# 4. Changeset
"Create a changeset"
# → Select packages: boss-cli
# → Version: minor
# → Summary: "Add new feature X"
git commit -m "chore: add changeset"

# 5. Submit
"Create a pull request"
# → PR created with title "feat: add new feature X"
```

### Bug Fix

```bash
# 1. Start
"Start a new feature" → fix/critical-bug

# 2. Fix
# ... fix bug ...
git commit -m "fix: resolve critical issue"

# 3. Validate
"Run quality check"
# → ✅ All checks pass

# 4. Changeset
"Create a changeset"
# → Version: patch
# → Summary: "Fix critical issue with X"
git commit -m "chore: add changeset"

# 5. Submit
"Create a pull request"
# → PR created with title "fix: resolve critical issue"
```

### Documentation Only

```bash
# 1. Start
"Start a new feature" → docs/update-readme

# 2. Update docs
# ... edit README.md ...
git commit -m "docs: update README"

# 3. Validate (optional)
"Run quality check"

# 4. Skip changeset (no code changes)

# 5. Submit
"Create a pull request"
# → PR created with `skip-changeset` label
```

---

## After PR is Created

### Automated Workflows

These run automatically when PR is created:

**Always:**
- ✅ **Changeset Check** - Validates changeset (unless `skip-changeset`)

**Conditional:**
- ✅ **Test boss-cli** - If boss-cli changed
- ✅ **Test conductor-mcp** - If conductor-mcp changed
- ✅ **Integration Tests** - If either package changed
- ✅ **Docker Image** - If Docker files changed

### Review Process

1. Wait for automated checks to pass
2. Request reviews from team
3. Address feedback if needed
4. Merge when approved

### After Merge

**For PRs with changeset:**
1. Release workflow creates "Version Packages" PR
2. Review version PR
3. Merge version PR
4. Auto-publishes to npm 🎉

**For PRs with `skip-changeset`:**
1. Changes merged to main
2. No release triggered
3. Done!

---

## Troubleshooting

### Quality Check Fails

**Problem:** Tests or linting fail

**Solution:**
```bash
# View specific errors
pnpm --filter <package> test
pnpm --filter <package> lint

# Fix and retry
"Run quality check"
```

### Missing Changeset

**Problem:** PR shows "Missing Changeset" warning

**Solution:**
```bash
# On your feature branch
"Create a changeset"
git push
# Warning auto-removes
```

### Wrong Version Type

**Problem:** Created changeset with wrong version

**Solution:**
```bash
# Edit changeset file
vim .changeset/your-changeset.md
# Change: "@glxmart/boss-cli": patch → minor
git add .changeset/
git commit -m "chore: update version type"
git push
```

### Workflow Failures

**Problem:** GitHub Actions fail

**Solution:**
```bash
# Check failures
./scripts/gh-with-1password.sh run list --limit 5
./scripts/gh-with-1password.sh run view <run-id> --log-failed

# Fix issues
# ... make fixes ...
git push
# Workflows re-run automatically
```

---

## Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/1-start-feature` | Create feature branch | Starting new work |
| `/2-quality-check` | Validate code quality | Before changeset/PR |
| `/3-create-changeset` | Document changes | After code is complete |
| `/4-create-pr` | Submit for review | Ready for review |

---

## Best Practices

### DO ✅

- ✅ Use focused commands for each workflow stage
- ✅ Run quality check before creating changeset
- ✅ Write clear, user-focused changeset summaries
- ✅ Use conventional commit format
- ✅ Test locally before pushing
- ✅ Request reviews before merging
- ✅ Squash merge for clean history

### DON'T ❌

- ❌ Push directly to main (protected)
- ❌ Skip quality check
- ❌ Skip changeset for code changes
- ❌ Merge with failing checks
- ❌ Edit CHANGELOG.md manually
- ❌ Edit package.json versions manually

---

## Related Documentation

- [docs/RELEASE.md](../../docs/RELEASE.md) - Complete release guide
- [.github/workflows/README.md](../../.github/workflows/README.md) - Workflow docs
- Individual command files for detailed usage

---

## Command Usage

This command provides workflow overview. For step-by-step execution, use the focused commands:

- **"Start a new feature"** → `/1-start-feature`
- **"Run quality check"** → `/2-quality-check`
- **"Create a changeset"** → `/3-create-changeset`
- **"Create a pull request"** → `/4-create-pr`

**Invoke this overview with:** "Show me the PR workflow" or "How do I create a feature?"
