# Create Pull Request

Create a pull request with GitHub CLI and 1Password authentication.

> **TIP**: This command uses the [`workflow-management`](.claude/skills/workflow-management/SKILL.md) + [`github-ops`](.claude/skills/github-ops/SKILL.md) skills.

## What This Does

1. Validates branch state (not on main, no uncommitted changes)
2. Checks for changeset (fails if missing unless `--skip-changeset`)
3. Generates PR title from branch name (or uses provided title)
4. Creates PR body with commit log and checklist
5. Pushes branch to origin
6. Creates PR using GitHub CLI (via 1Password)
7. Adds `skip-changeset` label if flag provided

## Usage

**Invoke with:** `/4-create-pr` or "Create a pull request"

Execute (all arguments optional):

```bash
.claude/skills/workflow-management/tools/4-create-pr.sh [options]
```

### Options

| Option             | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `--title <title>`  | PR title (default: generated from branch name)        |
| `--body <body>`    | PR body (default: auto-generated template)            |
| `--skip-changeset` | Add skip-changeset label (for docs/tests/config only) |
| `--draft`          | Create as draft PR                                    |

## Examples

```bash
# Auto-generate everything from branch name
.claude/skills/workflow-management/tools/4-create-pr.sh

# Custom title
.claude/skills/workflow-management/tools/4-create-pr.sh --title "fix: resolve validation error"

# Skip changeset for docs-only changes
.claude/skills/workflow-management/tools/4-create-pr.sh --skip-changeset

# Draft PR with custom title
.claude/skills/workflow-management/tools/4-create-pr.sh --title "feat: new worker type" --draft
```

## Prerequisites

- Quality checks passed (`/2-quality-check`)
- Changeset created (`/3-create-changeset`) OR use `--skip-changeset`
- All changes committed
- 1Password CLI configured for GitHub auth

## PR Title Generation

| Branch                  | Generated Title          |
| ----------------------- | ------------------------ |
| `feature/worker-resume` | `feature: worker resume` |
| `fix/validation-error`  | `fix: validation error`  |
| `docs/update-guide`     | `docs: update guide`     |

## Troubleshooting

**"Cannot create PR from main"**: Create feature branch first (`/1-start-feature`)

**"No changeset found"**: Create changeset (`/3-create-changeset`) or use `--skip-changeset`

**"You have uncommitted changes"**: Commit your changes first

**"GitHub auth failed"**: Check 1Password CLI setup

## Next Steps

After PR created:

1. Monitor workflows: `op run --env-file=.env -- gh run list --branch <branch>`
2. Address review feedback
3. Merge when approved

## Documentation

- [workflow-management skill](.claude/skills/workflow-management/SKILL.md)
- [github-ops skill](.claude/skills/github-ops/SKILL.md)
- [docs/RELEASE.md](../docs/RELEASE.md)
