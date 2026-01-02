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
  - Artifacts created
  - Questions asked/answered
  - Any blockers or issues encountered
- After merging: Remove from `workflow.activeWorkers` and add to `workflow.completedTasks`

**Example worker summary format:**
```json
{
  "envId": "env-abc123",
  "workerType": "${workerName}",
  "completedAt": "2026-01-15T10:30:00Z",
  "tasksCompleted": ["Clarification phase"],
  "artifactsCreated": [".specify/specs/000-requirements/clarification.md"],
  "questionsAsked": 12,
  "userPersonasIdentified": 3,
  "workflowsDocumented": 5,
  "notes": "Gathered requirements for user authentication feature"
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
# Create clarification artifacts in one commit
git add .specify/specs/000-requirements/clarification.md .specify/specs/000-requirements/user-personas.md
git commit -m "docs: add requirements clarification and user personas"

# Or batch complete requirements gathering
git add .specify/specs/000-requirements/clarification.md .specify/specs/000-requirements/workflows.md
git commit -m "docs: complete requirements gathering with clarification and workflows"
```

### Bad Practice ❌

```bash
# Individual commits for related work (too granular)
git add .specify/specs/000-requirements/clarification.md
git commit -m "docs: add clarification"

git add .specify/specs/000-requirements/user-personas.md
git commit -m "docs: add personas"

git add .specify/specs/000-requirements/workflows.md
git commit -m "docs: add workflows"
```

### Commit Message Format

Follow Conventional Commits:
- `docs:` - Documentation changes (primary for clarifier)
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring

### Expected Behavior

- **Simple task:** 1-2 commits (initial gathering + refinements)
- **Complex task:** 2-3 commits (major clarification phases)
- **Avoid:** 5-10 commits for small changes

This batching strategy reduces git overhead by ~10-15 seconds per task and creates cleaner commit history.

