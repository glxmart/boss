# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BOSS (Business-Orchestrated Software System)** is a monorepo containing two primary packages:

1. **boss-cli** - Bootstrap CLI for scaffolding BOSS-enabled projects
2. **conductor-mcp** - MCP middleware for orchestrating container-based workers

BOSS transforms Claude Code/Cursor into an autonomous development orchestrator using:
- **Spec-Kit** (GitHub) - Executable specifications
- **Container-Use MCP** - Isolated worker execution
- **Conductor MCP** - Worker orchestration middleware
- **1Password CLI** - Secure secret management

## Architecture

### Two-Tier System

```
boss-cli (Bootstrap)
  └─> Creates: .boss/, .specify/, .container-use/, worker configs
  └─> Configures: MCP servers, git hooks, quality gates
  └─> Generates: CLAUDE.md, start-boss.sh

conductor-mcp (Orchestration)
  └─> Spawns: Workers in isolated containers
  └─> Manages: Worker lifecycle, manifests, state
  └─> Orchestrates: 15 worker types across 10 phases
```

### Worker Architecture

Workers are specialized Claude Code instances running in Docker containers, each with:
- Dedicated Git branch (`container-use/env-{id}`)
- Worker-specific configuration (metadata.json, container-config.json)
- Structured JSON output via `--output-format json --json-schema`
- Per-worker manifest files (`.boss/worker-manifest-{workerId}.json`)

**15 Worker Types**: architect, clarifier, spec-writer, planner, reviewer, developer-{frontend,backend,fullstack}, tester, code-reviewer, security-engineer, devops-engineer, technical-writer, product-owner, consolidator

## Development Commands

### boss-cli (Bootstrap CLI)

```bash
# Development
pnpm install          # Install dependencies
pnpm build           # Compile TypeScript + copy assets
pnpm dev             # Run with tsx watch

# Testing
pnpm test                  # Run unit tests
pnpm test:watch           # Watch mode
pnpm test:coverage        # With coverage
pnpm test:integration     # Integration tests (creates test projects)
pnpm test:local           # Manual testing with verification

# Local testing
./test-local.sh                                    # Creates test project in $HOME
./test-local.sh --template nextjs-app-turbo        # Specific template
./test-local.sh --dir ~/test-projects              # Custom directory
./test-local.sh --verify-only                      # Verify existing project
```

### conductor-mcp (MCP Server)

```bash
# Development
npm install          # Install dependencies
npm run build       # Compile TypeScript
npm run dev         # Run in stdio mode with tsx

# Testing
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

## Key Architectural Patterns

### Schema-Based Manifest Communication

Conductor uses `claude-code --output-format json --json-schema` for validated structured output from workers. This eliminates manual JSON writing and ensures type-safe communication.

**Flow**:
1. Conductor generates JSON schema from worker metadata.json
2. Worker executes with `--json-schema` flag
3. Worker returns validated JSON matching schema
4. Conductor parses output and creates/updates manifest
5. No manual JSON manipulation by workers

**Benefit**: Guaranteed valid manifests, no JSON syntax errors, consistent structure.

### Per-Worker Manifests

Each worker gets its own manifest file (`.boss/worker-manifest-{workerId}.json`) instead of a shared manifest. This enables:
- Parallel worker execution without conflicts
- Clean git merges
- Worker-specific metadata tracking
- Independent worker lifecycle management

### Configuration-Driven Workers

Worker behavior is entirely defined by configuration files in `boss-cli/assets/worker-configs/{worker-type}/`:
- `metadata.json` - Worker capabilities, inputs, outputs, constraints
- `container-config.json` - Container environment setup
- `.claude/` - Claude Code configuration (optional)
- `CLAUDE.md` - Worker-specific instructions

**Clarification** boss-cli will bootstrap boss-cli/assets/worker-configs/{worker-type}/ content into .boss/workers/{worker-type}/ and inside the worker it will become workdir/.boss/workers/{worker-type}/

**metadata.json** is the single source of truth for:
- Worker description and phase
- Required/optional inputs
- Expected outputs (with validation schemas)
- Quality requirements and constraints
- Collaboration patterns

### Error Categories with Retry Guidance

All errors are categorized with explicit retry guidance:

```typescript
enum ErrorCategory {
  WORKER_CONFIG_NOT_FOUND,      // retryable: false
  CONTAINER_CREATION_FAILED,    // retryable: true
  WORKER_EXECUTION_FAILED,      // retryable: true
  MERGE_FAILED,                 // retryable: true
  // ... etc
}
```

## Project Structure

### boss-cli/

```
src/
├── commands/         # CLI commands (bootstrap, doctor, templates)
├── generators/       # Project generation logic
│   ├── boss-config.ts
│   ├── claude-md.ts
│   ├── container-use-config.ts
│   ├── mcp-config.ts
│   ├── worker-configs.ts
│   └── ...
├── presets/         # Quality presets (startup, production, enterprise)
├── utils/           # Shared utilities (git, file-system, logger)
└── types/           # TypeScript type definitions

assets/              # Static files copied during bootstrap
├── claude-folder/   # .claude/ folder structure
├── worker-configs/  # 15 worker type configurations
├── git-hooks/       # Pre-commit, pre-push hooks
├── github-workflows/ # CI/CD workflows
└── ...

templates/           # Project templates (nextjs-app-turbo, etc)
```

### conductor-mcp/

```
src/
├── config/          # Worker configuration loading
│   ├── worker-loader.ts        # Loads worker configs
│   └── container-mapper.ts     # Maps to container-use format
├── lifecycle/       # Worker lifecycle management
│   ├── worker-spawner.ts       # Spawn workers
│   ├── environment-manager.ts  # Manage environments
│   └── state-tracker.ts        # Track worker state
├── orchestration/   # Container-use interaction
│   ├── container-use-client.ts # MCP client
│   └── task-executor.ts        # Execute tasks
├── validation/      # Schema validation
│   └── schema-validator.ts
├── tools.ts         # MCP tool implementations
└── server.ts        # MCP server setup

worker-configs/      # Worker type configurations
├── {worker-type}/
│   ├── metadata.json          # Worker spec
│   └── container-config.json  # Container setup

schemas/             # JSON schemas
└── worker-metadata.schema.json
```

## Critical Implementation Details

### Worker Configuration Loading

Conductor loads worker configs using this process:

1. **Load metadata.json** from `worker-configs/{worker-type}/`
2. **Validate against schema** (`schemas/worker-metadata.schema.json`)
3. **Load container config** (`container-config.json`)
4. **Generate worker-specific output schema** from metadata.json
5. **Return unified WorkerConfig** with all data

### Worker Spawning Flow

```typescript
// spawn_worker tool execution
1. Load worker config (metadata + container-config)
2. Create container-use environment using `container-config.json`
3. Apply container configuration `container-config.json`
4. Execute task with --output-format json --json-schema
5. Parse validated JSON output
6. Create .boss/worker-manifest-{workerId}.json
7. Track worker state
8. Return worker ID to BOSS
9. If boss request conductor also relaunch the worker with new prompt using `claude-code --dangerously-skip-permissions --continue --print --session-id ${environmentId} --output-format json --json-schema ${workerSchema}`
```

### Manifest Protocol

Workers communicate via structured JSON output:

```typescript
interface WorkerResult {
  artifacts: WorkerArtifact[];      // Files created/modified
  decisions: WorkerDecision[];      // Key decisions made
  issues: WorkerIssue[];           // Problems encountered
  recommendations: string[];        // Next steps for BOSS
  tasksCompleted: string[];        // Work descriptions
  workComplete: boolean;           // Completion status

  // Worker-specific (from metadata.json)
  principlesEstablished?: string[];  // architect
  requirementsGathered?: string[];   // clarifier
  testsCreated?: number;            // tester
}
```

### Quality Presets

Three quality levels defined in `boss-cli/src/presets/`:

- **startup**: Fast iteration, minimal gates (coverage: 50%, mutation: 60%)
- **production**: Balanced (coverage: 80%, mutation: 80%)
- **enterprise**: Maximum quality (coverage: 90%, mutation: 90%)

Applied via `applyQualityPreset()` during bootstrap.

## Testing Strategy

### boss-cli Tests

- **Unit tests**: `src/**/__tests__/*.test.ts` - Test utilities and generators
- **Integration tests**: `tests/integration/*.test.ts` - Full bootstrap flow
- **Manual testing**: `test-local.sh` - Interactive testing with verification

### conductor-mcp Tests

- **Unit tests**: `tests/unit/*.test.ts` - Isolated component testing
- **Integration tests**: `tests/integration/*.test.ts` - End-to-end flows

## Common Development Workflows

### Adding a New Worker Type

1. Create `worker-configs/{worker-type}/`
2. Add `metadata.json` inside conductor-mcp/worker-configs/{worker-type}/ (validated against schema)
3. Add `container-config.json` inside conductor-mcp/worker-configs/{worker-type}/
5. Update `WorkerType` union in `conductor-mcp/src/types.ts`
6. Add to `boss-cli/assets/worker-configs/`
6.1. Optionally add `.claude/` folder inside boss-cli/assets/worker-configs/{worker-type}/
6.2. Optionally add `CLAUDE.md` folder inside boss-cli/assets/worker-configs/{worker-type}/
7. Test with `conductor-mcp` and `boss-cli`

### Modifying Bootstrap Process

1. Edit generator in `boss-cli/src/generators/`
2. Update corresponding asset in `boss-cli/assets/`
3. Add/update tests in `src/generators/__tests__/`
4. Test with `pnpm test:integration`
5. Verify with `./test-local.sh`

### Updating Conductor MCP Tools

1. Modify tool handler in `conductor-mcp/src/tools.ts`
2. Update `TOOL_SCHEMAS` if parameters change
3. Update TypeScript types in `src/types.ts`
4. Add/update tests
5. Update documentation in `docs/api/TOOLS.md`

## Dependencies Between Packages

```
boss-cli depends on conductor-mcp:
  - package.json: "@boss/conductor-mcp": "file:../conductor-mcp"
  - Copies conductor worker configs during bootstrap
  - Generates MCP configuration referencing conductor

conductor-mcp is standalone:
  - No dependency on boss-cli
  - Can be installed via npm/npx independently
  - Used as MCP server in Claude Code/Cursor
```

## Documentation Structure

### Root Level
- `README.md` - High-level overview and quick start
- `docs/` - Comprehensive design documents

### boss-cli
- `README.md` - Bootstrap CLI usage
- `docs/common-issues.md` - Troubleshooting

### conductor-mcp
- `README.md` - MCP server overview
- `INDEX.md` - Documentation index
- `INSTALLATION.md` - Setup guide
- `CHANGELOG.md` - Version history
- `docs/` - Detailed documentation
  - `api/` - Tool references, error handling
  - `architecture/` - System design
  - `guides/` - Integration guides
  - `development/` - Contributing guidelines

## Local Infrastructure

Docker Compose stack in root `docker-compose.yml`:

```yaml
services:
  postgres:       # Knowledge base (PostgreSQL)
    port: 5432

  qdrant:        # Vector database
    port: 6333   # HTTP API
    port: 6334   # gRPC API

  embeddings:    # HuggingFace text-embeddings-inference
    port: 8080
    model: BAAI/bge-large-en-v1.5
```

Start with: `docker-compose up -d`

## MCP Configuration

Bootstrap generates MCP configs for both packages:

**Claude Code**: `~/.config/claude-code/mcp-servers.json`
**Cursor**: `~/.cursor/mcp-servers.json`
**Project-specific**: `.mcp.json`, `.claude/mcp.json`

Conductor entry:
```json
{
  "conductor": {
    "type": "stdio",
    "command": "npx",
    "args": ["@boss/conductor-mcp", "stdio"]
  }
}
```

## Build Artifacts

### boss-cli
- `dist/` - Compiled TypeScript + copied assets
- `dist/assets/` - Static files for bootstrap
- Binary: `dist/index.js` (via `boss` command)

### conductor-mcp
- `dist/` - Compiled TypeScript
- Binary: `dist/bin.js` (via `conductor-mcp` command)
- Published files: `dist/`, `worker-configs/`, docs

## Important Constraints

### BOSS Operational Constraints

When BOSS (Claude Code configured as orchestrator) operates:

**BOSS CAN**:
- Use Conductor MCP (spawn/manage workers)
- Use GitHub MCP (ALL GitHub operations)
- Use Knowledge Base MCP (query patterns)
- Orchestrate workflow logic and tasks
- Perform direct git operations whnd required
- Create PR After work is done
- Manage Full Project Lifecycle - Create Github project, issues, tasks etc via GitHub MCP
- Comunicate with humans via Github.


**BOSS CANNOT**:
- Do the work himself (Needs to spin-up conductor workers)
- Work or push to the main branch


**Workers CAN** (inside containers):
- ALL file operations
- ALL code execution
- Full development capabilities

This separation ensures security, observability, and control.

### Schema Validation

All worker metadata.json files MUST validate against `conductor-mcp/schemas/worker-metadata.schema.json`. Validation happens at:
1. Worker config load time
2. Pre-publish checks
3. Runtime when spawning workers

Invalid schemas will cause worker spawn to fail with `WORKER_CONFIG_INVALID` error.

## Troubleshooting

### Common Issues

**Build failures**: Ensure `pnpm install` or `npm install` completed successfully. Check `tsconfig.json` is valid.

**Worker spawn failures**: Check container-use CLI is installed (`npm install -g container-use`). Verify Docker is running.

**MCP connection issues**: Verify MCP config in `~/.config/claude-code/mcp-servers.json`. Check conductor-mcp is built (`npm run build`).

**Test failures**: Clean builds with `rm -rf dist/ && pnpm build`. Check Docker is running for integration tests.

See `boss-cli/docs/common-issues.md` for detailed troubleshooting.

## Version Information

- **Node.js**: >= 18.0.0 required
- **TypeScript**: 5.x
- **Package Manager**: pnpm (boss-cli), npm (conductor-mcp)
- **Container Runtime**: Docker Desktop

## Contributing

### Code Style

- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting (when configured)
- Conventional Commits for commit messages

### Adding Features

1. Create feature branch from main
2. Implement with tests
3. Update documentation
4. Run full test suite
5. Submit PR with clear description

### Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Build and test
4. Commit with version tag
5. Publish (boss-cli: local, conductor-mcp: npm)
