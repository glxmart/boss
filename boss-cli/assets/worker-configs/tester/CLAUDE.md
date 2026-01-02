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
  - Artifacts created (test files, test reports)
  - Test coverage metrics
  - Mutation testing scores
  - Any blockers or issues encountered
- After merging: Remove from `workflow.activeWorkers` and add to `workflow.completedTasks`

**Example worker summary format:**
```json
{
  "envId": "env-abc123",
  "workerType": "${workerName}",
  "completedAt": "2026-01-15T10:30:00Z",
  "tasksCompleted": ["BDD test suite", "Integration tests"],
  "artifactsCreated": ["tests/feature.test.ts", "tests/integration.test.ts"],
  "testCoverage": "85%",
  "mutationScore": "82%",
  "notes": "Created comprehensive test suite with BDD tests matching spec.md"
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
# Create test files in one commit
git add tests/feature.test.ts tests/integration.test.ts tests/e2e.test.ts
git commit -m "test: add comprehensive test suite with unit, integration, and e2e tests"

# Or batch test implementation with fixtures
git add tests/api/users.test.ts tests/fixtures/users.ts tests/helpers/auth.ts
git commit -m "test: implement user API tests with fixtures and helpers"
```

### Bad Practice ❌

```bash
# Individual commits for related work (too granular)
git add tests/feature.test.ts
git commit -m "test: add unit tests"

git add tests/integration.test.ts
git commit -m "test: add integration tests"

git add tests/e2e.test.ts
git commit -m "test: add e2e tests"
```

### Commit Message Format

Follow Conventional Commits:
- `test:` - Adding/updating tests (primary for tester)
- `fix:` - Bug fixes found during testing

### Expected Behavior

- **Simple task:** 1-2 commits (test suite + coverage)
- **Complex task:** 2-3 commits (major test phases)
- **Avoid:** 5-10 commits for small changes

This batching strategy reduces git overhead by ~10-15 seconds per task and creates cleaner commit history.

