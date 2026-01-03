# Conductor MCP - Manifest Protocol

Complete specification for the worker manifest communication protocol.

## Overview

The manifest protocol enables structured, type-safe communication between workers and BOSS through JSON manifests. Each worker creates a manifest file that documents its work, decisions, and recommendations.

## Per-Worker Manifests

Each worker gets its own manifest file to enable parallel execution:

```
.boss/
├── worker-manifest-env-abc123.json  # Backend worker
├── worker-manifest-env-def456.json  # Frontend worker
└── worker-manifest-env-ghi789.json  # Tester worker
```

**Benefits:**

- No merge conflicts between parallel workers
- Clean git history
- Independent worker tracking
- Easy to inspect individual worker outputs

## Manifest Structure

### Base Manifest

All worker manifests follow this base structure:

```typescript
interface WorkerManifest {
  workerId: string; // e.g., 'env-abc123'
  workerType: WorkerType; // e.g., 'architect'
  status: WorkerStatus; // 'running' | 'completed' | 'failed'
  startedAt: string; // ISO 8601 timestamp
  lastUpdatedAt: string; // ISO 8601 timestamp
  completedAt?: string; // ISO 8601 timestamp
  artifacts: WorkerArtifact[];
  decisions: WorkerDecision[];
  issues: WorkerIssue[];
  recommendations: string[];
  tasksCompleted: string[];
}
```

### Artifact

Documents files created, modified, or deleted:

```typescript
interface WorkerArtifact {
  path: string; // e.g., '.specify/memory/constitution.md'
  action: 'created' | 'modified' | 'deleted';
  purpose: string; // Human-readable description
  sections?: string[]; // For markdown files
  filesChanged?: string[]; // For directories
}
```

**Example:**

```json
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
```

### Decision

Documents key decisions made during work:

```typescript
interface WorkerDecision {
  decision: string; // What was decided
  rationale: string; // Why it was decided
  impact: 'high' | 'medium' | 'low';
  reversible: boolean; // Can this be changed later?
}
```

**Example:**

```json
{
  "decision": "Enforced TDD as non-negotiable",
  "rationale": "Ensures code quality and prevents regressions",
  "impact": "high",
  "reversible": false
}
```

### Issue

Documents problems encountered:

```typescript
interface WorkerIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string; // What went wrong
  impact: string; // How it affects the project
  suggestedAction: string; // What BOSS should do
  blocksProgress: boolean; // Does this prevent completion?
}
```

**Example:**

```json
{
  "severity": "high",
  "description": "Constitution template not found in .specify/templates/",
  "impact": "Cannot follow standard format",
  "suggestedAction": "BOSS should bootstrap .specify/ structure first",
  "blocksProgress": false
}
```

## Schema-Based Approach

### How It Works

1. **Conductor generates JSON schema** from worker metadata.json
2. **Worker executes with schema validation**:
   ```bash
   claude-code --output-format json --json-schema '${schema}' < task
   ```
3. **Worker returns structured JSON** (validated by Claude)
4. **Conductor parses WorkerResult**:
   ```typescript
   const workerResult: WorkerResult = JSON.parse(stdout);
   ```
5. **Conductor creates/updates manifest**:
   ```typescript
   const manifest: WorkerManifest = {
     workerId,
     workerType,
     status: workerResult.workComplete ? 'completed' : 'running',
     artifacts: workerResult.artifacts,
     decisions: workerResult.decisions,
     issues: workerResult.issues,
     recommendations: workerResult.recommendations,
     tasksCompleted: workerResult.tasksCompleted,
     // ...timestamps
   };
   ```

### WorkerResult Schema

Workers return JSON matching this structure:

```typescript
interface WorkerResult {
  artifacts: WorkerArtifact[];
  decisions: WorkerDecision[];
  issues: WorkerIssue[];
  recommendations: string[];
  tasksCompleted: string[];
  workComplete: boolean;
  nextSteps?: string[];
  // Worker-specific fields...
}
```

### Worker-Specific Extensions

Each worker type can add specific fields:

**Architect:**

```typescript
{
  ...baseFields,
  principlesEstablished: string[]
}
```

**Clarifier:**

```typescript
{
  ...baseFields,
  questionsAsked: number,
  ambiguitiesResolved: number
}
```

**Spec Writer:**

```typescript
{
  ...baseFields,
  userStoriesWritten: number,
  acceptanceCriteriaDefined: number
}
```

**Planner:**

```typescript
{
  ...baseFields,
  tasksBrokenDown: number,
  parallelTasksIdentified: number
}
```

**Developer:**

```typescript
{
  ...baseFields,
  testsPassed: boolean,
  coverageAchieved: number
}
```

**Tester:**

```typescript
{
  ...baseFields,
  testsCreated: number,
  coverageAchieved: number,
  mutationScore: number
}
```

See [Worker Configs Review](../development/WORKER-CONFIGS-REVIEW.md) for complete worker-specific schemas.

## Lifecycle

### 1. Initialization

When worker is spawned, Conductor creates initial manifest:

```json
{
  "workerId": "env-abc123",
  "workerType": "architect",
  "status": "running",
  "startedAt": "2026-01-02T10:00:00Z",
  "lastUpdatedAt": "2026-01-02T10:00:00Z",
  "artifacts": [],
  "decisions": [],
  "issues": [],
  "recommendations": [],
  "tasksCompleted": []
}
```

### 2. Worker Execution

Worker processes task and returns JSON:

```json
{
  "artifacts": [
    {
      "path": ".specify/memory/constitution.md",
      "action": "created",
      "purpose": "Project constitution"
    }
  ],
  "decisions": [
    {
      "decision": "Enforced TDD",
      "rationale": "Quality assurance",
      "impact": "high",
      "reversible": false
    }
  ],
  "issues": [],
  "recommendations": ["Run clarifier next"],
  "tasksCompleted": ["Created constitution"],
  "workComplete": true
}
```

### 3. Manifest Update

Conductor updates manifest with worker result:

```json
{
  "workerId": "env-abc123",
  "workerType": "architect",
  "status": "completed",
  "startedAt": "2026-01-02T10:00:00Z",
  "lastUpdatedAt": "2026-01-02T10:15:00Z",
  "completedAt": "2026-01-02T10:15:00Z",
  "artifacts": [...],
  "decisions": [...],
  "issues": [],
  "recommendations": ["Run clarifier next"],
  "tasksCompleted": ["Created constitution"]
}
```

## Reading Manifests

### From Conductor

```typescript
const status = await conductor.get_worker_status({
  workerId: 'env-abc123',
});

console.log('Status:', status.status);
console.log('Artifacts:', status.manifest?.artifacts);
console.log('Decisions:', status.manifest?.decisions);
console.log('Recommendations:', status.manifest?.recommendations);
```

### From Filesystem

```bash
# Read manifest directly
cat .boss/worker-manifest-env-abc123.json | jq .

# Get specific fields
cat .boss/worker-manifest-env-abc123.json | jq '.artifacts'
cat .boss/worker-manifest-env-abc123.json | jq '.decisions'
cat .boss/worker-manifest-env-abc123.json | jq '.recommendations'
```

## Validation

### Schema Validation

Conductor validates worker output against generated schema:

```typescript
const schema = {
  type: 'object',
  required: [
    'artifacts',
    'decisions',
    'issues',
    'recommendations',
    'tasksCompleted',
    'workComplete',
  ],
  properties: {
    artifacts: {
      type: 'array',
      items: {
        /* WorkerArtifact schema */
      },
    },
    decisions: {
      type: 'array',
      items: {
        /* WorkerDecision schema */
      },
    },
    // ...
  },
};

// Claude validates output before returning
const workerResult = JSON.parse(stdout); // Guaranteed valid
```

### Manifest Integrity

Conductor ensures:

- All required fields present
- Valid timestamps (ISO 8601)
- Valid status values
- Valid severity/impact values
- No duplicate artifacts

## Best Practices

### For Workers

1. **Document all artifacts** - Every file created/modified
2. **Record key decisions** - Especially high-impact, irreversible ones
3. **Report issues early** - Don't hide problems
4. **Provide clear recommendations** - Help BOSS with next steps
5. **Be specific** - Use precise language, avoid ambiguity

### For BOSS

1. **Check manifest before merging** - Validate artifacts exist
2. **Review decisions** - Understand worker's reasoning
3. **Address critical issues** - Don't ignore high-severity problems
4. **Follow recommendations** - Workers know what comes next
5. **Track manifest history** - Keep manifests for audit trail

## Benefits

### Reliability

- **No manual JSON writing** - Workers return validated output
- **Consistent format** - Schema enforcement
- **Type safety** - TypeScript throughout

### Visibility

- **Complete audit trail** - All decisions documented
- **Easy debugging** - Issues clearly reported
- **Progress tracking** - Artifacts show what's done

### Scalability

- **Parallel execution** - Per-worker manifests
- **No conflicts** - Clean git merges
- **Independent workers** - No shared state

---

**Related Documentation:**

- [Architecture Overview](OVERVIEW.md)
- [Worker Configuration](WORKER-CONFIG.md)
- [API Tools](../api/TOOLS.md)
- [Conductor in Workers](../design/CONDUCTOR-IN-WORKERS.md)
