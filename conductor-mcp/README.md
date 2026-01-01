# Conductor MCP

**MCP middleware for BOSS worker orchestration**

Conductor simplifies BOSS's worker orchestration by providing a clean, unified API that handles all the complexity of spawning, configuring, and managing container-use workers.

## Overview

### Problem

BOSS previously had to manually:
- Call Container-Use MCP to create environments
- Load worker configurations from `.boss/workers/`
- Configure containers by overwriting `.claude/CLAUDE.md` and `.claude/` folder
- Execute tasks with `claude-code --dangerously-skip-permissions`
- Monitor worker progress and handle errors

This complexity led to orchestration failures and required BOSS to understand too many low-level details.

### Solution

Conductor MCP provides a simple middleware layer:

```
BOSS → Conductor MCP → Container-Use MCP → Docker Workers
      (simple API)     (complex details)
```

**Before Conductor (complex):**
```typescript
// BOSS has to do 5+ manual steps:
const config = loadWorkerConfig(...);
const env = await containerUse.createEnvironment(...);
await containerUse.fileWrite(...); // Multiple times
await containerUse.executeInEnvironment(...);
// Track state, handle errors, etc.
```

**With Conductor (simple):**
```typescript
// BOSS just does this:
await conductor.spawnWorker({
  workerType: 'architect',
  taskPrompt: 'Create constitution'
});
// Done!
```

## Features

- ✅ **Unified API**: 8 tools for all 15 worker types
- ✅ **Configuration-driven**: Loads worker configs automatically from `.boss/workers/`
- ✅ **Stateful**: Tracks active workers and their status
- ✅ **Error handling**: Rich error categories with retry guidance
- ✅ **Type-safe**: Full TypeScript with strict mode

## Installation

```bash
npm install @boss/conductor-mcp
```

Or use directly with npx (recommended for MCP configuration):

```json
{
  "conductor": {
    "type": "stdio",
    "command": "npx",
    "args": ["@boss/conductor-mcp", "stdio"]
  }
}
```

## MCP Tools

### 1. `spawn_worker`

Spawn a worker with full environment setup and configuration.

**Input:**
```typescript
{
  workerType: 'architect' | 'clarifier' | ... (15 types),
  taskPrompt: string,
  projectPath?: string,
  targetBranch?: string
}
```

**Output:**
```typescript
{
  success: boolean,
  workerId: string,
  workerType: string,
  branch: string,
  status: 'running' | 'failed',
  message: string,
  executionDetails?: {...},
  error?: {...}
}
```

**Example:**
```typescript
const result = await conductor.spawnWorker({
  workerType: 'architect',
  taskPrompt: 'Create constitution with TDD, BDD, Documentation standards',
  targetBranch: 'feature/boss-initial-setup'
});

console.log(result.workerId); // 'env-abc123'
console.log(result.branch);   // 'container-use/env-abc123'
```

### 2. `execute_task`

Execute additional task in existing worker.

**Input:**
```typescript
{
  workerId: string,
  taskPrompt: string
}
```

**Example:**
```typescript
await conductor.executeTask({
  workerId: 'env-abc123',
  taskPrompt: 'Add security principles to constitution'
});
```

### 3. `get_worker_status`

Get worker status and results.

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
  executionLog?: string
}
```

### 4. `merge_worker`

Merge worker changes into target branch.

**Input:**
```typescript
{
  workerId: string,
  targetBranch?: string
}
```

### 5. `terminate_worker`

Terminate worker without merging (for failures/retries).

**Input:**
```typescript
{
  workerId: string
}
```

### 6. `list_worker_types`

Get available worker types.

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

### 7. `list_active_workers`

List currently active workers.

**Output:**
```typescript
{
  workers: WorkerState[]
}
```

### 8. `conductor_health`

Health check.

**Output:**
```typescript
{
  healthy: boolean,
  containerUseAvailable: boolean,
  errors?: string[]
}
```

## Worker Types

Conductor supports 15 worker types:

| Type | Phase | Description |
|------|-------|-------------|
| `architect` | Phase 1 | Create constitution with governing principles |
| `clarifier` | Phase 2 | Gather business requirements |
| `spec-writer` | Phase 3 | Create user stories in BDD format |
| `planner` | Phase 4/6 | Create technical plans and task breakdowns |
| `reviewer` | Phase 5 | Validate against constitution |
| `developer-frontend` | Phase 7 | Implement frontend features with TDD + BDD |
| `developer-backend` | Phase 7 | Implement backend features with TDD + BDD |
| `developer-fullstack` | Phase 7 | Implement fullstack features with TDD + BDD |
| `tester` | Phase 7 | Create comprehensive test suites |
| `code-reviewer` | Phase 7 | Review code quality and standards |
| `security-engineer` | Cross-Phase | Ensure security and compliance |
| `devops-engineer` | Cross-Phase | Set up CI/CD and infrastructure |
| `technical-writer` | Cross-Phase | Create comprehensive documentation |
| `product-owner` | Cross-Phase | Represent business and user needs |
| `consolidator` | Phase 8 | Merge all worker branches |

## Error Handling

Conductor provides rich error categories:

```typescript
enum ErrorCategory {
  WORKER_CONFIG_NOT_FOUND,      // Retryable: false
  WORKER_CONFIG_INVALID,         // Retryable: false
  CONTAINER_CREATION_FAILED,     // Retryable: true
  CONTAINER_CONFIG_FAILED,       // Retryable: true
  WORKER_EXECUTION_FAILED,       // Retryable: true
  WORKER_NOT_FOUND,              // Retryable: false
  WORKER_ALREADY_MERGED,         // Retryable: false
  MERGE_FAILED,                  // Retryable: true
  CONTAINER_USE_UNAVAILABLE      // Retryable: true
}
```

Errors include:
- `category`: Error category
- `message`: Human-readable message
- `retryable`: Whether BOSS should retry
- `details`: Additional error context

## Architecture

```
conductor-mcp/
├── src/
│   ├── types.ts                      # Type definitions
│   ├── server.ts                     # MCP server setup
│   ├── tools.ts                      # Tool definitions and handlers
│   ├── bin.ts                        # CLI entry point
│   ├── index.ts                      # Main exports
│   ├── config/
│   │   ├── worker-loader.ts          # Load worker configs
│   │   └── container-mapper.ts       # Map to Container-Use format
│   ├── lifecycle/
│   │   ├── state-tracker.ts          # Track active workers
│   │   ├── environment-manager.ts    # Configure containers
│   │   └── worker-spawner.ts         # Orchestrate spawning
│   ├── orchestration/
│   │   ├── container-use-client.ts   # Container-Use interface
│   │   └── task-executor.ts          # Execute tasks
│   └── utils/
│       ├── error-handler.ts          # Error handling
│       └── logger.ts                 # Structured logging
```

## Configuration

Conductor loads worker configurations from `.boss/workers/[workerType]/`:

```
.boss/workers/architect/
├── container-config.json    # Environment setup
├── prompt.md                # Worker role description
├── CLAUDE.md                # Execution guidelines
└── .claude/                 # Worker-specific context
    ├── commands/
    ├── skills/
    └── agents/
```

### Template Variables

Conductor expands template variables in configurations:

```typescript
// Input: "Worker role: ${workerName}"
// Variables: { workerName: 'architect' }
// Output: "Worker role: architect"
```

## Logging

Conductor uses structured JSON logging:

```json
{
  "timestamp": "2026-01-01T18:00:00Z",
  "level": "info",
  "message": "Worker spawned successfully",
  "workerId": "env-abc123",
  "workerType": "architect"
}
```

Set log level with `LOG_LEVEL` environment variable:
- `debug`: Verbose debugging
- `info`: General information (default)
- `warn`: Warnings
- `error`: Errors only

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## Integration with BOSS

Conductor is automatically configured when you run `boss bootstrap`.

The MCP configuration is added to:
- `~/.config/claude-code/mcp-servers.json` (Claude Code)
- `~/.cursor/mcp-servers.json` (Cursor)
- `.mcp.json` (project-specific)
- `.claude/mcp.json` (project-specific)

## Requirements

- Node.js >= 18.0.0
- **container-use CLI** installed globally: `npm install -g container-use`
- Worker configs in `.boss/workers/` (created by `boss bootstrap`)

### Container-Use Integration

Conductor integrates with Container-Use via subprocess execution of the `container-use` CLI. The integration:

✅ **Calls container-use CLI commands** directly (create, exec, write, read, merge, delete)
✅ **Passes configuration** from worker configs to container-use
✅ **Handles errors** with proper error categories and retry guidance
✅ **Provides health checks** to verify container-use availability

**Command Mapping:**
- `create_environment` → `container-use create`
- `execute_in_environment` → `container-use exec`
- `environment_file_write` → `container-use write`
- `environment_file_read` → `container-use read`
- `merge_environment` → `container-use merge`
- `delete_environment` → `container-use delete`

The integration is fully tested with 19 unit and integration tests.

## License

MIT

## Author

BOSS CLI Team
