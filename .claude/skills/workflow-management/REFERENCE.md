# Workflow Management - Complete Reference

## Table of Contents

- [Philosophy](#philosophy)
- [Workflow Steps](#workflow-steps)
- [Tool Implementation](#tool-implementation)
- [Error Handling](#error-handling)
- [Integration Points](#integration-points)
- [Customization](#customization)

## Philosophy

The BOSS workflow is designed around these principles:

1. **Linear Progression**: Steps build on each other (1→2→3→4)
2. **Fast Feedback**: Catch issues before they reach CI
3. **Automation**: Reduce manual toil and human error
4. **Safety**: Multiple validation gates prevent bad commits
5. **Transparency**: Clear output at each step

## Workflow Steps

### Step 1: Start Feature

#### Implementation Details

**Script**: `tools/1-start-feature.sh`

**Flow**:

```
1. Check current branch
   ↓
2. Prompt to switch to main if not already
   ↓
3. Fetch latest from origin
   ↓
4. Compare local vs remote main
   ↓
5. Prompt to pull if behind
   ↓
6. Collect feature type and name
   ↓
7. Validate inputs
   ↓
8. Check if branch exists
   ↓
9. Create and checkout new branch
   ↓
10. Display next steps
```

**Safety Checks**:

- Prevents creating from non-main branch (unless explicitly allowed)
- Prevents creating from outdated main
- Handles existing branch conflicts gracefully

**Environment Variables** (for automation):

- `FEATURE_TYPE` - Branch type (feature/fix/chore/docs)
- `FEATURE_NAME` - Branch name (kebab-case)
- `SKIP_PROMPTS` - Skip all interactive prompts (y/n)

**Exit Codes**:

- `0` - Success
- `1` - User cancelled or validation failed

---

### Step 2: Quality Check

#### Implementation Details

**Script**: `tools/2-quality-check.sh`

**Checks Performed**:

1. **Build** (`pnpm build`)
   - Compiles TypeScript
   - Copies assets
   - Validates imports
   - **Blocking**: Yes

2. **Lint** (`pnpm lint`)
   - ESLint validation
   - Code style checks
   - **Blocking**: Yes

3. **Type Check** (`pnpm -r exec tsc --noEmit`)
   - TypeScript type validation
   - Checks all packages
   - **Blocking**: Yes

4. **Tests** (`pnpm test`)
   - Unit tests
   - Integration tests (if available)
   - **Blocking**: Yes

5. **Security** (`scripts/security-check.sh`)
   - Hardcoded secrets detection
   - Security TODOs
   - Dependency vulnerabilities
   - **Blocking**: No (warnings only)

**Performance Optimization**:

- Runs checks in sequence (not parallel) for clear error messages
- Early exit on first failure
- Uses pnpm for faster dependency resolution

**Output Format**:

```
🔍 Running Quality Checks

📦 Building packages...
✅ Build passed

🔧 Running lint check...
✅ Lint passed

📝 Running type check...
✅ Type check passed

🧪 Running tests...
✅ Tests passed

🔒 Running security checks...
✅ Security checks passed

✅ All quality checks passed!

Next steps:
  1. Create changeset: scripts/3-create-changeset.sh
  2. Create PR: scripts/4-create-pr.sh
```

**Exit Codes**:

- `0` - All checks passed
- `1` - One or more checks failed

---

### Step 3: Create Changeset

#### Implementation Details

**Script**: `tools/3-create-changeset.sh`

**Arguments**:

```bash
./tools/3-create-changeset.sh <bump-type> <packages> <message>
```

**Bump Types**:

- `patch` - Bug fixes, small changes (0.0.X)
- `minor` - New features, backwards compatible (0.X.0)
- `major` - Breaking changes (X.0.0)

**Package Selection**:

```bash
# Single package
"boss-cli"

# Multiple packages
"boss-cli,conductor-mcp"

# With @glxmart/ prefix (optional)
"@glxmart/boss-cli,@glxmart/conductor-mcp"
```

**Changeset Format**:

```markdown
---
'@glxmart/boss-cli': patch
'@glxmart/conductor-mcp': minor
---

Brief description of changes.

Details about what changed and why.
```

**Filename Generation**:
Uses random adjective-noun-verb pattern:

```
.changeset/happy-dogs-run.md
.changeset/brave-cats-jump.md
.changeset/calm-fish-swim.md
```

**Validation**:

- Bump type must be patch/minor/major
- Packages must be non-empty
- Message must be provided

**Integration with Changesets**:

- Compatible with `@changesets/cli`
- Automatically picked up by release workflow
- Supports standard changesets features

---

### Step 4: Create PR

#### Implementation Details

**Script**: `tools/4-create-pr.sh`

**Flow**:

```
1. Validate not on main branch
   ↓
2. Check for uncommitted changes
   ↓
3. Prompt to commit if needed
   ↓
4. Display recent commits
   ↓
5. Check for changeset
   ↓
6. Generate PR title from branch name
   ↓
7. Confirm or customize title
   ↓
8. Generate PR body template
   ↓
9. Push branch to origin
   ↓
10. Create PR via GitHub CLI
    ↓
11. Optionally add skip-changeset label
    ↓
12. Display PR info and next steps
```

**PR Title Generation**:

```bash
# Branch: feature/worker-resume
# Title:  feature: worker resume

# Branch: fix/validation-error
# Title:  fix: validation error
```

**PR Body Template**:

```markdown
## Summary

Brief description of the changes.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Tested locally
- [ ] Documentation updated

## Changeset

- [x] Changeset created

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**GitHub CLI Integration**:
Uses 1Password for secure credential management:

```bash
op run --env-file=.env -- gh pr create \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --base main
```

**Label Management**:

- Automatically prompts to add `skip-changeset` if no changeset found
- Can be customized for project-specific labels

---

## Tool Implementation

### Common Patterns

All tools follow these patterns:

**1. Strict Error Handling**:

```bash
set -euo pipefail
```

**2. Path Resolution**:

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
```

**3. Color Output**:

```bash
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
```

**4. User Feedback**:

```bash
echo -e "${BLUE}🚀 Starting operation${NC}"
echo -e "${GREEN}✅ Success${NC}"
echo -e "${YELLOW}⚠️  Warning${NC}"
echo -e "${RED}❌ Error${NC}"
```

### Testing Tools

Test individual tools:

```bash
# Test start-feature
cd .claude/skills/workflow-management/tools
./1-start-feature.sh

# Test quality-check
./2-quality-check.sh

# Test changeset creation
./3-create-changeset.sh patch "boss-cli" "Test changeset"

# Test PR creation (requires feature branch)
git checkout -b test/pr-creation
./4-create-pr.sh
```

---

## Error Handling

### Common Errors

#### "Not in a git repository"

**Cause**: Running tool outside git repository

**Solution**:

```bash
cd /path/to/boss
.claude/skills/workflow-management/tools/1-start-feature.sh
```

#### "Build failed"

**Cause**: TypeScript compilation errors

**Solution**:

```bash
# See detailed errors
pnpm build

# Clean build
rm -rf */dist
pnpm build
```

#### "No changeset found"

**Cause**: Creating PR without changeset

**Solution**:

```bash
# Create changeset first
.claude/skills/workflow-management/tools/3-create-changeset.sh minor "conductor-mcp" "Add feature"

# Or add skip-changeset label
# (prompted during PR creation)
```

#### "GitHub authentication failed"

**Cause**: 1Password not configured or GitHub token missing

**Solution**:
See [github-ops skill](.claude/skills/github-ops/SKILL.md) for complete setup guide.

---

## Integration Points

### With pnpm Scripts

Workflow tools are integrated into `package.json`:

```json
{
  "scripts": {
    "workflow:1-start": "bash .claude/skills/workflow-management/tools/1-start-feature.sh",
    "workflow:2-check": "bash .claude/skills/workflow-management/tools/2-quality-check.sh",
    "workflow:3-changeset": "bash .claude/skills/workflow-management/tools/3-create-changeset.sh",
    "workflow:4-pr": "bash .claude/skills/workflow-management/tools/4-create-pr.sh"
  }
}
```

### With Git Hooks

Quality checks run automatically:

**Pre-commit** (`.git/hooks/pre-commit`):

- Security checks
- Linting (on changed files)

**Pre-push** (`.git/hooks/pre-push`):

- Full build
- All tests
- Security checks

See [quality-gates skill](.claude/skills/quality-gates/SKILL.md) for hook management.

### With GitHub Actions

Workflow triggers CI/CD:

**On PR creation**:

- Runs all quality checks
- Validates changeset
- Reports status

**On PR merge**:

- Creates "Version Packages" PR (if changesets exist)
- Updates CHANGELOG
- Publishes to npm (when Version PR merged)

See [.github/workflows/README.md](../../../.github/workflows/README.md).

---

## Customization

### Adding Custom Checks

Extend `2-quality-check.sh`:

```bash
# Add after existing checks
echo -e "${BLUE}🔍 Running custom validation...${NC}"
if ! ./scripts/custom-check.sh; then
  echo -e "${RED}❌ Custom check failed${NC}"
  FAILED=1
fi
```

### Custom PR Templates

Modify PR body in `4-create-pr.sh`:

```bash
PR_BODY="## Summary

[Your custom template]

## Custom Section
- Custom checklist item

$PR_BODY_FOOTER
"
```

### Environment-Specific Workflows

Use environment variables to customize:

```bash
# Skip security checks in dev
export SKIP_SECURITY=1
./tools/2-quality-check.sh

# Use different base branch
export BASE_BRANCH=develop
./tools/4-create-pr.sh
```

---

## Workflow Metrics

Track workflow performance:

```bash
# Time each step
time ./tools/1-start-feature.sh    # ~5s
time ./tools/2-quality-check.sh    # ~60-120s
time ./tools/3-create-changeset.sh # <1s
time ./tools/4-create-pr.sh        # ~10s
```

**Optimization Tips**:

- Keep tests fast (unit tests < 10s, integration < 30s)
- Use test filtering for large suites
- Cache dependencies in CI
- Parallelize independent checks

---

## Advanced Topics

### Multi-Package Changesets

When changes affect multiple packages:

```bash
# Both packages, different bump types
./tools/3-create-changeset.sh \
  "patch:boss-cli,minor:conductor-mcp" \
  "Fix CLI bug, add MCP feature"

# Alternative: Create separate changesets
./tools/3-create-changeset.sh patch "boss-cli" "Fix CLI bug"
./tools/3-create-changeset.sh minor "conductor-mcp" "Add MCP feature"
```

### Automated Workflows

Script entire workflow:

```bash
#!/bin/bash
# automated-workflow.sh

set -euo pipefail

FEATURE_TYPE=feature
FEATURE_NAME=my-automated-feature

# 1. Start
FEATURE_TYPE=$FEATURE_TYPE FEATURE_NAME=$FEATURE_NAME \
  ./tools/1-start-feature.sh

# 2. Make changes
# ... your code generation ...

git add .
git commit -m "feat: automated changes"

# 3. Quality check
./tools/2-quality-check.sh || exit 1

# 4. Changeset
./tools/3-create-changeset.sh minor "conductor-mcp" "Automated feature"

git add .changeset/
git commit -m "chore: add changeset"

# 5. Create PR
PR_TITLE="feat: my automated feature" ./tools/4-create-pr.sh
```

---

## Troubleshooting Guide

### Debug Mode

Enable verbose output:

```bash
# Bash debug mode
bash -x ./tools/1-start-feature.sh

# Or modify script temporarily
set -x  # Add to script
```

### Common Issues

| Issue                    | Cause                       | Solution                             |
| ------------------------ | --------------------------- | ------------------------------------ |
| Branch already exists    | Previous feature incomplete | Switch or delete old branch          |
| Quality checks timeout   | Large test suite            | Increase timeout or filter tests     |
| Changeset format invalid | Manual edit                 | Regenerate with tool                 |
| PR creation fails        | Auth or network             | Check 1Password, try `gh auth login` |

### Getting Help

1. Check tool output for specific errors
2. Review [SKILL.md](SKILL.md) troubleshooting section
3. See [quality-gates skill](.claude/skills/quality-gates/SKILL.md) for git hooks
4. See [github-ops skill](.claude/skills/github-ops/SKILL.md) for GitHub auth
5. See [workflow-debugging skill](.claude/skills/workflow-debugging/SKILL.md) for CI issues

---

## Related Documentation

- [SKILL.md](SKILL.md) - Quick reference and examples
- [docs/RELEASE.md](../../../docs/RELEASE.md) - Complete release process
- [docs/WORKFLOW_SCRIPTS.md](../../../docs/WORKFLOW_SCRIPTS.md) - Legacy documentation
- [.github/workflows/README.md](../../../.github/workflows/README.md) - CI/CD reference
