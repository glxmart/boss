# Branch Management & Workflow

**MANDATORY WORKFLOW FOR EVERY CHANGE:**

1. **Check Project Status**
   - Read `.boss/project-config.json` to understand current state
   - Check `initialization.stage` - if not "ready", complete initial setup first
   - Check `currentBranch` - all work happens on `feature/boss-initial-setup` initially

2. **Spawn Worker (MANDATORY - BOSS Never Does Work Directly)**
   - **CRITICAL:** Use Conductor MCP `spawn_worker` to spawn workers
   - **BOSS MUST NEVER write deliverables directly** (constitution.md, spec.md, plan.md, code, tests, etc.)
   - Conductor handles all container creation, configuration, and execution
   - Worker runs in isolated container with its own branch (`container-use/env-*`)
   - Container has worker-specific `.claude/CLAUDE.md` and `.claude/` config files
   - Worker does ALL the actual work (writes files, runs commands, creates code)
   - Conductor manages all git operations automatically
   - **DO NOT** use git CLI directly for worker operations
   - **DO NOT poll worker status** - check status when needed
   
   **Correct Workflow:**
   ```
   1. BOSS calls conductor.spawn_worker()
   2. Conductor creates container environment
   3. Conductor configures worker's .claude/CLAUDE.md
   4. Conductor executes worker task
   5. WORKER (in container) writes all deliverables
   6. BOSS reviews and merges
   ```
   
   **WRONG - BOSS Doing Work Directly:**
   ```
   1. BOSS creates environment
   2. BOSS uses environment_file_write to write deliverables ❌ NOT OK
   ```

3. **Review Work (Optional - for user visibility)**
   - Check worker status using `conductor.get_worker_status()`
   - Review worker manifest for deliverables
   - **DO NOT wait for approval** - proceed automatically

4. **Merge Worker Changes (AUTOMATIC)**
   - **AUTOMATICALLY** use `conductor.merge_worker()` to merge worker's branch
   - Conductor merges worker's branch into target branch (usually `feature/boss-initial-setup`)
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
- Conductor creates branches locally with naming: `container-use/<env-id>`
- All worker branches merge into `feature/boss-initial-setup` (or current feature branch)
- Workers use Conductor MCP for their operations (automatic)
- Always update `project-config.json` to track state changes
- Each worker environment = isolated branch = isolated work
- **MINIMIZE STATUS CHECKS:** Only check worker status when necessary, not repeatedly

## Automatic Workflow Completion

**CRITICAL: Complete workflow automatically without user prompts**

After worker completes their work:

1. **Merge automatically** - Use `conductor.merge_worker()` to merge worker branch into feature branch
2. **Push feature branch automatically** - Use git commands: `git push origin <feature-branch-name>` or `git push -u origin <feature-branch-name>`
   - **NEVER push to main** - husky pre-push hooks block this (enforced for everyone)
3. **Create PR automatically (MANDATORY)** - Use GitHub MCP to create PR from feature branch to main
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

