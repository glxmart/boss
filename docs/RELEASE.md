# Release Process

This document describes the automated release process for BOSS packages using Changesets.

## Overview

BOSS uses [Changesets](https://github.com/changesets/changesets) for:

- **Automated version management** - No manual version bumping
- **Changelog generation** - Auto-generated from changeset descriptions
- **Coordinated releases** - Handle monorepo dependencies automatically
- **NPM publishing** - Automated publication via GitHub Actions

## Quick Start

### With Pull Requests (Recommended)

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make your changes
# ... edit code ...

# 3. Create a changeset
pnpm changeset

# 4. Commit and push
git add .changeset/*.md
git commit -m "feat: your feature description"
git push origin feature/my-feature

# 5. Create PR to main
# 6. Changeset check workflow validates changeset exists
# 7. Merge PR to main
# 8. Release workflow creates "Version Packages" PR automatically
# 9. Merge Version PR → automatic npm publish
```

### Direct to Main (Legacy - Soon Blocked)

```bash
# 1. Make your changes
# 2. Create a changeset
pnpm changeset

# 3. Commit and push
git add .changeset/*.md
git commit -m "feat: your feature description"
git push

# 4. Workflow creates "Version Packages" PR
# 5. Merge PR → automatic npm publish
```

**Note:** Direct pushes to main will be blocked soon. Use the PR workflow above.

## Automated Changeset Validation

When you create a PR, the **0.5-changeset-check.yml** workflow automatically:

1. ✅ **Detects code changes** - Checks if you modified source files
2. ✅ **Validates changeset exists** - Ensures you created a changeset
3. ✅ **Comments on PR** - Provides helpful guidance if changeset is missing
4. ✅ **Auto-approves** - Removes warning when changeset is added

### Skip Changeset Check

For PRs that don't need a release (docs, tests, CI config), add the `skip-changeset` label:

```bash
# Via GitHub CLI
gh pr edit <PR-number> --add-label skip-changeset

# Or via GitHub UI: Add label "skip-changeset"
```

**When to skip:**

- Documentation-only changes (`docs/`, `README.md`, etc.)
- Test-only changes
- CI/CD configuration changes
- Refactoring with no API changes
- Internal tooling updates

## Detailed Walkthrough

### Step 1: Create a Changeset

After making changes to code, create a changeset:

```bash
pnpm changeset
```

**Interactive prompts:**

1. **Select packages** that changed (Space to select, Enter to confirm)

   ```
   ◯ @glxmart/boss-cli
   ◯ @glxmart/conductor-mcp
   ```

2. **Choose version bump type** for each package:
   - **patch** (0.0.X) - Bug fixes, documentation, minor updates
   - **minor** (0.X.0) - New features, backwards compatible
   - **major** (X.0.0) - Breaking changes

3. **Write summary** - Describe the changes (appears in CHANGELOG.md)
   ```
   Added worker resume optimization for faster iterative development
   ```

**Generated file:** `.changeset/random-words-here.md`

```markdown
---
'@glxmart/boss-cli': minor
'@glxmart/conductor-mcp': patch
---

Added worker resume optimization for faster iterative development
```

### Step 2: Commit the Changeset

```bash
# Stage the changeset file
git add .changeset/*.md

# Commit with conventional commit message
git commit -m "feat: add worker resume optimization"

# Push to main (or create PR and merge)
git push origin main
```

### Step 3: Automated Version PR

When code with changesets reaches `main`:

**Workflow: `3.0-release.yml` triggers automatically**

1. **Detects changesets** in `.changeset/` directory
2. **Creates PR** titled "chore: version packages"
3. **PR contains:**
   - Updated `package.json` versions
   - Updated `CHANGELOG.md` files
   - Removed changeset files (they're consumed)
   - All pending changes grouped together

**Example PR:**

```
Title: chore: version packages

Changes:
- boss-cli: 1.2.0 → 1.3.0
- conductor-mcp: 0.8.1 → 0.8.2

CHANGELOG updates:
✨ Added worker resume optimization
🐛 Fixed bootstrap template path resolution
📝 Updated documentation
```

### Step 4: Review and Merge

**Review the Version PR:**

- ✅ Check version bumps are correct
- ✅ Review changelog entries
- ✅ Verify no unintended changes

**Merge the PR:**

```bash
# Via GitHub UI or CLI
./scripts/gh-with-1password.sh pr merge <PR-number>
```

### Step 5: Automatic Publication

**When Version PR is merged:**

1. **Workflow runs again** on updated main
2. **Detects version changes** (no changesets remaining)
3. **Runs `pnpm release`** which:
   - Builds packages
   - Publishes to npm
   - Creates git tags
4. **Packages are live** on npm!

## Version Bump Guidelines

### Patch (0.0.X)

**When to use:**

- Bug fixes
- Documentation updates
- Internal refactoring (no API changes)
- Dependency updates
- Performance improvements (no breaking changes)

**Examples:**

```bash
# Fix bug in bootstrap command
pnpm changeset
# Select: boss-cli
# Type: patch
# Summary: "Fix template path resolution in bootstrap"
```

### Minor (0.X.0)

**When to use:**

- New features
- New worker types
- New MCP tools
- Backwards-compatible enhancements
- Deprecated (but not removed) APIs

**Examples:**

```bash
# Add parallel worker spawning
pnpm changeset
# Select: conductor-mcp
# Type: minor
# Summary: "Add spawn_workers_parallel tool for concurrent execution"
```

### Major (X.0.0)

**When to use:**

- Breaking API changes
- Removed features
- Changed worker config schemas
- Updated minimum Node.js version
- Major architectural changes

**Examples:**

```bash
# Change worker metadata schema
pnpm changeset
# Select: conductor-mcp
# Type: major
# Summary: "BREAKING: Update worker metadata schema to v2"
```

## Common Scenarios

### Multiple Features Before Release

**Accumulate changesets:**

```bash
# Feature 1
git checkout -b feature-1
# ... make changes ...
pnpm changeset
# Type: minor, Summary: "Add feature 1"
git add .changeset/*.md
git commit -m "feat: add feature 1"
git push

# Feature 2
git checkout -b feature-2
# ... make changes ...
pnpm changeset
# Type: minor, Summary: "Add feature 2"
git add .changeset/*.md
git commit -m "feat: add feature 2"
git push

# Merge both PRs → ONE version PR created
# Contains BOTH features in changelog
```

### Bug Fix in Production

**Hotfix flow:**

```bash
# Create fix
git checkout -b hotfix/critical-bug
# ... fix the bug ...

# Create patch changeset
pnpm changeset
# Select: affected package
# Type: patch
# Summary: "Fix critical issue with X"

git add .changeset/*.md
git commit -m "fix: resolve critical issue with X"
git push

# Create PR, review, merge
# Version PR created automatically
# Merge version PR → hotfix published
```

### Breaking Change

**Major version flow:**

```bash
# Make breaking change
git checkout -b breaking/new-api

# Create major changeset
pnpm changeset
# Type: major
# Summary: "BREAKING: Change worker config schema format"

git add .changeset/*.md
git commit -m "feat!: change worker config schema [BREAKING]"
git push

# PR description should clearly explain:
# - What breaks
# - Migration guide
# - Deprecation timeline (if any)
```

### Coordinated Monorepo Release

**Both packages change together:**

```bash
# Make changes to both packages
pnpm changeset
# Select: BOTH boss-cli and conductor-mcp
# boss-cli: minor
# conductor-mcp: minor
# Summary: "Add cross-package feature X"

git add .changeset/*.md boss-cli/ conductor-mcp/
git commit -m "feat: add cross-package feature X"
git push

# Version PR updates BOTH packages
# Published together
```

## Monitoring Releases

### Check Pending Changesets

```bash
# List changeset files
ls .changeset/*.md

# View changeset status
pnpm changeset status

# Output shows:
# - Which packages will be bumped
# - What version changes will occur
# - Unreleased changesets
```

### Check Version PR Status

```bash
# List PRs
./scripts/gh-with-1password.sh pr list

# View the version PR
./scripts/gh-with-1password.sh pr view <PR-number>

# Check workflow status
./scripts/gh-with-1password.sh run list --workflow="3.0-release.yml"
```

### Verify Publication

```bash
# Check npm
npm info @glxmart/boss-cli
npm info @glxmart/conductor-mcp

# Check versions
npm view @glxmart/boss-cli version
npm view @glxmart/conductor-mcp version

# Check git tags
git tag -l
```

## Troubleshooting

### Version PR Not Created

**Problem:** Pushed changesets but no PR appeared

**Solutions:**

1. Check workflow ran: `./scripts/gh-with-1password.sh run list`
2. View workflow logs: `./scripts/gh-with-1password.sh run view <run-id> --log`
3. Verify changeset format:
   ```bash
   cat .changeset/*.md
   # Must have valid frontmatter (---)
   ```
4. Check paths triggered workflow: `.changeset/**` should be in paths filter

### Publication Failed

**Problem:** Version PR merged but packages didn't publish

**Solutions:**

1. Check workflow logs for `pnpm release` step
2. Verify `NPM_TOKEN` secret is valid:
   ```bash
   # Token must have publish access
   # Check at: https://www.npmjs.com/settings/USER/tokens
   ```
3. Check package.json `publishConfig`:
   ```json
   {
     "publishConfig": {
       "access": "public"
     }
   }
   ```
4. Verify package names are available on npm

### Wrong Version Bumped

**Problem:** Used wrong version type (patch instead of minor)

**Solutions:**

1. **Before merging version PR:**

   ```bash
   # Edit the changeset file
   vim .changeset/your-changeset.md
   # Change: "patch" → "minor"
   git add .changeset/
   git commit --amend
   git push --force
   ```

2. **After publishing (requires new release):**
   ```bash
   # Create corrective changeset
   pnpm changeset
   # Use correct version type
   # Summary: "Correct version - previous should have been X"
   ```

### Forgot to Create Changeset

**Problem:** Merged code without changeset

**Solutions:**

```bash
# Create changeset on main after merge
git checkout main
git pull
pnpm changeset
# Fill in details for the forgotten changes
git add .changeset/
git commit -m "chore: add missing changeset for previous merge"
git push
# Version PR will be created/updated
```

## Manual Release (Emergency Only)

**Only use in emergencies** (automation failure, critical hotfix)

```bash
# 1. Ensure you're on main with latest
git checkout main
git pull

# 2. Run version command locally
pnpm version-packages
# This updates package.json and CHANGELOG.md

# 3. Commit version changes
git add .
git commit -m "chore: version packages"
git push

# 4. Publish to npm
pnpm release

# 5. Create git tags
git tag @glxmart/boss-cli@$(jq -r .version boss-cli/package.json)
git tag @glxmart/conductor-mcp@$(jq -r .version conductor-mcp/package.json)
git push --tags
```

**Note:** This bypasses the automated workflow. Only use when GitHub Actions is unavailable.

## Best Practices

### DO ✅

- ✅ Create changeset for every user-facing change
- ✅ Write clear, user-focused summaries
- ✅ Use conventional commit messages
- ✅ Review version PR before merging
- ✅ Test locally before pushing
- ✅ Group related changes in one changeset

### DON'T ❌

- ❌ Edit package.json versions manually
- ❌ Edit CHANGELOG.md manually
- ❌ Run `npm publish` directly
- ❌ Create git tags manually
- ❌ Skip changesets for "small" changes
- ❌ Merge version PR with failing tests

## Configuration

### Changesets Config

Location: `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.2/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Key settings:**

- `commit: false` - Don't auto-commit (we commit manually)
- `access: "public"` - Publish as public packages
- `baseBranch: "main"` - Release from main branch
- `updateInternalDependencies: "patch"` - Bump dependents as patch

### Workflow Configuration

Location: `.github/workflows/3.0-release.yml`

**Triggers:**

- Push to `main` branch
- Changes to package code or changesets
- Path filters prevent unnecessary runs

**Required secrets:**

- `GITHUB_TOKEN` - Auto-provided by GitHub
- `NPM_TOKEN` - Must be configured in repository settings

## Related Documentation

- [GitHub Workflows README](../.github/workflows/README.md) - Complete workflow documentation
- [Changesets Documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md) - Official changesets guide
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message format
- [Semantic Versioning](https://semver.org/) - Version number meanings
