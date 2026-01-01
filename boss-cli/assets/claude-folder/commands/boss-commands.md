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
- [ ] **Verify:** Main branch is EMPTY (only empty commit) - bootstrap files are NOT on main
- [ ] **Verify:** Feature branch `feature/boss-initial-setup` exists with ALL bootstrap files (created during bootstrap)
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
    - [ ] Headers: `Authorization: Bearer {GITHUB_PERSONAL_ACCESS_TOKEN}`, `Accept: application/vnd.github.v3+json` (use GITHUB_PERSONAL_ACCESS_TOKEN, not GITHUB_TOKEN, for API calls)
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
  - [ ] **CRITICAL ORDER - Follow EXACTLY:**
    1. **Add remote using HTTPS:** `git remote add origin https://github.com/<owner>/<repo>.git` (ALWAYS use HTTPS, NEVER SSH `git@github.com` format)
    2. **If transferred, update remote:** `git remote set-url origin https://github.com/<new-owner>/<repo>.git` (use HTTPS format)
    3. **FIRST push empty main branch:** `git push -u origin main` (main is EMPTY - only empty commit, no validation needed, MUST be pushed first, git will use GITHUB_TOKEN from environment automatically, which is set to same value as GITHUB_PERSONAL_ACCESS_TOKEN)
       - **NOTE:** The pre-push hook allows empty main push without validation checks
       - **Main branch must be pushed first (empty) before feature branch**
    4. **THEN switch to feature branch:** `git checkout feature/boss-initial-setup` (branch should already exist from bootstrap)
    5. **Verify validation checks pass BEFORE pushing feature branch:**
       - **BEFORE pushing feature branch, verify all checks pass:**
         1. **Typecheck:** Run `pnpm typecheck` (or `npm run typecheck`) - must pass
         2. **Lint:** Run `pnpm lint` (or `npm run lint`) - must pass
         3. **Security:** Run `bash scripts/security-check.sh` - must pass
         4. **Tests:** Run `pnpm test:unit` (or `npm run test:unit`) - must pass
       - **If any check fails, fix the issues before pushing**
    6. **THEN push feature branch:** `git push -u origin feature/boss-initial-setup` (contains all bootstrap files, git will use GITHUB_TOKEN from environment automatically, which is set to same value as GITHUB_PERSONAL_ACCESS_TOKEN)
    7. **Update project-config.json** with repository info (including final owner after transfer)
    8. **Commit and push project-config.json:** `git add .boss/project-config.json && git commit -m "chore: update project-config.json" && git push`
    9. **Mark `initialization.stage = "ready"`** in project-config.json
    10. **Update `initialization.remoteCreated = true`** and `initialization.initialSetupComplete = true`
    11. **Commit and push again:** `git add .boss/project-config.json && git commit -m "chore: mark initialization as ready" && git push`
  - [ ] **NEVER push feature branch before main branch** - empty main must be pushed first
  - [ ] **After this, NEVER push directly to main** - main branch is protected, use PRs for future changes
  - [ ] Create PR from `feature/boss-initial-setup` to `main` automatically (for any future work)
  - [ ] Report completion to user

**Important Notes:**
- BOSS uses git commands for orchestration (branches, pushes, merges) - git CLI is allowed and expected
- Workers use Container-Use MCP for their git operations (automatic)
- ALWAYS update `.boss/project-config.json` to reflect status changes, then commit and push immediately
- ALWAYS ask user for repository preferences before creating
- Default to private repositories unless user specifies otherwise
- **CRITICAL:** Main branch MUST be protected before any pushes - require PRs for all changes
- **NEVER push directly to main branch** - always push to feature branch and create PR
- **ALWAYS create PRs automatically** - never ask user if they want a PR created
- **MINIMIZE status checks** - only check worker/environment status when necessary, not repeatedly

