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

When invoked, I will:

1. **Run changeset CLI**:
   ```bash
   pnpm changeset
   ```

2. **Guide you through prompts**:

   **Step 1: Select packages**
   ```
   Which packages would you like to include?
   ◯ @glxmart/boss-cli
   ◯ @glxmart/conductor-mcp
   ```
   - Press `Space` to select
   - Press `Enter` to confirm
   - Select all packages you modified

   **Step 2: Choose version bump**

   For each selected package, choose:

   - **patch** (0.0.X) - Bug fixes, minor updates, internal changes
     - Examples: Fix typo, Update dependency, Improve error message

   - **minor** (0.X.0) - New features, backwards compatible
     - Examples: Add new worker type, New CLI command, Performance optimization

   - **major** (X.0.0) - Breaking changes, API changes
     - Examples: Remove deprecated API, Change worker schema, Rename config fields

   **Step 3: Write summary**

   User-facing description of changes:
   ```
   Good examples:
   ✅ "Add worker resume optimization for 85% faster iterations"
   ✅ "Fix bootstrap template path resolution on Windows"
   ✅ "BREAKING: Update worker metadata schema to v2"

   Bad examples:
   ❌ "Updated code"
   ❌ "Fixed bug"
   ❌ "Changes"
   ```

3. **Verify changeset created**:
   ```bash
   ls .changeset/
   # Should show: random-words-here.md
   ```

4. **Stage changeset**:
   ```bash
   git add .changeset/*.md
   ```

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
"@glxmart/conductor-mcp": minor
---

Add parallel worker spawning with configurable concurrency

New `spawn_workers_parallel` tool enables spawning multiple workers concurrently with configurable concurrency limits (default: 5, max: 10). Reduces multi-worker phase time by 75%.
```

**Bug Fix (patch):**
```markdown
---
"@glxmart/boss-cli": patch
---

Fix bootstrap CLI hanging during MCP configuration prompt

Resolved issue where user prompt was called while spinner was active, causing 20+ minute hang. Moved prompt before spinner initialization.
```

**Breaking Change (major):**
```markdown
---
"@glxmart/conductor-mcp": major
---

BREAKING: Update worker metadata schema to v2

Worker metadata files now require `primaryCommand` field and use new output schema format. Migration guide: https://github.com/glxmart/boss/blob/main/docs/MIGRATION_V2.md
```

## Multiple Changes in One Changeset

If you made several related changes, create ONE changeset that describes all of them:

```markdown
---
"@glxmart/boss-cli": patch
"@glxmart/conductor-mcp": patch
---

Fix MCP hanging bug and Docker image auto-update

- Fixed MCP configuration hanging for 20+ minutes
- Updated Docker image to use 'latest' tag with auto-updates
- Added template directory mapping
```

## Next Steps

After changeset is created:
1. Review the changeset file in `.changeset/`
2. Commit changes: `git commit -m "chore: add changeset"`
3. Run `/4-create-pr` to submit

## Related Commands

- `/1-start-feature` - Create feature branch
- `/2-quality-check` - Run tests and linting
- `/4-create-pr` - Create pull request
