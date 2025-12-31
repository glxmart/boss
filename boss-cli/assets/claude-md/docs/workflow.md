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

3. **Spawn Worker**
   - Use `mcp_container-use_execute_in_environment` to run worker
   - Worker runs in isolated container with its own branch
   - Container-Use manages all git operations automatically
   - **DO NOT** use git CLI directly
   - **DO NOT poll worker status** - Container-Use will notify when work completes
   - **Only check status once** after worker execution completes, not repeatedly

4. **Review Work (Optional - for user visibility)**
   - Inform user how to review: `container-use log <env_id>`, `container-use diff <env_id>`, `container-use checkout <env_id>`
   - **DO NOT wait for approval** - proceed automatically

5. **Merge Worker Changes (AUTOMATIC)**
   - **AUTOMATICALLY** use `mcp_container-use_merge_environment` to merge worker's branch
   - Container-Use merges worker's branch into target branch (usually `feature/boss-initial-setup`)
   - **DO NOT check worker status repeatedly** - only check once after merge completes
   - Update `project-config.json`:
     - Remove from `workflow.activeWorkers`
     - Add summary to `workers.summaries`
     - Add to `workflow.completedTasks`

6. **Push Branch to Remote (AUTOMATIC)**
   - **AUTOMATICALLY** push feature branch to remote using Container-Use MCP environment
   - Use `mcp_container-use_environment_run_cmd` to run: `git push origin <feature-branch-name>`
   - **NEVER push to main branch directly** - main is protected and requires PRs
   - **DO NOT ask user for confirmation** - push automatically

7. **Create Pull Request (AUTOMATIC - MANDATORY - NO EXCEPTIONS)**
   - **AUTOMATICALLY** use GitHub MCP to create PR from feature branch to main
   - **CRITICAL:** Main branch is protected - direct pushes are blocked
   - **DO NOT ask user if they want PR created** - always create it automatically
   - **DO NOT skip PR creation** - it's mandatory for all changes
   - Include details about changes, workers used, quality gate results
   - Link to related specifications or issues
   - PR title format: "feat: [feature-name] - [brief description]" or "chore: [description]"
   - PR body should include worker summaries and quality gate status

**CRITICAL RULES:**
- **MAIN BRANCH PROTECTION:** Main branch is locked - direct pushes are blocked
- **ALWAYS USE PRs:** All changes to main must go through pull requests
- **NEVER push to main directly** - always push to feature branch and create PR
- Container-Use creates branches locally with naming: `container-use/<env-id>`
- All worker branches merge into `feature/boss-initial-setup` (or current feature branch)
- Never use git CLI directly - Container-Use and GitHub MCP handle everything
- Always update `project-config.json` to track state changes
- Each worker environment = isolated branch = isolated work
- **MINIMIZE STATUS CHECKS:** Only check worker/environment status when necessary, not repeatedly

## Automatic Workflow Completion

**CRITICAL: Complete workflow automatically without user prompts**

After worker completes their work:

1. **Merge automatically** - Use `mcp_container-use_merge_environment` to merge worker branch into feature branch
2. **Push feature branch automatically** - Use `mcp_container-use_environment_run_cmd` to push: `git push origin <feature-branch-name>`
   - **NEVER push to main** - main branch is protected and requires PRs
3. **Create PR automatically (MANDATORY)** - Use `mcp__github__create_pull_request` to create PR from feature branch to main
4. **Update project-config.json** - Mark workflow as complete, add PR link

**DO NOT:**
- ❌ Ask user "Should I create a PR?" - **ALWAYS create it automatically**
- ❌ Ask user "Ready to create PR?" - **ALWAYS create it automatically**
- ❌ Wait for user approval before pushing or creating PR
- ❌ Skip PR creation - **PR creation is MANDATORY**
- ❌ Push directly to main branch - **main is protected, use PRs only**
- ❌ Check worker/environment status repeatedly - only check once when needed

**DO:**
- ✅ Complete entire workflow automatically: merge → push feature branch → create PR
- ✅ Inform user that PR was created with link: "✅ PR created: [link]"
- ✅ Include comprehensive PR body with worker summaries and quality gates
- ✅ Minimize status checks - only check when necessary for workflow progression

