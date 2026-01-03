# GitHub Workflows

This directory contains GitHub Actions workflows with a numbered naming convention for clear ordering and execution.

## Workflow Structure

### Naming Convention

Workflows use a numbered prefix (0.5, 1.0, 1.1, 2.0, etc.) to indicate:

- **Order of execution** in the Actions tab
- **Logical grouping** (0.x = validation, 1.x = tests, 2.x = integration, 3.x = release, 4.x = infrastructure)
- **Easy identification** when reviewing workflow runs

### Path-Based Triggers

All workflows include `paths` filters to only run when relevant files change:

#### 0.5 - Changeset Check

**Triggers on:**

- Pull requests to `main` branch
- Any PR activity (opened, synchronized, reopened)

**Runs:**

- Validates changeset exists for code changes
- Comments on PR with helpful instructions
- Skips check if `skip-changeset` label is present
- Auto-removes warning when changeset is added

**Skip this check:**

- Add `skip-changeset` label for docs-only, test-only, or config-only PRs

#### 1.0 - Test boss-cli

**Triggers on:**

- `boss-cli/**` - Any changes to boss-cli package
- `pnpm-lock.yaml` - Dependency changes
- `package.json` - Root package changes
- `.github/workflows/1.0-test-boss-cli.yml` - Workflow file changes

**Runs:**

- Install dependencies
- Build boss-cli
- Run unit tests
- Lint

#### 1.1 - Test conductor-mcp

**Triggers on:**

- `conductor-mcp/**` - Any changes to conductor-mcp package
- `pnpm-lock.yaml` - Dependency changes
- `package.json` - Root package changes
- `.github/workflows/1.1-test-conductor-mcp.yml` - Workflow file changes

**Runs:**

- Install dependencies
- Build conductor-mcp
- Run unit tests
- Lint

#### 2.0 - Integration Tests

**Triggers on:**

- `boss-cli/**` - Changes to boss-cli
- `conductor-mcp/**` - Changes to conductor-mcp
- `pnpm-lock.yaml` - Dependency changes
- `package.json` - Root package changes
- `.github/workflows/2.0-integration-tests.yml` - Workflow file changes

**Runs:**

- Install dependencies
- Build all packages
- Run integration tests (creates real test projects)

#### 3.0 - Release

**Triggers on:**

- `boss-cli/**` - Package code changes
- `conductor-mcp/**` - Package code changes
- `.changeset/**` - Changeset files
- `pnpm-lock.yaml` - Dependency changes
- `package.json` - Root package changes
- `.github/workflows/3.0-release.yml` - Workflow file changes

**Runs:**

- Automated versioning via Changesets
- Creates "Version Packages" PR when changesets exist
- Automatically publishes to npm when PR is merged

#### 4.0 - Docker Image

**Triggers on:**

- `conductor-mcp/docker/boss-worker-base/**` - Docker image files
- `.github/workflows/4.0-docker.yml` - Workflow file changes
- Tags matching `v*`

**Runs:**

- Builds boss-worker-base Docker image
- Pushes to GitHub Container Registry (ghcr.io)
- Multi-platform build (linux/amd64, linux/arm64)

## Using Changesets

### Creating a Changeset

When you make changes to boss-cli or conductor-mcp:

```bash
# Run the changeset CLI
pnpm changeset

# Follow the prompts:
# 1. Select which packages changed (boss-cli, conductor-mcp, or both)
# 2. Select version bump type (patch, minor, major)
# 3. Write a summary of changes

# Commit the generated changeset file
git add .changeset/*.md
git commit -m "chore: add changeset for feature X"
```

### Version Bump Types

- **patch** (0.0.X) - Bug fixes, minor updates
- **minor** (0.X.0) - New features, backwards compatible
- **major** (X.0.0) - Breaking changes

### Release Process

1. **Developer creates changeset** (as shown above)
2. **Push to main** triggers `3.0-release.yml`
3. **Workflow creates/updates PR** titled "chore: version packages"
4. **PR shows** all changes and version bumps
5. **Merge PR** to automatically:
   - Update package versions
   - Update CHANGELOG.md files
   - Publish to npm
   - Create git tags

### Example Changeset File

```markdown
---
'@glxmart/boss-cli': patch
'@glxmart/conductor-mcp': minor
---

Added new worker type 'consolidator' and updated bootstrap templates
```

## Workflow Optimization

### Conditional Execution

Workflows only run when relevant code changes:

**Example 1:** Documentation-only PR

- Changes: `README.md`, `docs/*.md`
- Workflows triggered: **None** (no code changed)

**Example 2:** boss-cli feature

- Changes: `boss-cli/src/commands/new-feature.ts`
- Workflows triggered: **1.0** (boss-cli tests), **2.0** (integration), **3.0** (release if on main)

**Example 3:** Docker image update

- Changes: `conductor-mcp/docker/boss-worker-base/Dockerfile`
- Workflows triggered: **4.0** (Docker build)

**Example 4:** Full-stack change

- Changes: `boss-cli/src/**`, `conductor-mcp/src/**`
- Workflows triggered: **1.0**, **1.1**, **2.0**, **3.0**

### Cost Savings

Path-based triggers significantly reduce GitHub Actions minutes:

- Before: ~15 min per PR (all workflows run)
- After: ~3-5 min per PR (only relevant workflows)
- **~60-70% reduction** in CI costs

## Secrets Required

The following secrets must be configured in repository settings:

- `GITHUB_TOKEN` - Automatically provided by GitHub
- `NPM_TOKEN` - Required for publishing to npm registry

## Troubleshooting

### Workflow Not Triggering

If a workflow doesn't run when you expect:

1. **Check paths filter** - Does your change match the path patterns?
2. **Check branch** - Some workflows only run on `main`
3. **Check file extensions** - Ensure you're not excluded by patterns

### Release Workflow Not Creating PR

If `3.0-release.yml` runs but doesn't create a PR:

1. **Verify changeset exists** in `.changeset/` directory
2. **Check changeset format** - Must be valid markdown
3. **Ensure on main branch** - Release only runs on main
4. **Check NPM_TOKEN** - Must be valid and have publish access

### Docker Build Fails

If `4.0-docker.yml` fails:

1. **Test locally**: `cd conductor-mcp/docker/boss-worker-base && docker build .`
2. **Check Dockerfile syntax**
3. **Verify base images** are accessible
4. **Check GHCR permissions** - Token must have `packages:write`

## Migration Notes

### Removed Workflows

- ~~`ci.yml`~~ → Replaced by `1.0`, `1.1`, `2.0`
- ~~`release.yml`~~ → Replaced by `3.0-release.yml`
- ~~`publish.yml`~~ → Redundant (changesets handles publishing)
- ~~`docker.yml`~~ → Replaced by `4.0-docker.yml`

### Benefits

1. **Clear ordering** - Numbered prefixes make workflow list scannable
2. **Faster CI** - Path filters prevent unnecessary runs
3. **Automated versioning** - Changesets handle version bumps and changelogs
4. **Consistent releases** - No more manual version updates
5. **Better changelog** - Auto-generated from changeset descriptions
