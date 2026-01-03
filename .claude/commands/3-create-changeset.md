# Create Changeset

Create a changeset describing your changes for automated versioning and release.

## What This Does

Generates a changeset file that describes:

- Which packages changed
- Version bump type (patch/minor/major)
- User-facing summary of changes

This changeset is used to:

- Generate CHANGELOG.md
- Determine next version number
- Create automated "Version Packages" PR

## Usage

**Invoke with:** "Create a changeset" or "Add changeset for my changes"

## When to Create Changeset

**CREATE changeset for:**

- ✅ New features
- ✅ Bug fixes
- ✅ Performance improvements
- ✅ API changes
- ✅ Breaking changes

**SKIP changeset for:**

- ❌ Documentation only (use `skip-changeset` label on PR)
- ❌ Tests only
- ❌ CI/CD config only
- ❌ Internal tooling
- ❌ README updates

## Process

When invoked, I will create a changeset using the non-interactive script:

**Command**:

```bash
pnpm changeset:add <bump-type> <packages> <message>
```

**Parameters**:

- `<bump-type>`: `patch`, `minor`, or `major` (see [Version Bump Guidelines](#version-bump-guidelines))
- `<packages>`: Comma-separated package names (e.g., `"boss-cli,conductor-mcp"`)
- `<message>`: User-facing summary of changes (use quotes for multi-line)

**Examples**:

```bash
# Single package, patch bump
pnpm changeset:add patch "conductor-mcp" "Fix container error handling"

# Multiple packages, minor bump
pnpm changeset:add minor "boss-cli,conductor-mcp" "Add worker resume optimization"

# Major breaking change
pnpm changeset:add major "boss-cli" "BREAKING: Update worker schema to v2"
```

**What happens**:

1. ✅ Creates changeset file with random name (`.changeset/random-words-here.md`)
2. ✅ Generates proper frontmatter with package versions
3. ✅ Adds your message as the summary
4. ✅ Shows preview of created file
5. ✅ Automatically stages the changeset

**Note**: The `@glxmart/` prefix is added automatically to package names.

## Alternative: Interactive Mode (Local Terminal Only)

If you're working in your local terminal (not via Claude Code), you can use interactive mode:

```bash
pnpm changeset
```

This provides an interactive menu to:

1. Select packages (Space to select, Enter to confirm)
2. Choose version bump for each package
3. Write summary message

**Note**: Interactive mode doesn't work in Claude Code environment (no TTY), so I always use `pnpm changeset:add` instead.

## Version Bump Guidelines

### Patch (0.0.X)

When to use:

- Bug fixes
- Documentation updates in code
- Internal refactoring
- Dependency updates
- Performance improvements (non-breaking)

Examples:

- Fix validation error message
- Update JSDoc comments
- Refactor internal function
- Update TypeScript to 5.4

### Minor (0.X.0)

When to use:

- New features
- New functionality
- Backwards-compatible additions
- New options/parameters (with defaults)

Examples:

- Add new worker type
- New CLI command
- Add optional parameter to function
- New MCP tool

### Major (X.0.0)

When to use:

- Breaking changes
- Removed functionality
- Changed behavior
- Required parameter changes
- Schema changes

Examples:

- Remove deprecated worker type
- Change metadata schema structure
- Rename required config fields
- Remove CLI command

## Example Changesets

**New Feature (minor):**

```markdown
---
'@glxmart/conductor-mcp': minor
---

Add parallel worker spawning with configurable concurrency

New `spawn_workers_parallel` tool enables spawning multiple workers concurrently with configurable concurrency limits (default: 5, max: 10). Reduces multi-worker phase time by 75%.
```

**Bug Fix (patch):**

```markdown
---
'@glxmart/boss-cli': patch
---

Fix bootstrap CLI hanging during MCP configuration prompt

Resolved issue where user prompt was called while spinner was active, causing 20+ minute hang. Moved prompt before spinner initialization.
```

**Breaking Change (major):**

```markdown
---
'@glxmart/conductor-mcp': major
---

BREAKING: Update worker metadata schema to v2

Worker metadata files now require `primaryCommand` field and use new output schema format. Migration guide: https://github.com/glxmart/boss/blob/main/docs/MIGRATION_V2.md
```

## Multiple Changes in One Changeset

If you made several related changes, create ONE changeset that describes all of them:

```markdown
---
'@glxmart/boss-cli': patch
'@glxmart/conductor-mcp': patch
---

Fix MCP hanging bug and Docker image auto-update

- Fixed MCP configuration hanging for 20+ minutes
- Updated Docker image to use 'latest' tag with auto-updates
- Added template directory mapping
```

## Next Steps

After changeset is created:

1. Review the preview shown in terminal
2. Changeset is already staged automatically
3. Commit all changes together with your code
4. Run `/4-create-pr` to submit

**Note**: The changeset will be committed along with your code changes, not separately.

## Related Commands

- `/1-start-feature` - Create feature branch
- `/2-quality-check` - Run tests and linting
- `/4-create-pr` - Create pull request
