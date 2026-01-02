# Conductor MCP - Error Handling

Complete guide to error categories, handling strategies, and troubleshooting.

## Error Categories

Conductor provides structured errors with retry guidance:

### 1. WORKER_CONFIG_NOT_FOUND

**Description**: Worker configuration directory not found

**Retryable**: ❌ No

**Common Causes**:
- Worker type doesn't exist
- Project not bootstrapped
- Missing `.boss/workers/` directory

**Resolution**:
```bash
# Run bootstrap to create worker configs
boss bootstrap

# Or check available workers
conductor list_worker_types
```

---

### 2. WORKER_CONFIG_INVALID

**Description**: Worker configuration is malformed or invalid

**Retryable**: ❌ No

**Common Causes**:
- Invalid JSON in `container-config.json`
- Missing required fields in metadata.json
- Invalid template variables

**Resolution**:
```bash
# Validate worker config
cd .boss/workers/[worker-type]
cat container-config.json | jq .  # Check JSON syntax
cat metadata.json | jq .          # Validate metadata
```

---

### 3. CONTAINER_CREATION_FAILED

**Description**: Failed to create Docker container environment

**Retryable**: ✅ Yes

**Common Causes**:
- Docker not running
- container-use CLI not installed
- Insufficient disk space
- Network issues (pulling base image)

**Resolution**:
```bash
# Check Docker status
docker ps

# Install container-use
npm install -g container-use

# Check disk space
df -h

# Test container-use
container-use create --base-image node:20-alpine
```

---

### 4. CONTAINER_CONFIG_FAILED

**Description**: Failed to configure container (write CLAUDE.md, copy files)

**Retryable**: ✅ Yes

**Common Causes**:
- Container filesystem full
- Permission issues
- Invalid file paths in config

**Resolution**:
```bash
# Check container logs
container-use log [env-id]

# Verify file paths in worker config
cat .boss/workers/[type]/container-config.json
```

---

### 5. WORKER_EXECUTION_FAILED

**Description**: Worker task execution failed

**Retryable**: ✅ Yes (with improved prompt)

**Common Causes**:
- Worker encountered errors
- Invalid task prompt
- Missing required inputs
- Task too complex

**Resolution**:
```typescript
// Get execution log to understand failure
const status = await conductor.get_worker_status({ workerId });
console.log('Execution log:', status.executionLog);
console.log('Issues:', status.manifest?.issues);

// Terminate failed worker
await conductor.terminate_worker({ workerId });

// Retry with improved prompt
const newWorker = await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: `Previous attempt failed.

    CRITICAL REQUIREMENTS:
    - Include all 4 required sections
    - Follow constitution template
    - Use Spec-Kit commands

    ERRORS FROM PREVIOUS ATTEMPT:
    ${status.manifest?.issues.map(i => i.description).join('\n')}`
});
```

---

### 6. WORKER_NOT_FOUND

**Description**: Worker ID not found in active workers

**Retryable**: ❌ No

**Common Causes**:
- Invalid worker ID
- Worker already terminated
- Worker already merged

**Resolution**:
```typescript
// List active workers
const { workers } = await conductor.list_active_workers();
console.log('Active workers:', workers.map(w => w.workerId));

// Check if worker was merged
const { workers: allWorkers } = await conductor.list_worker_types();
// Worker manifests persist in .boss/ directory
```

---

### 7. WORKER_ALREADY_MERGED

**Description**: Attempt to merge worker that's already merged

**Retryable**: ❌ No

**Common Causes**:
- Double merge attempt
- Worker already integrated

**Resolution**: No action needed - worker is already merged

---

### 8. MERGE_FAILED

**Description**: Failed to merge worker branch

**Retryable**: ✅ Yes (after resolving conflicts)

**Common Causes**:
- Merge conflicts
- Target branch doesn't exist
- Git errors

**Resolution**:
```bash
# Check for conflicts
git status

# Resolve conflicts manually
git checkout container-use/[env-id]
git merge [target-branch]
# Resolve conflicts
git add .
git commit

# Try merge again
conductor merge_worker --worker-id [env-id]
```

---

### 9. CONTAINER_USE_UNAVAILABLE

**Description**: container-use CLI not available

**Retryable**: ✅ Yes (after installation)

**Common Causes**:
- container-use not installed
- container-use not in PATH

**Resolution**:
```bash
# Install container-use
npm install -g container-use

# Verify installation
container-use --version

# Check health
conductor conductor_health
```

---

## Error Structure

All errors follow this structure:

```typescript
interface ConductorError {
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  details?: {
    workerId?: string;
    workerType?: string;
    exitCode?: number;
    stderr?: string;
    [key: string]: unknown;
  };
}
```

## Error Handling Patterns

### Basic Error Handling

```typescript
try {
  const worker = await conductor.spawn_worker({
    workerType: 'architect',
    taskPrompt: 'Create constitution'
  });
} catch (error) {
  if (isConductorError(error)) {
    console.error(`Error: ${error.message}`);
    console.error(`Category: ${error.category}`);
    console.error(`Retryable: ${error.retryable}`);

    if (error.retryable) {
      // Implement retry logic
    } else {
      // Fatal error - cannot proceed
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
async function spawnWorkerWithRetry(
  workerType: WorkerType,
  taskPrompt: string,
  maxAttempts = 3
) {
  let attempt = 0;
  let delay = 1000; // Start with 1 second

  while (attempt < maxAttempts) {
    try {
      return await conductor.spawn_worker({
        workerType,
        taskPrompt
      });
    } catch (error) {
      if (!isConductorError(error) || !error.retryable) {
        throw error;
      }

      attempt++;
      if (attempt >= maxAttempts) {
        throw new Error(`Failed after ${maxAttempts} attempts: ${error.message}`);
      }

      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
}
```

### Selective Retry

```typescript
async function handleWorkerError(
  error: ConductorError,
  context: { workerType: WorkerType; taskPrompt: string }
) {
  switch (error.category) {
    case 'CONTAINER_CREATION_FAILED':
      console.log('Checking container-use availability...');
      const health = await conductor.conductor_health();
      if (!health.containerUseAvailable) {
        throw new Error('container-use not available. Run: npm install -g container-use');
      }
      // Retry
      return await conductor.spawn_worker(context);

    case 'WORKER_EXECUTION_FAILED':
      console.log('Worker execution failed. Analyzing errors...');
      // Get execution log
      const details = error.details as { workerId?: string };
      if (details?.workerId) {
        const status = await conductor.get_worker_status({
          workerId: details.workerId
        });
        console.log('Issues:', status.manifest?.issues);
        // Terminate and retry with improved prompt
        await conductor.terminate_worker({ workerId: details.workerId });
        return await retryWithImprovedPrompt(context, status.manifest?.issues);
      }
      throw error;

    case 'WORKER_CONFIG_NOT_FOUND':
      throw new Error(`Worker type '${context.workerType}' not found. Run: boss bootstrap`);

    default:
      if (error.retryable) {
        console.log('Retrying...');
        return await conductor.spawn_worker(context);
      }
      throw error;
  }
}
```

## Health Check

Always check health before critical operations:

```typescript
async function ensureHealthy() {
  const health = await conductor.conductor_health();

  if (!health.healthy) {
    const errors = health.errors || [];

    if (!health.containerUseAvailable) {
      throw new Error(
        'container-use not available.\n' +
        'Install: npm install -g container-use'
      );
    }

    throw new Error(`Conductor unhealthy: ${errors.join(', ')}`);
  }
}

// Use before spawning workers
await ensureHealthy();
const worker = await conductor.spawn_worker({...});
```

## Troubleshooting Guide

### Issue: "Worker stuck at 'running'"

**Diagnosis:**
```typescript
const status = await conductor.get_worker_status({ workerId });
console.log('Execution log:', status.executionLog);
```

**Solutions:**
1. Check execution log for errors
2. Verify worker has required inputs
3. Check container logs: `container-use log [env-id]`
4. Terminate and retry with clearer prompt

---

### Issue: "Merge conflicts"

**Diagnosis:**
```bash
git checkout container-use/[env-id]
git diff [target-branch]
```

**Solutions:**
1. Review parallel tasks for file conflicts
2. Use `[P]` markers only for truly independent tasks
3. Resolve conflicts manually
4. Improve task breakdown to avoid conflicts

---

### Issue: "Worker returns invalid JSON"

**Diagnosis:**
```typescript
const status = await conductor.get_worker_status({ workerId });
// Check manifest validation errors
```

**Solutions:**
1. This shouldn't happen with schema-based approach
2. Check worker CLAUDE.md has correct schema instructions
3. Verify metadata.json output schema is correct
4. Update worker config if needed

---

### Issue: "High memory usage"

**Diagnosis:**
```typescript
const { workers } = await conductor.list_active_workers();
console.log(`Active workers: ${workers.length}`);
```

**Solutions:**
1. Limit concurrent workers (max 3-5)
2. Terminate completed workers promptly
3. Monitor container resource usage
4. Implement worker queue for large batches

---

## Logging

Set log level for debugging:

```bash
# Development
export LOG_LEVEL=debug

# Production
export LOG_LEVEL=info

# Errors only
export LOG_LEVEL=error
```

Log output:
```json
{
  "timestamp": "2026-01-02T10:00:00Z",
  "level": "error",
  "message": "Worker execution failed",
  "workerId": "env-abc123",
  "workerType": "architect",
  "error": {
    "category": "WORKER_EXECUTION_FAILED",
    "retryable": true
  }
}
```

---

**Related Documentation:**
- [API Tools](TOOLS.md)
- [Architecture Overview](../architecture/OVERVIEW.md)
- [BOSS Integration Guide](../guides/BOSS-GUIDE.md)
