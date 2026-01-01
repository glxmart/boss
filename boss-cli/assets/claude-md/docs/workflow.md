# Branch Management & Workflow

**MANDATORY WORKFLOW FOR EVERY CHANGE:**

1. **Check Project Status**
   - Read `.boss/project-config.json` to understand current state
   - Check `initialization.stage` - if not "ready", complete initial setup first
   - Check `currentBranch` - all work happens on `feature/boss-initial-setup` initially

2. **Create Worker Environment**
   - Use Container-Use MCP `mcp_container-use_create_environment`
   - Environment automatically creates branch: `container-use/<env-id>`
   - Branch is created locally and will be pushed to remote later
   - Update `project-config.json` with new worker in `workflow.activeWorkers`
   - **DO NOT check environment status repeatedly** - only check when needed

3. **Configure Container Environment (MANDATORY - BEFORE Spawning Worker)**
   - **CRITICAL:** This is the ONLY exception where BOSS uses `environment_file_write`
   - **Purpose:** Configure container with worker-specific context, not BOSS's orchestration context
   - **Load worker configuration:**
     - Read `.boss/workers/[worker-name]/prompt.md` to understand worker's role
     - Read `.boss/workers/[worker-name]/CLAUDE.md` for execution guidelines
     - Check for worker-specific `.claude` folder: `.boss/workers/[worker-name]/.claude/`
   - **Overwrite `.claude/CLAUDE.md` in container:**
     - Read `.boss/workers/[worker-name]/CLAUDE.md` from host
     - Use `mcp_container-use_environment_file_write` to write to `/workdir/.claude/CLAUDE.md` in container
     - **CRITICAL PATH:** Host `.boss/workers/architect/CLAUDE.md` → Container `/workdir/.claude/CLAUDE.md`
     - Container needs worker's instructions, not BOSS's orchestration instructions
   - **Copy worker-specific `.claude` files to container:**
     - If `.boss/workers/[worker-name]/.claude/` exists, copy all files maintaining directory structure
     - **CRITICAL PATH TRANSFORMATION:**
       - Host: `.boss/workers/architect/.claude/commands/file.md`
       - Container: `/workdir/.claude/commands/file.md`
       - Remove `.boss/workers/architect/` prefix, keep `.claude/` structure
     - Copy all subdirectories:
       - `.claude/commands/` → `/workdir/.claude/commands/`
       - `.claude/skills/` → `/workdir/.claude/skills/`
       - `.claude/agents/` → `/workdir/.claude/agents/`
       - `.claude/settings*.json` → `/workdir/.claude/settings*.json`
     - Use `mcp_container-use_environment_file_write` for each file
   - **Why:** Container's Claude Code reads from `/workdir/.claude/` by convention - we must copy files there
   - **Why NOT environment variables:** Claude Code reads from `.claude/` folder by convention, cannot be changed

4. **Spawn Worker (MANDATORY - BOSS Never Does Work Directly)**
   - **CRITICAL:** Use `mcp_container-use_execute_in_environment` to run worker
   - **BOSS MUST NEVER write deliverables directly** (constitution.md, spec.md, plan.md, code, tests, etc.)
   - **BOSS MUST NEVER use `environment_file_write` to create deliverables** - workers write all deliverables
   - **BOSS MUST NEVER use `environment_run_cmd` to execute code that creates deliverables** - workers do this
   - Worker runs in isolated container with its own branch
   - Container has worker-specific `.claude/CLAUDE.md` and `.claude/` config files
   - Worker does ALL the actual work (writes files, runs commands, creates code)
   - Container-Use manages all git operations automatically
   - **DO NOT** use git CLI directly
   - **DO NOT poll worker status** - Container-Use will notify when work completes
   - **Only check status once** after worker execution completes, not repeatedly
   
   **Correct Workflow:**
   ```
   1. BOSS creates environment
   2. BOSS loads worker prompt from .boss/workers/[worker-name]/prompt.md
   3. BOSS configures container: overwrites .claude/CLAUDE.md and copies .claude/ files
   4. BOSS calls mcp_container-use_execute_in_environment with task prompt
   5. WORKER (in container) writes all deliverables
   6. BOSS reviews and merges
   ```
   
   **WRONG - BOSS Doing Work Directly:**
   ```
   1. BOSS creates environment
   2. BOSS reads worker prompt
   3. BOSS uses environment_file_write to write deliverables NOT OK WRONG!
   ```

5. **Review Work (Optional - for user visibility)**
   - Inform user how to review: `container-use log <env_id>`, `container-use diff <env_id>`, `container-use checkout <env_id>`
   - **DO NOT wait for approval** - proceed automatically

6. **Merge Worker Changes (AUTOMATIC)**
   - **AUTOMATICALLY** use `mcp_container-use_merge_environment` to merge worker's branch
   - Container-Use merges worker's branch into target branch (usually `feature/boss-initial-setup`)
   - **DO NOT check worker status repeatedly** - only check once after merge completes
   - Update `project-config.json`:
     - Remove from `workflow.activeWorkers`
     - Add summary to `workers.summaries`
     - Add to `workflow.completedTasks`

7. **Push Branch to Remote (AUTOMATIC)**
   - **AUTOMATICALLY** push feature branch to remote using git commands
   - Use: `git push origin <feature-branch-name>` or `git push -u origin <feature-branch-name>`
   - **NEVER push to main branch directly** - husky pre-push hooks block this (enforced for everyone)
   - **DO NOT ask user for confirmation** - push automatically

8. **Create Pull Request (AUTOMATIC - MANDATORY - NO EXCEPTIONS)**
   - **AUTOMATICALLY** use GitHub MCP to create PR from feature branch to main
   - **CRITICAL:** Main branch is protected - direct pushes are blocked
   - **DO NOT ask user if they want PR created** - always create it automatically
   - **DO NOT skip PR creation** - it's mandatory for all changes
   - Include details about changes, workers used, quality gate results
   - Link to related specifications or issues
   - PR title format: "feat: [feature-name] - [brief description]" or "chore: [description]"
   - PR body should include worker summaries and quality gate status

**CRITICAL RULES:**
- **MAIN BRANCH PROTECTION:** Main branch is locked - husky pre-push hooks block direct pushes (enforced for everyone, including BOSS and humans)
- **ALWAYS USE PRs:** All changes to main must go through pull requests
- **NEVER push to main directly** - always push to feature branch and create PR
- **BOSS uses git commands** for orchestration: creating branches, pushing code, merging branches
- Container-Use creates branches locally with naming: `container-use/<env-id>`
- All worker branches merge into `feature/boss-initial-setup` (or current feature branch)
- Workers use Container-Use MCP for their git operations (automatic)
- Always update `project-config.json` to track state changes
- Each worker environment = isolated branch = isolated work
- **MINIMIZE STATUS CHECKS:** Only check worker/environment status when necessary, not repeatedly

## Automatic Workflow Completion

**CRITICAL: Complete workflow automatically without user prompts**

After worker completes their work:

1. **Merge automatically** - Use `mcp_container-use_merge_environment` to merge worker branch into feature branch, or use git commands: `git merge <worker-branch>`
2. **Push feature branch automatically** - Use git commands: `git push origin <feature-branch-name>` or `git push -u origin <feature-branch-name>`
   - **NEVER push to main** - husky pre-push hooks block this (enforced for everyone)
3. **Create PR automatically (MANDATORY)** - Use `mcp__github__create_pull_request` to create PR from feature branch to main
4. **Update project-config.json** - Mark workflow as complete, add PR link, then commit and push: `git add .boss/project-config.json && git commit -m "chore: update project-config.json" && git push`

**DO NOT:**
- NOT OK Ask user "Should I create a PR?" - **ALWAYS create it automatically**
- NOT OK Ask user "Ready to create PR?" - **ALWAYS create it automatically**
- NOT OK Wait for user approval before pushing or creating PR
- NOT OK Skip PR creation - **PR creation is MANDATORY**
- NOT OK Push directly to main branch - **main is protected, use PRs only**
- NOT OK Check worker/environment status repeatedly - only check once when needed

**DO:**
- OK Complete entire workflow automatically: merge → push feature branch → create PR
- OK Inform user that PR was created with link: "OK PR created: [link]"
- OK Include comprehensive PR body with worker summaries and quality gates
- OK Minimize status checks - only check when necessary for workflow progression

