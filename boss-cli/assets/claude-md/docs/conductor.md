# Conductor MCP Operations

**CRITICAL:** BOSS uses Conductor MCP to orchestrate workers. Conductor handles all container management, worker configuration, and execution.

## Overview

Conductor MCP is a middleware layer that simplifies worker orchestration. Instead of manually managing container environments, BOSS makes simple Conductor calls:

```typescript
// Spawn a worker (Conductor handles everything)
await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution with TDD, BDD, and quality standards',
  targetBranch: 'feature/boss-initial-setup'
});
```

## Core Conductor Tools

BOSS has access to 8 Conductor tools:

1. **`spawn_worker`** - Spawn a single worker with full environment setup
2. **`spawn_workers_parallel`** - Spawn multiple workers in parallel (optimized for Phase 5)
3. **`get_worker_status`** - Check worker status and manifest
4. **`list_active_workers`** - List all active workers
5. **`execute_task`** - Execute additional tasks in existing worker environment
6. **`merge_worker`** - Merge worker branch into target branch
7. **`terminate_worker`** - Terminate a worker and clean up
8. **`ask_worker`** - Query worker about their work

## Worker Spawning

**CRITICAL:** BOSS must ALWAYS spawn workers using Conductor. BOSS must NEVER write deliverables directly.

**Correct Workflow:**
```
1. BOSS calls conductor.spawn_worker()
2. Conductor creates container environment
3. Conductor configures worker's .claude/CLAUDE.md
4. Conductor executes worker task
5. WORKER writes all deliverables
6. BOSS reviews and merges
```

**WRONG - BOSS Doing Work Directly:**
```
1. BOSS creates environment
2. BOSS uses environment_file_write to write deliverables ❌ NOT OK
```

## What Conductor Handles

✅ **Conductor DOES:**
- Load worker configurations from `.boss/workers/[worker-type]/`
- Create container environments
- Configure `.claude/CLAUDE.md` with worker-specific instructions
- Copy worker-specific `.claude/` files to container
- Execute tasks in isolated environments
- Track worker state and manifests
- Manage git branches (`container-use/env-*`)

✅ **BOSS DOES:**
- Call Conductor tools to spawn workers
- Provide task prompts for workers
- Monitor worker status
- Decide when to merge or terminate workers
- Handle phase orchestration logic
- Manage quality gates and retries

❌ **BOSS DOES NOT:**
- Load worker configurations (Conductor does this)
- Create container environments (Conductor does this)
- Configure `.claude/CLAUDE.md` (Conductor does this)
- Execute claude-code commands (Conductor does this)
- Track worker state (Conductor does this)

## Worker Status and Manifests

Workers communicate their status via manifests (`.boss/worker-manifest-{workerId}.json`):

```typescript
// Check worker status
const status = await conductor.get_worker_status({
  workerId: 'env-abc123'
});

if (status.manifest?.workComplete) {
  await conductor.merge_worker({ workerId: 'env-abc123' });
}
```

## Parallel Worker Execution

For Phase 5 optimization, spawn multiple workers in parallel:

```typescript
const results = await conductor.spawn_workers_parallel({
  workers: [
    { workerType: 'architect', taskPrompt: '...' },
    { workerType: 'clarifier', taskPrompt: '...' },
    { workerType: 'spec-writer', taskPrompt: '...' },
    { workerType: 'planner', taskPrompt: '...' }
  ],
  maxConcurrency: 4
});
```

## Resuming Worker Environments

To continue work in an existing environment (94% faster):

```typescript
const followUp = await conductor.spawn_worker({
  workerType: 'developer-backend',
  taskPrompt: 'Add password reset to complete authentication',
  resumeEnvironmentId: previousWorker.workerId,
  targetBranch: 'feature/boss-auth'
});
```

## Key Rules

- **[DO]** ALWAYS use Conductor tools to spawn workers
- **[DO]** ALWAYS let workers write deliverables
- **[DO]** ALWAYS review worker manifests before merging
- **[DON'T]** NEVER write deliverables directly as BOSS
- **[DON'T]** NEVER use container-use MCP directly (use Conductor instead)
- **[DON'T]** NEVER bypass worker execution

## Available Workers

Conductor supports 15 worker types:
- `architect`, `clarifier`, `spec-writer`, `planner`, `reviewer`
- `developer-frontend`, `developer-backend`, `developer-fullstack`
- `tester`, `code-reviewer`, `security-engineer`, `devops-engineer`
- `technical-writer`, `product-owner`, `consolidator`

See `docs/workers.md` for detailed worker descriptions.

