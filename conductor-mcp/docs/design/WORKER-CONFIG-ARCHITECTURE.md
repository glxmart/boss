# Worker Configuration Architecture

## Problem Statement

Current worker configs have duplication between `prompt.md` and `CLAUDE.md`, causing:

- Maintenance overhead (update in two places)
- Inconsistency risk
- Unclear separation of concerns

## Proposed Solution

### File Structure (per worker)

```
worker-configs/[worker-type]/
├── metadata.json          # NEW: BOSS-facing metadata (replaces prompt.md)
├── CLAUDE.md             # Worker-facing instructions (enhanced)
├── container-config.json # Container environment setup
└── .claude/              # Optional worker-specific skills/commands
```

### 1. metadata.json - BOSS-Facing Orchestration Data

**Purpose**: Tell BOSS what this worker is and how to use it

```json
{
  "workerType": "architect",
  "phase": "Phase 1: Constitution",
  "role": "Creates constitution with governing principles and NON-NEGOTIABLE standards",

  "artifacts": [
    {
      "path": ".specify/memory/constitution.md",
      "purpose": "Project constitution with architectural principles",
      "required": true
    }
  ],

  "dependencies": {
    "requiredBefore": [],
    "requiredAfter": ["clarifier", "spec-writer", "planner"]
  },

  "spawnGuidance": {
    "when": "First worker to spawn - establishes foundation",
    "taskPromptGuidance": "Provide high-level project vision. Worker knows BOSS methodology.",
    "expectedDuration": "5-15 minutes",
    "parallelizable": false
  },

  "outputExpectations": {
    "decisions": ["TDD enforcement", "BDD requirements", "Documentation standards"],
    "principlesEstablished": 4-6
  }
}
```

**Benefits**:

- Structured, parseable by BOSS
- Clear orchestration guidance
- Easy to query programmatically
- Can be used by tools/UIs

### 2. CLAUDE.md - Worker-Facing Execution Context

**Purpose**: Tell the worker (Claude Code in container) everything it needs to know

````markdown
# Architect Worker - Full Context

You are a **fully specialized Architect agent** running in an isolated container environment.

## Your Role & Identity

**Worker Type**: Architect
**Phase**: Phase 1: Constitution
**Responsibility**: Create `.specify/memory/constitution.md` with governing principles that establish NON-NEGOTIABLE standards for the entire project.

## CRITICAL: BOSS-Worker Communication Protocol (Schema-Based)

### How Communication Works (You Don't Write JSON Manually!)

**IMPORTANT**: You are executed with `--output-format json` and `--json-schema` flags. This means:

- **You return structured JSON data** at the end of your work
- **Conductor automatically updates the manifest** based on your output
- **You DON'T manually write** `.boss/worker-manifest-{workerId}.json` files

**Your Output Format** (automatically validated):

```json
{
  "artifacts": [
    {
      "path": ".specify/memory/constitution.md",
      "action": "created",
      "purpose": "Project constitution with governing principles",
      "sections": [
        "Architectural Principles",
        "Development Methodology",
        "Testing Standards",
        "Documentation Standards"
      ]
    }
  ],
  "decisions": [
    {
      "decision": "Enforced TDD as non-negotiable",
      "rationale": "Ensures code quality and prevents regressions",
      "impact": "high",
      "reversible": false
    }
  ],
  "issues": [],
  "recommendations": [
    "Clarifier should gather business requirements next",
    "Constitution should be validated by reviewer before proceeding"
  ],
  "tasksCompleted": ["Created project constitution", "Established quality gates"],
  "workComplete": true,
  "principlesEstablished": [
    "TDD Mandatory",
    "BDD Required",
    "80% Coverage",
    "Documentation Standards"
  ]
}
```
````

## BOSS Project Structure (Critical Knowledge)

[Full project structure here...]

## Your Core Responsibilities

1. **Create Constitution**: `.specify/memory/constitution.md`
2. **Establish NON-NEGOTIABLE Standards**: TDD, BDD, Documentation
3. **Define Architectural Principles**: Patterns, conventions, constraints
4. **Set Quality Gates**: Coverage, mutation testing, review criteria

## Spec-Kit Integration

**You MUST use Spec-Kit commands:**

- `/speckit.constitution` - Your primary tool
- `/speckit.analyze` - Validate consistency

## Expected Deliverables

**Required Sections in Constitution**:

1. **Architectural Principles**: Core patterns and conventions
2. **Development Methodology**: TDD, BDD, workflow
3. **Testing Standards**: Coverage ≥80%, mutation ≥80%
4. **Documentation Standards**: Feature docs, API docs, README

## Quality Checklist

Before marking `workComplete: true`, verify:

- [ ] Constitution created at `.specify/memory/constitution.md`
- [ ] All 4 required sections present
- [ ] TDD declared as NON-NEGOTIABLE
- [ ] BDD declared as NON-NEGOTIABLE
- [ ] Documentation standards clear
- [ ] Principles are measurable and enforceable

````

**Benefits**:
- Complete worker context
- No duplication
- Schema-based communication documented
- Worker has everything needed

### 3. How BOSS Uses This

```typescript
// Load worker metadata
const metadata = await loadWorkerMetadata('architect');

// BOSS knows:
// - When to spawn: metadata.spawnGuidance.when
// - What to expect: metadata.outputExpectations
// - Dependencies: metadata.dependencies

// Spawn worker
await conductor.spawn_worker({
  workerType: 'architect',
  taskPrompt: 'Create constitution for e-commerce platform with microservices architecture'
  // BOSS knows this worker needs high-level vision
});

// Worker receives:
// - Task prompt (above)
// - Full CLAUDE.md context (loaded into container)
// - Schema validation (enforced by Conductor)
````

## Migration Strategy

### Phase 1: Add metadata.json (Keep prompt.md for now)

1. Create metadata.json for all 15 workers
2. Update worker-loader.ts to read both
3. Deprecate prompt.md usage

### Phase 2: Enhance all CLAUDE.md files

1. Update all 15 CLAUDE.md with schema-based protocol
2. Add complete BOSS project structure
3. Add worker-specific output expectations

### Phase 3: Remove prompt.md

1. Remove prompt.md from all workers
2. Update worker-loader.ts to only use metadata.json
3. Update documentation

## Benefits of New Architecture

1. **Clear Separation**: metadata.json = BOSS, CLAUDE.md = Worker
2. **No Duplication**: Single source of truth for each purpose
3. **Structured Data**: metadata.json is queryable/parseable
4. **Complete Context**: Workers get everything in CLAUDE.md
5. **Type Safety**: metadata.json can be validated
6. **Tooling Ready**: Can build UIs/dashboards from metadata.json
7. **Maintainability**: Update once in right place

## Example: How Each File is Used

**BOSS orchestrating workflow**:

```typescript
// 1. Query available workers
const workers = await listWorkerTypes();

// 2. For each worker, read metadata.json
const metadata = await loadWorkerMetadata(workerType);

// 3. BOSS decides when to spawn based on:
//    - metadata.phase
//    - metadata.dependencies
//    - metadata.spawnGuidance

// 4. BOSS crafts task prompt using:
//    - metadata.spawnGuidance.taskPromptGuidance
//    - User's requirements
//    - Project context
```

**Worker executing task**:

```bash
# 1. Container starts
# 2. Conductor writes CLAUDE.md to /workdir/CLAUDE.md
# 3. Worker (Claude Code) reads CLAUDE.md
# 4. Worker sees:
#    - Its role and responsibilities
#    - BOSS project structure
#    - Schema-based output format
#    - Quality requirements
# 5. Worker executes task
# 6. Worker returns JSON matching schema
# 7. Conductor updates manifest
```

## Implementation Priority

1. **HIGH**: Create metadata.json for all 15 workers
2. **HIGH**: Update all CLAUDE.md with schema-based protocol
3. **MEDIUM**: Update worker-loader.ts to use metadata.json
4. **LOW**: Build UI/dashboard using metadata.json
