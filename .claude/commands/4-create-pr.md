# Create Pull Request

Create a pull request with GitHub CLI and 1Password authentication.

> **💡 Powered by**: [`workflow-management`](.claude/skills/workflow-management/SKILL.md) + [`github-ops`](.claude/skills/github-ops/SKILL.md) skills

## What This Does

1. Validates branch state (not on main, no uncommitted changes)
2. Checks for changeset (warns if missing)
3. Generates PR title from branch name
4. Creates PR body with checklist template
5. Pushes branch to origin
6. Creates PR using GitHub CLI (via 1Password)
7. Optionally adds `skip-changeset` label

## Usage

**Invoke with:** "Create a pull request" or "Submit changes"

Executes: `.claude/skills/workflow-management/tools/4-create-pr.sh`

## Prerequisites

✅ Quality checks passed (`/2-quality-check`)
✅ Changeset created (`/3-create-changeset`) OR ready to skip
✅ 1Password CLI configured for GitHub auth

## PR Title Generation

| Branch                  | Generated Title          |
| ----------------------- | ------------------------ |
| `feature/worker-resume` | `feature: worker resume` |
| `fix/validation-error`  | `fix: validation error`  |
| `docs/update-guide`     | `docs: update guide`     |

## PR Template

```markdown
## Summary

Brief description of changes.

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

## Troubleshooting

**"Cannot create PR from main"**: Create feature branch first (`/1-start-feature`)

**"No changeset found"**: Create changeset (`/3-create-changeset`) or add `skip-changeset` label

**"GitHub auth failed"**: See [github-ops TROUBLESHOOTING.md](.claude/skills/github-ops/TROUBLESHOOTING.md)

## Next Steps

After PR created:

1. Monitor workflows: `gh run list --branch <branch>`
2. Address review feedback
3. Merge when approved

## Documentation

- [workflow-management skill](.claude/skills/workflow-management/SKILL.md)
- [github-ops skill](.claude/skills/github-ops/SKILL.md)
- [docs/RELEASE.md](../docs/RELEASE.md)
