# Conductor MCP - BOSS Integration Guide

**How BOSS uses Conductor to orchestrate workers**

This guide explains how BOSS uses Conductor MCP to simplify worker orchestration, from setup to execution.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [How BOSS Uses Conductor](#how-boss-uses-conductor)
4. [Tool Reference](#tool-reference)
5. [Workflows](#workflows)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Conductor?

Conductor is an MCP middleware layer that **simplifies worker orchestration** for BOSS. Instead of manually managing container environments, configurations, and executions, BOSS makes simple Conductor calls.

### Before Conductor (Complex)

```typescript
// BOSS had to do ALL of this manually:

// 1. Load worker configuration
const configPath = `.boss/workers/${workerType}/container-config.json`;
const config = JSON.parse(readFile(configPath));

// 2. Create container environment
const env = await containerUse.createEnvironment({
  base_image: config.base_image,
  setup_commands: config.setup_commands,
  install_commands: config.install_commands,
  environment_variables: expandVariables(config.environment_variables),
  secrets: config.secrets,
  network: config.network
});

// 3. Configure container (.claude/CLAUDE.md)
const claudeMd = readFile(`.boss/workers/${workerType}/CLAUDE.md`);
await containerUse.environmentFileWrite({
  environment_id: env.environment_id,
  target_file: '/workdir/.claude/CLAUDE.md',
  contents: expandTemplate(claudeMd)
});

// 4. Copy .claude folder files (multiple calls)
for (const file of claudeFiles) {
  await containerUse.environmentFileWrite({
    environment_id: env.environment_id,
    target_file: `/workdir/.claude/${file.path}`,
    contents: file.contents
  });
}

// 5. Execute task
const prompt = assemblePrompt(workerPrompt, taskPrompt);
await containerUse.executeInEnvironment({
  environment_id: env.environment_id,
  command: `echo '${escapePrompt(prompt)}' | claude-code --dangerously-skip-permissions`
});

// 6. Track state manually
// ... state management code ...
```

### With Conductor (Simple)

```typescript
// BOSS just does this:
const result = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution with TDD, BDD, Documentation standards'
});

// Done! Worker is running with full configuration.
```

**Complexity Reduction: 6+ steps → 1 call**

---

## Setup

### Prerequisites

Before BOSS can use Conductor, these must be installed:

1. **container-use CLI** (globally)
   ```bash
   npm install -g container-use
   ```

2. **Conductor MCP** (automatically installed by `boss bootstrap`)
   - Added to `.mcp.json`
   - Added to `.claude/mcp.json`
   - Added to `.cursor/mcp.json`

### Verification

BOSS can verify Conductor is available:

```typescript
// Check Conductor health
const health = await conductor.conductor_health();

if (!health.healthy) {
  console.error('Conductor not ready:', health.errors);
  // Errors will indicate if container-use is missing
}
```

**Expected healthy response:**
```json
{
  "healthy": true,
  "containerUseAvailable": true
}
```

**If container-use not installed:**
```json
{
  "healthy": false,
  "containerUseAvailable": false,
  "errors": ["Container-Use MCP is not available"]
}
```

---

## How BOSS Uses Conductor

### Architecture

```
┌─────────────────────────────────────────┐
│  BOSS (Claude Code/Cursor)              │
│  • Orchestrates phases                  │
│  • Calls Conductor tools                │
│  • Monitors worker progress             │
└──────────────┬──────────────────────────┘
               │ Simple API (8 tools)
               ▼
┌─────────────────────────────────────────┐
│  Conductor MCP                          │
│  • Loads worker configs                 │
│  • Creates environments                 │
│  • Configures containers                │
│  • Executes tasks                       │
│  • Tracks state                         │
└──────────────┬──────────────────────────┘
               │ Container-Use CLI
               ▼
┌─────────────────────────────────────────┐
│  container-use                          │
│  • Manages Docker containers            │
│  • Executes claude-code                 │
│  • Handles git branches                 │
└─────────────────────────────────────────┘
```

### BOSS's Responsibilities

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
- Configure .claude/CLAUDE.md (Conductor does this)
- Execute claude-code commands (Conductor does this)
- Track worker state (Conductor does this)

---

## Tool Reference

Conductor exposes 8 tools to BOSS:

### 1. `spawn_worker`

**Purpose:** Spawn a worker with full environment setup

**When BOSS calls this:**
- At the start of each phase
- When spawning parallel workers
- When retrying a failed worker

**Input:**
```typescript
{
  workerType: 'architect' | 'clarifier' | 'spec-writer' | 'planner' |
              'reviewer' | 'developer-frontend' | 'developer-backend' |
              'developer-fullstack' | 'tester' | 'code-reviewer' |
              'security-engineer' | 'devops-engineer' | 'technical-writer' |
              'product-owner' | 'consolidator',
  taskPrompt: string,              // What the worker should do
  projectPath?: string,            // Defaults to cwd
  targetBranch?: string            // Defaults to 'feature/boss-initial-setup'
}
```

**Output:**
```typescript
{
  success: true,
  workerId: 'env-abc123',
  workerType: 'architect',
  branch: 'container-use/env-abc123',
  status: 'running',
  message: 'architect worker spawned successfully',
  executionDetails: {
    environmentId: 'env-abc123',
    containerConfigApplied: true,
    claudeConfigured: true,
    taskStartedAt: '2026-01-01T18:00:00Z'
  }
}
```

**Example:**
```typescript
// Phase 1: Spawn architect worker
const architect = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: `Create constitution.md with:
    - Architectural Principles (Test-First, BDD, Documentation)
    - Development Methodology
    - Testing Standards (≥80% coverage)
    - Documentation Standards`
});

console.log(`Architect spawned: ${architect.workerId}`);
console.log(`Branch: ${architect.branch}`);
```

---

### 2. `execute_task`

**Purpose:** Execute an additional task in an existing worker

**When BOSS calls this:**
- When a worker needs to perform a follow-up task
- When adding to a worker's scope
- When refining worker output

**Input:**
```typescript
{
  workerId: string,        // From spawn_worker response
  taskPrompt: string       // Additional task instructions
}
```

**Output:**
```typescript
{
  success: true,
  workerId: 'env-abc123',
  status: 'running',
  executionLog: '...',     // Execution output
  artifacts: [...]         // Files created/modified
}
```

**Example:**
```typescript
// Architect completed constitution, now add security section
await conductor.execute_task({
  workerId: architect.workerId,
  taskPrompt: 'Add Security Principles section to constitution.md covering OWASP Top 10'
});
```

---

### 3. `get_worker_status`

**Purpose:** Check worker status and get results

**When BOSS calls this:**
- To monitor worker progress
- To check if worker completed
- To retrieve artifacts
- Before merging worker

**Input:**
```typescript
{
  workerId: string
}
```

**Output:**
```typescript
{
  workerId: 'env-abc123',
  workerType: 'architect',
  status: 'running' | 'completed' | 'failed',
  branch: 'container-use/env-abc123',
  targetBranch: 'feature/boss-initial-setup',
  startedAt: '2026-01-01T18:00:00Z',
  completedAt: '2026-01-01T18:15:00Z',
  artifacts: ['.specify/memory/constitution.md'],
  executionLog: '...'
}
```

**Example:**
```typescript
// Check if architect finished
const status = await conductor.get_worker_status({
  workerId: architect.workerId
});

if (status.status === 'completed') {
  console.log('Architect completed!');
  console.log('Artifacts:', status.artifacts);
} else {
  console.log('Still working...');
}
```

---

### 4. `merge_worker`

**Purpose:** Merge worker's branch into target branch

**When BOSS calls this:**
- After quality gates pass
- When worker work is approved
- At end of phase

**Input:**
```typescript
{
  workerId: string,
  targetBranch?: string    // Optional, uses stored value if not provided
}
```

**Output:**
```typescript
{
  success: true,
  message: 'Worker env-abc123 merged successfully into main'
}
```

**Example:**
```typescript
// Architect passed review, merge it
await conductor.merge_worker({
  workerId: architect.workerId,
  targetBranch: 'feature/boss-initial-setup'
});

console.log('Architect work merged!');
```

---

### 5. `terminate_worker`

**Purpose:** Terminate worker without merging (discard changes)

**When BOSS calls this:**
- When quality gates fail
- When worker needs to be retried
- On unrecoverable errors

**Input:**
```typescript
{
  workerId: string
}
```

**Output:**
```typescript
{
  success: true,
  message: 'Worker env-abc123 terminated successfully'
}
```

**Example:**
```typescript
// Architect failed validation, terminate and retry
await conductor.terminate_worker({
  workerId: architect.workerId
});

// Spawn new architect with improved prompt
const newArchitect = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: `Previous attempt failed validation.

    CRITICAL: Include ALL required sections:
    - Architectural Principles
    - Development Methodology
    - Testing Standards
    - Documentation Standards`
});
```

---

### 6. `list_worker_types`

**Purpose:** Get available worker types and their descriptions

**When BOSS calls this:**
- During initialization
- When deciding which workers to spawn
- For help/documentation

**Input:**
```typescript
{
  projectPath?: string
}
```

**Output:**
```typescript
{
  workers: [
    {
      type: 'architect',
      description: 'Create constitution with governing principles and standards',
      phase: 'Phase 1: Constitution'
    },
    // ... 14 more worker types
  ]
}
```

---

### 7. `list_active_workers`

**Purpose:** List currently active workers

**When BOSS calls this:**
- To monitor parallel workers
- To check overall progress
- Before spawning new workers

**Output:**
```typescript
{
  workers: [
    {
      workerId: 'env-123',
      workerType: 'developer-backend',
      status: 'running',
      branch: 'container-use/env-123',
      startedAt: '...',
      artifacts: []
    },
    // ... more active workers
  ]
}
```

---

### 8. `conductor_health`

**Purpose:** Check Conductor and container-use availability

**When BOSS calls this:**
- At startup
- Before spawning workers
- When diagnosing issues

**Output:**
```typescript
{
  healthy: true,
  containerUseAvailable: true
}
```

---

## Workflows

### Phase 1: Constitution (Single Worker)

```typescript
// 1. Check health
const health = await conductor.conductor_health();
if (!health.healthy) {
  throw new Error('Conductor not ready');
}

// 2. Spawn architect
const architect = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution.md with architectural principles'
});

// 3. Wait for completion (poll or wait)
let status;
do {
  await sleep(5000);
  status = await conductor.get_worker_status({
    workerId: architect.workerId
  });
} while (status.status === 'running');

// 4. Check quality gates
if (status.artifacts.includes('.specify/memory/constitution.md')) {
  // Validate constitution content
  // If valid, merge
  await conductor.merge_worker({ workerId: architect.workerId });
} else {
  // Failed, terminate and retry
  await conductor.terminate_worker({ workerId: architect.workerId });
}
```

---

### Phase 7: Parallel Implementation (Multiple Workers)

```typescript
// Spawn multiple workers in parallel
const tasks = [
  { type: 'developer-backend', tasks: ['T001', 'T002', 'T003'] },
  { type: 'developer-frontend', tasks: ['T004', 'T005'] },
  { type: 'tester', tasks: ['T006', 'T007'] }
];

const workers = await Promise.all(
  tasks.map(async ({ type, tasks }) => {
    const prompt = `Implement tasks: ${tasks.join(', ')}
      Follow TDD + BDD approach.
      Create tests first, then implementation.`;

    return await conductor.spawn_worker({
      workerType: type,
      taskPrompt: prompt
    });
  })
);

console.log(`Spawned ${workers.length} workers`);

// Monitor all workers
const allWorkerIds = workers.map(w => w.workerId);

// Wait for all to complete
let allCompleted = false;
while (!allCompleted) {
  await sleep(10000);

  const statuses = await Promise.all(
    allWorkerIds.map(id => conductor.get_worker_status({ workerId: id }))
  );

  allCompleted = statuses.every(s => s.status !== 'running');
}

// Check quality gates for each
for (const workerId of allWorkerIds) {
  const status = await conductor.get_worker_status({ workerId });

  if (qualityGatesPassed(status)) {
    await conductor.merge_worker({ workerId });
  } else {
    await conductor.terminate_worker({ workerId });
    // Retry logic...
  }
}
```

---

### Retry with Improved Prompt

```typescript
// First attempt
let attempts = 0;
const maxAttempts = 3;
let worker;

while (attempts < maxAttempts) {
  attempts++;

  // Build prompt with retry feedback
  let prompt = 'Create spec.md with BDD user stories';
  if (attempts > 1) {
    prompt += `\n\nPREVIOUS ATTEMPT FAILED:
      - Missing acceptance criteria
      - User stories not in Given/When/Then format

      THIS TIME:
      - ALL user stories MUST use Given/When/Then
      - Include comprehensive acceptance criteria`;
  }

  worker = await conductor.spawn_worker({
    workerType: 'spec-writer',
    taskPrompt: prompt
  });

  // Wait for completion
  const status = await waitForCompletion(worker.workerId);

  // Validate
  if (validateSpec(status)) {
    await conductor.merge_worker({ workerId: worker.workerId });
    break;
  } else {
    await conductor.terminate_worker({ workerId: worker.workerId });
  }
}
```

---

## Best Practices

### 1. Always Check Health First

```typescript
// ✅ GOOD
const health = await conductor.conductor_health();
if (!health.healthy) {
  console.error('Setup issue:', health.errors);
  return;
}

// Proceed with worker spawning...
```

### 2. Store Worker IDs

```typescript
// ✅ GOOD - Track workers
const workerRegistry = new Map();

const worker = await conductor.spawn_worker({...});
workerRegistry.set(worker.workerId, {
  type: worker.workerType,
  phase: 'Phase 1',
  spawnedAt: new Date()
});
```

### 3. Always Terminate Failed Workers

```typescript
// ✅ GOOD
if (qualityGateFailed) {
  await conductor.terminate_worker({ workerId });
  // Retry with improved prompt
}

// ❌ BAD - Leaving failed workers around
if (qualityGateFailed) {
  // Just retry without cleanup
}
```

### 4. Use Detailed Task Prompts

```typescript
// ✅ GOOD - Specific, actionable
const prompt = `Create spec.md with user stories:
  - Use Given/When/Then format (BDD)
  - Include acceptance criteria
  - Add edge cases
  - Reference constitution.md principles`;

// ❌ BAD - Vague
const prompt = 'Write specs';
```

### 5. Include Context in Retry Prompts

```typescript
// ✅ GOOD - Learn from failures
if (attempt > 1) {
  prompt += `\n\nPREVIOUS FAILURES:\n${failures.join('\n')}`;
}

// ❌ BAD - Same prompt every retry
```

### 6. Merge Only After Validation

```typescript
// ✅ GOOD
const status = await conductor.get_worker_status({ workerId });
if (validateArtifacts(status.artifacts)) {
  await conductor.merge_worker({ workerId });
}

// ❌ BAD - Blind merge
await conductor.merge_worker({ workerId });
```

---

## Troubleshooting

### Error: "Container-Use MCP is not available"

**Cause:** container-use CLI not installed

**Solution:**
```bash
npm install -g container-use
```

**Verification:**
```bash
container-use --version
```

---

### Error: "Worker configuration not found"

**Cause:** `.boss/workers/[type]/` directory missing

**Solution:**
```bash
# Ensure project was bootstrapped
boss bootstrap

# Or check worker configs exist
ls .boss/workers/
```

---

### Worker Status Stuck at "running"

**Cause:** Worker task may have hung or failed silently

**Investigation:**
```typescript
// Get execution log
const status = await conductor.get_worker_status({ workerId });
console.log('Execution log:', status.executionLog);

// Check container-use directly
// Run: container-use log <env-id>
```

**Solution:**
```typescript
// Terminate and retry
await conductor.terminate_worker({ workerId });
```

---

### Workers Merge Conflicts

**Cause:** Multiple workers modified same files

**Prevention:**
```typescript
// Use [P] markers to avoid conflicts
// Mark independent tasks with [P]
// Only [P] tasks run in parallel

// ✅ GOOD - Independent tasks
[P] T001: Create user model
[P] T002: Create product model

// ❌ BAD - Dependent tasks marked [P]
[P] T001: Create user schema
[P] T002: Add user validation  // Depends on T001
```

---

### High Memory Usage

**Cause:** Many active workers

**Solution:**
```typescript
// Limit concurrent workers
const MAX_CONCURRENT = 3;
const queue = [...workerTasks];
const active = [];

while (queue.length > 0 || active.length > 0) {
  // Spawn up to MAX_CONCURRENT
  while (active.length < MAX_CONCURRENT && queue.length > 0) {
    const task = queue.shift();
    const worker = await conductor.spawn_worker(task);
    active.push(worker.workerId);
  }

  // Wait for one to complete
  await sleep(5000);

  // Check statuses
  for (const workerId of [...active]) {
    const status = await conductor.get_worker_status({ workerId });
    if (status.status !== 'running') {
      active.splice(active.indexOf(workerId), 1);
      // Handle completion...
    }
  }
}
```

---

## Summary

Conductor simplifies BOSS worker orchestration from **6+ manual steps to 1 API call**:

### Key Points for BOSS:

1. **Always check health** before spawning workers
2. **Store worker IDs** for tracking
3. **Validate before merging** - use quality gates
4. **Terminate failed workers** - don't leave them around
5. **Include retry context** in improved prompts
6. **Monitor parallel workers** - avoid resource exhaustion
7. **Use detailed prompts** - specific, actionable instructions

### Conductor Handles:

- ✅ Worker configuration loading
- ✅ Container environment creation
- ✅ Claude context configuration (.claude/CLAUDE.md)
- ✅ Task execution (claude-code)
- ✅ State tracking
- ✅ Error handling

### BOSS Focuses On:

- ✅ Phase orchestration
- ✅ Quality gates
- ✅ Retry logic
- ✅ Prompt engineering
- ✅ Workflow coordination

With Conductor, BOSS can focus on **high-level orchestration** while Conductor handles the **low-level details** of worker management.
