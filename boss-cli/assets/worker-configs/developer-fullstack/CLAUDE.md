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
  - Files changed
  - Tests written/updated
  - Documentation created
  - Any blockers or issues encountered
- After merging: Remove from `workflow.activeWorkers` and add to `workflow.completedTasks`

**Example worker summary format:**
```json
{
  "envId": "env-abc123",
  "workerType": "${workerName}",
  "completedAt": "2026-01-15T10:30:00Z",
  "tasksCompleted": ["T010", "T011", "T012"],
  "filesChanged": ["src/api/users.ts", "src/components/UserCard.tsx", "tests/api/users.test.ts"],
  "testsWritten": 8,
  "testsUpdated": 3,
  "documentationCreated": ["docs/api/users.md", "docs/components/UserCard.md"],
  "notes": "Implemented fullstack user authentication with TDD"
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
# Create multiple related files in one commit
git add src/components/UserProfile.tsx src/components/UserProfile.test.tsx
git commit -m "feat: add user profile component with tests"

# Or batch a complete feature implementation
git add src/api/auth.ts src/hooks/useAuth.ts tests/api/auth.test.ts
git commit -m "feat: implement authentication API and hooks with test coverage"
```

### Bad Practice ❌

```bash
# Individual commits for related work (too granular)
git add src/components/UserProfile.tsx
git commit -m "feat: add component"

git add src/components/UserProfile.test.tsx
git commit -m "test: add component tests"

git add src/styles/UserProfile.css
git commit -m "style: add component styles"
```

### Commit Message Format

Follow Conventional Commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `perf:` - Performance improvements

### Expected Behavior

- **Simple task:** 1-2 commits (setup + implementation)
- **Complex task:** 2-3 commits (major logical phases)
- **Avoid:** 5-10 commits for small changes

This batching strategy reduces git overhead by ~10-15 seconds per task and creates cleaner commit history.

