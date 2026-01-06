# Start Feature Branch

Create a new feature branch from main with the latest changes.

> **TIP**: This command uses the [`workflow-management`](.claude/skills/workflow-management/SKILL.md) skill for execution.

## What This Does

1. Stashes any local changes (auto-restores after)
2. Switches to main branch
3. Pulls latest changes
4. Creates a new feature branch (or switches to existing)
5. Restores stashed changes

## Usage

**Invoke with:** `/1-start-feature` or "Start a new feature"

When invoked, ask the user for:

1. **Branch type**: feature, fix, chore, or docs
2. **Branch name**: kebab-case name (e.g., worker-resume)

Then execute:

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh <type> <name>
```

### Arguments

| Argument | Required | Values                            | Description                         |
| -------- | -------- | --------------------------------- | ----------------------------------- |
| `type`   | Yes      | `feature`, `fix`, `chore`, `docs` | Branch type prefix                  |
| `name`   | Yes      | kebab-case string                 | Branch name (e.g., `worker-resume`) |

## Examples

**New Feature:**

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh feature worker-resume
# Creates: feature/worker-resume
```

**Bug Fix:**

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh fix validation-error
# Creates: fix/validation-error
```

**Documentation:**

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh docs api-reference
# Creates: docs/api-reference
```

## Behavior

- **Local changes**: Automatically stashed and restored after branch creation
- **Existing local branch**: Switches to it instead of failing
- **Existing remote branch**: Checks out tracking branch
- **Already on target branch**: No-op, reports success

## Next Steps

After branch is created:

1. Make your code changes
2. Run `/2-quality-check` to validate
3. Run `/3-create-changeset` (if code changes)
4. Run `/4-create-pr` to submit

## Related

- `/2-quality-check` - Validate code quality
- `/3-create-changeset` - Create version bump
- `/4-create-pr` - Submit pull request
- [workflow-management skill](.claude/skills/workflow-management/SKILL.md) - Complete documentation
