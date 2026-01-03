# Start Feature Branch

Create a new feature branch from main with the latest changes.

## What This Does

1. Switches to main branch
2. Pulls latest changes
3. Creates a new feature branch
4. Verifies clean starting point

## Usage

**Invoke with:** "Start a new feature" or "Create feature branch"

When invoked, I will:

1. **Ask for branch name** - You provide the feature name
2. **Determine branch type** based on name:
   - `feature/` - New features (likely minor version)
   - `fix/` - Bug fixes (likely patch version)
   - `docs/` - Documentation (skip-changeset)
   - `refactor/` - Code refactoring (patch/skip-changeset)
   - `test/` - Test additions (skip-changeset)
   - `chore/` - Tooling/config (skip-changeset)
3. **Execute workflow**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b <branch-type>/<feature-name>
   git status
   ```

## Examples

**New Feature:**

```bash
git checkout -b feature/worker-resume-optimization
```

**Bug Fix:**

```bash
git checkout -b fix/bootstrap-template-path
```

**Documentation:**

```bash
git checkout -b docs/update-release-guide
```

## Next Steps

After branch is created:

1. Make your code changes
2. Run `/2-quality-check` to validate
3. Run `/3-create-changeset` (if code changes)
4. Run `/4-create-pr` to submit

## Related Commands

- `/2-quality-check` - Run tests and linting
- `/3-create-changeset` - Create changeset for release
- `/4-create-pr` - Create pull request
