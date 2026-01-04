---
name: github-ops
description: Execute GitHub CLI operations with 1Password credential management. Use when working with PRs, workflows, issues, or any gh command requiring authentication.
allowed-tools: Bash, Read
---

# GitHub Operations with 1Password

## Overview

This skill provides secure GitHub CLI operations using 1Password for credential management. All GitHub operations (PRs, workflows, issues, releases) use the `gh` CLI with automatic 1Password credential injection.

## Quick Start

### Run GitHub CLI Command

```bash
.claude/skills/github-ops/tools/gh-with-1password.sh <gh-command> [args...]
```

### Common Operations

```bash
# List pull requests
.claude/skills/github-ops/tools/gh-with-1password.sh pr list

# View workflow runs
.claude/skills/github-ops/tools/gh-with-1password.sh run list

# Create an issue
.claude/skills/github-ops/tools/gh-with-1password.sh issue create

# View PR details
.claude/skills/github-ops/tools/gh-with-1password.sh pr view 42
```

## How It Works

### 1Password Integration

The skill uses 1Password CLI to inject GitHub credentials at runtime:

```bash
# .env file contains 1Password references
GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token
GITHUB_TOKEN=op://boss/github/token

# Tool injects credentials and runs gh command
op run --env-file=.env -- gh <command>
```

**Benefits**:

- ✅ Never store tokens in plain text
- ✅ Centralized credential management
- ✅ Automatic rotation support
- ✅ Audit trail via 1Password
- ✅ Team credential sharing

### Tool Wrapper

The `gh-with-1password.sh` wrapper:

1. Locates project root and `.env` file
2. Validates `.env` exists
3. Injects credentials via `op run`
4. Executes `gh` command
5. Returns output and exit code

## Common Use Cases

### Pull Requests

```bash
# List PRs
./tools/gh-with-1password.sh pr list

# View PR
./tools/gh-with-1password.sh pr view 42

# Create PR (interactive)
./tools/gh-with-1password.sh pr create

# Merge PR
./tools/gh-with-1password.sh pr merge 42 --squash --delete-branch

# Add label
./tools/gh-with-1password.sh pr edit 42 --add-label skip-changeset
```

### Workflow Runs

```bash
# List recent runs
./tools/gh-with-1password.sh run list --limit 10

# View specific run
./tools/gh-with-1password.sh run view <run-id>

# View failed logs
./tools/gh-with-1password.sh run view <run-id> --log-failed

# Re-run failed jobs
./tools/gh-with-1password.sh run rerun <run-id> --failed

# Download logs
./tools/gh-with-1password.sh run download <run-id>
```

### Issues

```bash
# List issues
./tools/gh-with-1password.sh issue list

# Create issue
./tools/gh-with-1password.sh issue create \
  --title "Bug: validation error" \
  --body "Description here" \
  --label bug

# Close issue
./tools/gh-with-1password.sh issue close 123
```

### Repository API

```bash
# Get workflows
./tools/gh-with-1password.sh api repos/glxmart/boss/actions/workflows

# Get workflow runs
./tools/gh-with-1password.sh api repos/glxmart/boss/actions/runs

# Trigger workflow
./tools/gh-with-1password.sh workflow run release.yml
```

## Setup

### 1. Install 1Password CLI

```bash
# macOS
brew install --cask 1password-cli

# Verify installation
op --version
```

### 2. Configure 1Password Vault

Create entries in your 1Password vault:

**Entry 1**: `boss/github`

- Field: `token`
- Value: Your GitHub Personal Access Token

Required token scopes:

- ✅ `repo` - Repository access
- ✅ `workflow` - Workflow management
- ✅ `write:packages` - Package publishing
- ✅ `read:packages` - Package reading
- ✅ `read:org` - Organization read (for PR details)

### 3. Create .env File

In your project root:

```bash
# .env
GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token
GITHUB_TOKEN=op://boss/github/token
```

**IMPORTANT**: Never commit actual tokens to `.env`. Always use `op://` references.

### 4. Test Authentication

```bash
# Test GitHub auth
./tools/gh-with-1password.sh auth status

# Test API access
./tools/gh-with-1password.sh api user
```

## Token Management

### Generating New Token

1. Go to https://github.com/settings/tokens/new
2. Select required scopes (see Setup section)
3. Generate token
4. Copy token value

### Updating Token in 1Password

```bash
# Update token in 1Password
op item edit boss/github --field token="ghp_YOUR_NEW_TOKEN_HERE"

# Verify update
./tools/gh-with-1password.sh auth status
```

### Token Rotation

When rotating tokens:

1. Generate new token on GitHub
2. Update 1Password entry
3. Verify with `gh auth status`
4. Revoke old token on GitHub

No code changes needed - credentials update automatically!

## Troubleshooting

### "Error: .env file not found"

**Cause**: Running from wrong directory or `.env` missing

**Solution**:

```bash
# Ensure you're in project root
cd /path/to/boss

# Check .env exists
ls -la .env

# Run command
./claude/skills/github-ops/tools/gh-with-1password.sh pr list
```

### "Missing required token scopes"

**Cause**: GitHub token lacks necessary permissions

**Solution**:

1. Generate new token with required scopes
2. Update 1Password: `op item edit boss/github --field token="ghp_NEW_TOKEN"`
3. Verify: `./tools/gh-with-1password.sh auth status`

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for complete token scope guide.

### "1Password CLI not found"

**Cause**: 1Password CLI not installed

**Solution**:

```bash
# Install
brew install --cask 1password-cli

# Verify
op --version
```

### "Could not retrieve op://boss/github/token"

**Cause**: 1Password vault entry missing or incorrect path

**Solution**:

```bash
# List 1Password items
op item list

# Check specific item
op item get "boss/github"

# Verify token field exists
op item get "boss/github" --fields token
```

### "gh: command not found"

**Cause**: GitHub CLI not installed

**Solution**:

```bash
# Install GitHub CLI
brew install gh

# Verify
gh --version

# Login (first time only)
gh auth login
```

## Integration with Workflow

The github-ops skill is used by:

1. **workflow-management** - Creating PRs (step 4)
2. **workflow-debugging** - Analyzing workflow failures
3. **Manual operations** - Ad-hoc GitHub tasks

## Environment Variables

The tool uses these environment variables:

- `GITHUB_TOKEN` - GitHub Personal Access Token (from 1Password)
- `GITHUB_PERSONAL_ACCESS_TOKEN` - Alias for GITHUB_TOKEN

Both reference the same 1Password entry for compatibility.

## Security Best Practices

1. **Never commit tokens** - Always use `op://` references
2. **Rotate regularly** - Update tokens every 90 days
3. **Minimum scopes** - Only grant required permissions
4. **Audit access** - Review 1Password access logs
5. **Team vaults** - Use shared vaults for team credentials

## Advanced Usage

### Custom 1Password Vault

If using a different vault structure:

```bash
# Edit .env to point to your vault
GITHUB_TOKEN=op://my-vault/my-github/token

# Tool automatically uses your reference
./tools/gh-with-1password.sh pr list
```

### Non-Interactive Automation

For CI/CD or scripts:

```bash
# Export credentials to environment
eval "$(op run --env-file=.env -- env | grep GITHUB | sed 's/^/export /')"

# Now gh works without wrapper
gh pr list
gh run list
```

### Multiple GitHub Accounts

Use different 1Password entries:

```bash
# Personal account
GITHUB_TOKEN=op://personal/github/token \
  ./tools/gh-with-1password.sh pr list --repo user/personal-repo

# Work account
GITHUB_TOKEN=op://work/github/token \
  ./tools/gh-with-1password.sh pr list --repo company/work-repo
```

## Tool Reference

| Tool                   | Purpose                           | Usage                                       |
| ---------------------- | --------------------------------- | ------------------------------------------- |
| `gh-with-1password.sh` | Run gh with 1Password credentials | `./tools/gh-with-1password.sh <gh-command>` |

## Related Skills

- **[workflow-management](.claude/skills/workflow-management/SKILL.md)** - Uses gh for PR creation
- **[workflow-debugging](.claude/skills/workflow-debugging/SKILL.md)** - Uses gh for workflow analysis
- **[quality-gates](.claude/skills/quality-gates/SKILL.md)** - Git hooks that may trigger gh operations

## Documentation

For complete GitHub CLI documentation:

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed troubleshooting guide
- [GitHub CLI Manual](https://cli.github.com/manual/) - Official gh documentation
- [1Password CLI Reference](https://developer.1password.com/docs/cli/) - Official op documentation
