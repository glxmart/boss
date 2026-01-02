# ${workerName} Worker Instructions

## Worker-Specific Guidelines

- Your role, responsibilities, and artifact requirements are defined in conductor-mcp's metadata.json
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
  - Artifacts created (constitution.md)
  - Principles established
  - Any blockers or issues encountered
- After merging: Remove from `workflow.activeWorkers` and add to `workflow.completedTasks`

**Example worker summary format:**
```json
{
  "envId": "env-abc123",
  "workerType": "${workerName}",
  "completedAt": "2026-01-15T10:30:00Z",
  "tasksCompleted": ["Constitution creation"],
  "artifactsCreated": [".specify/memory/constitution.md"],
  "principlesEstablished": ["Test-First", "BDD", "Documentation"],
  "notes": "Created project constitution with TDD, BDD, and documentation standards"
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
# Create constitution artifacts in one commit
git add .specify/memory/constitution.md .specify/memory/principles.md
git commit -m "docs: add project constitution with development principles"

# Or batch complete architectural phase
git add .specify/memory/constitution.md .specify/memory/architecture.md
git commit -m "docs: establish constitution and architectural guidelines"
```

### Bad Practice ❌

```bash
# Individual commits for related work (too granular)
git add .specify/memory/constitution.md
git commit -m "docs: add constitution"

git add .specify/memory/principles.md
git commit -m "docs: add principles"

git add .specify/memory/architecture.md
git commit -m "docs: add architecture"
```

### Commit Message Format

Follow Conventional Commits:
- `docs:` - Documentation changes (primary for architect)
- `feat:` - New architectural features

### Expected Behavior

- **Simple task:** 1-2 commits (constitution + principles)
- **Complex task:** 2-3 commits (major architectural phases)
- **Avoid:** 5-10 commits for small changes

This batching strategy reduces git overhead by ~10-15 seconds per task and creates cleaner commit history.

