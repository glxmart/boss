# Conductor MCP - Architecture Overview

## System Architecture

Conductor MCP is a middleware layer that sits between BOSS (the orchestrator) and Container-Use MCP (the container manager), providing a simplified API for worker management.

### High-Level Architecture

```
┌──────────────────────────────────┐
│  BOSS (Claude Code/Cursor)       │
│  • Orchestrates development      │
│  • Calls Conductor tools         │
│  • Monitors worker progress      │
└────────────┬─────────────────────┘
             │ MCP Protocol (stdio)
             │ 8 Simple Tools
             ▼
┌──────────────────────────────────┐
│  Conductor MCP Server            │
│  • Loads worker configs          │
│  • Creates environments          │
│  • Configures containers         │
│  • Executes tasks with schema    │
│  • Manages manifests             │
│  • Tracks worker state           │
└────────────┬─────────────────────┘
             │ Subprocess (execa)
             │ container-use CLI
             ▼
┌──────────────────────────────────┐
│  container-use CLI               │
│  • Creates Docker environments   │
│  • Executes claude-code          │
│  • Manages git branches          │
│  • Provides file operations      │
└──────────────────────────────────┘
```

## Core Components

### 1. MCP Server (`src/server.ts`)

Entry point for the MCP server. Handles:
- Tool registration
- Request routing
- Error handling
- Logging

### 2. Tools (`src/tools.ts`)

Defines and implements 8 MCP tools:
- `spawn_worker` - Spawn worker with full setup
- `execute_task` - Execute additional task
- `get_worker_status` - Check worker status
- `merge_worker` - Merge worker branch
- `terminate_worker` - Terminate worker
- `list_worker_types` - List available workers
- `list_active_workers` - List active workers
- `conductor_health` - Health check

### 3. Worker Spawner (`src/lifecycle/worker-spawner.ts`)

Orchestrates the worker spawning process:
1. Load worker configuration
2. Create container environment
3. Configure container (CLAUDE.md, .claude/)
4. Execute task with schema validation
5. Parse worker result
6. Update manifest

### 4. Environment Manager (`src/lifecycle/environment-manager.ts`)

Manages container environment configuration:
- Writes CLAUDE.md to container
- Copies .claude/ directory files
- Creates initial manifest template
- Sets up worker context

### 5. Task Executor (`src/orchestration/task-executor.ts`)

Handles task execution:
- Executes tasks with schema validation
- Parses structured JSON output
- Reads and updates manifests
- Provides worker status

### 6. Container-Use Client (`src/orchestration/container-use-client.ts`)

Interface to container-use CLI:
- `createEnvironment` - Create container
- `executeInEnvironment` - Run claude-code
- `writeEnvironmentFile` - Write files
- `readEnvironmentFile` - Read files
- `mergeEnvironment` - Merge branch
- `deleteEnvironment` - Delete container

### 7. Worker Loader (`src/config/worker-loader.ts`)

Loads worker configurations:
- Priority 1: Project override (`.boss/workers/[type]/`)
- Priority 2: Built-in configs (`conductor-mcp/worker-configs/[type]/`)
- Resolves template variables
- Lists available workers

### 8. State Tracker (`src/lifecycle/state-tracker.ts`)

Tracks active workers:
- In-memory state management
- Worker registration
- Status updates
- Cleanup on termination

## Data Flow

### Spawning a Worker

```
1. BOSS calls spawn_worker
   ↓
2. Conductor loads worker config
   ↓
3. Conductor creates container environment
   ↓
4. Conductor writes CLAUDE.md to container
   ↓
5. Conductor executes task with schema
   ↓
6. Worker (Claude Code) processes task
   ↓
7. Worker returns JSON (validated by schema)
   ↓
8. Conductor parses WorkerResult
   ↓
9. Conductor creates/updates manifest
   ↓
10. Returns success to BOSS
```

### Schema-Based Communication

```
Conductor generates JSON schema
   ↓
Executes: claude-code --output-format json --json-schema '${schema}'
   ↓
Worker processes task
   ↓
Worker returns structured JSON
   ↓
Claude validates against schema
   ↓
Conductor receives validated output
   ↓
Conductor updates manifest
```

## Worker Configuration Structure

```
worker-configs/[worker-type]/
├── container-config.json    # Container environment setup
├── prompt.md               # Worker role description
├── CLAUDE.md               # Execution context and guidelines
└── .claude/                # Worker-specific resources
    ├── commands/           # Custom commands
    ├── skills/             # Worker-specific skills
    └── agents/             # Sub-agents
```

See [Worker Configuration](WORKER-CONFIG.md) for details.

## Manifest Protocol

### Per-Worker Manifests

Each worker gets its own manifest file:
```
.boss/
├── worker-manifest-env-abc123.json  # Worker 1
├── worker-manifest-env-def456.json  # Worker 2
└── worker-manifest-env-ghi789.json  # Worker 3
```

### Manifest Structure

```typescript
interface WorkerManifest {
  workerId: string;
  workerType: WorkerType;
  status: 'running' | 'completed' | 'failed';
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

See [Manifest Protocol](MANIFEST-PROTOCOL.md) for complete specification.

## State Management

### Worker Lifecycle

```
spawned → running → completed/failed → merged/terminated
```

### State Transitions

1. **spawned**: Worker created, container started
2. **running**: Task executing
3. **completed**: Task finished successfully
4. **failed**: Task execution failed
5. **merged**: Worker branch merged to target
6. **terminated**: Worker discarded without merge

## Error Handling

Conductor provides structured error handling with retry guidance:

```typescript
interface ConductorError {
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

See [Error Handling](../api/ERRORS.md) for complete error categories.

## Scalability

### Parallel Execution

Multiple workers can run in parallel:
- Each has own container
- Each has own manifest file
- No resource conflicts
- Git merges cleanly

### Concurrency Limits

Recommended limits:
- **Max concurrent workers**: 3-5 (configurable)
- **Memory per worker**: ~500MB-1GB
- **CPU per worker**: 1-2 cores

### Resource Management

Conductor tracks:
- Active worker count
- Container resource usage
- Manifest file sizes
- Branch count

## Security

### Isolation

- Each worker runs in isolated container
- Workers cannot access BOSS's filesystem
- Workers cannot modify other workers' files
- Workers use separate git branches

### Validation

- Schema validation for worker outputs
- Configuration validation on load
- Template variable validation
- Manifest format validation

## Performance

### Optimizations

1. **Lazy loading**: Worker configs loaded on demand
2. **Caching**: Template resolution cached
3. **Streaming**: Large outputs streamed
4. **Parallel I/O**: File operations parallelized

### Benchmarks

- Worker spawn time: ~2-5 seconds
- Task execution: Varies (5-300 seconds)
- Manifest update: <100ms
- Branch merge: 1-3 seconds

## Extensibility

### Adding New Workers

1. Create worker config in `worker-configs/[type]/`
2. Define worker metadata
3. Write CLAUDE.md context
4. Add to WorkerType enum in `types.ts`

### Custom Tools

Conductor's tool system is extensible:
1. Define tool schema in `tools.ts`
2. Implement handler function
3. Register in server
4. Document in API reference

## Testing

### Test Coverage

- **19/19 tests passing**
- Unit tests for all components
- Integration tests for workflows
- Schema validation tests

### Test Structure

```
tests/
├── unit/
│   ├── worker-loader.test.ts
│   ├── environment-manager.test.ts
│   └── task-executor.test.ts
├── integration/
│   ├── spawn-worker.test.ts
│   └── parallel-workers.test.ts
└── fixtures/
    └── worker-configs/
```

## Deployment

### Production Deployment

1. Build: `npm run build`
2. Publish: `npm publish`
3. Install: `npm install -g @glxmart/conductor-mcp`
4. Configure: Add to MCP servers config

### Development Deployment

1. Build: `npm run build`
2. Link: `npm link`
3. Use locally: `boss bootstrap`

## Monitoring

### Logging

Structured JSON logging:
```json
{
  "timestamp": "2026-01-02T10:00:00Z",
  "level": "info",
  "message": "Worker spawned successfully",
  "workerId": "env-abc123",
  "workerType": "architect"
}
```

Log levels:
- `debug` - Verbose debugging
- `info` - General information (default)
- `warn` - Warnings
- `error` - Errors only

### Metrics

Conductor tracks:
- Worker spawn count
- Success/failure rates
- Average execution time
- Active worker count
- Error frequency

## Future Enhancements

See [Design Documents](../design/) for proposed improvements:
- [Conductor in Workers](../design/CONDUCTOR-IN-WORKERS.md) - Workers use Conductor tools
- [Worker Config Architecture](../design/WORKER-CONFIG-ARCHITECTURE.md) - metadata.json approach

---

**Related Documentation:**
- [Worker Configuration](WORKER-CONFIG.md)
- [Manifest Protocol](MANIFEST-PROTOCOL.md)
- [API Tools](../api/TOOLS.md)
- [Error Handling](../api/ERRORS.md)
