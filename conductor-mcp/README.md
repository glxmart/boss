# Conductor MCP

**MCP middleware for BOSS worker orchestration**

[![npm version](https://img.shields.io/npm/v/@glxmart/conductor-mcp)](https://www.npmjs.com/package/@glxmart/conductor-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Conductor simplifies BOSS's worker orchestration by providing a clean, unified API that handles all the complexity of spawning, configuring, and managing container-use workers.

## Quick Start

### Installation

```bash
npm install @glxmart/conductor-mcp
```

Or use with npx (recommended for MCP configuration):

```json
{
  "mcpServers": {
    "conductor": {
      "type": "stdio",
      "command": "npx",
      "args": ["@glxmart/conductor-mcp", "stdio"]
    }
  }
}
```

See [Installation Guide](docs/guides/INSTALLATION.md) for complete setup instructions.

### Basic Usage

**Before Conductor (6+ manual steps):**

```typescript
// Load config, create environment, configure container,
// write files, execute task, track state...
```

**With Conductor (1 simple call):**

```typescript
await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution with TDD, BDD, Documentation standards',
});
```

**Complexity Reduction: 85%**

## Features

- **8 Unified Tools** - Simple API for all 15 worker types
- **Configuration-Driven** - Loads worker configs automatically
- **Stateful** - Tracks active workers and their status
- **Schema-Based** - Type-safe manifest communication
- **Error Handling** - Rich error categories with retry guidance
- **Production Ready** - 19/19 tests passing

## Architecture

```
BOSS (Claude Code)
  ↓ Simple API (8 tools)
Conductor MCP
  ↓ Orchestrates workers
  ↓ Manages manifests
  ↓ Handles configuration
Container-Use MCP
  ↓ Creates Docker environments
  ↓ Executes claude-code
Worker (Claude Code in container)
  ↓ Work adding/changing files inside /workdir
  ↓ Returns structured JSON
Manifest (validated, type-safe)
```

## MCP Tools

### Core Tools

| Tool                | Purpose                           |
| ------------------- | --------------------------------- |
| `spawn_worker`      | Spawn worker with full setup      |
| `execute_task`      | Execute additional task in worker |
| `get_worker_status` | Check worker status               |
| `merge_worker`      | Merge worker branch               |
| `terminate_worker`  | Terminate worker (discard)        |

### Management Tools

| Tool                  | Purpose               |
| --------------------- | --------------------- |
| `list_worker_types`   | Get available workers |
| `list_active_workers` | List active workers   |
| `conductor_health`    | Health check          |

See [API Reference](docs/api/TOOLS.md) for complete tool documentation.

## Worker Types

Conductor supports 15 specialized worker types across 10 phases:

| Phase   | Workers                                              | Purpose                                       |
| ------- | ---------------------------------------------------- | --------------------------------------------- |
| 1       | architect                                            | Create constitution with governing principles |
| 2       | clarifier, product-owner                             | Gather business requirements                  |
| 3       | spec-writer                                          | Create user stories in BDD format             |
| 4       | planner                                              | Create technical plans                        |
| 5       | reviewer                                             | Validate against constitution                 |
| 6       | planner                                              | Break down into tasks                         |
| 7       | developer-\*                                         | Implement features with TDD+BDD               |
| 8       | tester                                               | Create comprehensive test suites              |
| 9       | code-reviewer                                        | Review code quality                           |
| 10      | consolidator                                         | Merge all worker branches                     |
| Ongoing | security-engineer, devops-engineer, technical-writer | Cross-phase support                           |

## Documentation

### Essential Reading

- **[INDEX.md](INDEX.md)** - Complete documentation index
- **[Installation Guide](docs/guides/INSTALLATION.md)** - Setup and verification
- **[BOSS Integration Guide](docs/guides/BOSS-GUIDE.md)** - How BOSS uses Conductor
- **[Architecture Overview](docs/architecture/OVERVIEW.md)** - System design

### Reference

- **[API Tools](docs/api/TOOLS.md)** - MCP tools reference
- **[Error Handling](docs/api/ERRORS.md)** - Error categories
- **[Worker Config](docs/architecture/WORKER-CONFIG.md)** - Configuration structure
- **[Manifest Protocol](docs/architecture/MANIFEST-PROTOCOL.md)** - Communication protocol

### Development

- **[Contributing](docs/development/CONTRIBUTING.md)** - Development guidelines
- **[Changelog](CHANGELOG.md)** - Version history
- **[Design Documents](docs/design/)** - Future proposals

## Key Concepts

### Schema-Based Manifest Communication

Conductor uses `claude-code --output-format json --json-schema` to get validated structured output from workers. This schema-based approach eliminates manual JSON writing by workers and ensures consistent, validated communication.

#### How It Works

1. **Worker executes with schema validation** - Conductor spawns workers with `--output-format json --json-schema` flags
2. **Worker returns JSON matching schema** - Workers output structured JSON at the end of their work
3. **Conductor validates output** - Output is validated against the worker-specific schema generated from metadata.json
4. **Conductor updates manifest automatically** - `.boss/worker-manifest-${workerId}.json` is created/updated
5. **No manual JSON writing by workers** - Workers focus on their work and document it in JSON output

#### Worker Metadata (metadata.json)

Each worker has a `metadata.json` file that defines:

- **Inputs**: Required and optional inputs for the worker
- **Outputs**: Expected artifacts and deliverables (with schemas)
- **Constraints**: Worker-specific requirements and rules
- **Collaborators**: Other workers this worker interacts with
- **Quality Requirements**: Validation rules and quality gates

**Example metadata.json for Architect:**

```json
{
  "workerType": "architect",
  "phase": 1,
  "description": "Establishes technical constitution and governing principles",
  "primaryCommand": "/speckit.constitution",
  "outputs": {
    "required": [
      {
        "path": ".specify/memory/constitution.md",
        "type": "markdown",
        "description": "Project constitution with NON-NEGOTIABLE principles"
      }
    ]
  }
}
```

#### Validation Process

1. **Metadata Validation**: When a worker config is loaded, metadata.json is validated against the master schema (`schemas/worker-metadata.schema.json`)
2. **Output Schema Generation**: Worker-specific output schema is generated from metadata.json
3. **Output Validation**: When worker completes, output is validated against the generated schema
4. **Manifest Creation**: Validated output is used to create the worker manifest file

#### Benefits

- ✅ **Guaranteed valid format** - Schema validation catches errors
- ✅ **No JSON syntax errors** - Workers output JSON once, validated automatically
- ✅ **Consistent data structure** - All workers follow same base schema with worker-specific extensions
- ✅ **Type-safe throughout system** - TypeScript types generated from schemas
- ✅ **Self-documenting** - metadata.json serves as worker specification
- ✅ **Programmatic discovery** - BOSS can query worker capabilities via metadata.json

#### Worker Output Schema (Common Fields)

All workers return JSON with these base fields:

```json
{
  "artifacts": [], // Files created/updated/deleted
  "decisions": [], // Key decisions made
  "issues": [], // Problems encountered
  "recommendations": [], // Next steps for BOSS
  "tasksCompleted": [], // Description of work done
  "workComplete": true, // Completion status
  "nextSteps": [] // Suggested workflow steps
}
```

Worker-specific extensions are added based on worker type (e.g., `principlesEstablished` for architect, `testsCreated` for tester).

See [Conductor in Workers](docs/design/CONDUCTOR-IN-WORKERS.md) for complete design.

### Per-Worker Manifests

Each worker gets its own manifest file for parallel execution:

```
.boss/
├── worker-manifest-env-abc123.json  # Backend worker
├── worker-manifest-env-def456.json  # Frontend worker
└── worker-manifest-env-ghi789.json  # Tester worker
```

**Result**: Clean git merges with no conflicts!

## Requirements

- **Node.js** >= 18.0.0
- **container-use CLI** installed globally: `npm install -g container-use`
- **Worker configs** in `.boss/workers/` (created by `boss bootstrap`)

## Integration with BOSS

Conductor is automatically configured when you run `boss bootstrap`.

The MCP configuration is added to:

- `~/.config/claude-code/mcp-servers.json` (Claude Code)
- `~/.cursor/mcp-servers.json` (Cursor)
- `.mcp.json` (project-specific)
- `.claude/mcp.json` (project-specific)

See [BOSS Integration Guide](docs/guides/BOSS-GUIDE.md) for detailed usage.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

See [Contributing Guide](docs/development/CONTRIBUTING.md) for development guidelines.

## Error Handling

Conductor provides rich error categories with retry guidance:

```typescript
enum ErrorCategory {
  WORKER_CONFIG_NOT_FOUND, // Retryable: false
  WORKER_CONFIG_INVALID, // Retryable: false
  CONTAINER_CREATION_FAILED, // Retryable: true
  CONTAINER_CONFIG_FAILED, // Retryable: true
  WORKER_EXECUTION_FAILED, // Retryable: true
  WORKER_NOT_FOUND, // Retryable: false
  WORKER_ALREADY_MERGED, // Retryable: false
  MERGE_FAILED, // Retryable: true
  CONTAINER_USE_UNAVAILABLE, // Retryable: true
}
```

See [Error Handling](docs/api/ERRORS.md) for complete documentation.

## Latest Updates

### v0.3.0 - Schema-Based Manifest Management (2026-01-02)

Revolutionary change: Conductor controls manifest via JSON schema instead of manual worker updates.

**Benefits:**

- Guaranteed valid manifest format
- No worker JSON errors
- Consistent data structure
- Single source of truth

See [CHANGELOG.md](CHANGELOG.md) for complete history.

## License

MIT

## Author

BOSS CLI Team

---

**Quick Links:**

- [Full Documentation Index](INDEX.md)
- [Installation Guide](docs/guides/INSTALLATION.md)
- [BOSS Integration Guide](docs/guides/BOSS-GUIDE.md)
- [API Reference](docs/api/TOOLS.md)
- [Architecture](docs/architecture/OVERVIEW.md)
- [Contributing](docs/development/CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
