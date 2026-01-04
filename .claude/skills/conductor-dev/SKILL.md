---
name: conductor-dev
description: Develops and debugs Conductor MCP workers and configurations. Use when creating workers, debugging spawns, or validating worker configurations.
allowed-tools: Bash, Read, Grep, Edit, Write
---

# Conductor Development

## Overview

This skill provides tools and guidance for developing and debugging Conductor MCP workers, configurations, and the orchestration system.

## Quick Start

### Debug Worker Spawn

```bash
.claude/skills/conductor-dev/tools/debug-worker-spawn.sh [worker-type] [project-path]
```

Or ask Claude:

- "Debug worker spawn"
- "Test conductor worker"
- "Spawn a test worker"

### Default Usage

```bash
# Default: spawns clarifier worker in /tmp/conductor-e2e-test
./tools/debug-worker-spawn.sh

# Custom worker type
./tools/debug-worker-spawn.sh developer-backend

# Custom project path
./tools/debug-worker-spawn.sh architect /path/to/my-project
```

## What is Conductor MCP?

Conductor MCP is the orchestration middleware that manages container-based workers for BOSS. It:

- Spawns workers in isolated Docker containers
- Manages worker lifecycle (create, execute, merge, terminate)
- Validates worker configurations and manifests
- Provides structured communication via JSON schemas
- Handles parallel worker execution

## Worker Architecture

### Worker Types

BOSS includes 15 specialized worker types:

| Worker Type         | Phase          | Purpose                        |
| ------------------- | -------------- | ------------------------------ |
| architect           | Discovery      | System architecture and design |
| clarifier           | Discovery      | Requirements clarification     |
| spec-writer         | Discovery      | Specification authoring        |
| planner             | Discovery      | Implementation planning        |
| developer-frontend  | Implementation | Frontend development           |
| developer-backend   | Implementation | Backend development            |
| developer-fullstack | Implementation | Full-stack development         |
| tester              | Quality        | Test creation and execution    |
| code-reviewer       | Quality        | Code review                    |
| security-engineer   | Quality        | Security analysis              |
| devops-engineer     | Deployment     | Infrastructure and CI/CD       |
| technical-writer    | Documentation  | Technical documentation        |
| product-owner       | Management     | Product decisions              |
| consolidator        | Finalization   | Result consolidation           |
| reviewer            | Validation     | Final review                   |

### Worker Configuration

Each worker type has two configuration files:

**1. metadata.json** (Package-level spec)

```json
{
  "name": "clarifier",
  "description": "Clarifies requirements and gathers user needs",
  "phase": "discovery",
  "capabilities": ["requirement-gathering", "question-generation"],
  "inputs": {
    "required": ["projectContext"],
    "optional": ["existingRequirements"]
  },
  "outputs": {
    "requirementsGathered": {
      "type": "array",
      "description": "List of gathered requirements"
    }
  },
  "primaryCommand": "/speckit.clarify"
}
```

**2. container-config.json** (Container setup)

```json
{
  "setupCommands": ["apt-get update", "apt-get install -y postgresql-client"],
  "installCommands": ["pnpm install --frozen-lockfile"],
  "environmentVariables": {
    "NODE_ENV": "production",
    "BOSS_WORKER_TYPE": "clarifier"
  }
}
```

### Worker Lifecycle

```
1. spawn_worker
   ↓
2. Create container-use environment
   ↓
3. Apply configuration
   ↓
4. Execute task with --output-format json --json-schema
   ↓
5. Parse validated JSON output
   ↓
6. Create worker manifest (.boss/worker-manifest-{workerId}.json)
   ↓
7. Return worker ID to orchestrator
   ↓
8. Optional: execute_task for follow-up work
   ↓
9. merge_worker to integrate changes
   ↓
10. terminate_worker to cleanup
```

## Debug Worker Spawn Tool

### What It Does

The debug-worker-spawn tool:

1. Validates project exists
2. Calls Conductor MCP via `op run` (injects OAuth token)
3. Sends spawn_worker request with JSON-RPC
4. Monitors response and output
5. Shows structured JSON result
6. Times out after 3 minutes

### Usage Examples

**Default (clarifier worker)**:

```bash
./tools/debug-worker-spawn.sh
# Worker: clarifier
# Project: /tmp/conductor-e2e-test
```

**Custom worker type**:

```bash
./tools/debug-worker-spawn.sh architect
# Worker: architect
# Project: /tmp/conductor-e2e-test
```

**Custom project**:

```bash
./tools/debug-worker-spawn.sh developer-backend ~/my-boss-project
# Worker: developer-backend
# Project: ~/my-boss-project
```

### Output Format

```
🔍 Debug: Spawning clarifier worker
   Project: /tmp/conductor-e2e-test

📦 Calling Conductor MCP with op run...
📤 Sending request: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "spawn_worker",
    "arguments": {
      "workerType": "clarifier",
      "taskPrompt": "List 3 key features needed for a TODO app. Be brief.",
      "projectPath": "/tmp/conductor-e2e-test",
      "targetBranch": "feature/debug-test"
    }
  }
}

📥 Response: {
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "workerId": "env-abc123",
    "status": "completed",
    "manifest": { ... }
  }
}

✅ MCP process exited with code: 0
```

## Common Development Tasks

### Creating a New Worker Type

**Step 1: Create metadata.json**

Location: `conductor-mcp/worker-configs/{worker-type}/metadata.json`

```json
{
  "name": "my-worker",
  "description": "Worker description",
  "phase": "implementation",
  "capabilities": ["capability1", "capability2"],
  "inputs": {
    "required": ["input1"],
    "optional": ["input2"]
  },
  "outputs": {
    "outputField": {
      "type": "string",
      "description": "Output description"
    }
  },
  "primaryCommand": "/speckit.implement"
}
```

**Step 2: Create container-config.json**

Location: `conductor-mcp/worker-configs/{worker-type}/container-config.json`

```json
{
  "setupCommands": [],
  "installCommands": [],
  "environmentVariables": {
    "BOSS_WORKER_TYPE": "my-worker"
  }
}
```

**Step 3: Update TypeScript types**

File: `conductor-mcp/src/types.ts`

```typescript
export type WorkerType =
  | 'architect'
  | 'clarifier'
  // ... existing types
  | 'my-worker'; // Add new type
```

**Step 4: Test worker spawn**

```bash
# First, ensure test project exists
cd boss-cli
pnpm test:local

# Then test worker spawn
cd ../conductor-mcp
./tools/debug-worker-spawn.sh my-worker /tmp/test-project
```

### Modifying Worker Configuration

**Add Setup Commands**:

```json
{
  "setupCommands": ["apt-get update", "apt-get install -y postgresql-client redis-tools"]
}
```

**Add Environment Variables**:

```json
{
  "environmentVariables": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "debug",
    "WORKER_TIMEOUT": "300000"
  }
}
```

**Add Install Commands**:

```json
{
  "installCommands": ["pnpm install --frozen-lockfile", "pnpm build"]
}
```

### Validating Worker Metadata

Metadata must validate against schema:

Location: `conductor-mcp/schemas/worker-metadata.schema.json`

**Common validation errors**:

1. **Missing required field**:

```
Error: Missing required field 'phase'
```

Fix: Add `"phase": "discovery"` to metadata.json

2. **Invalid phase value**:

```
Error: Invalid phase 'implementation-phase'
```

Fix: Use valid phase: discovery, implementation, quality, deployment, documentation, management, finalization

3. **Invalid output type**:

```
Error: Output type 'list' is not valid
```

Fix: Use valid JSON Schema type: string, number, boolean, array, object

## Troubleshooting

### "Project not found"

**Cause**: Project path doesn't exist or is incorrect

**Solution**:

```bash
# Check path exists
ls -la /path/to/project

# Or create test project
cd boss-cli
pnpm test:local

# Use created project
./tools/debug-worker-spawn.sh clarifier ~/boss-test-project
```

### "Could not retrieve op://..."

**Cause**: 1Password CLI can't find OAuth token

**Solution**:

```bash
# Check 1Password CLI
op --version

# Check .env file exists
ls -la .env

# Verify token entry exists
op item get "glx/claude-code"

# Check token field
op item get "glx/claude-code" --fields oauth-token
```

### "Worker spawn timed out"

**Cause**: Worker spawn takes longer than 3 minutes

**Solutions**:

1. **Increase timeout in script**:

```bash
# Edit tools/debug-worker-spawn.sh
# Change: setTimeout(..., 180000)
# To:     setTimeout(..., 300000)  # 5 minutes
```

2. **Check container startup**:

```bash
# View container logs
docker ps -a | grep boss-worker

# Check container logs
docker logs <container-id>
```

3. **Simplify task prompt**:

```bash
# Use simpler task for testing
taskPrompt: "Say hello"
```

### "MCP process exited with code: 1"

**Cause**: Conductor MCP encountered an error

**Solution**:

```bash
# Check conductor logs (shown in output)
# Common issues:
# - Missing worker config
# - Invalid metadata.json
# - Container creation failed

# Validate metadata
cd conductor-mcp
node -e "
  const schema = require('./schemas/worker-metadata.schema.json');
  const metadata = require('./worker-configs/my-worker/metadata.json');
  const Ajv = require('ajv');
  const ajv = new Ajv();
  const valid = ajv.validate(schema, metadata);
  console.log(valid ? 'Valid' : ajv.errors);
"
```

### "Cannot find module 'conductor-mcp'"

**Cause**: Conductor not built or not installed

**Solution**:

```bash
# Build conductor
cd conductor-mcp
pnpm install
pnpm build

# Or install globally for testing
npm install -g .
```

## Worker Development Best Practices

### 1. Start Simple

Begin with minimal configuration:

```json
{
  "setupCommands": [],
  "installCommands": [],
  "environmentVariables": {}
}
```

Add complexity only as needed.

### 2. Test Incrementally

1. Test metadata validation
2. Test worker spawn
3. Test task execution
4. Test manifest generation
5. Test merge operation

### 3. Use Descriptive Names

```json
// Good
"name": "security-engineer"
"description": "Performs security analysis and vulnerability assessment"

// Avoid
"name": "worker3"
"description": "Does stuff"
```

### 4. Document Required Inputs

```json
{
  "inputs": {
    "required": [
      "projectContext", // What project are we working on?
      "securityRequirements" // What security standards to follow?
    ]
  }
}
```

### 5. Define Clear Outputs

```json
{
  "outputs": {
    "vulnerabilitiesFound": {
      "type": "array",
      "description": "List of security vulnerabilities discovered",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
          "description": { "type": "string" },
          "file": { "type": "string" },
          "line": { "type": "number" }
        }
      }
    }
  }
}
```

## Advanced Topics

### Parallel Worker Spawning

Use `spawn_workers_parallel` for concurrent execution:

```typescript
const results = await conductor.spawn_workers_parallel({
  workers: [
    { workerType: 'architect', taskPrompt: '...' },
    { workerType: 'clarifier', taskPrompt: '...' },
    { workerType: 'spec-writer', taskPrompt: '...' },
  ],
  maxConcurrency: 5,
});
```

### Worker Resume

Resume work in existing environment:

```typescript
// Initial spawn
const worker = await spawn_worker({
  workerType: 'developer-backend',
  taskPrompt: 'Implement user authentication',
});

// Resume for follow-up work
const followUp = await spawn_worker({
  workerType: 'developer-backend',
  taskPrompt: 'Add password reset functionality',
  resumeEnvironmentId: worker.workerId, // Resume optimization
});
```

### Configuration Learning

Inspect and import beneficial config changes:

```typescript
// Inspect what worker added
const config = await conductor.inspect_worker_config({
  workerId: worker.workerId,
});

// Import beneficial changes
await conductor.import_worker_config({
  workerId: worker.workerId,
  importSetupCommands: true,
  importInstallCommands: true,
});
```

## Tool Reference

| Tool                    | Purpose              | Usage                                         |
| ----------------------- | -------------------- | --------------------------------------------- |
| `debug-worker-spawn.sh` | Test worker spawning | `./tools/debug-worker-spawn.sh [type] [path]` |

## Related Skills

- **[workflow-management](.claude/skills/workflow-management/SKILL.md)** - Development workflow
- **[quality-gates](.claude/skills/quality-gates/SKILL.md)** - Quality validation
- **[workflow-debugging](.claude/skills/workflow-debugging/SKILL.md)** - CI/CD debugging

## Documentation

For complete Conductor documentation:

- [WORKER-CONFIG-GUIDE.md](WORKER-CONFIG-GUIDE.md) - Worker configuration reference
- [conductor-mcp/INDEX.md](../../../conductor-mcp/INDEX.md) - Complete Conductor docs
- [conductor-mcp/docs/api/TOOLS.md](../../../conductor-mcp/docs/api/TOOLS.md) - MCP API reference
