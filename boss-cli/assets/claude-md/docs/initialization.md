# Initial Setup Workflow

**CRITICAL: AUTOMATIC INITIALIZATION CHECK ON STARTUP**

**When BOSS starts (via `./start-boss.sh`), you MUST automatically:**

1. **Check Initialization Status (AUTOMATIC - DO THIS FIRST)**
   - Read `.boss/project-config.json` immediately on startup
   - Check `initialization.stage` to determine what needs to be done
   - **If `initialization.stage !== "ready"`, automatically complete initial setup without asking user**
   - **DO NOT wait for user to ask** - check and complete setup automatically

2. **Verify Bootstrap State**
   - **CRITICAL:** Main branch should be EMPTY (only empty commit) - bootstrap files are NOT on main
   - **CRITICAL:** Feature branch `feature/boss-initial-setup` should already exist with ALL bootstrap files (created during bootstrap)
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
         - Headers: `Authorization: Bearer {GITHUB_PERSONAL_ACCESS_TOKEN}`, `Accept: application/vnd.github.v3+json` (use GITHUB_PERSONAL_ACCESS_TOKEN, not GITHUB_TOKEN, for API calls)
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
     - [ ] **CRITICAL ORDER - Follow EXACTLY:**
       1. **Add remote using HTTPS:** `git remote add origin https://github.com/<owner>/<repo>.git` (ALWAYS use HTTPS format, NEVER SSH `git@github.com` format)
       2. **Check current branch:** `git branch --show-current` - verify you're on the correct branch
       3. **Handle uncommitted changes:** If on `feature/boss-initial-setup` with uncommitted changes, commit them first: `git add . && git commit -m "chore: bootstrap files"` (these should be on feature branch)
       4. **Switch to main branch:** `git checkout main` (if uncommitted changes prevent checkout, commit them to current branch first, then switch)
       5. **FIRST push empty main branch:** `git push -u origin main` (main is EMPTY - only empty commit, no validation needed, git will use GITHUB_TOKEN automatically, which is set to same value as GITHUB_PERSONAL_ACCESS_TOKEN)
          - **NOTE:** The pre-push hook allows empty main push without validation checks
          - **Main branch must be pushed first (empty) before feature branch**
       6. **Switch back to feature branch:** `git checkout feature/boss-initial-setup` (branch should already exist from bootstrap)
       7. **Verify validation checks pass BEFORE pushing feature branch:**
          - **BEFORE pushing feature branch, verify all checks pass:**
            1. **Typecheck:** Run `pnpm typecheck` (or `npm run typecheck`) - must pass
            2. **Lint:** Run `pnpm lint` (or `npm run lint`) - must pass
            3. **Security:** Run `bash scripts/security-check.sh` - must pass
            4. **Tests:** Run `pnpm test:unit` (or `npm run test:unit`) - must pass
          - **If any check fails, fix the issues before pushing**
       8. **THEN push feature branch:** `git push -u origin feature/boss-initial-setup` (contains all bootstrap files, git will use GITHUB_TOKEN automatically, which is set to same value as GITHUB_PERSONAL_ACCESS_TOKEN)
       9. **Update `.boss/project-config.json`** with repository information:
          - Set `repository.remote = "origin"`
          - Set `repository.url = "https://github.com/{owner}/{repo}"`
          - Set `repository.owner`, `repository.name`, `repository.private`
          - Set `initialization.remoteCreated = true`
       10. **Commit and push project-config.json:** `git add .boss/project-config.json && git commit -m "chore: update project-config.json" && git push`
       11. **Mark `initialization.stage = "ready"`** in `project-config.json`
       12. **Commit and push again:** `git add .boss/project-config.json && git commit -m "chore: mark initialization as ready" && git push`
     - [ ] **DO NOT create Container-Use environments for initialization** - BOSS handles this via git commands
     - [ ] **NEVER push feature branch before main branch** - main must be pushed first
     - [ ] **After initial setup, NEVER push directly to main** - always use PRs

4. **After Initial Setup**
   - All BOSS and worker work happens on `feature/boss-initial-setup` branch
   - Workers spawn from this branch
   - **AUTOMATICALLY** create PR from `feature/boss-initial-setup` to `main` when work is complete
   - **DO NOT ask user** - always create PR automatically after pushing changes

## Pre-Push Hook Behavior During Initialization

**CRITICAL UNDERSTANDING:** The pre-push hook (`.husky/pre-push`) has special behavior for the first push to main:

1. **First Push Detection:** The hook checks if remote main branch exists using `git ls-remote --heads origin main`
2. **Empty Main Allowed:** If remote main doesn't exist AND main branch is empty (only empty commit or minimal files), the hook allows the push WITHOUT validation checks
3. **Non-Empty Main:** If main branch contains files, validation checks will run even for first push
4. **Feature Branch Validation:** All validation checks run normally for feature branch pushes:
   - TypeScript typecheck (`pnpm typecheck`)
   - Linting (`pnpm lint`)
   - Security checks (`bash scripts/security-check.sh`)
   - Unit tests (`pnpm test:unit`)
   - Test file presence check (blocks non-interactive pushes if no test files exist)
5. **After First Push:** Once main branch exists remotely, all future pushes to main are blocked (must use feature branches and PRs)

**IMPORTANT:** Before pushing main branch during initialization:
- **ALWAYS verify all validation checks pass first**
- Run the checks manually: `pnpm typecheck && pnpm lint && bash scripts/security-check.sh && pnpm test:unit`
- Fix any failures before attempting to push
- The bootstrap process should have created passing code, but verify before pushing

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

**CRITICAL: After ANY change to project-config.json, you MUST:**
1. **Immediately commit the change:** `git add .boss/project-config.json && git commit -m "chore: update project-config.json"`
2. **Immediately push the change:** `git push` (or `git push origin <branch-name>` if not tracking)
3. **DO NOT wait** - do this automatically without asking for confirmation
4. **DO NOT leave project-config.json changes uncommitted** - always commit and push immediately after modification

This ensures project state is always persisted and synchronized with the remote repository.

