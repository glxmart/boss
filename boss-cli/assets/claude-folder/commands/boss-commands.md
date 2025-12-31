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
- [ ] Confirm you are on `feature/boss-initial-setup` branch (created during bootstrap)
- [ ] Check if remote repository exists (read project-config.json, NOT git)
- [ ] If no remote:
  - [ ] Ask user for repository preferences (private/public, org)
  - [ ] Create GitHub repository using GitHub MCP
  - [ ] Add remote using Container-Use MCP environment
  - [ ] Push initial commit using Container-Use MCP
  - [ ] Update project-config.json with repository info
- [ ] Mark `initialization.stage = "ready"` in project-config.json
- [ ] Update `initialization.remoteCreated = true`
- [ ] Update `initialization.initialSetupComplete = true`
- [ ] Report completion to user

**Important Notes:**
- NEVER use git CLI directly - use Container-Use MCP for all git operations (git CLI is only allowed during bootstrap before Container-Use is available)
- ALWAYS update `.boss/project-config.json` to reflect status changes
- ALWAYS ask user for repository preferences before creating
- Default to private repositories unless user specifies otherwise

