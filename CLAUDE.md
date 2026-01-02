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

**IMPORTANT**: This monorepo uses **pnpm** exclusively. The `preinstall` script will prevent using npm or yarn. Install pnpm with: `npm install -g pnpm`

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
pnpm install          # Install dependencies
pnpm build           # Compile TypeScript
pnpm dev             # Run in stdio mode with tsx

# Testing
pnpm test                    # Run all tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only
```

## 1Password Environment Setup

BOSS uses 1Password CLI to manage sensitive credentials (GitHub tokens, API keys) securely. This section explains how to set up your development environment to use 1Password for authentication.

### Prerequisites

1. **1Password CLI installed**:
   ```bash
   brew install --cask 1password-cli
   ```

2. **1Password account** with vault access to:
   - `boss/github/token` - GitHub Personal Access Token
   - `glx/claude-code/oauth-token` - Claude Code OAuth token

### Environment Configuration

The `.env` file contains 1Password references using the `op://` format:

```bash
# .env (already configured)
GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token
GITHUB_TOKEN=op://boss/github/token
CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token
```

**IMPORTANT**: Never commit actual secrets to `.env`. The file uses `op://` references that are resolved at runtime by 1Password CLI.

### Using GitHub CLI with 1Password

When working with GitHub Actions, PRs, or workflows, use the helper script to inject 1Password credentials:

```bash
# Run any gh command with 1Password environment
./scripts/gh-with-1password.sh <command> [args...]

# Examples
./scripts/gh-with-1password.sh run list              # List workflow runs
./scripts/gh-with-1password.sh pr list               # List pull requests
./scripts/gh-with-1password.sh pr create             # Create PR
./scripts/gh-with-1password.sh api repos/glxmart/boss/actions/workflows
```

### Setting Up Shell Environment

To use 1Password credentials in your current shell session:

```bash
# Load environment variables from 1Password
eval "$(op run --env-file=.env -- bash -c 'env | grep -E "^(GITHUB_|CLAUDE_)" | sed "s/^/export /"')"

# Verify GitHub authentication
gh auth status

# Now you can use gh CLI commands directly
gh run list
gh pr list
```

**Alternative**: Add to your `~/.zshrc` or `~/.bashrc` for automatic loading:

```bash
# Add to ~/.zshrc (update path to your BOSS repo)
if [[ "$PWD" == "/Users/joe/code-glx/boss"* ]]; then
  eval "$(op run --env-file=/Users/joe/code-glx/boss/.env -- bash -c 'env | grep -E "^(GITHUB_|CLAUDE_)" | sed "s/^/export /"' 2>/dev/null)"
fi
```

### Starting Your IDE with 1Password

To ensure your IDE (VS Code, Cursor) has access to 1Password credentials:

```bash
# Start VS Code
op run --env-file=.env -- code .

# Start Cursor
op run --env-file=.env -- cursor .
```

This is especially important for:
- GitHub MCP server (used in `.mcp.json`)
- Conductor MCP worker spawning
- Integration tests that require API access

### Troubleshooting

**Issue**: `open .env: no such file or directory`
- **Solution**: Make sure you're running commands from the project root (`/Users/joe/code-glx/boss`)
- **Solution**: Use absolute path: `op run --env-file=/path/to/boss/.env -- <command>`

**Issue**: `gh` authentication fails
- **Solution**: Check 1Password vault has `boss/github/token` entry
- **Solution**: Verify token has required scopes (repo, workflow, read:org, write:packages)
- **Solution**: Run `gh auth refresh` if token scopes changed

**Issue**: MCP server can't access GitHub
- **Solution**: Check `.mcp.json` is configured to use `op run --env-file=.env`
- **Solution**: Restart Claude Code/Cursor with `op run --env-file=.env -- code .`

## Debugging GitHub Workflows

When GitHub Actions workflows fail, follow this systematic debugging approach:

### 1. Quick Status Check

```bash
# View recent workflow runs
./scripts/gh-with-1password.sh run list --limit 5

# Or with 1Password inline
op run --env-file=.env -- gh run list --limit 5
```

### 2. Get Failure Details

```bash
# View specific workflow run (get ID from list above)
./scripts/gh-with-1password.sh run view <run-id>

# View failed logs only
./scripts/gh-with-1password.sh run view <run-id> --log-failed

# Download full logs for offline analysis
./scripts/gh-with-1password.sh run download <run-id>
```

### 3. Common Failure Patterns

**Test Failures**

```bash
# Tests fail in CI but pass locally
# Solution: Check for environment-specific issues
# - File paths (use path.join, not hardcoded paths)
# - Environment variables
# - Git state (CI starts with clean slate)

# Example: Integration tests failing
./scripts/gh-with-1password.sh run view <run-id> --log-failed | grep -A 10 "FAIL"
```

**Build Failures**

```bash
# ESLint errors
# Solution: Run linting locally before pushing
pnpm --filter @glxmart/boss-cli lint
pnpm --filter @glxmart/conductor-mcp lint

# TypeScript errors
# Solution: Run build locally before pushing
pnpm build
```

**Dependency Issues**

```bash
# pnpm install fails
# Solution: Check pnpm-lock.yaml is committed
git status | grep pnpm-lock.yaml

# Solution: Verify package.json versions are valid
pnpm install --frozen-lockfile
```

### 4. Reproduce Locally

```bash
# Run the same commands CI runs
cd boss-cli && pnpm install && pnpm build && pnpm test
cd conductor-mcp && pnpm install && pnpm build && pnpm test

# Run integration tests (creates real projects)
cd boss-cli && pnpm test:integration
```

### 5. Workflow-Specific Debugging

**CI Workflow** (.github/workflows/ci.yml)
- Runs: Tests for both packages + integration tests
- Common fix: Ensure all tests pass locally first

**Release Workflow** (.github/workflows/release.yml)
- Runs: Builds + tests before publishing via changesets
- Common fix: Ensure `prepublishOnly` script succeeds
- Note: Uses `NPM_TOKEN` secret for publishing

**Docker Workflow** (.github/workflows/docker.yml)
- Runs: Builds and pushes boss-worker-base image
- Common fix: Verify Dockerfile exists and builds locally
- Manual build: `cd conductor-mcp/docker/boss-worker-base && ./build.sh`

### 6. Re-trigger Workflows

```bash
# Re-run failed workflow
./scripts/gh-with-1password.sh run rerun <run-id>

# Re-run specific job
./scripts/gh-with-1password.sh run rerun <run-id> --job <job-id>
```

### 7. Check Workflow Status from Code

If you need to programmatically check workflow status:

```bash
# Get JSON output for parsing
./scripts/gh-with-1password.sh run list --limit 3 --json conclusion,name,status,headBranch

# Check if latest run passed
./scripts/gh-with-1password.sh run list --limit 1 --json conclusion --jq '.[0].conclusion'
# Output: "success", "failure", "cancelled", etc.
```

### 8. Debugging Tips

- **Always check the specific job that failed**: Look at ANNOTATIONS section in run view
- **Search for the first error**: Often subsequent errors are cascading failures
- **Compare with previous successful runs**: See what changed between success and failure
- **Check if it's a flaky test**: Re-run to see if it passes intermittently
- **Look for resource issues**: Timeout errors might indicate slow tests or insufficient resources

### Example Debugging Session

```bash
# 1. Check what failed
op run --env-file=.env -- gh run list --limit 3
# Output shows CI failed

# 2. Get details
op run --env-file=.env -- gh run view 20667413783
# Shows "Test conductor-mcp" job failed

# 3. Get specific error
op run --env-file=.env -- gh run view 20667413783 --log-failed | grep -A 20 "FAIL"
# Shows: ERROR: The symbol "conductorWorkerConfigsPath" has already been declared

# 4. Fix locally
# Edit conductor-mcp/tests/e2e/boss-workflow.test.ts
# Rename duplicate variable

# 5. Test fix locally
cd conductor-mcp && pnpm test

# 6. Commit and push
git add conductor-mcp/tests/e2e/boss-workflow.test.ts
git commit -m "fix: remove duplicate variable declaration"
git push

# 7. Verify workflow passes
sleep 30
op run --env-file=.env -- gh run list --limit 1
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

Worker behavior is defined by configuration files in two locations:

**Conductor owns (package-level specs)**:
- `conductor-mcp/worker-configs/{worker-type}/metadata.json` - Worker capabilities, inputs, outputs, constraints
- `conductor-mcp/worker-configs/{worker-type}/container-config.json` - Container environment setup

**Boss-cli generates (project-level configs)**:
- `boss-cli/assets/worker-configs/{worker-type}/CLAUDE.md` (optional) - Worker-specific instructions
- `boss-cli/assets/worker-configs/{worker-type}/.claude/` (optional) - Worker-specific commands/skills
- `boss-cli/templates/spec-kit/templates/commands/` - Spec-Kit commands (copied based on worker's `primaryCommand`)
- `boss-cli/assets/claude-folder/commands/` - BOSS-specific commands (NOT copied to workers)

**During bootstrap**: boss-cli generates `.boss/workers/{worker-type}/` in the project with:
- `CLAUDE.md` (from assets)
- `.claude/commands/` (relevant Spec-Kit commands + worker-specific commands)
- `.claude/skills/` (worker-specific)

**Inside container**: These become available at `workdir/.boss/workers/{worker-type}/`

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

## Performance Optimizations

BOSS includes comprehensive performance optimizations that reduce worker spawn times by up to **85%** and enable self-improving capabilities.

### Optimization Summary

| Phase | Optimization | Performance Gain | Status |
|-------|-------------|------------------|--------|
| 1-3 | Base optimizations (Docker images, config, git batching) | 180s → 110s (-39%) | ✅ Complete |
| 4 | Environment resume | Resume: 10-30s (-94%) | ✅ Complete |
| 5 | Parallel spawning | 4 workers: 720s → 110s (-85%) | ✅ Complete |
| 6 | Config learning & metrics | Self-improving system | ✅ Complete |

**Documentation**: See `docs/OPTIMIZATION_PLAN.md`, `docs/PHASE_4_COMPLETE.md`, `docs/PHASE_5_COMPLETE.md`, `docs/PHASE_6_COMPLETE.md`

### Phases 1-3: Base Optimizations (Foundation)

**Purpose**: Establish foundational performance improvements through Docker image optimization, configuration management, and git operation batching.

#### Phase 1: Custom Docker Base Images

**Before**: Each worker runs setup commands on generic Ubuntu image
```bash
# Runs on EVERY worker spawn (~70s)
apt-get update                           # 20s
apt-get install -y curl git build-essential  # 20s
npm install -g pnpm@latest              # 15s
npm install -g claude-code@latest       # 15s
```

**After**: Pre-built base image with tools already installed
```dockerfile
# conductor-mcp/docker/boss-worker-base/Dockerfile
FROM ubuntu:24.04
RUN apt-get update && \
    apt-get install -y curl git build-essential && \
    rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g pnpm@latest claude-code@latest
```

**Savings**: 50-70s per worker spawn

#### Phase 2: Configuration Optimization

**Strategy**: Use container-use's two-layer config system
- **Default config** in `.container-use/environment.json` (project-wide)
- **Worker-specific overrides** only when needed

**Before**: Every worker specifies full configuration
```json
// Every worker's container-config.json
{
  "baseImage": "ubuntu:24.04",
  "setupCommands": ["apt-get update", "apt-get install..."],
  "installCommands": ["npm install -g pnpm", "npm install -g claude-code"],
  "environmentVariables": {"NODE_ENV": "production", "BOSS_VERSION": "1.0.0"}
}
```

**After**: Smart defaults with minimal overrides
```json
// .container-use/environment.json (shared defaults)
{
  "baseImage": "boss/worker-base:1.0.0",
  "setupCommands": [],
  "installCommands": [],
  "environmentVariables": {
    "NODE_ENV": "production",
    "BOSS_VERSION": "1.0.0"
  }
}

// Worker-specific configs only override when needed
{
  "installCommands": ["pnpm install --frozen-lockfile"],  // Only if needed
  "environment": {"BOSS_WORKER_TYPE": "developer-fullstack"}
}
```

**Savings**: 10-15s per worker spawn (reduced config processing)

#### Phase 3: Git Operation Batching

**Strategy**: Guide workers to batch related changes into logical commits

**Before**: Workers create many small commits (~10 per task)
```bash
# Individual commits for related work (~20s total)
touch src/component.tsx
git commit -m "add component"           # 2s

touch src/component.test.tsx
git commit -m "add component tests"     # 2s

touch src/component.css
git commit -m "add component styles"    # 2s
# ... 7 more commits
```

**After**: Batch related changes into logical commits (~3 per task)
```bash
# Batched commits (~6s total)
touch src/component.tsx src/component.test.tsx src/component.css
git add src/component.*
git commit -m "feat: add user profile component with tests and styles"  # 2s
# ... 2 more logical commits
```

**Implementation**: Worker CLAUDE.md templates include git batching guidance

**Savings**: 10-15s per worker spawn

#### Combined Base Optimization Impact

**Total Savings**: 70-100s per worker spawn
- Phase 1 (Docker images): 50-70s
- Phase 2 (Config optimization): 10-15s
- Phase 3 (Git batching): 10-15s

**Result**: 180s → 110s per spawn (-39%)

### Phase 4: Environment Resume (Iterative Work)

**Purpose**: Resume work in existing worker environments instead of creating new ones, saving ~180s for iterative tasks.

**Usage**:
```typescript
// Initial spawn
const worker = await conductor.spawn_worker({
  workerType: 'developer-backend',
  taskPrompt: 'Implement user authentication'
});
// Time: 110s (with base optimizations)

// Resume for follow-up work
const followUp = await conductor.spawn_worker({
  workerType: 'developer-backend',
  taskPrompt: 'Add password reset functionality',
  resumeEnvironmentId: worker.workerId  // ⚡ Resume optimization
});
// Time: 10-30s (skips container creation, setup, config)
// Savings: ~180s per resume
```

**Benefits**:
- Skip container creation (60-90s saved)
- Skip configuration (10-20s saved)
- Skip environment setup (10-20s saved)
- Maintain full context and conversation history
- Ideal for: bug fixes, refinements, multi-step tasks

**Use Cases**:
- Iterative development (initial 80% → resume for remaining 20%)
- Bug fixes after code review
- Styling adjustments and refinements
- Multi-step feature implementation

### Phase 5: Parallel Worker Spawning

**Purpose**: Spawn multiple workers concurrently for massive time savings in multi-worker phases.

**Usage**:
```typescript
// Sequential (old way) - 4 × 110s = 440s
const architect = await spawn_worker({ type: 'architect', ... });
const clarifier = await spawn_worker({ type: 'clarifier', ... });
const specWriter = await spawn_worker({ type: 'spec-writer', ... });
const planner = await spawn_worker({ type: 'planner', ... });

// Parallel (new way) - max(110s) = 110s
const results = await conductor.spawn_workers_parallel({
  workers: [
    { workerType: 'architect', taskPrompt: '...' },
    { workerType: 'clarifier', taskPrompt: '...' },
    { workerType: 'spec-writer', taskPrompt: '...' },
    { workerType: 'planner', taskPrompt: '...' }
  ],
  maxConcurrency: 5  // Default: 5, max: 10
});
// Savings: 330s (-75%)
```

**Features**:
- Configurable concurrency limiting (default: 5, max: 10)
- Graceful partial failure handling
- Automatic time savings calculation
- Batching for large worker counts
- Resource-aware execution

**Benefits**:
- 4-worker phase: 440s → 110s (-75%)
- 8-worker phase: 880s → 220s (-75% with batching)
- Comprehensive progress tracking
- Partial success handling

**Use Cases**:
- Discovery phase (architect, clarifier, spec-writer, planner)
- Implementation phase (frontend, backend, fullstack developers)
- Quality assurance (code-reviewer, security, technical-writer)
- Large-scale projects (10+ workers)

### Phase 6: Configuration Learning & Performance Metrics

**Purpose**: Self-improving system that learns from worker discoveries and tracks performance automatically.

#### Config Inspection

**Identify optimizations discovered by workers**:
```typescript
// Worker completes successfully
const worker = await spawn_worker({
  workerType: 'developer-backend',
  taskPrompt: 'Implement database migrations'
});

// Inspect what the worker added/changed
const config = await conductor.inspect_worker_config({
  workerId: worker.workerId
});

// Result shows worker added postgresql-client
// config.setupCommands: ['apt-get install -y postgresql-client']
```

#### Config Import

**Adopt beneficial changes as defaults**:
```typescript
// Import all optimizations
await conductor.import_worker_config({
  workerId: worker.workerId,
  importSetupCommands: true,
  importInstallCommands: true,
  importEnvironmentVariables: true
});

// Or selective import
await conductor.import_worker_config({
  workerId: worker.workerId,
  selective: {
    setupCommands: ['apt-get install -y postgresql-client'],
    installCommands: ['pnpm install --frozen-lockfile'],
    environmentVariables: ['NODE_OPTIONS']
  }
});

// All future workers inherit these optimizations!
```

#### Performance Metrics

**Automatic tracking of worker performance**:
```json
// .boss/performance-metrics.json (auto-generated)
[
  {
    "workerId": "env-abc123",
    "workerType": "developer-backend",
    "startedAt": "2026-01-02T08:00:00Z",
    "completedAt": "2026-01-02T08:01:52Z",
    "totalTime": 112000,
    "usedResumeOptimization": false,
    "wasPartOfParallelBatch": true,
    "batchSize": 4,
    "success": true,
    "artifactsCreated": 5,
    "decisionsCount": 3,
    "issuesCount": 0
  }
]
```

**Benefits**:
- Self-learning from successful patterns
- Data-driven optimization decisions
- Performance visibility and trending
- Knowledge retention across lifecycles
- Compound gains over time

**Use Cases**:
- Learn which tools workers commonly need
- Identify faster dependency installation methods
- Optimize environment variables for performance
- Track optimization effectiveness
- Analyze trends and patterns

### Optimization Tools Reference

**Conductor MCP Tools**:
- `spawn_worker` - Spawn single worker (supports `resumeEnvironmentId` for Phase 4)
- `spawn_workers_parallel` - Spawn multiple workers concurrently (Phase 5)
- `inspect_worker_config` - Analyze worker environment configuration (Phase 6)
- `import_worker_config` - Import beneficial config changes (Phase 6)
- `get_worker_status` - Check worker status and manifest
- `execute_task` - Execute additional task in existing worker
- `merge_worker` - Merge worker branch to target
- `terminate_worker` - Terminate and cleanup worker
- `list_worker_types` - List available worker types
- `list_active_workers` - List currently active workers
- `conductor_health` - Check Conductor MCP health
- `ask_worker` - Ask question to completed worker

**Performance Files**:
- `.boss/performance-metrics.json` - Automatic performance tracking
- `.boss/worker-manifest-{workerId}.json` - Per-worker manifests
- `.container-use/environment.json` - Default configuration

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
├── claude-folder/   # .claude/ folder structure (project-level)
├── worker-configs/  # Optional worker configs (CLAUDE.md, .claude/ per worker)
├── git-hooks/       # Pre-commit, pre-push hooks
├── github-workflows/ # CI/CD workflows
└── ...

templates/           # Project templates and shared resources
├── nextjs-app-turbo/     # Next.js template
├── spec-kit/
│   └── templates/
│       └── commands/     # Spec-Kit commands (copied to ALL workers)
└── ...
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

worker-configs/      # Worker type specifications (NO .claude folders)
├── {worker-type}/
│   ├── metadata.json          # Worker spec
│   └── container-config.json  # Container setup

schemas/             # JSON schemas
└── worker-metadata.schema.json

templates/           # Shared templates used during worker spawning
└── CLAUDE.md       # Shared worker CLAUDE.md template
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

**In conductor-mcp (worker specifications)**:
1. Create `conductor-mcp/worker-configs/{worker-type}/`
2. Add `metadata.json` (validated against schema)
   - Include `primaryCommand` field to specify which Spec-Kit commands the worker needs
   - Example: `"primaryCommand": "/speckit.clarify"` → gets `clarify.md`
   - Example: `"primaryCommand": ["/speckit.plan", "/speckit.tasks"]` → gets `plan.md` and `tasks.md`
3. Add `container-config.json`
4. Update `WorkerType` union in `conductor-mcp/src/types.ts`
5. **DO NOT** add `.claude/` folder here - conductor only owns specs

**In boss-cli (project-level config, optional)**:
6. Optionally create `boss-cli/assets/worker-configs/{worker-type}/`
7. Optionally add `CLAUDE.md` (worker-specific instructions)
8. Optionally add `.claude/commands/` (worker-specific commands beyond Spec-Kit)
9. Optionally add `.claude/skills/` (worker-specific skills)

**Note**: Workers only get Spec-Kit commands if they have `primaryCommand` in metadata.json. BOSS-specific commands are NOT copied to workers.

**Testing**:
10. Test with `conductor-mcp` and `boss-cli`
11. Verify bootstrapped project has correct .boss/workers/{worker-type}/ structure

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
  - package.json: "@glxmart/conductor-mcp": "file:../conductor-mcp"
  - Copies conductor worker configs during bootstrap
  - Generates MCP configuration referencing conductor

conductor-mcp is standalone:
  - No dependency on boss-cli
  - Can be installed via npm/npx independently
  - Used as MCP server in Claude Code/Cursor
```

## Documentation Structure

### 📖 Complete Documentation Index

- **[docs/README.md](./docs/README.md)** - Complete documentation index with learning paths
- **[boss-cli/docs/index.md](./boss-cli/docs/index.md)** - Bootstrap CLI documentation
- **[conductor-mcp/INDEX.md](./conductor-mcp/INDEX.md)** - Conductor MCP documentation index

### Core Documentation

#### 1. 🎨 [BOSS-ENHANCED-VISION.md](./docs/BOSS-ENHANCED-VISION.md)

**The Big Picture** - Read this first!

Comprehensive overview of the BOSS system covering:
- Two-tier architecture (Bootstrap + Orchestration)
- Foundation technologies (Spec-Kit + Container-Use)
- Complete workflow (8 phases)
- Worker management & coordination
- Knowledge engine & cross-BOSS communication
- GitHub integration for project management
- End-to-end examples with real scenarios
- Advanced features (cross-BOSS coordination, dependency management)

#### 2. 📋 [BOSS-SPEC-KIT-INTEGRATION.md](./docs/BOSS-SPEC-KIT-INTEGRATION.md)

**Spec-Driven Development** - Implementation methodology

Deep dive into how BOSS automates GitHub's Spec-Kit:
- Seven sequential phases (Principles → Implementation)
- Structured artifacts (constitution.md, spec.md, plan.md, tasks.md)
- Worker prompts for each phase
- Constitutional governance (NON-NEGOTIABLE rules)
- Test-First methodology (TDD enforced)
- Parallelization with [P] markers
- Quality gate automation
- Complete artifact specifications

#### 3. 🔐 [BOSS-CONTAINER-USE-INTEGRATION.md](./docs/BOSS-CONTAINER-USE-INTEGRATION.md)

**Secure Worker Execution** - Isolation & secret management

Complete guide to worker isolation and security:
- Container-use environment configurations
- Worker-specific setups (8 worker types)
- 1Password integration (op:// references)
- Secret discovery by agents (automatic requirement detection)
- Secret setup templates (Stripe, SendGrid, AWS, etc.)
- Integration testing with real APIs
- Worker lifecycle management
- Security best practices & troubleshooting

#### 4. 🐙 [BOSS-GITHUB-INTEGRATION.md](./docs/BOSS-GITHUB-INTEGRATION.md)

**GitHub Workflows** - Repository and project management

Complete guide to GitHub integration and workflows

#### 5. 🖥️ [BOSS-HOST-SETUP.md](./docs/BOSS-HOST-SETUP.md)

**Host Setup** - Local machine configuration

Complete host machine setup guide (Docker, 1Password, Container-Use, MCP servers)

#### 6. 🐳 [DOCKER-SETUP.md](./docs/DOCKER-SETUP.md)

**Infrastructure Setup** - Local services and databases

Local infrastructure setup (PostgreSQL, Qdrant, embeddings)

### Package Documentation

#### BOSS CLI (Bootstrap)

- **[boss-cli/README.md](./boss-cli/README.md)** - CLI usage and commands
- **[boss-cli/docs/index.md](./boss-cli/docs/index.md)** - Complete CLI documentation index
- **[boss-cli/docs/common-issues.md](./boss-cli/docs/common-issues.md)** - Troubleshooting guide

#### Conductor MCP (Orchestration)

- **[conductor-mcp/README.md](./conductor-mcp/README.md)** - MCP server overview
- **[conductor-mcp/INDEX.md](./conductor-mcp/INDEX.md)** - Complete documentation index
- **[conductor-mcp/CHANGELOG.md](./conductor-mcp/CHANGELOG.md)** - Version history
- **[conductor-mcp/docs/guides/INSTALLATION.md](./conductor-mcp/docs/guides/INSTALLATION.md)** - Installation guide
- **[conductor-mcp/docs/guides/BOSS-GUIDE.md](./conductor-mcp/docs/guides/BOSS-GUIDE.md)** - BOSS integration
- **[conductor-mcp/docs/architecture/OVERVIEW.md](./conductor-mcp/docs/architecture/OVERVIEW.md)** - Architecture
- **[conductor-mcp/docs/api/TOOLS.md](./conductor-mcp/docs/api/TOOLS.md)** - API reference

### Development & Planning

- **[docs/CONTRIBUTING_DOCS.md](./docs/CONTRIBUTING_DOCS.md)** - **📝 Documentation guidelines (when/where to add docs)**
- **[docs/PHASE_1_COMPLETE.md](./docs/PHASE_1_COMPLETE.md)** - Phase 1 completion summary
- **[docs/PHASE_2_COMPLETE.md](./docs/PHASE_2_COMPLETE.md)** - Phase 2 completion summary
- **[docs/OPTIMIZATION_PLAN.md](./docs/OPTIMIZATION_PLAN.md)** - Performance optimization strategy
- **[docs/PERFORMANCE_ANALYSIS.md](./docs/PERFORMANCE_ANALYSIS.md)** - System performance analysis
- **[docs/OAUTH_TOKEN_IMPLEMENTATION.md](./docs/OAUTH_TOKEN_IMPLEMENTATION.md)** - OAuth implementation details

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
    "args": ["@glxmart/conductor-mcp", "stdio"]
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

**Build failures**: Ensure `pnpm install` completed successfully. Check `tsconfig.json` is valid.

**Worker spawn failures**: Check container-use CLI is installed (`pnpm add -g container-use`). Verify Docker is running.

**MCP connection issues**: Verify MCP config in `~/.config/claude-code/mcp-servers.json`. Check conductor-mcp is built (`pnpm build`).

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
