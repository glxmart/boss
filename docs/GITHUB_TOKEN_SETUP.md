# GitHub Token Setup Guide

This guide explains how to create and configure a GitHub Personal Access Token with the correct scopes for BOSS development.

## Quick Fix (Recommended)

If you're seeing "Missing required token scopes" errors:

```bash
# 1. Go to GitHub and generate new token
open https://github.com/settings/tokens/new

# 2. After generating, copy the token and run:
op item edit boss/github --field token="ghp_YOUR_NEW_TOKEN_HERE"

# 3. Verify
op run --env-file=.env -- gh auth status
```

**Required scopes for new token**:

- ☑️ `repo` - Full control of private repositories
- ☑️ `workflow` - Update GitHub Action workflows
- ☑️ `write:packages` - Upload packages to GitHub Package Registry
- ☑️ `read:packages` - Download packages from GitHub Package Registry
- ☑️ **`read:org`** ← **NEW** (needed for PR details)
- ☑️ **`read:discussion`** ← **NEW** (optional, for discussions)

See detailed instructions below for step-by-step guidance.

---

## Required Token Scopes

The GitHub token stored in 1Password (`boss/github/token`) needs the following scopes:

### Essential Scopes (Currently Have)

- ✅ **`repo`** - Full control of private repositories
  - Includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
  - Used for: Git operations, reading/writing code, managing releases

- ✅ **`workflow`** - Update GitHub Action workflows
  - Used for: Triggering workflows, managing workflow runs

- ✅ **`write:packages`** - Upload packages to GitHub Package Registry
  - Used for: Publishing npm packages, Docker images

### Missing Scopes (Need to Add)

- ❌ **`read:org`** - Read org and team membership, read org projects
  - **Why needed**: View PR details (assignees, reviewers, team info)
  - **Impact**: Without this, `gh pr view` fails with scope error
  - **Note**: Only read access, cannot modify organization

- ⚠️ **`read:discussion`** (Optional but recommended)
  - **Why needed**: Read discussions in PRs and issues
  - **Impact**: Better PR context when viewing discussions
  - **Note**: Only needed if using GitHub Discussions

### Recommended Additional Scopes

- 📝 **`read:project`** - Read access to projects
  - **Why needed**: View project boards, issues in projects
  - **Useful for**: BOSS GitHub integration features

## How to Update Token Scopes

### Create New Token

**Step 1: Open GitHub Token Settings**

```bash
# Quick command to open in browser
open https://github.com/settings/tokens/new
```

Or navigate manually: Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

**Step 2: Generate New Token (Classic)**

1. Click "Generate new token (classic)"
   - Note: We use classic tokens for compatibility

2. Configure token:
   - **Note**: `BOSS Development Token`
   - **Expiration**: 90 days (or "No expiration" for convenience)

3. Select scopes:

   ```
   ☑ repo (Full control of private repositories)
   ☑ workflow (Update GitHub Action workflows)
   ☑ write:packages (Upload packages to GitHub Package Registry)
   ☑ read:packages (Download packages from GitHub Package Registry)
   ☑ read:org (Read org and team membership) ← NEW
   ☑ read:discussion (Read discussions) ← NEW
   ```

4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again!)

**Step 3: Update 1Password**

```bash
# Store the token in 1Password
op item edit boss/github --field token="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Step 4: Verify**

```bash
# Test authentication
op run --env-file=.env -- gh auth status

# Should show:
#   ✓ Token scopes: 'read:discussion', 'read:org', 'repo', 'workflow', 'write:packages'

# Test PR viewing (previously failed)
op run --env-file=.env -- gh pr list
```

## Verifying Token Scopes

After updating the token, verify it has all required scopes:

```bash
# Check current scopes
op run --env-file=.env -- gh auth status 2>&1 | grep -A 5 "Token scopes"

# Expected output:
#   - Token scopes: 'read:discussion', 'read:org', 'repo', 'workflow', 'write:packages'
#   ✓ Token scopes sufficient for all actions
```

## Troubleshooting

### "Missing required token scopes" Error

**Error**:

```
Your token has not been granted the required scopes to execute this query.
The 'login' field requires one of the following scopes: ['read:org']
```

**Solution**: Generate a new token following the steps above.

### 1Password Not Resolving Token

**Error**: `op: "boss/github/token" isn't a valid secret reference`

**Solution**:

```bash
# List items in boss vault
op item list --vault boss

# Verify the path
op item get boss/github --fields token

# If not found, create it
op item create --category password \
  --vault boss \
  --title github \
  --fields token=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Security Best Practices

1. **Never commit tokens to Git**
   - Always use `.env` with `op://` references
   - The `.env` file is git-ignored

2. **Set expiration**
   - Tokens should expire (90 days recommended)
   - Set calendar reminder to refresh before expiration

3. **Use minimal scopes**
   - Only add scopes you actually need
   - Don't grant `admin:org` or `delete:packages` unless required

4. **Rotate regularly**
   - Refresh tokens every 3-6 months
   - Update 1Password immediately after rotation

5. **Monitor usage**
   - Check GitHub Settings → Applications for active tokens
   - Revoke unused tokens

## References

- [GitHub Token Scopes Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [Creating Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [1Password Secret References](https://developer.1password.com/docs/cli/secret-references)
