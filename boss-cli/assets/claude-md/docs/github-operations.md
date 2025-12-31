# GitHub MCP Operations

**CRITICAL:** 
- **GitHub MCP is already authenticated and available** - use it directly for GitHub API operations (repositories, PRs, issues, branch protection)
- Use git commands for local git operations (branches, pushes, merges)
- **ALWAYS use HTTPS URLs for git remotes:** `https://github.com/<owner>/<repo>.git` (NEVER use SSH `git@github.com` format)
- **Git authentication:** Git automatically uses `GITHUB_TOKEN` environment variable for HTTPS authentication (set to same value as `GITHUB_PERSONAL_ACCESS_TOKEN` for consistency)

## Organization Selection

**CRITICAL: Use MCP for ALL GitHub Operations**

**When user requests to create repository in an organization:**

1. **Ask user directly for organization name:**
   - Simply ask: "What is the name of the GitHub organization you want to create the repository in?"
   - Wait for user to provide the organization name as a string (e.g., "my-org", "company-name")
   - Store the organization name for use in repository creation and transfer

2. **DO NOT:**
   - ❌ List organizations using `search_users` MCP tool with `type:org` - this searches public organizations
   - ❌ Use curl to call GitHub API endpoints - use GitHub MCP tools instead
   - ❌ Try to enumerate user's organizations - just ask the user directly

3. **Use GitHub MCP for all operations:**
   - Use GitHub MCP `createRepository` tool to create the repository
   - Use GitHub MCP transfer tool (if available) to transfer repository to organization
   - Use GitHub MCP for all repository, branch, and PR operations

## Repository Creation

**CRITICAL: BOSS's Role in Repository Setup**

**BOSS does NOT:**
- ❌ Push to main branch (husky pre-push hooks block this - enforced for everyone)
- ❌ Create Container-Use environments for repository setup operations
- ❌ Use Container-Use MCP for BOSS's own git operations

**BOSS DOES:**
- ✅ Use git commands for orchestration: create branches, push code, merge branches, add remotes
- ✅ Use GitHub MCP for GitHub API operations: create repositories, create PRs, set branch protection

**BOSS DOES (continued):**
- ✅ Use GitHub MCP to check if repository exists (`search_repositories` or similar)
- ✅ Use GitHub MCP to create repository if it doesn't exist (`createRepository`)
- ✅ Use GitHub MCP to set branch protection (use GitHub MCP tools, or if not available, use `run_terminal_cmd` with curl as fallback)
- ✅ Use git commands to add remotes: `git remote add origin https://github.com/<owner>/<repo>.git` (ALWAYS use HTTPS, NEVER SSH)
- ✅ Use git commands to push branches: `git push origin <branch-name>` (except main - blocked by hooks)
- ✅ **Git authentication:** Git automatically uses `GITHUB_TOKEN` environment variable for HTTPS authentication (set to same value as `GITHUB_PERSONAL_ACCESS_TOKEN` for consistency)
- ✅ **GitHub MCP is authenticated:** GitHub MCP server is already up and authenticated - use it directly, no additional setup needed
- ✅ Update `.boss/project-config.json` directly with repository information, then commit and push: `git add .boss/project-config.json && git commit -m "chore: update project-config.json" && git push`

**IMPORTANT LIMITATION:** The GitHub MCP `createRepository` tool currently only creates repositories under the authenticated user's personal account, not under organizations. This is a limitation of the GitHub MCP tool itself, not the PAT permissions.

**AUTOMATIC TRANSFER:** When an organization is requested, automatically ask the user if they want to transfer the repository. First try using GitHub MCP transfer tool if available, otherwise fall back to GitHub API.

When creating a GitHub repository:

1. **Ask User for Preferences:**
   - Should repository be **private** or **public**? (default: private)
   - Should it be created in an **organization**? (if yes, proceed to step 2)
   - Repository name (if different from project name)

2. **If Organization Was Requested - Get Organization Name:**
   - **CRITICAL:** Ask user directly for the organization name as a string
   - Simply ask: "What is the name of the GitHub organization you want to create the repository in?"
   - Wait for user to provide the organization name (e.g., "my-org", "company-name")
   - Store the organization name for use in repository transfer
   - **DO NOT use `search_users` MCP tool** - this searches public organizations, not the user's organizations
   - **DO NOT use curl** - use GitHub MCP tools for all operations

3. **Create Repository:**
   ```typescript
   // Use GitHub MCP to create repository (GitHub MCP is already authenticated - use it directly)
   // NOTE: This will create under personal account even if organization is specified
   const repo = await mcp.github.createRepository({
     name: "project-name",
     description: "BOSS project",
     private: true,  // Ask user, default to private
     // organization parameter is not supported by GitHub MCP
   });
   ```
   **After creating repository, use HTTPS URL for git remote:**
   - Repository URL format: `https://github.com/<owner>/<repo>.git`
   - Add remote: `git remote add origin https://github.com/<owner>/<repo>.git` (NEVER use SSH `git@github.com` format)
   - Git will automatically use `GITHUB_TOKEN` environment variable for authentication (set to same value as `GITHUB_PERSONAL_ACCESS_TOKEN` for consistency)

4. **If Organization Was Selected - Automatic Transfer:**
   - Inform the user: "Repository created under your personal account. Would you like me to transfer it to [org-name] now?"
   - If user confirms:
     - Transfer the repository (see "Repository Transfer" section below for complete instructions)
     - First try GitHub MCP transfer tool if available
     - If MCP tool not available, use `run_terminal_cmd` to execute curl command
     - Verify response status is `202 Accepted`
     - Wait for transfer to complete (poll status if needed, or wait a few seconds)
     - **Verify dependencies are installed** - `start-boss.sh` already runs `pnpm install` automatically, so just verify `node_modules` exists (do NOT run install again)
     - Update git remote URL using HTTPS: `git remote set-url origin https://github.com/<new-owner>/<repo>.git` (NEVER use SSH format)
     - Update `project-config.json` with transferred repository info

5. **Update project-config.json:**
   - Set `repository.remote = "origin"`
   - Set `repository.url` (use org URL if transferred, personal URL if not)
   - Set `repository.owner` (org name if transferred, personal account if not)
   - Set `repository.name`, `private`
   - Set `repository.organization` to the org name (even if not yet transferred)
   - Set `initialization.remoteCreated = true`

## Repository Transfer

**OFFICIAL INSTRUCTIONS:** Transfer repositories using GitHub MCP if available, otherwise fall back to GitHub REST API.

**Official Documentation:** https://docs.github.com/en/rest/repos/repos#transfer-a-repository

**Method 1: Try GitHub MCP First (Preferred)**

Check if GitHub MCP provides a `transfer_repository` or similar tool. If available, use it:

```typescript
// Try GitHub MCP transfer tool if available
try {
  const result = await mcp.github.transferRepository({
    owner: currentOwner,
    repo: repoName,
    new_owner: targetOrgName,
    // Optional: team_ids, new_name
  });
  // Transfer successful via MCP
} catch (error) {
  // MCP tool not available, fall back to API method
}
```

**Method 2: Fallback to GitHub REST API (If MCP Not Available)**

If GitHub MCP doesn't have a transfer tool, use direct HTTP requests via `run_terminal_cmd`.

**Endpoint:** `POST /repos/{owner}/{repo}/transfer`

**Request Headers:**
- `Authorization: Bearer {GITHUB_PERSONAL_ACCESS_TOKEN}`
- `Accept: application/vnd.github.v3+json`

**Request Body:**
```json
{
  "new_owner": "new_owner_username_or_org",
  "team_ids": [1234567, 2345678],  // Optional: array of team IDs (for org transfers)
  "new_name": "new_repository_name"  // Optional: rename during transfer
}
```

**Response:** `202 Accepted` - Transfer initiated successfully

**Using run_terminal_cmd with curl (Fallback if MCP not available):**
```bash
curl -X POST \
  -H "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/{current-owner}/{repo-name}/transfer \
  -d "{\"new_owner\": \"{target-org}\"}"
```

**Critical Requirements:**
- ✅ **Administrative access required** - You must have admin access to the repository being transferred
- ✅ **Organization permissions** - If transferring to an organization, you must have permission to create repositories in that organization
- ✅ **Acceptance window** - The new owner has 24 hours to accept the transfer, otherwise it expires
- ✅ **Update git remote** - After successful transfer, update the git remote URL using Container-Use MCP
- ✅ **Update project-config.json** - Update repository owner, URL, and organization fields

**Post-Transfer Steps:**
1. Wait for transfer to complete (poll repository status or wait a few seconds)
2. **CRITICAL: Verify dependencies are installed** - Before creating Container-Use environments, ensure `node_modules` exists:
   - **NOTE:** `start-boss.sh` already runs `pnpm install` (or `npm install`) automatically before launching Claude
   - **DO NOT run `pnpm install` again** - dependencies should already be installed
   - Only verify `node_modules` directory exists (if missing, that's unexpected)
   - This prevents pre-push hook failures due to missing dependencies
3. Update git remote URL in Container-Use environment
4. Verify remote was updated correctly
5. Update `project-config.json` with new owner and URL

## Branch Operations

- **Create branches:** BOSS uses git commands: `git checkout -b <branch-name>` or Container-Use MCP for worker branches (creates environment = branch)
- **Push branches:** BOSS uses git commands: `git push origin <branch-name>` (except main - blocked by husky hooks)
  - **Git authentication:** Git automatically uses `GITHUB_TOKEN` environment variable for HTTPS authentication (set to same value as `GITHUB_PERSONAL_ACCESS_TOKEN` for consistency)
  - **ALWAYS use HTTPS remotes:** Ensure remote URL is `https://github.com/<owner>/<repo>.git` (NEVER SSH format)
- **List branches:** Use GitHub MCP for remote branch info, or git commands for local branches: `git branch` or `git branch -a`

## Branch Protection

**CRITICAL: MAIN BRANCH IS PROTECTED - PRs REQUIRED**

- **Main branch is locked during initial setup** - direct pushes are blocked
- **ALL changes to main must go through pull requests** - no exceptions
- Branch protection is set up automatically during initial setup with:
  - Required pull request reviews before merging
  - Required status checks to pass
  - Required branches to be up to date
  - Force pushes disabled
  - Branch deletions disabled

**NEVER:**
- ❌ Push directly to main branch
- ❌ Bypass PR requirement
- ❌ Skip PR creation

**ALWAYS:**
- ✅ Push to feature branch (`feature/boss-initial-setup` or `feature/*`)
- ✅ Create PR from feature branch to main
- ✅ Use PRs for all changes to main

## Pull Requests

**CRITICAL: AUTOMATIC PR CREATION - NO USER PROMPTS - MANDATORY**

- **ALWAYS** create PRs automatically - **NEVER ask user if they want a PR created**
- **MANDATORY:** After merging worker changes and pushing to remote, **IMMEDIATELY** create PR using GitHub MCP
- **Main branch protection requires PRs** - direct pushes will fail
- Use GitHub MCP `mcp__github__create_pull_request` to create PR from feature branch to main
- Include worker summaries, quality gate results, and related specs/issues in PR body
- Link to container-use environments for review
- PR title format: `feat: [feature-name] - [brief description]` or `chore: [description]`
- **DO NOT wait for user confirmation** - create PR automatically as part of workflow completion
- **DO NOT skip PR creation** - it's mandatory for all changes to main

## GitHub Repository Requirements

**CRITICAL: Repository Privacy Policy**

- **Default to PRIVATE repositories** - Ask user for preference
- When using GitHub MCP to create repositories, ask user:
  - Should it be private or public? (default: private)
  - Should it be in an organization? (if yes, which org?)
- This applies to:
  - Initial repository creation during setup
  - Any new repositories created for projects, features, or sub-projects

