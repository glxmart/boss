# Create Changeset

Create a changeset describing version bump and changes.

> **TIP**: This command uses the [`workflow-management`](.claude/skills/workflow-management/SKILL.md) skill.

## What This Does

Creates a changeset file in `.changeset/` that describes:

- Which packages are affected
- Version bump type (patch/minor/major)
- Description of changes

Used by automated release workflow to generate CHANGELOGs and publish versions.

## Usage

**Invoke with:** `/3-create-changeset` or "Create a changeset"

Execute with required arguments:

```bash
.claude/skills/workflow-management/tools/3-create-changeset.sh <bump-type> <packages> <message>
```

### Arguments

| Argument    | Required | Values                    | Description                                    |
| ----------- | -------- | ------------------------- | ---------------------------------------------- |
| `bump-type` | Yes      | `patch`, `minor`, `major` | Version bump type                              |
| `packages`  | Yes      | Comma-separated list      | Package names (e.g., `boss-cli,conductor-mcp`) |
| `message`   | Yes      | String                    | Change description                             |

## Bump Types

| Type    | When to Use                        | Version |
| ------- | ---------------------------------- | ------- |
| `patch` | Bug fixes, small changes           | 0.0.X   |
| `minor` | New features, backwards compatible | 0.X.0   |
| `major` | Breaking changes                   | X.0.0   |

## Examples

```bash
# Single package patch fix
.claude/skills/workflow-management/tools/3-create-changeset.sh patch "boss-cli" "Fix validation error"

# Single package minor feature
.claude/skills/workflow-management/tools/3-create-changeset.sh minor "conductor-mcp" "Add parallel spawning"

# Multiple packages
.claude/skills/workflow-management/tools/3-create-changeset.sh minor "boss-cli,conductor-mcp" "Add shared feature"

# Breaking change
.claude/skills/workflow-management/tools/3-create-changeset.sh major "conductor-mcp" "Remove deprecated API"
```

## When to Create

**Create changeset for:**

- Source code changes
- Template changes
- Asset changes
- Worker config changes

**Skip changeset for:**

- Documentation only (use `--skip-changeset` flag on PR)
- Test-only changes
- Config-only changes

## Next Steps

1. Commit the changeset: `git add .changeset/ && git commit -m "chore: add changeset"`
2. Run `/4-create-pr` to submit pull request

## Documentation

- [workflow-management skill](.claude/skills/workflow-management/SKILL.md)
- [docs/RELEASE.md](../docs/RELEASE.md) - Complete release process
