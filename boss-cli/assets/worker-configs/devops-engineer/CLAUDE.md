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
  - Artifacts created (CI/CD configs, infrastructure code, deployment docs)
  - Deployment environments configured
  - Any blockers or issues encountered
- After merging: Remove from `workflow.activeWorkers` and add to `workflow.completedTasks`

**Example worker summary format:**
```json
{
  "envId": "env-abc123",
  "workerType": "${workerName}",
  "completedAt": "2026-01-15T10:30:00Z",
  "tasksCompleted": ["CI/CD pipeline", "Infrastructure setup"],
  "artifactsCreated": [".github/workflows/ci.yml", "terraform/", ".specify/specs/001-feature/quickstart.md"],
  "environments": ["dev", "staging", "production"],
  "notes": "Set up CI/CD pipeline and infrastructure for feature deployment"
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
# Create infrastructure files in one commit
git add .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "ci: add CI/CD pipeline workflows"

# Or batch complete infrastructure setup
git add terraform/main.tf terraform/variables.tf .specify/specs/001-feature/quickstart.md
git commit -m "feat: add infrastructure configuration with deployment docs"
```

### Bad Practice ❌

```bash
# Individual commits for related work (too granular)
git add .github/workflows/ci.yml
git commit -m "ci: add CI"

git add .github/workflows/deploy.yml
git commit -m "ci: add deploy"

git add terraform/main.tf
git commit -m "feat: add terraform"
```

### Commit Message Format

Follow Conventional Commits:
- `ci:` - CI/CD changes (primary for devops)
- `feat:` - New infrastructure features
- `fix:` - Infrastructure bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

### Expected Behavior

- **Simple task:** 1-2 commits (setup + configuration)
- **Complex task:** 2-3 commits (major infrastructure phases)
- **Avoid:** 5-10 commits for small changes

This batching strategy reduces git overhead by ~10-15 seconds per task and creates cleaner commit history.

