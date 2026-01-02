# Conductor MCP - API Tools Reference

Complete reference for all 8 Conductor MCP tools.

## Core Tools

### spawn_worker

Spawn a worker with full environment setup and configuration.

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
  success: boolean,
  workerId: string,               // e.g., 'env-abc123'
  workerType: string,
  branch: string,                 // e.g., 'container-use/env-abc123'
  status: 'running' | 'failed',
  message: string,
  executionDetails?: {
    environmentId: string,
    containerConfigApplied: boolean,
    claudeConfigured: boolean,
    taskStartedAt: string
  },
  error?: ConductorError
}
```

**Example:**
```typescript
const result = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution with TDD, BDD, Documentation standards',
  targetBranch: 'feature/boss-initial-setup'
});

console.log(result.workerId);  // 'env-abc123'
console.log(result.branch);    // 'container-use/env-abc123'
```

**When to use:**
- At the start of each phase
- When spawning parallel workers
- When retrying a failed worker

---

### execute_task

Execute an additional task in an existing worker.

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
  success: boolean,
  workerId: string,
  status: 'running' | 'completed' | 'failed',
  executionLog?: string,
  artifacts?: string[],
  error?: ConductorError
}
```

**Example:**
```typescript
await conductor.execute_task({
  workerId: 'env-abc123',
  taskPrompt: 'Add Security Principles section to constitution.md'
});
```

**When to use:**
- When a worker needs to perform a follow-up task
- When adding to a worker's scope
- When refining worker output

---

### get_worker_status

Check worker status and get results.

**Input:**
```typescript
{
  workerId: string
}
```

**Output:**
```typescript
{
  workerId: string,
  workerType: string,
  status: 'running' | 'completed' | 'failed',
  branch: string,
  targetBranch: string,
  startedAt: string,
  completedAt?: string,
  artifacts: string[],
  manifest?: WorkerManifest,
  executionLog?: string,
  error?: ConductorError
}
```

**Example:**
```typescript
const status = await conductor.get_worker_status({
  workerId: 'env-abc123'
});

if (status.status === 'completed') {
  console.log('Worker completed!');
  console.log('Artifacts:', status.artifacts);
  console.log('Decisions:', status.manifest?.decisions);
}
```

**When to use:**
- To monitor worker progress
- To check if worker completed
- To retrieve artifacts and decisions
- Before merging worker

---

### merge_worker

Merge worker's branch into target branch.

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
  success: boolean,
  message: string,
  error?: ConductorError
}
```

**Example:**
```typescript
// After quality gates pass
await conductor.merge_worker({
  workerId: 'env-abc123',
  targetBranch: 'feature/boss-initial-setup'
});

console.log('Worker work merged!');
```

**When to use:**
- After quality gates pass
- When worker work is approved
- At end of phase

---

### terminate_worker

Terminate worker without merging (discard changes).

**Input:**
```typescript
{
  workerId: string
}
```

**Output:**
```typescript
{
  success: boolean,
  message: string,
  error?: ConductorError
}
```

**Example:**
```typescript
// Worker failed validation, terminate and retry
await conductor.terminate_worker({
  workerId: 'env-abc123'
});

// Spawn new worker with improved prompt
const newWorker = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Previous attempt failed validation.\n\nCRITICAL: Include ALL required sections...'
});
```

**When to use:**
- When quality gates fail
- When worker needs to be retried
- On unrecoverable errors

---

## Management Tools

### list_worker_types

Get available worker types and their descriptions.

**Input:**
```typescript
{
  projectPath?: string    // Optional project path
}
```

**Output:**
```typescript
{
  workers: Array<{
    type: WorkerType,
    description: string,
    phase: string
  }>
}
```

**Example:**
```typescript
const { workers } = await conductor.list_worker_types();

workers.forEach(w => {
  console.log(`${w.type} (${w.phase}): ${w.description}`);
});
```

**When to use:**
- During initialization
- When deciding which workers to spawn
- For help/documentation

---

### list_active_workers

List currently active workers.

**Input:**
```typescript
{}  // No parameters
```

**Output:**
```typescript
{
  workers: Array<{
    workerId: string,
    workerType: string,
    status: 'running' | 'completed' | 'failed',
    branch: string,
    startedAt: string,
    artifacts: string[]
  }>
}
```

**Example:**
```typescript
const { workers } = await conductor.list_active_workers();

console.log(`Active workers: ${workers.length}`);
workers.forEach(w => {
  console.log(`${w.workerType} (${w.workerId}): ${w.status}`);
});
```

**When to use:**
- To monitor parallel workers
- To check overall progress
- Before spawning new workers

---

### conductor_health

Health check for Conductor and container-use availability.

**Input:**
```typescript
{}  // No parameters
```

**Output:**
```typescript
{
  healthy: boolean,
  containerUseAvailable: boolean,
  errors?: string[]
}
```

**Example:**
```typescript
const health = await conductor.conductor_health();

if (!health.healthy) {
  console.error('Conductor not ready:', health.errors);
  // Check if container-use is missing
  if (!health.containerUseAvailable) {
    console.error('Install container-use: npm install -g container-use');
  }
}
```

**When to use:**
- At startup
- Before spawning workers
- When diagnosing issues

---

## Tool Patterns

### Sequential Workflow

```typescript
// 1. Check health
const health = await conductor.conductor_health();
if (!health.healthy) throw new Error('Conductor not ready');

// 2. Spawn worker
const worker = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution'
});

// 3. Wait for completion
let status;
do {
  await sleep(5000);
  status = await conductor.get_worker_status({ workerId: worker.workerId });
} while (status.status === 'running');

// 4. Validate and merge
if (qualityGatesPass(status)) {
  await conductor.merge_worker({ workerId: worker.workerId });
} else {
  await conductor.terminate_worker({ workerId: worker.workerId });
}
```

### Parallel Workflow

```typescript
// Spawn multiple workers in parallel
const tasks = [
  { type: 'developer-backend', prompt: 'Implement API' },
  { type: 'developer-frontend', prompt: 'Implement UI' },
  { type: 'tester', prompt: 'Create tests' }
];

const workers = await Promise.all(
  tasks.map(t => conductor.spawn_worker({
    workerType: t.type,
    taskPrompt: t.prompt
  }))
);

// Monitor all workers
const workerIds = workers.map(w => w.workerId);
let allCompleted = false;

while (!allCompleted) {
  await sleep(10000);
  const statuses = await Promise.all(
    workerIds.map(id => conductor.get_worker_status({ workerId: id }))
  );
  allCompleted = statuses.every(s => s.status !== 'running');
}

// Merge successful workers
for (const id of workerIds) {
  const status = await conductor.get_worker_status({ workerId: id });
  if (qualityGatesPass(status)) {
    await conductor.merge_worker({ workerId: id });
  }
}
```

### Retry Pattern

```typescript
const maxAttempts = 3;
let attempts = 0;
let worker;

while (attempts < maxAttempts) {
  attempts++;

  let prompt = 'Create spec.md with BDD user stories';
  if (attempts > 1) {
    prompt += `\n\nPREVIOUS ATTEMPT FAILED:\n${previousErrors.join('\n')}`;
  }

  worker = await conductor.spawn_worker({
    workerType: 'spec-writer',
    taskPrompt: prompt
  });

  const status = await waitForCompletion(worker.workerId);

  if (validateSpec(status)) {
    await conductor.merge_worker({ workerId: worker.workerId });
    break;
  } else {
    await conductor.terminate_worker({ workerId: worker.workerId });
    previousErrors.push(...extractErrors(status));
  }
}
```

---

## Type Definitions

### WorkerType

```typescript
type WorkerType =
  | 'architect'
  | 'clarifier'
  | 'spec-writer'
  | 'planner'
  | 'reviewer'
  | 'developer-frontend'
  | 'developer-backend'
  | 'developer-fullstack'
  | 'tester'
  | 'code-reviewer'
  | 'security-engineer'
  | 'devops-engineer'
  | 'technical-writer'
  | 'product-owner'
  | 'consolidator';
```

### WorkerStatus

```typescript
type WorkerStatus = 'running' | 'completed' | 'failed';
```

### WorkerManifest

```typescript
interface WorkerManifest {
  workerId: string;
  workerType: WorkerType;
  status: WorkerStatus;
  startedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;
  artifacts: WorkerArtifact[];
  decisions: WorkerDecision[];
  issues: WorkerIssue[];
  recommendations: string[];
  tasksCompleted: string[];
}
```

See [Manifest Protocol](../architecture/MANIFEST-PROTOCOL.md) for complete definitions.

---

**Related Documentation:**
- [Architecture Overview](../architecture/OVERVIEW.md)
- [Error Handling](ERRORS.md)
- [BOSS Integration Guide](../guides/BOSS-GUIDE.md)
- [Manifest Protocol](../architecture/MANIFEST-PROTOCOL.md)
