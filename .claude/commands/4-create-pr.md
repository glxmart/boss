# Create Pull Request

Create a pull request for your feature branch with proper formatting and checks.

## What This Does

Creates a well-formatted PR that:
- Uses conventional commit format in title
- Includes comprehensive description
- Triggers automated workflows
- References changeset (if present)

## Usage

**Invoke with:** "Create a pull request" or "Submit PR for review"

## Prerequisites

Before creating PR:
- ✅ On feature branch (not main)
- ✅ Changes committed
- ✅ Quality checks pass (run `/2-quality-check`)
- ✅ Changeset created (run `/3-create-changeset`, or plan to use `skip-changeset` label)

## Process

When invoked, I will:

1. **Verify current state**:
   ```bash
   git status
   git log -1
   ```

2. **Push branch** (if not already pushed):
   ```bash
   git push origin <branch-name>
   ```

3. **Generate PR title** from branch name and commits:
   - `feature/worker-resume` → `feat: add worker resume optimization`
   - `fix/bootstrap-bug` → `fix: resolve bootstrap template issue`
   - `docs/update-readme` → `docs: update README with new features`

4. **Generate PR description**:
   ```markdown
   ## Summary

   - Key change 1
   - Key change 2
   - Key change 3

   ## Testing

   - [x] Tested locally
   - [x] All tests pass
   - [x] Documentation updated (if needed)

   ## Changeset

   - [x] Changeset created (patch/minor/major)

   ## Related Issues

   Closes #123 (if applicable)
   ```

5. **Create PR using GitHub CLI**:
   ```bash
   ./scripts/gh-with-1password.sh pr create \
     --title "feat: your feature" \
     --body "PR description"
   ```

6. **Add labels if needed**:
   ```bash
   # For docs/tests/config only
   ./scripts/gh-with-1password.sh pr edit --add-label skip-changeset
   ```

## PR Title Format

Use conventional commit format:

**Format:** `<type>: <description>`

**Types:**
- `feat:` - New feature (minor version)
- `fix:` - Bug fix (patch version)
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Tooling/config
- `perf:` - Performance improvement
- `feat!:` or `fix!:` - Breaking changes (add `!`)

**Examples:**
```
✅ feat: add parallel worker spawning
✅ fix: resolve MCP hanging during bootstrap
✅ docs: update release workflow documentation
✅ perf: optimize Docker image build time
✅ feat!: update worker metadata schema to v2
```

## PR Description Template

**For feature PRs:**
```markdown
## Summary

Brief description of what this PR does.

## Changes

- Added X functionality
- Updated Y component
- Fixed Z issue

## Testing

- [x] Unit tests added/updated
- [x] Integration tests pass
- [x] Tested locally in real project
- [x] Documentation updated

## Changeset

- [x] Changeset created
- Version bump: minor
- Packages: boss-cli, conductor-mcp

## Screenshots (if UI changes)

[Add screenshots if applicable]
```

**For docs/config PRs:**
```markdown
## Summary

Updated documentation for X.

## Changes

- Updated README with new examples
- Fixed broken links
- Clarified installation steps

## Changeset

- N/A - Documentation only
- Will add `skip-changeset` label
```

**For bug fix PRs:**
```markdown
## Summary

Fixes #123 - Description of the bug

## Root Cause

Explanation of what caused the bug.

## Fix

Description of how this fixes it.

## Testing

- [x] Added test case reproducing the bug
- [x] Verified fix resolves the issue
- [x] No regressions

## Changeset

- [x] Changeset created (patch)
```

## Automated Workflows

After PR is created, these workflows run automatically:

### Always Run:
- **0.5 - Changeset Check** - Validates changeset exists (unless `skip-changeset` label)

### Conditional (based on file changes):
- **1.0 - Test boss-cli** - If boss-cli files changed
- **1.1 - Test conductor-mcp** - If conductor-mcp files changed
- **2.0 - Integration Tests** - If either package changed
- **4.0 - Docker Image** - If Docker files changed

## When to Add `skip-changeset` Label

Add label for PRs that don't need a release:

**Use `skip-changeset` for:**
- Documentation only
- Tests only
- CI/CD config only
- Internal tooling
- README updates
- Comment updates

**How to add:**
```bash
./scripts/gh-with-1password.sh pr edit <PR-number> --add-label skip-changeset
```

## After PR Creation

The PR will:
1. Run automated checks
2. Wait for review
3. Show status of all workflows

**Monitor status:**
```bash
# View PR
./scripts/gh-with-1password.sh pr view <PR-number>

# Check workflow runs
./scripts/gh-with-1password.sh run list --branch <branch-name>
```

## If Workflows Fail

1. Check which workflow failed:
   ```bash
   ./scripts/gh-with-1password.sh run list --limit 5
   ```

2. View failure details:
   ```bash
   ./scripts/gh-with-1password.sh run view <run-id> --log-failed
   ```

3. Fix issues locally:
   ```bash
   # Fix code
   git add .
   git commit -m "fix: address workflow failures"
   git push
   # Workflows re-run automatically
   ```

## After Approval

Once approved and all checks pass:

```bash
# Merge PR (squash)
./scripts/gh-with-1password.sh pr merge <PR-number> --squash --delete-branch

# Or use GitHub UI:
# Click "Squash and merge"
```

## Next Steps After Merge

For PRs with changesets:
1. **Release workflow** runs automatically
2. Creates/updates **"Version Packages"** PR
3. Review version PR
4. Merge version PR → publishes to npm

For PRs with `skip-changeset`:
1. Changes merged to main
2. No release triggered
3. Done!

## Related Commands

- `/1-start-feature` - Create feature branch
- `/2-quality-check` - Run tests and linting
- `/3-create-changeset` - Create changeset for release

## Related Documentation

- [docs/RELEASE.md](../../docs/RELEASE.md) - Complete release process
- [.github/workflows/README.md](../../.github/workflows/README.md) - Workflow details
