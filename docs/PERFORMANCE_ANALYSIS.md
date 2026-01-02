# Conductor MCP Performance Analysis & Improvements

## Current Performance Metrics

### Worker Execution Times (from logs)

| Worker | Task | Duration (total) | API Time | Turns | Cost |
|--------|------|-----------------|----------|-------|------|
| model-polliwog | Create README | 84s | 62s | 11 | $0.30 |
| pleasant-wildcat | Create constitution | 103s | 118s | 17 | $0.37 |
| superb-spider | Create test doc | 46s | 62s | 13 | $0.30 |
| regular-goat | Date formatter + tests | ~180s | N/A | N/A | N/A |

### Timing Breakdown (regular-goat example)

```
0:00 - Create environment request
1:00 - Environment created, writing CLAUDE.md
2:00 - Writing initial manifest
3:00 - Executing claude command
6:00 - Worker completed
```

**Total: ~6 minutes (360s) for simple utility function**

## Identified Bottlenecks

### 1. Container Setup (⏱️ 60-90s per worker)

**Current Process:**
```json
{
  "setup_commands": [
    "apt-get update",              // ~20-30s
    "apt-get install -y bash git curl build-essential"  // ~15-20s
  ],
  "install_commands": [
    "npm install -g pnpm",         // ~10-15s
    "npm install -g @anthropic-ai/claude-code"  // ~15-20s
  ]
}
```

**Issue:** Every worker builds from scratch using `node:22-slim`

**Impact:** 60-90 seconds of setup time before any work starts

### 2. Multiple Git Commits (⏱️ 10-20s overhead)

**Current Behavior:**
- Commit 1: Create environment
- Commit 2: Write CLAUDE.md
- Commit 3: Write initial manifest
- Commit 4: Execute command
- Commit 5: Update manifest
- Commit 6-N: Each file operation (Write tool calls)

**Issue:** Each commit triggers git operations and potentially container-use overhead

**Impact:** 10-20 seconds of git overhead across multiple commits

### 3. Claude API Round Trips (⏱️ Variable, 40-120s)

**Current Behavior:**
- 11-17 turns per simple task
- Each turn: Request → API → Response
- Cache hits help but still significant time

**Issue:** Sequential tool use requires multiple API round trips

**Impact:** Highly variable, 40-120s depending on task complexity

### 4. Git Notes Parsing (⏱️ Minor, <1s)

**Current Implementation:**
```typescript
// Read git notes after execution
const gitResult = await execFileAsync('git', [
  '-C', params.environment_source,
  'notes', '--ref=container-use', 'show',
  `container-use/${params.environment_id}`
]);
```

**Issue:** Requires extra git call after command execution

**Impact:** Minimal (<1s), but adds latency

### 5. No Container Reuse (⏱️ 60-90s per spawn)

**Issue:** Each worker creates a brand new container from scratch

**Impact:** Cannot reuse containers for similar tasks, always pay full setup cost

## Improvement Recommendations

### Priority 1: Pre-built Docker Images (🚀 Save 50-70s)

**Create worker-specific base images with dependencies pre-installed**

```dockerfile
# conductor-mcp/docker/developer-backend.Dockerfile
FROM node:22-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y bash git curl build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g pnpm @anthropic-ai/claude-code

# Set working directory
WORKDIR /workdir

# Pre-create common directories
RUN mkdir -p .boss .specify
```

**Update container configs:**
```json
{
  "base_image": "ghcr.io/boss/worker-developer-backend:latest",
  "setup_commands": [],  // Empty - already done
  "install_commands": [] // Empty - already done
}
```

**Estimated Savings:** 50-70 seconds per worker spawn

**Implementation Effort:** Medium
- Create Dockerfiles for 15 worker types
- Set up CI/CD to build and publish images
- Update container-config.json files

---

### Priority 2: Batch Git Operations (🚀 Save 10-15s)

**Combine multiple file operations into single commits**

**Current:**
```
Commit: Write CLAUDE.md
Commit: Write manifest
Commit: Write file 1
Commit: Write file 2
```

**Improved:**
```
Commit: Setup worker (CLAUDE.md + initial manifest)
Commit: Worker output (all files + final manifest)
```

**Implementation:**
- Buffer file writes in worker-spawner.ts
- Flush at setup completion and execution completion
- Reduce total commits from 5-10 to 2-3

**Estimated Savings:** 10-15 seconds per worker

**Implementation Effort:** Low-Medium

---

### Priority 3: Streaming Output (🚀 Save 0s, improve UX)

**Stream worker progress instead of waiting for completion**

**Current:** BOSS waits for full completion before seeing results

**Improved:**
```typescript
// Stream updates as they happen
conductor.on('worker_progress', (event) => {
  console.log(`[${event.workerId}] ${event.message}`);
  // Update UI with real-time progress
});
```

**Benefits:**
- Better UX - see progress in real-time
- Early error detection
- No time savings but feels faster

**Implementation Effort:** Medium
- Add event emitter to worker-spawner
- Stream git commits or container-use events
- Update MCP tools to support progress callbacks

---

### Priority 4: Parallel Worker Setup (🚀 Save N*setup_time for parallel spawns)

**Run worker initialization in parallel when spawning multiple workers**

**Current:**
```typescript
for (const task of tasks) {
  await conductor.spawn_worker(task);  // Sequential
}
```

**Improved:**
```typescript
await Promise.all(
  tasks.map(task => conductor.spawn_worker(task))
);  // Parallel
```

**Benefits:**
- When spawning 5 workers, setup happens concurrently
- Total time = max(setup_times) instead of sum(setup_times)

**Estimated Savings:** 240-360s when spawning 5 workers in parallel (4 * 60-90s)

**Implementation Effort:** Low (already supported, just needs documentation)

---

### Priority 5: Container Pooling (🚀 Save 60-90s on subsequent spawns)

**Reuse containers for similar worker types**

**Concept:**
```typescript
// Keep pool of warm containers
const pool = {
  'developer-backend': ['container-1', 'container-2'],
  'technical-writer': ['container-3']
};

// When spawning, check pool first
async spawn_worker(workerType) {
  const containerId = pool[workerType].pop();
  if (containerId) {
    // Reuse existing container (2-3s reset)
    return await resetAndExecute(containerId);
  } else {
    // Create new container (60-90s)
    return await createAndExecute(workerType);
  }
}
```

**Benefits:**
- First spawn: 60-90s (create container)
- Subsequent spawns: 2-3s (reset container)
- Huge savings for repeated worker types

**Estimated Savings:** 60-90s on 2nd+ spawn of same worker type

**Implementation Effort:** High
- Implement container lifecycle management
- Handle cleanup and reset logic
- Manage pool size limits

---

### Priority 6: Optimize Claude Turns (🚀 Save 10-30s)

**Reduce API round trips through better prompting**

**Strategies:**
1. **Batch operations in prompt:**
   ```
   Instead of: "Create file X"
   Use: "Create files X, Y, Z with the following content..."
   ```

2. **Pre-provide context:**
   - Include relevant files in initial prompt
   - Reduce need for Read tool calls

3. **Use larger context windows:**
   - Opus 4.5 has 200k context
   - Load more context upfront, fewer lookups

**Estimated Savings:** 10-30s depending on task

**Implementation Effort:** Medium
- Refine worker prompts in metadata.json
- Optimize CLAUDE.md instructions
- Pre-load common files

---

### Priority 7: Caching Strategy (🚀 Save variable time)

**Leverage prompt caching for repeated patterns**

**Current:** Some caching happens automatically

**Improved:**
- Structure prompts to maximize cache hits
- Reuse prompt prefixes across workers
- Cache common project context

**Benefits:**
- Faster API responses (cache hits vs cache misses)
- Lower costs
- More predictable performance

**Estimated Savings:** 5-15s per worker (depending on cache hit rate)

**Implementation Effort:** Low
- Already works, just optimize prompt structure

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ Document parallel worker spawning
2. 🔄 Optimize prompts for fewer turns (Priority 6)
3. 🔄 Batch git operations (Priority 2)

**Expected Impact:** 20-30s savings per worker

### Phase 2: Infrastructure (2-4 weeks)
1. 🔄 Create pre-built Docker images (Priority 1)
2. 🔄 Set up image CI/CD pipeline
3. 🔄 Deploy and test with all worker types

**Expected Impact:** 50-70s savings per worker

### Phase 3: Advanced (4-8 weeks)
1. 🔄 Implement streaming output (Priority 3)
2. 🔄 Container pooling prototype (Priority 5)
3. 🔄 Full container lifecycle management

**Expected Impact:** 60-90s savings on repeated worker spawns

## Expected Results

### Current Performance
- Simple task (date formatter): **360 seconds**
- Complex task (constitution): **103 seconds**

### After Phase 1 (Quick Wins)
- Simple task: **240 seconds** (-33%)
- Complex task: **73 seconds** (-29%)

### After Phase 2 (Infrastructure)
- Simple task: **120 seconds** (-67%)
- Complex task: **33 seconds** (-68%)

### After Phase 3 (Advanced)
- First spawn: **120 seconds**
- Repeat spawn: **30 seconds** (-92% from original)

## Monitoring & Metrics

### Add telemetry to track:
```typescript
{
  worker_id: string,
  timings: {
    container_create: number,    // Docker/Dagger time
    setup_commands: number,       // apt-get + npm installs
    file_setup: number,           // CLAUDE.md + manifest writes
    claude_execution: number,     // API time
    git_operations: number,       // All git commits
    total: number                 // End to end
  },
  api_metrics: {
    turns: number,
    cache_hits: number,
    cache_misses: number,
    tokens_input: number,
    tokens_output: number,
    cost_usd: number
  }
}
```

### Dashboard metrics:
- P50, P95, P99 latencies per worker type
- Cache hit rates
- Container reuse rates
- Cost per worker type
- Failure rates and retry counts

## Conclusion

**Current bottleneck:** Container setup (60-90s, 25-40% of total time)

**Biggest opportunity:** Pre-built Docker images (Priority 1)

**Quick wins:** Prompt optimization + batch commits (20-30s savings)

**Long-term goal:** Sub-30s worker execution for simple tasks with container reuse
