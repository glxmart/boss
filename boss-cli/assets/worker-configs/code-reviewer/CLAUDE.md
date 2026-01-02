# ${workerName} Worker Instructions

This worker is responsible for ${workerRoleDescription}

## Worker-Specific Guidelines

- Follow the prompt in \`prompt.md\` for detailed role instructions
- Use container-use environments for all operations
- Reference \`.claude/commands/\`, \`.claude/skills/\`, and \`.claude/agents/\` for worker-specific resources

## Environment Operations

All file, code, and shell operations MUST use container-use environments.

- DO NOT use git CLI directly
- All operations must go through container-use MCP
- Inform user: \`container-use log <env_id>\` AND \`container-use checkout <env_id>\`

## Project Status & Configuration

**CRITICAL:** Always check `.boss/project-config.json` to understand project state before starting work.

**Read project-config.json to understand:**
- Current branch and workflow stage
- Active workers and their status
- Completed tasks
- Repository information
- Initialization status

**Update project-config.json when:**
- Starting work: Add your environment ID to `workflow.activeWorkers`
- Completing work: Add a summary to `workers.summaries` with:
  - Environment ID
  - Tasks completed
  - Artifacts created (review reports, feedback)
  - Code quality metrics
  - Issues found and resolved
  - Any blockers or issues encountered
- After merging: Remove from `workflow.activeWorkers` and add to `workflow.completedTasks`

**Example worker summary format:**
```json
{
  "envId": "env-abc123",
  "workerType": "${workerName}",
  "completedAt": "2026-01-15T10:30:00Z",
  "tasksCompleted": ["Code review", "Test review", "Quality validation"],
  "artifactsCreated": ["review-report.md"],
  "issuesFound": 3,
  "issuesResolved": 3,
  "approvalStatus": "approved",
  "notes": "Completed code review with 3 minor issues resolved"
}
```

**IMPORTANT:**
- NEVER use git commands to check project status - read project-config.json instead
- ALWAYS update project-config.json when completing work
- Keep summaries concise but informative for BOSS to track progress

## Git Commit Strategy

**IMPORTANT:** Batch related changes into logical commits to reduce overhead and improve workflow efficiency.

### Batching Guidelines

1. **Group files by feature/fix** (not by file type)
2. **Aim for 1-3 commits per task** instead of 5-10
3. **Use meaningful commit messages** following Conventional Commits
4. **Only commit when reaching a logical checkpoint**

### Good Practice ✅

```bash
# Create review artifacts in one commit
git add review-report.md review-feedback.json
git commit -m "docs: add code review report with feedback"

# Or batch review fixes
git add src/api/users.ts tests/api/users.test.ts
git commit -m "fix: address code review feedback - add error handling and tests"
```

### Bad Practice ❌

```bash
# Individual commits for related work (too granular)
git add review-report.md
git commit -m "docs: add report"

git add review-feedback.json
git commit -m "docs: add feedback"

git add src/api/users.ts
git commit -m "fix: fix issue 1"
```

### Commit Message Format

Follow Conventional Commits:
- `docs:` - Documentation changes (review reports)
- `fix:` - Bug fixes based on review
- `refactor:` - Code improvements from review
- `style:` - Code style fixes

### Expected Behavior

- **Simple task:** 1-2 commits (review report + fixes)
- **Complex task:** 2-3 commits (review phases)
- **Avoid:** 5-10 commits for small changes

This batching strategy reduces git overhead by ~10-15 seconds per task and creates cleaner commit history.

