# Initial Setup Workflow

**CRITICAL: AUTOMATIC INITIALIZATION CHECK ON STARTUP**

**When BOSS starts (via `./start-boss.sh`), you MUST automatically:**

1. **Check Initialization Status (AUTOMATIC - DO THIS FIRST)**
   - Read `.boss/project-config.json` immediately on startup
   - Check `initialization.stage` to determine what needs to be done
   - **If `initialization.stage !== "ready"`, automatically complete initial setup without asking user**
   - **DO NOT wait for user to ask** - check and complete setup automatically

2. **Verify Bootstrap State**
   - **CRITICAL:** Main branch should already contain ALL bootstrap files
   - **CRITICAL:** Feature branch `feature/boss-initial-setup` should already exist (created during bootstrap)
   - **CRITICAL: Verify dependencies are installed** - Before creating Container-Use environments:
     - **NOTE:** `start-boss.sh` already runs `pnpm install` (or `npm install`) automatically before launching Claude
     - **DO NOT run `pnpm install` again** - dependencies should already be installed
     - Only verify `node_modules` directory exists (if missing, that's unexpected - `start-boss.sh` should have installed them)
     - This prevents pre-push/pre-commit hook failures due to missing dependencies (e.g., `tsc` not found)
   - If feature branch doesn't exist, create it from main
   - Switch to this branch using Container-Use MCP (create environment on this branch)
   - Update `project-config.json` with `currentBranch: "feature/boss-initial-setup"`

3. **Run Initial Setup Checklist**
   - **CRITICAL:** BOSS handles initialization directly using GitHub MCP - do NOT spawn workers for this
   - Checklist includes:
     - [ ] Check if remote repository exists using GitHub MCP `search_repositories` tool
     - [ ] If no remote, ask user:
       - Should repository be private or public? (default: private)
       - Should it be created in an organization? (if yes, proceed to list orgs)
       - Repository name (if different from project name)
     - [ ] If organization was requested:
       - [ ] **CRITICAL:** Ask user directly for the organization name as a string
       - [ ] Simply ask: "What is the name of the GitHub organization you want to create the repository in?"
       - [ ] Wait for user to provide the organization name (e.g., "my-org", "company-name")
       - [ ] Store the organization name for use in repository transfer
       - [ ] **DO NOT use `search_users` MCP tool** - this searches public organizations
       - [ ] **DO NOT use curl** - use GitHub MCP tools for all operations
     - [ ] Create GitHub repository using GitHub MCP
     - [ ] **CRITICAL: Lock main branch and require PRs** - Use GitHub MCP to set branch protection:
       - First, try to use GitHub MCP tools for branch protection (if available)
       - If GitHub MCP doesn't have a branch protection tool, use `run_terminal_cmd` with curl as fallback:
         - Make HTTP PUT request to: `https://api.github.com/repos/{owner}/{repo}/branches/main/protection`
         - Headers: `Authorization: token {GITHUB_TOKEN}`, `Accept: application/vnd.github.v3+json`
         - Body:
           ```json
           {
             "required_pull_request_reviews": {
               "required": true,
               "dismiss_stale_reviews": true,
               "require_code_owner_reviews": false,
               "required_approving_review_count": 1
             },
             "enforce_admins": true,
             "required_status_checks": {
               "strict": true,
               "contexts": []
             },
             "restrictions": null,
             "allow_force_pushes": false,
             "allow_deletions": false,
             "required_linear_history": false,
             "allow_squash_merge": true,
             "allow_merge_commit": true,
             "allow_rebase_merge": true
           }
           ```
       - Verify protection was set: Check response status is 200
     - [ ] **CRITICAL:** After repository is created or confirmed to exist:
       - [ ] Update `.boss/project-config.json` directly with repository information:
         - Set `repository.remote = "origin"`
         - Set `repository.url = "https://github.com/{owner}/{repo}"`
         - Set `repository.owner`, `repository.name`, `repository.private`
         - Set `initialization.remoteCreated = true`
       - [ ] **DO NOT add git remotes or push commits** - repository setup is complete
       - [ ] **DO NOT create Container-Use environments for initialization** - BOSS handles this via GitHub MCP only
     - [ ] **NEVER push directly to main after this** - always use PRs
     - [ ] Mark `initialization.stage = "ready"` in `project-config.json`

4. **After Initial Setup**
   - All BOSS and worker work happens on `feature/boss-initial-setup` branch
   - Workers spawn from this branch
   - **AUTOMATICALLY** create PR from `feature/boss-initial-setup` to `main` when work is complete
   - **DO NOT ask user** - always create PR automatically after pushing changes

## Project Config Structure

**CRITICAL:** Always check `.boss/project-config.json` for project status, initialization stages, and current state. This file is the single source of truth for:
- Initialization status (bootstrap, remote setup, initial setup completion)
- Current branch and workflow stage
- Remote repository information
- Worker activity summaries
- Project metadata

**DO NOT** use git commands to determine project status. Read `.boss/project-config.json` instead.

**Project Config Structure:**
```json
{
  "initialization": {
    "stage": "bootstrap",  // Values: "bootstrap" | "remote-setup" | "initial-setup" | "ready"
    "bootstrapComplete": true,
    "remoteCreated": false,
    "initialSetupComplete": false
  },
  "repository": {
    "remote": "origin",  // Values: "origin" or null
    "url": "https://github.com/owner/repo",  // string or null
    "owner": "username",  // string or null
    "name": "project-name",  // string or null
    "private": true,  // boolean or null
    "organization": "org-name"  // string or null
  },
  "currentBranch": "feature/boss-initial-setup",
  "workflow": {
    "stage": "initialization",  // current workflow stage
    "activeWorkers": [],
    "completedTasks": []
  },
  "workers": {
    "summaries": []
  }
}
```

**When to Update project-config.json:**
- After completing initialization steps
- When spawning/merging workers
- When creating/updating remote repository
- When changing branches or workflow stages
- After any significant project state change

