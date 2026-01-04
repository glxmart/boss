# Start Feature Branch

Create a new feature branch from main with the latest changes.

> **💡 TIP**: This command uses the [`workflow-management`](.claude/skills/workflow-management/SKILL.md) skill for execution.

## What This Does

1. Switches to main branch
2. Pulls latest changes
3. Creates a new feature branch
4. Verifies clean starting point

## Usage

**Invoke with:** "Start a new feature" or "Create feature branch"

When invoked, I will execute:

```bash
.claude/skills/workflow-management/tools/1-start-feature.sh
```

This tool will:

1. **Ask for branch type** (feature/fix/chore/docs)
2. **Ask for feature name** (kebab-case)
3. **Create branch** `{type}/{name}`
4. **Show next steps**

## Examples

**New Feature:**

```
→ Feature type: feature
→ Feature name: worker-resume
✅ Created: feature/worker-resume
```

**Bug Fix:**

```
→ Feature type: fix
→ Feature name: validation-error
✅ Created: fix/validation-error
```

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
