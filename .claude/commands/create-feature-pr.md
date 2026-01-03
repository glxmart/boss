# Create Feature PR with Changeset

This command guides you through the complete PR workflow for BOSS, including changeset creation and automated release process.

## Context

- **Main branch is protected** - Direct pushes are blocked
- **Changesets required** - All code changes need a changeset (automated validation)
- **Automated release** - Merging triggers version PR creation and npm publishing

## Prerequisites

- On `main` branch with latest changes
- Know what you're going to change
- Understand version bump type needed (patch/minor/major)

## Step-by-Step Workflow

### 1. Verify Starting Point

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Verify clean working directory
git status
# Should show: "nothing to commit, working tree clean"
```

### 2. Create Feature Branch

```bash
# Create descriptive feature branch
git checkout -b feature/your-feature-name

# Examples:
# git checkout -b feature/worker-resume-optimization
# git checkout -b fix/bootstrap-template-path
# git checkout -b docs/update-release-guide
```

**Branch naming conventions:**
- `feature/` - New features (likely minor version)
- `fix/` - Bug fixes (likely patch version)
- `docs/` - Documentation (skip-changeset)
- `refactor/` - Code refactoring (patch/skip-changeset)
- `test/` - Test additions (skip-changeset)
- `chore/` - Tooling/config (skip-changeset)

### 3. Make Your Changes

```bash
# Make code changes in boss-cli/ or conductor-mcp/
# Edit files as needed

# Test locally
pnpm install  # If dependencies changed
pnpm build    # Build packages
pnpm test     # Run tests

# Package-specific testing
cd boss-cli && pnpm test
cd conductor-mcp && pnpm test
```

### 4. Create Changeset (For Code Changes Only)

**Skip this step if:**
- Documentation only (add `skip-changeset` label later)
- Tests only
- CI/CD config only
- Internal tooling

**Create changeset:**

```bash
# Run changeset CLI
pnpm changeset
```

**Interactive prompts:**

1. **Select packages** (Space to select, Enter to confirm)
   ```
   ◯ @glxmart/boss-cli
   ◯ @glxmart/conductor-mcp
   ```
   - Select packages you modified
   - Can select multiple

2. **Choose version bump type** (for each package)
   - **patch** (0.0.X) - Bug fixes, minor updates, internal changes
   - **minor** (0.X.0) - New features, backwards compatible
   - **major** (X.0.0) - Breaking changes, API changes

3. **Write summary** - Clear description of changes
   ```
   Example: "Add worker resume optimization for 85% faster iterations"
   Example: "Fix bootstrap template path resolution on Windows"
   Example: "BREAKING: Update worker metadata schema to v2"
   ```

**Result:** Creates `.changeset/random-words-here.md`

### 5. Commit and Push

```bash
# Stage all changes including changeset
git add .

# Use conventional commit message
git commit -m "feat: your feature description"

# Push to origin
git push origin feature/your-feature-name
```

**Conventional commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Tooling/config
- `feat!:` or `fix!:` - Breaking changes (use `!`)

### 6. Create Pull Request

```bash
# Using GitHub CLI (recommended)
gh pr create \
  --title "feat: your feature description" \
  --body "## Summary

- Change 1
- Change 2

## Testing

- [ ] Tested locally
- [ ] All tests pass
- [ ] Documentation updated (if needed)

## Changeset

- [x] Changeset created
- Version bump: minor/patch/major
"

# Or via GitHub UI
open "https://github.com/glxmart/boss/compare/feature/your-feature-name?expand=1"
```

**For docs/tests/config PRs (no changeset):**

```bash
# Create PR
gh pr create --title "docs: update release guide"

# Add skip-changeset label
gh pr edit --add-label skip-changeset
```

### 7. Automated Workflow (Happens Automatically)

**When PR is created/updated:**

1. ✅ **0.5 - Changeset Check** runs
   - Validates changeset exists (if code changed)
   - Posts helpful comment if missing
   - Passes if changeset present or `skip-changeset` label

2. ✅ **1.0 - Test boss-cli** (if boss-cli files changed)
   - Runs boss-cli tests

3. ✅ **1.1 - Test conductor-mcp** (if conductor-mcp files changed)
   - Runs conductor-mcp tests

4. ✅ **2.0 - Integration Tests** (if either package changed)
   - Runs full integration tests

**All checks must pass before merge.**

### 8. Review and Address Feedback

```bash
# If changes requested, make updates
git checkout feature/your-feature-name

# Make changes
# ... edit files ...

# Commit updates
git add .
git commit -m "fix: address review feedback"
git push

# Workflows re-run automatically
```

### 9. Merge PR

**After approval and all checks pass:**

```bash
# Merge via GitHub CLI
gh pr merge --squash --delete-branch

# Or via GitHub UI
# Click "Squash and merge"
```

### 10. Automated Release (Happens Automatically)

**When PR merges to main:**

1. ✅ **3.0 - Release** workflow triggers
2. ✅ Detects changeset in main
3. ✅ Creates/updates PR titled **"chore: version packages"**
   - Updates `package.json` versions
   - Generates `CHANGELOG.md` entries
   - Removes consumed changeset files

**Review Version PR:**

```bash
# List PRs
gh pr list

# View version PR
gh pr view <PR-number>

# Check what's being released
gh pr diff <PR-number>
```

### 11. Publish Release

**Merge the Version PR:**

```bash
# Merge version PR
gh pr merge <PR-number> --squash

# Or via GitHub UI
```

**Automated publishing:**
- Builds packages
- Publishes to npm
- Creates git tags
- **Done!** 🎉

### 12. Verify Publication

```bash
# Check npm
npm info @glxmart/boss-cli
npm info @glxmart/conductor-mcp

# Check versions
npm view @glxmart/boss-cli version
npm view @glxmart/conductor-mcp version

# Visit npm
open https://www.npmjs.com/package/@glxmart/boss-cli
open https://www.npmjs.com/package/@glxmart/conductor-mcp
```

## Quick Reference

### Full Feature Workflow

```bash
# 1. Start from main
git checkout main && git pull

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes
# ... edit code ...

# 4. Test
pnpm build && pnpm test

# 5. Create changeset
pnpm changeset

# 6. Commit and push
git add .
git commit -m "feat: my feature"
git push origin feature/my-feature

# 7. Create PR
gh pr create

# 8. Wait for checks ✅
# 9. Merge after approval
# 10. Version PR auto-created
# 11. Merge version PR
# 12. Auto-published to npm 🎉
```

### Docs-Only Workflow

```bash
# 1-3. Same as above
git checkout -b docs/update-readme

# 4. Make changes (no changeset needed)
# ... edit docs ...

# 5. Commit and push
git add .
git commit -m "docs: update README"
git push origin docs/update-readme

# 6. Create PR with skip label
gh pr create
gh pr edit --add-label skip-changeset

# 7. Merge (no release triggered)
```

### Hotfix Workflow

```bash
# 1. Create hotfix branch
git checkout -b fix/critical-bug

# 2. Fix bug
# ... fix code ...

# 3. Create patch changeset
pnpm changeset
# Select affected package
# Type: patch
# Summary: "Fix critical issue with X"

# 4. Commit and push
git add .
git commit -m "fix: resolve critical issue"
git push origin fix/critical-bug

# 5. Create PR with priority
gh pr create --label "priority"

# 6. Fast-track review and merge
# 7. Version PR created (patch bump)
# 8. Merge version PR → hotfix published
```

## Troubleshooting

### Changeset Check Failed

**Problem:** PR shows "Missing Changeset" warning

**Solution:**
```bash
# On your feature branch
pnpm changeset

# Commit the changeset
git add .changeset/*.md
git commit -m "chore: add changeset"
git push

# Check auto-removes warning
```

### Need to Skip Changeset

**Problem:** PR is docs/tests only but check fails

**Solution:**
```bash
# Add skip-changeset label
gh pr edit <PR-number> --add-label skip-changeset

# Or via GitHub UI: Add "skip-changeset" label
```

### Multiple Commits Need Single Changeset

**Problem:** Made several commits, need one changeset

**Solution:**
```bash
# Create changeset at the end
pnpm changeset
# Summarize ALL changes in one changeset

git add .changeset/*.md
git commit -m "chore: add changeset for feature"
git push
```

### Wrong Version Type

**Problem:** Created changeset with wrong version type

**Solution:**
```bash
# Edit the changeset file
vim .changeset/your-changeset.md

# Change the version type
# Before: "@glxmart/boss-cli": patch
# After:  "@glxmart/boss-cli": minor

git add .changeset/
git commit -m "chore: update changeset version type"
git push
```

### Forgot Changeset Before Merge

**Problem:** Merged PR without changeset

**Solution:**
```bash
# On main branch (after merge)
git checkout main
git pull

# Create changeset for the merged changes
pnpm changeset
# Describe what was merged

git add .changeset/
git commit -m "chore: add missing changeset"
git push

# Version PR will include this change
```

## Best Practices

### DO ✅

- ✅ Create changeset on feature branch (not main)
- ✅ Write clear, user-focused changeset summaries
- ✅ Test locally before pushing
- ✅ Use conventional commit messages
- ✅ Request reviews before merging
- ✅ Squash merge PRs for clean history
- ✅ Delete branches after merge

### DON'T ❌

- ❌ Push directly to main (blocked anyway)
- ❌ Skip changeset for code changes
- ❌ Create changeset on main branch
- ❌ Merge PRs with failing checks
- ❌ Edit CHANGELOG.md manually
- ❌ Edit package.json versions manually
- ❌ Create git tags manually

## Related Documentation

- [docs/RELEASE.md](../../docs/RELEASE.md) - Complete release guide
- [.github/workflows/README.md](../../.github/workflows/README.md) - Workflow documentation
- [CLAUDE.md](../../CLAUDE.md) - Project overview

## Command Usage

This command provides instructions for the complete PR workflow. Use it when:
- Starting a new feature
- Making any code changes
- Creating a hotfix
- Need a workflow reminder

**Invoke with:** "How do I create a feature PR?" or "Show me the PR workflow"
