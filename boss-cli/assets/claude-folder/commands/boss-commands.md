# BOSS Commands

## Available Commands

### Container-Use Commands

- \`container-use log <env_id>\` - View worker logs
- \`container-use checkout <env_id>\` - Checkout worker branch
- \`container-use diff <env_id>\` - View code changes
- \`container-use merge <env_id>\` - Merge worker branch

### Spec-Kit Commands

- \`bash .specify/scripts/speckit.plan.sh\` - Generate plan
- \`bash .specify/scripts/speckit.tasks.sh\` - Generate tasks
- \`bash .specify/scripts/speckit.implement.sh\` - Implement features

### BOSS Commands

- \`./start-boss.sh\` - Start BOSS with MCP restrictions

### Initial Setup Command

**Command:** `boss-initial-setup`

**Purpose:** Complete the initial project setup after bootstrap.

**When to Run:**
- After bootstrap completes
- When `initialization.stage` in `.boss/project-config.json` is `"bootstrap"` or `"remote-setup"`

**What It Does:**
1. Checks `.boss/project-config.json` for current initialization status
2. Verifies if remote repository exists
3. If no remote exists:
   - Asks user:
     - Should repository be **private** or **public**? (default: private)
     - Should it be created in an **organization**? (if yes, which org?)
     - Repository name (if different from project name)
   - Creates GitHub repository using GitHub MCP
   - Adds remote using Container-Use MCP (NOT git CLI)
   - Pushes initial commit to remote
   - Updates `.boss/project-config.json` with remote information
4. Marks `initialization.stage = "ready"` in project-config.json
5. Updates project status to indicate setup is complete

**How to Execute:**
- BOSS can run this command directly when user asks to complete setup
- Or BOSS can spawn an initial-setup worker using Container-Use MCP
- Worker should follow the checklist in its prompt.md

**Checklist for Initial Setup:**
- [ ] Read `.boss/project-config.json` to check current status
- [ ] **Verify:** Main branch contains ALL bootstrap files (committed during bootstrap)
- [ ] **Verify:** Feature branch `feature/boss-initial-setup` exists (created as LAST step during bootstrap)
- [ ] Confirm you are on `feature/boss-initial-setup` branch (created during bootstrap)
- [ ] Check if remote repository exists (read project-config.json, NOT git)
- [ ] If no remote:
  - [ ] Ask user for repository preferences (private/public, org)
  - [ ] Create GitHub repository using GitHub MCP (will create under personal account)
  - [ ] If organization was requested:
    - [ ] Ask user: "Repository created under your personal account. Would you like me to transfer it to [org-name] now?"
    - [ ] If user confirms:
      - [ ] Transfer repository using GitHub API: `POST /repos/{owner}/{repo}/transfer` with `{"new_owner": "org-name"}`
      - [ ] Wait for transfer to complete
      - [ ] Update git remote URL to reflect new owner using Container-Use MCP
  - [ ] **CRITICAL: Lock main branch and require PRs** - Use GitHub API to set branch protection:
    - [ ] Make HTTP PUT request to: `https://api.github.com/repos/{owner}/{repo}/branches/main/protection`
    - [ ] Headers: `Authorization: token {GITHUB_TOKEN}`, `Accept: application/vnd.github.v3+json`
    - [ ] Body (JSON):
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
    - [ ] Verify protection was set: Check response status is 200
    - [ ] **DO NOT skip this step** - branch protection is mandatory
  - [ ] Add remote using Container-Use MCP environment (or update if transferred)
  - [ ] **Push main branch to remote FIRST** (contains all bootstrap files) - use Container-Use MCP
  - [ ] Push `feature/boss-initial-setup` branch to remote - use Container-Use MCP
  - [ ] **After this, NEVER push directly to main** - main branch is protected, use PRs for future changes
  - [ ] Create PR from `feature/boss-initial-setup` to `main` automatically (for any future work)
  - [ ] Update project-config.json with repository info (including final owner after transfer)
- [ ] Mark `initialization.stage = "ready"` in project-config.json
- [ ] Update `initialization.remoteCreated = true`
- [ ] Update `initialization.initialSetupComplete = true`
- [ ] Report completion to user

**Important Notes:**
- NEVER use git CLI directly - use Container-Use MCP for all git operations (git CLI is only allowed during bootstrap before Container-Use is available)
- ALWAYS update `.boss/project-config.json` to reflect status changes
- ALWAYS ask user for repository preferences before creating
- Default to private repositories unless user specifies otherwise
- **CRITICAL:** Main branch MUST be protected before any pushes - require PRs for all changes
- **NEVER push directly to main branch** - always push to feature branch and create PR
- **ALWAYS create PRs automatically** - never ask user if they want a PR created
- **MINIMIZE status checks** - only check worker/environment status when necessary, not repeatedly

