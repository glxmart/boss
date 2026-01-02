# Conductor MCP - Worker Configuration

Complete guide to worker configuration structure and management.

## Configuration Structure

Each worker has a dedicated configuration directory:

```
worker-configs/[worker-type]/
├── metadata.json          # Worker metadata and output schema
├── prompt.md             # Worker role description
├── CLAUDE.md             # Execution context and guidelines
├── container-config.json # Container environment setup
└── .claude/              # Worker-specific resources
    ├── agents/           # Sub-agents
    ├── commands/         # Custom commands
    └── skills/           # Worker-specific skills
```

## Configuration Loading

### Priority Order

1. **Project override**: `.boss/workers/[type]/` (if exists)
2. **Built-in config**: `conductor-mcp/worker-configs/[type]/`

This allows projects to customize workers while maintaining sensible defaults.

### Example

```typescript
// Loads from project override if exists
const config = await loadWorkerConfig('architect', '/path/to/project');

// Fallback chain:
// 1. /path/to/project/.boss/workers/architect/
// 2. /path/to/conductor-mcp/worker-configs/architect/
```

## Configuration Files

### 1. metadata.json

**Purpose**: Defines worker capabilities, inputs, outputs, and validation rules

**Structure**:
```json
{
  "workerType": "architect",
  "phase": 1,
  "description": "Establishes technical constitution and governing principles",
  "primaryCommand": "/speckit.constitution",
  "inputs": {
    "required": [],
    "optional": ["Business requirements from Product Owner"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/memory/constitution.md",
        "type": "markdown",
        "description": "Project constitution with NON-NEGOTIABLE principles",
        "schema": {
          "sections": [
            "Architectural Principles",
            "Development Methodology",
            "Testing Standards",
            "Documentation Standards"
          ]
        }
      }
    ],
    "optional": []
  },
  "constraints": {
    "tdd": "Test-First is NON-NEGOTIABLE",
    "bdd": "BDD format is MANDATORY",
    "documentation": "Documentation is REQUIRED"
  },
  "decisionTypes": [
    "Architectural principles",
    "Development methodology",
    "Quality gates"
  ],
  "collaboratesWith": ["product-owner", "clarifier", "reviewer"],
  "workflowPosition": "first",
  "blockers": []
}
```

**Uses**:
- Generate JSON schema for output validation
- Document worker capabilities
- Enable programmatic worker discovery
- Validate worker configurations

---

### 2. prompt.md

**Purpose**: Describes worker's role, responsibilities, and workflow

**Structure**:
```markdown
# ${workerName} Worker

## Role
${workerRoleDescription}

## Phase
${phase}

## Responsibilities
- Responsibility 1
- Responsibility 2

## Deliverables
${artifactRequirements}

## Quality Standards
- Standard 1
- Standard 2

## Workflow
1. Step 1
2. Step 2
```

**Template Variables**:
- `${workerName}` - Worker type name
- `${phase}` - Development phase
- `${workerRoleDescription}` - Role description from metadata.json
- `${artifactRequirements}` - Expected outputs from metadata.json

---

### 3. CLAUDE.md

**Purpose**: Provides execution context for worker (Claude Code in container)

**Structure**:
```markdown
# ${workerType} Worker - Execution Context

## Your Role & Identity

You are a **fully specialized ${workerType} agent** running in an isolated container environment.

## CRITICAL: BOSS-Worker Communication Protocol

### Schema-Based Output

You are executed with `--output-format json --json-schema` flags. This means:
- You return structured JSON data at the end of your work
- Conductor automatically validates and updates the manifest
- You DON'T manually write `.boss/worker-manifest-${workerId}.json` files

### Output Format

```json
{
  "artifacts": [...],
  "decisions": [...],
  "issues": [...],
  "recommendations": [...],
  "tasksCompleted": [...],
  "workComplete": true,
  "nextSteps": [...]
}
```

## BOSS Project Structure

```
/workdir/
├── .boss/                    # BOSS metadata (DO NOT MODIFY)
│   ├── project-config.json
│   └── worker-manifest-${workerId}.json  # Conductor manages this
├── .specify/                 # Spec-Kit structure
│   ├── memory/constitution.md
│   └── specs/001-feature/
├── src/                      # Implementation
├── tests/                    # Tests
└── docs/                     # Documentation
```

## Your Core Responsibilities

1. [List specific responsibilities]
2. ...

## Spec-Kit Integration

Use these commands:
- `/speckit.${primaryCommand}` - Your primary tool

## Expected Deliverables

[Specific deliverables from metadata.json]

## Quality Checklist

Before marking `workComplete: true`:
- [ ] Deliverable 1 created
- [ ] Quality standard 1 met
- [ ] ...

## BOSS Methodology (NON-NEGOTIABLE)

- **Test-First Development** (TDD): Red → Green → Refactor
- **BDD Layer**: All user stories use Given/When/Then format
- **Documentation Standards**: Comprehensive documentation required
- **Constitution Compliance**: Follow .specify/memory/constitution.md
```

**Template Variables**:
- `${workerType}` - Worker type (e.g., 'architect')
- `${workerId}` - Runtime worker instance ID (e.g., 'env-abc123')
- `${primaryCommand}` - Primary Spec-Kit command from metadata.json

---

### 4. container-config.json

**Purpose**: Defines Docker container environment configuration

**Structure**:
```json
{
  "base_image": "node:22-slim",
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential"
  ],
  "install_commands": [
    "npm install -g pnpm",
    "npm install -g @anthropic-ai/claude-code"
  ],
  "environment_variables": {
    "WORKER_ROLE": "${workerType}",
    "NODE_ENV": "production",
    "SPEC_KIT_MODE": "worker",
    "SPEC_KIT_PATH": "/workdir/.specify"
  },
  "secrets": [
    {
      "name": "CLAUDE_CODE_OAUTH_TOKEN",
      "source": "1password",
      "reference": "op://Development/Claude Code/oauth_token"
    }
  ],
  "network": {
    "allowed_domains": [
      "npmjs.org",
      "github.com",
      "api.anthropic.com",
      "claude.ai"
    ]
  }
}
```

**Template Variables**:
- `${workerType}` - Worker type name
- `${workerId}` - Runtime worker instance ID

---

### 5. .claude/ Directory

**Purpose**: Worker-specific resources (commands, skills, agents)

**Structure**:
```
.claude/
├── agents/
│   └── research-subagent.md    # For documentation lookup
├── commands/
│   └── validate-output.sh      # Custom validation
└── skills/
    ├── tdd-helper.md          # TDD workflow guidance
    └── bdd-formatter.md       # BDD formatting help
```

**Currently**: Mostly empty (.gitkeep files)
**Future**: Populate with worker-specific resources

See [Worker Configs Review](../development/WORKER-CONFIGS-REVIEW.md) for recommendations.

## Template Resolution

### Variables

Template variables are resolved at runtime:

```typescript
function resolveTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => {
    return variables[key] || '';
  });
}
```

### Common Variables

| Variable | Source | Example |
|----------|--------|---------|
| `workerName` | Worker type | 'architect' |
| `workerType` | Worker type | 'architect' |
| `workerId` | Runtime | 'env-abc123' |
| `phase` | metadata.json | '1' or 'Phase 1: Foundation' |
| `workerRoleDescription` | metadata.json | 'Establishes constitution...' |
| `artifactRequirements` | metadata.json outputs | '.specify/memory/constitution.md' |
| `primaryCommand` | metadata.json | '/speckit.constitution' |

### Example

**Input (CLAUDE.md)**:
```markdown
You are a ${workerType} worker (ID: ${workerId}).
Your primary command is ${primaryCommand}.
```

**Variables**:
```json
{
  "workerType": "architect",
  "workerId": "env-abc123",
  "primaryCommand": "/speckit.constitution"
}
```

**Output**:
```markdown
You are a architect worker (ID: env-abc123).
Your primary command is /speckit.constitution.
```

## Customization

### Project Override

To customize a worker for your project:

1. **Copy built-in config**:
   ```bash
   cp -r node_modules/@glxmart/conductor-mcp/worker-configs/architect \
         .boss/workers/architect
   ```

2. **Modify as needed**:
   ```bash
   cd .boss/workers/architect
   # Edit metadata.json, CLAUDE.md, etc.
   ```

3. **Conductor uses project config**:
   ```typescript
   // Automatically loads from .boss/workers/architect/
   const worker = await conductor.spawn_worker({
     workerType: 'architect',
     taskPrompt: '...'
   });
   ```

### Common Customizations

**Add project-specific skills**:
```bash
mkdir -p .boss/workers/architect/.claude/skills
echo "..." > .boss/workers/architect/.claude/skills/custom-validation.md
```

**Modify container image**:
```json
{
  "base_image": "node:20-alpine",  // Changed from node:22-slim
  "install_commands": [
    "npm install -g @anthropic-ai/claude-code",
    "npm install -g my-custom-tool"  // Added
  ]
}
```

**Add worker-specific commands**:
```bash
mkdir -p .boss/workers/architect/.claude/commands
echo "#!/bin/bash\n..." > .boss/workers/architect/.claude/commands/validate.sh
chmod +x .boss/workers/architect/.claude/commands/validate.sh
```

## Validation

### Configuration Validation

Conductor validates configurations on load:

```typescript
// Validate metadata.json against master schema
validateMetadata(metadata);

// Validate container-config.json structure
validateContainerConfig(containerConfig);

// Validate template variables resolve
validateTemplateVariables(prompt, variables);
```

### Runtime Validation

During execution:

1. **Schema validation**: Worker output validated against generated schema
2. **Artifact validation**: Verify artifacts exist on filesystem
3. **Manifest validation**: Ensure manifest format correct

## Best Practices

### Configuration Design

1. **Keep metadata.json accurate** - Source of truth for worker capabilities
2. **Document in prompt.md** - Clear role and responsibilities
3. **Provide context in CLAUDE.md** - Worker should be fully autonomous
4. **Minimal container** - Only install what's needed
5. **Use template variables** - Make configs reusable

### Maintenance

1. **Version control** - Track config changes
2. **Test configurations** - Validate before deployment
3. **Document customizations** - Explain why changes were made
4. **Review regularly** - Keep configs up-to-date
5. **Share improvements** - Contribute back to conductor-mcp

---

**Related Documentation:**
- [Architecture Overview](OVERVIEW.md)
- [Manifest Protocol](MANIFEST-PROTOCOL.md)
- [Worker Configs Review](../development/WORKER-CONFIGS-REVIEW.md)
- [Worker Config Architecture Proposal](../design/WORKER-CONFIG-ARCHITECTURE.md)
