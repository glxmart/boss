# GitHub Operations - Troubleshooting Guide

## Table of Contents

- [Token Issues](#token-issues)
- [Authentication Problems](#authentication-problems)
- [Permission Errors](#permission-errors)
- [1Password Integration](#1password-integration)
- [Common Errors](#common-errors)

## Token Issues

### Missing Required Token Scopes

**Error**:

```
gh: Missing required token scopes
Required: repo, workflow, read:org
```

**Diagnosis**:
Your GitHub token doesn't have all required permissions.

**Solution**:

1. **Generate new token**:
   - Visit: https://github.com/settings/tokens/new
   - Token name: `BOSS CLI - Full Access`
   - Expiration: 90 days (recommended)
   - Select scopes:
     - ✅ `repo` (all) - Full repository access
     - ✅ `workflow` - Update GitHub Actions workflows
     - ✅ `write:packages` - Upload packages
     - ✅ `read:packages` - Download packages
     - ✅ `read:org` - Read org and team membership
     - ✅ `read:discussion` - Read discussions (optional)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again)

2. **Update 1Password**:

   ```bash
   op item edit boss/github --field token="ghp_YOUR_NEW_TOKEN_HERE"
   ```

3. **Verify**:
   ```bash
   .claude/skills/github-ops/tools/gh-with-1password.sh auth status
   ```

### Token Expired

**Error**:

```
HTTP 401: Bad credentials
```

**Diagnosis**:
Token has expired (GitHub tokens can have expiration dates).

**Solution**:

1. Check token expiration in GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate new token (see above)
3. Update 1Password
4. Verify authentication

### Wrong Token Stored

**Error**:
Operations fail despite valid-looking token.

**Diagnosis**:
Token stored in 1Password might be corrupted or incomplete.

**Solution**:

1. **Retrieve current token**:

   ```bash
   op item get "boss/github" --fields token
   ```

2. **Verify format**:
   - Classic tokens: Start with `ghp_` (40 characters)
   - Fine-grained tokens: Start with `github_pat_` (longer)

3. **If invalid, regenerate**:

   ```bash
   # Delete old token
   op item delete "boss/github/token"

   # Add new token
   op item create --category=login \
     --title="boss/github" \
     --vault=boss \
     token="ghp_YOUR_NEW_TOKEN"
   ```

## Authentication Problems

### "gh: command not found"

**Cause**: GitHub CLI not installed.

**Solution**:

```bash
# macOS
brew install gh

# Verify
gh --version

# Authenticate (first time)
gh auth login
```

### "op: command not found"

**Cause**: 1Password CLI not installed.

**Solution**:

```bash
# macOS
brew install --cask 1password-cli

# Verify
op --version

# Sign in
op signin
```

### Authentication Loop

**Error**:
`gh` keeps prompting for authentication despite valid token.

**Diagnosis**:
GitHub CLI using different auth method than 1Password.

**Solution**:

1. **Clear existing auth**:

   ```bash
   gh auth logout
   ```

2. **Check 1Password**:

   ```bash
   op run --env-file=.env -- env | grep GITHUB
   ```

3. **Verify token injection**:

   ```bash
   # Should show "Logged in to github.com as <username>"
   op run --env-file=.env -- gh auth status
   ```

4. **If still failing, use explicit token**:
   ```bash
   # Export to environment
   export GITHUB_TOKEN=$(op item get "boss/github" --fields token)
   gh auth status
   ```

## Permission Errors

### "Resource not accessible by integration"

**Error**:

```
gh: Resource not accessible by integration
```

**Cause**: Token lacks specific scope for operation.

**Common Scenarios**:

| Operation          | Required Scope     |
| ------------------ | ------------------ |
| Create/merge PR    | `repo`             |
| Trigger workflow   | `workflow`         |
| Manage packages    | `write:packages`   |
| View org details   | `read:org`         |
| Manage discussions | `write:discussion` |

**Solution**:
Generate new token with all required scopes (see "Missing Required Token Scopes" above).

### "Not Found" (404)

**Possible Causes**:

1. Repository doesn't exist
2. Token lacks access to repository
3. Repository is private and token doesn't have `repo` scope

**Solution**:

1. **Verify repository exists**:

   ```bash
   # Visit repository in browser
   open https://github.com/glxmart/boss
   ```

2. **Check token has repo access**:

   ```bash
   op run --env-file=.env -- gh repo view glxmart/boss
   ```

3. **If private repo, ensure `repo` scope**:
   - Public repos: `public_repo` scope sufficient
   - Private repos: Full `repo` scope required

## 1Password Integration

### ".env file not found"

**Error**:

```
Error: .env file not found at /path/to/boss/.env
```

**Cause**: Running from wrong directory or `.env` missing.

**Solution**:

1. **Check current directory**:

   ```bash
   pwd  # Should be project root
   ```

2. **Verify .env exists**:

   ```bash
   ls -la .env
   ```

3. **Create if missing**:
   ```bash
   cat > .env << 'EOF'
   GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token
   GITHUB_TOKEN=op://boss/github/token
   EOF
   ```

### "Could not retrieve op://boss/github/token"

**Error**:

```
[ERROR] 2024/01/04 could not retrieve op://boss/github/token
```

**Diagnosis**:
1Password reference path is incorrect or entry doesn't exist.

**Solution**:

1. **List all 1Password items**:

   ```bash
   op item list --vault boss
   ```

2. **Check if entry exists**:

   ```bash
   op item get "boss/github"
   ```

3. **If not found, create entry**:

   ```bash
   # Interactive creation
   op item create

   # Or programmatic
   op item create \
     --category=login \
     --title=github \
     --vault=boss \
     token[password]="ghp_YOUR_TOKEN_HERE"
   ```

4. **Verify reference works**:
   ```bash
   op read "op://boss/github/token"
   ```

### "1Password is locked"

**Error**:

```
[ERROR] 1Password is locked. Sign in to unlock.
```

**Solution**:

```bash
# Sign in to 1Password
eval $(op signin)

# Or if already signed in
op signin --force
```

### "Invalid 1Password reference format"

**Error**:

```
[ERROR] invalid item reference
```

**Cause**: Incorrect `op://` reference syntax.

**Correct Formats**:

```bash
# Standard format
op://vault-name/item-name/field-name

# BOSS project format
op://boss/github/token

# With spaces in names
op://boss/github token/password
```

**Solution**:
Update `.env` with correct format:

```bash
GITHUB_TOKEN=op://boss/github/token
```

## Common Errors

### Rate Limiting

**Error**:

```
API rate limit exceeded
```

**Cause**: Too many GitHub API requests.

**Solution**:

1. **Check rate limit**:

   ```bash
   op run --env-file=.env -- gh api rate_limit
   ```

2. **Wait for reset** (shown in response)

3. **For authenticated requests**, rate limit is higher:
   - Unauthenticated: 60 requests/hour
   - Authenticated: 5,000 requests/hour

### Network Issues

**Error**:

```
dial tcp: lookup api.github.com: no such host
```

**Cause**: Network connectivity or DNS issues.

**Solution**:

1. **Check internet connection**:

   ```bash
   ping github.com
   ```

2. **Test DNS resolution**:

   ```bash
   nslookup api.github.com
   ```

3. **Try with different DNS**:
   ```bash
   # Use Google DNS temporarily
   networksetup -setdnsservers Wi-Fi 8.8.8.8
   ```

### SSL Certificate Errors

**Error**:

```
x509: certificate signed by unknown authority
```

**Cause**: Corporate proxy or network intercepting SSL.

**Solution**:

**WARNING**: Only do this if on trusted corporate network

```bash
# Temporarily bypass (NOT recommended for production)
export GH_INSECURE=1
gh pr list
```

**Better solution**: Configure trust for corporate CA certificate.

## Getting Help

### Enable Debug Mode

```bash
# GitHub CLI debug
GH_DEBUG=api op run --env-file=.env -- gh pr list

# 1Password debug
OP_DEBUG=1 op run --env-file=.env -- gh pr list

# Bash debug
bash -x .claude/skills/github-ops/tools/gh-with-1password.sh pr list
```

### Collect Diagnostic Info

```bash
# Versions
echo "=== Versions ==="
gh --version
op --version

# Authentication status
echo "=== GitHub Auth ==="
op run --env-file=.env -- gh auth status

# 1Password connectivity
echo "=== 1Password ==="
op item list --vault boss

# Environment
echo "=== Environment ==="
op run --env-file=.env -- env | grep GITHUB
```

### Check Workflow Documentation

If issues persist, see:

- [SKILL.md](SKILL.md) - Complete usage guide
- [docs/GITHUB_TOKEN_SETUP.md](../../../docs/GITHUB_TOKEN_SETUP.md) - Detailed token setup
- [GitHub CLI Manual](https://cli.github.com/manual/) - Official documentation

## Quick Fixes Reference

| Issue            | Quick Fix                                  |
| ---------------- | ------------------------------------------ |
| Token expired    | Regenerate → Update 1Password → Verify     |
| Missing scopes   | New token with all scopes                  |
| .env not found   | `cat > .env` with op:// references         |
| 1Password locked | `eval $(op signin)`                        |
| gh not installed | `brew install gh`                          |
| op not installed | `brew install --cask 1password-cli`        |
| Wrong directory  | `cd /path/to/boss`                         |
| Network issues   | Check connectivity, DNS                    |
| Rate limited     | Wait for reset, use authenticated requests |
