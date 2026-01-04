# Worker Configuration Guide

## Overview

This guide provides comprehensive documentation for configuring Conductor MCP workers.

## Configuration Files

Each worker type requires two configuration files in `conductor-mcp/worker-configs/{worker-type}/`:

1. **metadata.json** - Worker specification and capabilities
2. **container-config.json** - Container environment setup

## metadata.json Structure

### Required Fields

```json
{
  "name": "string", // Worker type name (kebab-case)
  "description": "string", // Clear description of worker purpose
  "phase": "string", // Workflow phase (see valid phases below)
  "capabilities": ["string"], // Array of capability identifiers
  "inputs": {
    // Required and optional inputs
    "required": ["string"],
    "optional": ["string"]
  },
  "outputs": {
    // Expected outputs with JSON Schema
    "fieldName": {
      "type": "string",
      "description": "string"
    }
  }
}
```

### Optional Fields

```json
{
  "primaryCommand": "string", // Spec-Kit command to include
  "constraints": ["string"], // Quality constraints
  "qualityRequirements": {
    // Quality expectations
    "testCoverage": 80,
    "mutationScore": 80
  },
  "collaborationPatterns": ["string"] // How worker collaborates
}
```

### Valid Phases

- `discovery` - Requirements and architecture
- `implementation` - Code development
- `quality` - Testing and review
- `deployment` - Infrastructure and CI/CD
- `documentation` - Technical writing
- `management` - Product decisions
- `finalization` - Consolidation and final review

### Capability Examples

```json
{
  "capabilities": [
    "requirement-gathering",
    "question-generation",
    "architecture-design",
    "code-generation",
    "test-creation",
    "security-analysis",
    "documentation-writing"
  ]
}
```

### Input Specification

```json
{
  "inputs": {
    "required": [
      "projectContext", // Always needed
      "taskDescription"
    ],
    "optional": [
      "existingCode", // May or may not be provided
      "designDocs",
      "dependencies"
    ]
  }
}
```

### Output Schema

Outputs use JSON Schema format:

**String output**:

```json
{
  "summary": {
    "type": "string",
    "description": "Summary of work completed"
  }
}
```

**Array output**:

```json
{
  "requirementsGathered": {
    "type": "array",
    "description": "List of gathered requirements",
    "items": {
      "type": "string"
    }
  }
}
```

**Object output**:

```json
{
  "testResults": {
    "type": "object",
    "description": "Test execution results",
    "properties": {
      "passed": { "type": "number" },
      "failed": { "type": "number" },
      "coverage": { "type": "number" }
    },
    "required": ["passed", "failed", "coverage"]
  }
}
```

**Complex array output**:

```json
{
  "decisions": {
    "type": "array",
    "description": "Key technical decisions made",
    "items": {
      "type": "object",
      "properties": {
        "decision": { "type": "string" },
        "rationale": { "type": "string" },
        "alternatives": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["decision", "rationale"]
    }
  }
}
```

## container-config.json Structure

### Basic Structure

```json
{
  "setupCommands": ["string"],
  "installCommands": ["string"],
  "environmentVariables": {
    "KEY": "value"
  }
}
```

### Setup Commands

Commands run once during container creation:

```json
{
  "setupCommands": [
    "apt-get update",
    "apt-get install -y postgresql-client",
    "apt-get install -y redis-tools",
    "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  ]
}
```

**Common setup patterns**:

- Database clients: `postgresql-client`, `mysql-client`, `redis-tools`
- Build tools: `build-essential`, `python3`, `gcc`
- CLI tools: `jq`, `curl`, `wget`, `git`

### Install Commands

Commands run after setup and before task execution:

```json
{
  "installCommands": ["pnpm install --frozen-lockfile", "pnpm build"]
}
```

**Common install patterns**:

- Dependencies: `pnpm install --frozen-lockfile`
- Build: `pnpm build`
- Generate: `pnpm generate`
- Custom setup: `./scripts/setup.sh`

### Environment Variables

```json
{
  "environmentVariables": {
    "NODE_ENV": "production",
    "BOSS_WORKER_TYPE": "developer-backend",
    "LOG_LEVEL": "info",
    "WORKER_TIMEOUT": "300000"
  }
}
```

**Standard variables**:

- `NODE_ENV` - Node environment (production/development)
- `BOSS_WORKER_TYPE` - Worker type identifier
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)
- `WORKER_TIMEOUT` - Task timeout in milliseconds

## Primary Command

The `primaryCommand` field specifies which Spec-Kit command the worker uses:

```json
{
  "primaryCommand": "/speckit.clarify"
}
```

**Available Spec-Kit commands**:

- `/speckit.clarify` - Requirements clarification
- `/speckit.spec` - Specification writing
- `/speckit.plan` - Implementation planning
- `/speckit.tasks` - Task breakdown
- `/speckit.implement` - Implementation
- `/speckit.test` - Test creation

**Multiple commands** (array):

```json
{
  "primaryCommand": ["/speckit.plan", "/speckit.tasks"]
}
```

## Quality Requirements

Specify expected quality levels:

```json
{
  "qualityRequirements": {
    "testCoverage": 80,
    "mutationScore": 80,
    "lintingStrict": true,
    "securityScan": true
  }
}
```

## Constraints

Behavioral constraints for the worker:

```json
{
  "constraints": [
    "Must write tests before implementation (TDD)",
    "All code must be TypeScript strict mode",
    "Maximum function complexity: 10",
    "No console.log in production code"
  ]
}
```

## Complete Example: Backend Developer

### metadata.json

```json
{
  "name": "developer-backend",
  "description": "Implements backend features including APIs, database operations, and business logic using Node.js, TypeScript, and PostgreSQL",
  "phase": "implementation",
  "capabilities": [
    "api-development",
    "database-design",
    "business-logic",
    "authentication",
    "testing"
  ],
  "inputs": {
    "required": ["projectContext", "specification", "taskDescription"],
    "optional": ["existingCode", "apiDesign", "databaseSchema"]
  },
  "outputs": {
    "artifacts": {
      "type": "array",
      "description": "Files created or modified",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["path", "type"]
      }
    },
    "testsCreated": {
      "type": "number",
      "description": "Number of test files created"
    },
    "apiEndpoints": {
      "type": "array",
      "description": "API endpoints implemented",
      "items": {
        "type": "object",
        "properties": {
          "method": { "type": "string" },
          "path": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    }
  },
  "primaryCommand": "/speckit.implement",
  "qualityRequirements": {
    "testCoverage": 80,
    "mutationScore": 80
  },
  "constraints": [
    "Must follow TDD: tests before implementation",
    "Use TypeScript strict mode",
    "Implement proper error handling",
    "Include input validation",
    "Add JSDoc comments for public APIs"
  ]
}
```

### container-config.json

```json
{
  "setupCommands": ["apt-get update", "apt-get install -y postgresql-client"],
  "installCommands": ["pnpm install --frozen-lockfile"],
  "environmentVariables": {
    "NODE_ENV": "production",
    "BOSS_WORKER_TYPE": "developer-backend",
    "LOG_LEVEL": "info"
  }
}
```

## Validation

### Schema Validation

All metadata.json files are validated against:

`conductor-mcp/schemas/worker-metadata.schema.json`

### Manual Validation

```bash
# Using Node.js
cd conductor-mcp
node -e "
const Ajv = require('ajv');
const schema = require('./schemas/worker-metadata.schema.json');
const metadata = require('./worker-configs/my-worker/metadata.json');
const ajv = new Ajv();
const valid = ajv.validate(schema, metadata);
if (!valid) {
  console.error('Validation errors:', ajv.errors);
  process.exit(1);
}
console.log('Valid!');
"
```

### Common Validation Errors

**Missing required field**:

```
Error: should have required property 'phase'
```

Fix: Add `"phase": "implementation"`

**Invalid enum value**:

```
Error: should be equal to one of the allowed values
```

Fix: Use valid phase/capability from schema

**Invalid type**:

```
Error: should be string
```

Fix: Change to correct type (string, number, array, object)

## Best Practices

### 1. Descriptive Names and Descriptions

```json
// Good
{
  "name": "security-engineer",
  "description": "Performs comprehensive security analysis including OWASP checks, dependency scanning, and code security review"
}

// Avoid
{
  "name": "sec",
  "description": "Security stuff"
}
```

### 2. Minimal Setup Commands

Only install what's needed:

```json
// Good - specific tools
{
  "setupCommands": [
    "apt-get update",
    "apt-get install -y postgresql-client"
  ]
}

// Avoid - unnecessary bloat
{
  "setupCommands": [
    "apt-get update",
    "apt-get install -y postgresql-client mysql-client redis-tools mongodb-tools python3 ruby java"
  ]
}
```

### 3. Clear Input/Output Contracts

```json
{
  "inputs": {
    "required": [
      "projectContext", // What we're working on
      "specification" // What to implement
    ],
    "optional": [
      "existingTests" // May help inform new tests
    ]
  }
}
```

### 4. Structured Outputs

Use objects with properties instead of free-form strings:

```json
// Good - structured
{
  "vulnerabilities": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "severity": { "type": "string" },
        "file": { "type": "string" },
        "line": { "type": "number" }
      }
    }
  }
}

// Avoid - free-form
{
  "result": {
    "type": "string",
    "description": "Whatever the worker outputs"
  }
}
```

## Common Patterns

### Database Worker

```json
{
  "setupCommands": ["apt-get update", "apt-get install -y postgresql-client"],
  "environmentVariables": {
    "DATABASE_URL": "postgresql://localhost:5432/db"
  }
}
```

### Testing Worker

```json
{
  "installCommands": ["pnpm install --frozen-lockfile"],
  "environmentVariables": {
    "NODE_ENV": "test",
    "COVERAGE_THRESHOLD": "80"
  }
}
```

### Security Worker

```json
{
  "setupCommands": ["apt-get update", "apt-get install -y jq curl"],
  "installCommands": ["pnpm install --frozen-lockfile", "pnpm audit"]
}
```

## Troubleshooting

### "Worker config not found"

Check file locations:

- `conductor-mcp/worker-configs/{worker-type}/metadata.json`
- `conductor-mcp/worker-configs/{worker-type}/container-config.json`

### "Validation failed"

Run manual validation to see specific errors:

```bash
node scripts/validate-worker-config.js worker-type
```

### "Setup command failed"

Common issues:

- Package not in apt repositories
- Missing `apt-get update`
- Incorrect package name

### "Environment variable not set"

Ensure proper format:

```json
{
  "environmentVariables": {
    "KEY": "value" // String value, not reference
  }
}
```

## Resources

- [JSON Schema Documentation](https://json-schema.org/)
- [Conductor MCP API](../../../conductor-mcp/docs/api/TOOLS.md)
- [Worker Types Reference](../../../conductor-mcp/worker-configs/)
- [BOSS Architecture](../../../docs/BOSS-ENHANCED-VISION.md)
