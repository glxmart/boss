# Conductor MCP in Worker Containers - Design Document

## Executive Summary

**Revolutionary Idea**: Install Conductor MCP inside worker containers so workers (Claude Code instances) can use MCP tools to manage their own manifests and potentially communicate with BOSS.

This transforms workers from manual JSON writers to MCP-powered specialists with type-safe manifest operations.

---

## Current Architecture

```
BOSS (Claude Code)
  ↓ has access to
Conductor MCP (BOSS's instance)
  ↓ manages workers
Worker Container (Claude Code)
  ↓ manually writes JSON
.boss/worker-manifest-{workerId}.json
```

**Problems**:
1. Workers manually write JSON (error-prone)
2. No validation until BOSS reads manifest
3. No type safety for workers
4. Workers don't know manifest schema

---

## Proposed Architecture

```
BOSS (Claude Code)
  ↓ has access to
Conductor MCP Instance #1 (BOSS's MCP server)
  ↓ manages workers
  ↓ spawns containers

Worker Container (Claude Code)
  ↓ has access to
Conductor MCP Instance #2 (Worker's MCP server)
  ↓ provides manifest tools
.boss/worker-manifest-{workerId}.json
```

**Benefits**:
1. ✅ Type-safe manifest operations for workers
2. ✅ Built-in validation
3. ✅ Consistent format guaranteed
4. ✅ Workers use MCP tools (natural for Claude Code)
5. ✅ Potential for bidirectional communication

---

## Implementation Details

### 1. Install Conductor in Worker Containers

**Update container-config.json**:

```json
{
  "base_image": "node:20-alpine",
  "install_commands": [
    "npm install -g @anthropic-ai/claude-code",
    "npm install -g @boss/conductor-mcp"
  ],
  "environment_variables": {
    "WORKER_ID": "${workerId}",
    "WORKER_TYPE": "${workerType}"
  }
}
```

**Why this works**:
- Each container is isolated
- Each has its own Conductor MCP instance
- No conflicts between BOSS's Conductor and Worker's Conductor

---

### 2. Configure Worker's MCP to Expose Manifest Tools

**Worker-specific Conductor tools** (subset of full Conductor):

```typescript
// Tools available ONLY to workers (not to BOSS)
export const WORKER_TOOLS = {
  // Manifest Operations
  update_manifest: {
    name: 'update_manifest',
    description: 'Update your worker manifest file',
    inputSchema: {
      type: 'object',
      properties: {
        artifacts: { type: 'array' },
        decisions: { type: 'array' },
        issues: { type: 'array' },
        recommendations: { type: 'array' },
        tasksCompleted: { type: 'array' }
      }
    }
  },

  add_artifact: {
    name: 'add_artifact',
    description: 'Add an artifact to your manifest',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        action: { enum: ['created', 'modified', 'deleted'] },
        purpose: { type: 'string' },
        sections: { type: 'array' }
      },
      required: ['path', 'action', 'purpose']
    }
  },

  add_decision: {
    name: 'add_decision',
    description: 'Document a key decision',
    inputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'string' },
        rationale: { type: 'string' },
        impact: { enum: ['high', 'medium', 'low'] },
        reversible: { type: 'boolean' }
      },
      required: ['decision', 'rationale', 'impact', 'reversible']
    }
  },

  add_issue: {
    name: 'add_issue',
    description: 'Report an issue encountered',
    inputSchema: {
      type: 'object',
      properties: {
        severity: { enum: ['critical', 'high', 'medium', 'low'] },
        description: { type: 'string' },
        impact: { type: 'string' },
        suggestedAction: { type: 'string' },
        blocksProgress: { type: 'boolean' }
      },
      required: ['severity', 'description', 'impact', 'blocksProgress']
    }
  },

  mark_completed: {
    name: 'mark_completed',
    description: 'Mark your work as completed',
    inputSchema: {
      type: 'object',
      properties: {
        finalRecommendations: { type: 'array' }
      }
    }
  }
};
```

**How workers use these tools**:

Instead of:
```javascript
// Manual JSON writing (error-prone!)
const manifest = JSON.parse(fs.readFileSync('.boss/worker-manifest-env-abc123.json'));
manifest.artifacts.push({
  path: '.specify/memory/constitution.md',
  action: 'created',
  purpose: 'Project constitution'
});
fs.writeFileSync('.boss/worker-manifest-env-abc123.json', JSON.stringify(manifest, null, 2));
```

Workers do:
```typescript
// Type-safe MCP tool call!
await conductor.add_artifact({
  path: '.specify/memory/constitution.md',
  action: 'created',
  purpose: 'Project constitution with governing principles',
  sections: ['Architectural Principles', 'Development Methodology', 'Testing Standards', 'Documentation Standards']
});
```

---

### 3. Bidirectional Communication via Shared Filesystem

**Problem**: MCP instances in different containers can't communicate directly.

**Solution**: Shared filesystem as communication channel!

```
/workdir/.boss/
├── worker-manifest-env-abc123.json     # Worker's manifest
├── boss-inbox/                         # Workers write here
│   └── env-abc123-message.json         # BOSS reads from here
└── worker-inbox/                       # BOSS writes here
    └── env-abc123-message.json         # Worker reads from here
```

**Communication Flow**:

#### Worker → BOSS (Question/Notification)

```typescript
// Worker calls:
await conductor.notify_boss({
  type: 'question',
  message: 'Should I include GraphQL in API design? Constitution mentions REST but requirements suggest GraphQL.',
  priority: 'high',
  requiresAnswer: true
});

// Conductor writes to: .boss/boss-inbox/env-abc123-question-001.json
```

BOSS periodically checks `.boss/boss-inbox/` or gets notified.

#### BOSS → Worker (Response/Instruction)

```typescript
// BOSS uses existing ask_worker tool
await conductor.ask_worker({
  workerId: 'env-abc123',
  question: 'Include both REST and GraphQL. Prioritize REST for CRUD, GraphQL for complex queries.'
});

// Or BOSS writes to: .boss/worker-inbox/env-abc123-response-001.json
// Worker's Conductor reads this file and presents to worker
```

---

### 4. Worker CLAUDE.md Updated Instructions

```markdown
## Using Conductor MCP for Manifest Management

**You have Conductor MCP tools available!** Use them instead of manually writing JSON.

### Available Tools:

#### Add an Artifact
When you create/modify a file:
```typescript
await conductor.add_artifact({
  path: '.specify/memory/constitution.md',
  action: 'created',
  purpose: 'Project constitution',
  sections: ['Architectural Principles', 'Development Methodology']
});
```

#### Document a Decision
When you make a key decision:
```typescript
await conductor.add_decision({
  decision: 'Enforced TDD as non-negotiable',
  rationale: 'Ensures code quality and prevents regressions',
  impact: 'high',
  reversible: false
});
```

#### Report an Issue
When you encounter a problem:
```typescript
await conductor.add_issue({
  severity: 'high',
  description: 'Constitution template not found in .specify/templates/',
  impact: 'Cannot follow standard format',
  suggestedAction: 'BOSS should bootstrap .specify/ structure first',
  blocksProgress: false
});
```

#### Mark Work Complete
When finished:
```typescript
await conductor.mark_completed({
  finalRecommendations: [
    'Clarifier should gather business requirements next',
    'Constitution should be validated by reviewer'
  ]
});
```

### Ask BOSS a Question
If you need clarification:
```typescript
await conductor.notify_boss({
  type: 'question',
  message: 'Should API support versioning?',
  priority: 'medium',
  requiresAnswer: true
});
```
```

---

## Technical Challenges & Solutions

### Challenge 1: Different MCP Instance IDs

**Problem**: Each container has a separate Conductor MCP instance.

**Solution**: Not a problem! Each instance is isolated and operates on the local filesystem. BOSS's Conductor manages workers, Worker's Conductor manages its own manifest.

### Challenge 2: Version Compatibility

**Problem**: BOSS's Conductor and Worker's Conductor might have different versions.

**Solution**:
- Pin Conductor version in container-config.json
- BOSS checks Conductor version on spawn
- Manifest schema versioning

```json
{
  "install_commands": [
    "npm install -g @anthropic-ai/claude-code@latest",
    "npm install -g @boss/conductor-mcp@0.2.0"  // Pinned version
  ]
}
```

### Challenge 3: Filesystem Permissions

**Problem**: Worker needs write access to `.boss/` directory.

**Solution**: Container-use already provides this. Workers run in `/workdir/` with full access.

---

## Implementation Phases

### Phase 1: Basic Manifest Tools (Implement First)
- ✅ Install Conductor in worker containers
- ✅ Expose `add_artifact`, `add_decision`, `add_issue` tools
- ✅ Update worker CLAUDE.md with tool instructions
- ✅ Test with single worker

### Phase 2: Bidirectional Communication
- Add `notify_boss` tool for workers
- BOSS polls `.boss/boss-inbox/` for messages
- Update `ask_worker` to use inbox files
- Test question/answer flow

### Phase 3: Advanced Features
- Real-time communication via file watching
- Manifest diff/validation tools
- Worker-to-worker communication (optional)
- Shared state management

---

## Code Changes Required

### 1. Update Container Config Template

**File**: `conductor-mcp/worker-configs/*/container-config.json`

```json
{
  "base_image": "node:20-alpine",
  "setup_commands": [
    "apk add --no-cache git bash"
  ],
  "install_commands": [
    "npm install -g @anthropic-ai/claude-code",
    "npm install -g @boss/conductor-mcp@0.2.0"
  ],
  "environment_variables": {
    "WORKER_ID": "${workerId}",
    "WORKER_TYPE": "${workerType}",
    "NODE_ENV": "production"
  }
}
```

### 2. Create Worker-Specific Tools

**File**: `conductor-mcp/src/worker-tools.ts` (new file)

```typescript
// Tools exposed only to workers (not BOSS)
export const WORKER_MANIFEST_TOOLS = {
  add_artifact: { ... },
  add_decision: { ... },
  add_issue: { ... },
  mark_completed: { ... },
  notify_boss: { ... }
};
```

### 3. Update Server to Detect Context

**File**: `conductor-mcp/src/server.ts`

```typescript
// Detect if running in worker container
const isWorker = process.env.WORKER_ID !== undefined;

if (isWorker) {
  // Expose worker-specific tools
  this.tools = WORKER_MANIFEST_TOOLS;
} else {
  // Expose BOSS tools (spawn_worker, etc.)
  this.tools = BOSS_TOOLS;
}
```

---

## Expected Benefits

### For Workers:
1. ✅ Type-safe manifest operations
2. ✅ No manual JSON writing
3. ✅ Instant validation
4. ✅ Natural MCP interface (they're Claude Code!)
5. ✅ Can ask BOSS questions
6. ✅ Reduced errors

### For BOSS:
1. ✅ Guaranteed manifest format
2. ✅ Can interact with workers
3. ✅ Better error reporting from workers
4. ✅ Workers self-document better
5. ✅ Simplified orchestration

### For System:
1. ✅ Consistent data format
2. ✅ Version-compatible manifests
3. ✅ Easier upgrades
4. ✅ Better debugging
5. ✅ Audit trail via MCP logs

---

## Testing Strategy

### Test 1: Single Worker with Conductor
```bash
# Spawn architect worker
conductor spawn_worker architect "Create constitution"

# Worker uses conductor.add_artifact() internally
# Verify manifest has correct format
cat .boss/worker-manifest-env-abc123.json

# Should see properly formatted artifact entries
```

### Test 2: Parallel Workers with Conductor
```bash
# Spawn 3 workers in parallel
conductor spawn_worker developer-backend "Implement API"
conductor spawn_worker developer-frontend "Implement UI"
conductor spawn_worker tester "Create tests"

# Each creates their own manifest
ls .boss/worker-manifest-*.json
# Should show 3 files, no conflicts

# Merge all
git merge --no-ff container-use/env-abc123
git merge --no-ff container-use/env-def456
git merge --no-ff container-use/env-ghi789

# Should merge cleanly (no conflicts!)
```

### Test 3: Interactive Communication
```bash
# Spawn worker
conductor spawn_worker architect "Create constitution"

# BOSS asks question
conductor ask_worker env-abc123 "Did you include security principles?"

# Worker responds (via conductor tool or manifest update)
conductor get_worker_status env-abc123
# Should show answer or updated manifest
```

---

## Security Considerations

1. **Isolation**: Each worker's Conductor instance is isolated
2. **Permissions**: Workers can only modify their own manifest
3. **Validation**: Conductor validates all manifest operations
4. **Audit**: MCP logs all worker tool calls
5. **Secrets**: Workers don't have access to BOSS's MCP configuration

---

## Future Possibilities

### Worker-to-Worker Communication
Workers could potentially send messages to each other via shared inbox:

```
.boss/
├── worker-inbox/
│   ├── env-abc123-from-env-def456.json  # Message from frontend to backend
│   └── env-def456-from-env-abc123.json  # Message from backend to frontend
```

### Shared State Management
Workers could update shared state:

```
.boss/
└── shared-state.json  # All workers can read/append to this
```

### Real-Time Collaboration
Workers watching each other's manifests for coordination.

---

## Recommendation

**YES! Implement this!** The benefits far outweigh the complexity:

1. Start with Phase 1 (basic manifest tools)
2. Test thoroughly with single + parallel workers
3. Add bidirectional communication in Phase 2
4. Iterate based on real usage

This transforms workers from passive executors to intelligent, communicating agents.

---

## Next Steps

1. Create `src/worker-tools.ts` with manifest operation tools
2. Update `container-config.json` templates to install Conductor
3. Update worker CLAUDE.md with Conductor tool instructions
4. Create `.boss/boss-inbox/` and `.boss/worker-inbox/` directories on spawn
5. Test with architect worker
6. Document in README and BOSS-GUIDE

This is the future of BOSS-Worker communication!
