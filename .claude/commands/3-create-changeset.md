# Create Changeset

Create a changeset describing version bump and changes.

> **💡 Powered by**: [`workflow-management`](.claude/skills/workflow-management/SKILL.md) skill

## What This Does

Creates a changeset file in `.changeset/` that describes:

- Which packages are affected
- Version bump type (patch/minor/major)
- Description of changes

Used by automated release workflow to generate CHANGELOGs and publish versions.

## Usage

**Invoke with:** "Create a changeset" or "Prepare for release"

Executes: `.claude/skills/workflow-management/tools/3-create-changeset.sh`

## Bump Types

| Type    | When to Use                        | Version |
| ------- | ---------------------------------- | ------- |
| `patch` | Bug fixes, small changes           | 0.0.X   |
| `minor` | New features, backwards compatible | 0.X.0   |
| `major` | Breaking changes                   | X.0.0   |

## Examples

```bash
# Single package (patch)
./tools/3-create-changeset.sh patch "boss-cli" "Fix validation error"

# Single package (minor)
./tools/3-create-changeset.sh minor "conductor-mcp" "Add parallel spawning"

# Multiple packages
./tools/3-create-changeset.sh minor "boss-cli,conductor-mcp" "Add feature"
```

## When to Create

✅ **Create changeset for:**

- Source code changes
- Template changes
- Asset changes
- Worker config changes

❌ **Skip changeset for:**

- Documentation only (add `skip-changeset` label to PR)
- Test-only changes
- Config-only changes

## Next Steps

1. Commit changeset: `git add .changeset/ && git commit -m "chore: add changeset"`
2. `/4-create-pr` - Submit pull request

## Documentation

- [workflow-management skill](.claude/skills/workflow-management/SKILL.md)
- [docs/RELEASE.md](../docs/RELEASE.md) - Complete release process
