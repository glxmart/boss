# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BOSS (Business-Orchestrated Software System)** is a monorepo containing two primary packages:

1. **boss-cli** - Bootstrap CLI for scaffolding BOSS-enabled projects
2. **conductor-mcp** - MCP middleware for orchestrating container-based workers

BOSS transforms Claude Code/Cursor into an autonomous development orchestrator using Spec-Kit (executable specifications), Container-Use MCP (isolated worker execution), Conductor MCP (worker orchestration), and 1Password CLI (secure secret management).

**15 Worker Types**: architect, clarifier, spec-writer, planner, reviewer, developer-{frontend,backend,fullstack}, tester, code-reviewer, security-engineer, devops-engineer, technical-writer, product-owner, consolidator

## Quick Start

### Prerequisites

- **Node.js**: >= 18.0.0
- **Package Manager**: pnpm exclusively (`npm install -g pnpm`)
- **Docker**: Docker Desktop running
- **1Password CLI**: For credential management (`brew install --cask 1password-cli`)

### Essential Commands

```bash
# Development
pnpm install              # Install dependencies (both packages)
pnpm build               # Build both packages
pnpm test                # Run all tests

# Package-specific
cd boss-cli && pnpm dev       # Run CLI in watch mode
cd conductor-mcp && pnpm dev  # Run MCP server in stdio mode

# Testing
./test-local.sh                    # Test bootstrap locally
pnpm test:integration             # Run integration tests
```

## Development Workflow

**IMPORTANT**: Use numbered workflow scripts for streamlined development:

```bash
# Complete workflow
pnpm run workflow:1-start        # Start feature branch
pnpm run workflow:2-check        # Quality validation
pnpm run workflow:3-changeset    # Create changeset
pnpm run workflow:4-pr           # Create pull request
```

**Slash Commands**:

| Command               | Purpose                          |
| --------------------- | -------------------------------- |
| `/1-start-feature`    | Create feature branch from main  |
| `/2-quality-check`    | Run build, lint, tests, coverage |
| `/3-create-changeset` | Create changeset for release     |
| `/4-create-pr`        | Submit pull request              |

**Complete workflow guide**: [docs/WORKFLOW_SCRIPTS.md](./docs/WORKFLOW_SCRIPTS.md)

## Authentication & Credentials

### 1Password Setup

BOSS uses 1Password CLI for secure credential management. The `.env` file contains `op://` references resolved at runtime:

```bash
# Quick start: Load credentials in shell
eval "$(op run --env-file=.env -- bash -c 'env | grep -E "^(GITHUB_|CLAUDE_)" | sed "s/^/export /"')"

# Run GitHub CLI with credentials
./scripts/gh-with-1password.sh pr list
```

**Required 1Password items**:

- `boss/github/token` - GitHub Personal Access Token (repo, workflow, write:packages, read:org)
- `glx/claude-code/oauth-token` - Claude Code OAuth token

**Complete setup guide**: [docs/GITHUB_TOKEN_SETUP.md](./docs/GITHUB_TOKEN_SETUP.md) - Token scopes, troubleshooting, IDE setup

**Detailed 1Password integration**: [docs/BOSS-HOST-SETUP.md](./docs/BOSS-HOST-SETUP.md) - Complete host machine setup with 1Password, Docker, Container-Use, MCP servers

## GitHub Workflows

### Quick Debugging

```bash
# Check workflow status
./scripts/gh-with-1password.sh run list --limit 5

# View failed logs
./scripts/gh-with-1password.sh run view <run-id> --log-failed

# Re-run failed workflow
./scripts/gh-with-1password.sh run rerun <run-id>
```

### Workflow Types

- **Test Workflows** (1.0-test-boss-cli.yml, 1.1-test-conductor-mcp.yml) - Package-specific tests
- **Integration Tests** (2.0-integration-tests.yml) - End-to-end integration tests
- **Release Workflow** (3.0-release.yml) - Changesets-based versioning and publishing
- **Docker Workflow** (4.0-docker.yml) - boss-worker-base image builds

**Complete workflow documentation**: [.github/workflows/README.md](./.github/workflows/README.md) - Numbered naming, path triggers, debugging strategies, common failure patterns, debugging examples

## Architecture & Design

### Two-Tier System

```
boss-cli (Bootstrap)
  └─> Scaffolds: .boss/, .specify/, .container-use/, worker configs
  └─> Configures: MCP servers, git hooks, quality gates

conductor-mcp (Orchestration)
  └─> Spawns: Workers in isolated Docker containers
  └─> Manages: Worker lifecycle, manifests, state
  └─> Orchestrates: 15 worker types across 10 phases
```

### Key Patterns

1. **Schema-Based Communication**: Workers return validated JSON via `--output-format json --json-schema`
2. **Per-Worker Manifests**: `.boss/worker-manifest-{workerId}.json` for parallel execution
3. **Configuration-Driven**: Worker behavior defined by `metadata.json` and `container-config.json`

**Complete architecture guide**: [docs/BOSS-ENHANCED-VISION.md](./docs/BOSS-ENHANCED-VISION.md) - Two-tier architecture, worker coordination, knowledge engine, cross-BOSS communication

**Spec-Kit integration**: [docs/BOSS-SPEC-KIT-INTEGRATION.md](./docs/BOSS-SPEC-KIT-INTEGRATION.md) - 7 sequential phases, constitutional governance, test-first methodology

**Container isolation**: [docs/BOSS-CONTAINER-USE-INTEGRATION.md](./docs/BOSS-CONTAINER-USE-INTEGRATION.md) - Worker-specific setups, secret management, security best practices

**Project structure**: [boss-cli/docs/index.md](./boss-cli/docs/index.md) and [conductor-mcp/INDEX.md](./conductor-mcp/INDEX.md) - Detailed directory layouts for both packages

## Performance Optimizations

BOSS reduces worker spawn times by up to **85%** through multiple optimization phases:

| Phase | Optimization               | Performance Gain              | Status      |
| ----- | -------------------------- | ----------------------------- | ----------- |
| 1-3   | Base (Docker, config, git) | 180s → 110s (-39%)            | ✅ Complete |
| 4     | Environment resume         | Resume: 10-30s (-94%)         | ✅ Complete |
| 5     | Parallel spawning          | 4 workers: 440s → 110s (-75%) | ✅ Complete |
| 6     | Config learning & metrics  | Self-improving system         | ✅ Complete |

**Quick reference**:

- `spawn_worker` with `resumeEnvironmentId` - Resume existing environments
- `spawn_workers_parallel` - Spawn multiple workers concurrently
- `inspect_worker_config` / `import_worker_config` - Learn from workers

**Complete optimization guide**: [docs/OPTIMIZATION_PLAN.md](./docs/OPTIMIZATION_PLAN.md) - Detailed strategies and implementation

**Phase completion details**: [docs/PHASE_4_COMPLETE.md](./docs/PHASE_4_COMPLETE.md), [docs/PHASE_5_COMPLETE.md](./docs/PHASE_5_COMPLETE.md), [docs/PHASE_6_COMPLETE.md](./docs/PHASE_6_COMPLETE.md)

**Performance analysis**: [docs/PERFORMANCE_ANALYSIS.md](./docs/PERFORMANCE_ANALYSIS.md) - System performance metrics and benchmarks

## Critical Operational Constraints

### BOSS vs Workers

When BOSS (Claude Code orchestrator) operates:

**BOSS CAN**:

- Use Conductor MCP (spawn/manage workers)
- Use GitHub MCP (ALL GitHub operations)
- Use Knowledge Base MCP (query patterns)
- Orchestrate workflow logic and tasks
- Perform direct git operations when required
- Create PRs after work is done
- Manage full project lifecycle via GitHub MCP
- Communicate with humans via GitHub

**BOSS CANNOT**:

- Do the work himself (must spawn conductor workers)
- Work or push to the main branch

**Workers CAN** (inside containers):

- ALL file operations
- ALL code execution
- Full development capabilities

This separation ensures security, observability, and control.

## Common Development Tasks

### Adding a New Worker Type

1. **In conductor-mcp**: Create worker spec in `worker-configs/{worker-type}/`
   - Add `metadata.json` (include `primaryCommand` for Spec-Kit commands)
   - Add `container-config.json`
   - Update `WorkerType` union in `src/types.ts`

2. **In boss-cli** (optional): Add project-level config in `assets/worker-configs/{worker-type}/`
   - Optional `CLAUDE.md` for worker-specific instructions
   - Optional `.claude/commands/` for worker-specific commands
   - Optional `.claude/skills/` for worker-specific skills

**Testing**: Test with `conductor-mcp` and `boss-cli`, verify bootstrapped project structure

### Modifying Bootstrap Process

1. Edit generator in `boss-cli/src/generators/`
2. Update corresponding asset in `boss-cli/assets/`
3. Add/update tests in `src/generators/__tests__/`
4. Test with `pnpm test:integration` and `./test-local.sh`

### Release Process

BOSS uses **Changesets** for automated versioning and publishing:

```bash
# 1. Use workflow commands
/1-start-feature    # Create feature branch
# ... make changes ...
/2-quality-check    # Validate code quality
/3-create-changeset # Create changeset (interactive)
/4-create-pr        # Submit PR

# 2. After PR merge:
# - Release workflow creates "Version Packages" PR automatically
# - Merge Version PR → automatic npm publish
```

**What requires changesets**: Source code, assets, templates, worker-configs
**Skip changeset**: Documentation, tests, config-only changes

**Complete release guide**: [docs/RELEASE.md](./docs/RELEASE.md) - Changesets workflow, versioning strategy, troubleshooting

## Documentation Structure

### Core Documentation (Read These First)

1. **[docs/README.md](./docs/README.md)** - Complete documentation index with learning paths
2. **[docs/BOSS-ENHANCED-VISION.md](./docs/BOSS-ENHANCED-VISION.md)** - The big picture: architecture, workflow, examples
3. **[docs/BOSS-SPEC-KIT-INTEGRATION.md](./docs/BOSS-SPEC-KIT-INTEGRATION.md)** - Spec-driven development methodology
4. **[docs/BOSS-CONTAINER-USE-INTEGRATION.md](./docs/BOSS-CONTAINER-USE-INTEGRATION.md)** - Secure worker execution and isolation
5. **[docs/BOSS-GITHUB-INTEGRATION.md](./docs/BOSS-GITHUB-INTEGRATION.md)** - Repository and project management
6. **[docs/BOSS-HOST-SETUP.md](./docs/BOSS-HOST-SETUP.md)** - Local machine setup (Docker, 1Password, MCP)
7. **[docs/DOCKER-SETUP.md](./docs/DOCKER-SETUP.md)** - Local infrastructure (PostgreSQL, Qdrant, embeddings)

### Package Documentation

**boss-cli**: [boss-cli/README.md](./boss-cli/README.md), [boss-cli/docs/index.md](./boss-cli/docs/index.md), [boss-cli/docs/common-issues.md](./boss-cli/docs/common-issues.md)

**conductor-mcp**: [conductor-mcp/README.md](./conductor-mcp/README.md), [conductor-mcp/INDEX.md](./conductor-mcp/INDEX.md), [conductor-mcp/docs/api/TOOLS.md](./conductor-mcp/docs/api/TOOLS.md)

### Development Documentation

- **[docs/WORKFLOW_SCRIPTS.md](./docs/WORKFLOW_SCRIPTS.md)** - Numbered workflow scripts guide
- **[.github/workflows/README.md](./.github/workflows/README.md)** - GitHub Actions workflows documentation
- **[docs/CONTRIBUTING_DOCS.md](./docs/CONTRIBUTING_DOCS.md)** - Documentation contribution guidelines

## Troubleshooting

### Common Issues

**Build failures**: `pnpm install` completed? Check `tsconfig.json` validity.

**Worker spawn failures**: container-use CLI installed? Docker running?

**MCP connection issues**: Verify `~/.config/claude-code/mcp-servers.json` and `pnpm build` completed.

**Test failures**: Clean build with `rm -rf dist/ && pnpm build`. Docker running for integration tests?

**Complete troubleshooting**: [boss-cli/docs/common-issues.md](./boss-cli/docs/common-issues.md)

## Local Infrastructure

Docker Compose stack (`docker-compose.yml`):

- **postgres** (port 5432) - Knowledge base
- **qdrant** (ports 6333, 6334) - Vector database
- **embeddings** (port 8080) - HuggingFace text-embeddings-inference

Start: `docker-compose up -d`

**Complete setup**: [docs/DOCKER-SETUP.md](./docs/DOCKER-SETUP.md)

## MCP Configuration

Bootstrap generates MCP configs:

- **Claude Code**: `~/.config/claude-code/mcp-servers.json`
- **Cursor**: `~/.cursor/mcp-servers.json`
- **Project**: `.mcp.json`, `.claude/mcp.json`

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

## Dependencies

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

## Contributing

### Code Style

- TypeScript with strict mode
- ESLint for linting
- Conventional Commits for commit messages

### Workflow

1. Create feature branch from main (`/1-start-feature`)
2. Implement with tests
3. Validate quality (`/2-quality-check`)
4. Create changeset (`/3-create-changeset`)
5. Submit PR (`/4-create-pr`)

**Complete contributing guide**: [docs/CONTRIBUTING_DOCS.md](./docs/CONTRIBUTING_DOCS.md)
