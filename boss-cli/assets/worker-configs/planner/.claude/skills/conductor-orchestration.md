# Conductor Orchestration

## Description

Understanding worker coordination, phase transitions, and BOSS orchestration patterns. Use when workers need to understand their role in the overall workflow, read project state, or coordinate with other workers.

## Overview

Conductor-MCP orchestrates all 15 worker types across 10 development phases, managing lifecycle, state, and coordination. Workers in early phases (architect, clarifier, spec-writer, planner, reviewer, consolidator) especially need to understand how their work fits into the larger workflow.

## Core Concepts

### Worker Lifecycle

```
1. SPAWN → Conductor creates container-use environment
2. CONFIGURE → Worker-specific CLAUDE.md and skills loaded
3. EXECUTE → Worker performs assigned task
4. MANIFEST → Worker creates .boss/worker-manifest-{id}.json
5. REVIEW → Conductor validates manifest against schema
6. MERGE/RESUME → Branch merged or worker resumed for more work
7. TERMINATE → Container cleaned up
```

### 10 Development Phases

```
PHASE 1: Architecture & Governance
├── architect → constitution.md (NON-NEGOTIABLE principles)

PHASE 2: Requirements Clarification
├── clarifier → clarification.md (max 5 Q&A)

PHASE 3: Specification
├── spec-writer → spec.md (BDD user stories)

PHASE 4: Planning
├── planner → plan.md, data-model.md, contracts/

PHASE 5: Review Gate
├── reviewer → validation.md (approve/reject/retry)

PHASE 6: Task Breakdown
├── planner → tasks.md (with [P] parallelization markers)

PHASE 7: Implementation (PARALLEL)
├── developer-frontend  ┐
├── developer-backend   ├─ Parallel execution
└── developer-fullstack ┘

PHASE 8: Testing
├── tester → test-checklist.md

PHASE 9: Code Review
├── code-reviewer → review-report.md

PHASE 10: Consolidation Gate
├── consolidator → checklist.md, merged feature branch

ONGOING (Parallel with Phase 7):
├── security-engineer → security.md, threat model
├── devops-engineer → CI/CD, infrastructure
├── technical-writer → API docs, user guides
└── product-owner → requirements validation, prioritization
```

### Worker Types by Role

**Sequential Workers** (must wait for predecessors):
- architect (first worker, no dependencies)
- clarifier (depends on: requirements)
- spec-writer (depends on: clarification.md)
- planner (depends on: spec.md)
- reviewer (depends on: plan.md)
- planner again (depends on: validation.md approved)

**Parallel Workers** (can run concurrently):
- developer-frontend, developer-backend, developer-fullstack (all from tasks.md)
- security-engineer, devops-engineer (ongoing during implementation)
- technical-writer (during/after implementation)

**Gate Workers** (quality gates):
- reviewer (Phase 5 - plan approval gate)
- consolidator (Phase 10 - final merge gate)

## Reading Project State

### Project Config

**Location**: `.boss/project-config.json`

**Critical before starting work**:
```bash
# Read entire config
cat .boss/project-config.json | jq .

# Key information to extract:
jq -r '.workflow.currentBranch' .boss/project-config.json
# Example output: "feature/user-authentication"

jq -r '.workflow.activeWorkers[]' .boss/project-config.json
# Example output: ["env-developer-backend-001", "env-developer-frontend-002"]

jq -r '.workflow.completedTasks[]' .boss/project-config.json
# Example output: ["T010", "T011", "T012"]
```

**Structure**:
```json
{
  "project": {
    "name": "my-app",
    "template": "nextjs-turbo-monorepo",
    "createdAt": "2026-01-15T08:00:00Z"
  },
  "workflow": {
    "currentBranch": "feature/user-auth",
    "targetBranch": "main",
    "currentPhase": "implementation",
    "activeWorkers": ["env-dev-backend-001"],
    "completedTasks": ["T010", "T011"],
    "blockedTasks": []
  },
  "workers": {
    "summaries": [
      {
        "envId": "env-architect-001",
        "workerType": "architect",
        "completedAt": "2026-01-15T09:00:00Z",
        "artifacts": ["constitution.md"],
        "notes": "Established TDD/BDD principles"
      }
    ]
  },
  "repository": {
    "url": "https://github.com/user/repo",
    "defaultBranch": "main"
  }
}
```

### Other Workers' Manifests

**Reading manifests** to understand previous work:

```bash
# List all manifests
ls -1 .boss/worker-manifest-*.json

# Read architect's manifest to understand principles
cat .boss/worker-manifest-env-architect-001.json | jq '.principlesEstablished'

# Read clarifier's manifest to see Q&A
cat .boss/worker-manifest-env-clarifier-001.json | jq '.requirementsGathered'

# Read planner's manifest to understand task breakdown
cat .boss/worker-manifest-env-planner-001.json | jq '.tasksIdentified'

# Check if previous worker reported issues
cat .boss/worker-manifest-env-*.json | jq '.issues[]'
```

**Common use cases**:
1. **Architect** reads product-owner manifest for business requirements
2. **Clarifier** reads architect manifest for architectural constraints
3. **Spec-writer** reads clarifier manifest for resolved ambiguities
4. **Planner** reads spec-writer manifest for user stories
5. **Reviewer** reads planner manifest + constitution to validate compliance
6. **Developers** read planner manifest for task assignments
7. **Consolidator** reads ALL manifests to verify completeness

## Phase Transitions

### Understanding Dependencies

**Blocker Pattern**:
If a worker discovers they cannot proceed:

```json
{
  "workComplete": false,
  "issues": [
    {
      "severity": "critical",
      "category": "blocker",
      "description": "Cannot create plan without API contract examples from architect",
      "affectedArtifacts": ["plan.md"],
      "suggestedResolution": "Spawn architect to define API contract patterns, or resume this worker after patterns available"
    }
  ],
  "recommendations": [
    "Resume this planner worker after architect provides API contract examples",
    "Alternative: Proceed with standard REST patterns as default"
  ]
}
```

**Handoff Pattern**:
When work complete and ready for next phase:

```json
{
  "workComplete": true,
  "recommendations": [
    "Spawn reviewer to validate plan against constitution",
    "After plan approval, resume planner to create tasks.md",
    "Ensure plan.md and data-model.md are committed before review"
  ],
  "decisionsRequiringReview": [
    "JWT vs session-based authentication (see decision D001)",
    "PostgreSQL vs MySQL for user storage (see decision D002)"
  ]
}
```

### Gate Transitions

**Reviewer Gate (Phase 5)**:
```json
{
  "reviewStatus": "approved",
  "workComplete": true,
  "recommendations": [
    "✅ Plan approved - proceed to Phase 6 task breakdown",
    "Resume planner to create tasks.md based on approved plan.md"
  ]
}
```

OR:

```json
{
  "reviewStatus": "changes-requested",
  "workComplete": true,
  "issues": [
    {
      "severity": "high",
      "category": "question",
      "description": "Plan missing API documentation strategy (constitution violation)",
      "suggestedResolution": "Resume planner to add API documentation section to plan.md"
    }
  ],
  "recommendations": [
    "❌ Changes required before task breakdown",
    "Resume planner to address API documentation gap"
  ]
}
```

**Consolidator Gate (Phase 10)**:
```json
{
  "workComplete": true,
  "recommendations": [
    "✅ All quality gates passed",
    "✅ Integration tests passing",
    "✅ Security scan clean",
    "✅ Documentation complete",
    "Ready to merge feature branch to main"
  ],
  "mergeStrategy": "squash",
  "finalChecklist": {
    "testsPass": true,
    "coverageAboveThreshold": true,
    "securityScanClean": true,
    "documentationComplete": true
  }
}
```

## Coordination Patterns

### Sequential Coordination (Phases 1-6)

Workers must wait for predecessors to complete:

**Architect → Clarifier**:
```bash
# Clarifier checks if constitution exists
test -f .specify/memory/constitution.md || echo "Waiting for architect"

# If exists, read NON-NEGOTIABLE principles
grep "NON-NEGOTIABLE" .specify/memory/constitution.md

# Ensure clarifications comply with principles
```

**Clarifier → Spec Writer**:
```bash
# Spec Writer checks if clarifications exist
test -f .specify/specs/000-requirements/clarification.md || echo "Waiting for clarifier"

# Read Q&A to understand resolved ambiguities
cat .specify/specs/000-requirements/clarification.md

# Write user stories based on clarified requirements
```

**Spec Writer → Planner**:
```bash
# Planner checks if spec exists
test -f .specify/specs/000-requirements/spec.md || echo "Waiting for spec-writer"

# Read user stories
cat .specify/specs/000-requirements/spec.md

# Design architecture to fulfill stories
```

### Parallel Coordination (Phase 7)

Multiple developers work concurrently on independent tasks:

**Pattern**:
1. Planner creates tasks.md with [P] markers
2. Conductor spawns developers in parallel
3. Each developer works on assigned task from tasks.md
4. Developers commit to isolated branches
5. Consolidator merges all branches

**Developer Coordination**:
```bash
# Read your assigned task
grep "T012" .specify/specs/user-authentication/tasks.md

# Check if dependencies complete
grep "Dependencies: T011" .specify/specs/user-authentication/tasks.md
# If T011 listed, verify it's in completedTasks
jq '.workflow.completedTasks[]' .boss/project-config.json | grep "T011"

# If dependency complete, proceed with implementation
```

**Avoiding Conflicts**:
- Each developer on isolated branch: `container-use/env-{workerId}`
- No shared files between parallel tasks (planner ensures this via [P] markers)
- Consolidator resolves any merge conflicts

### Ongoing Worker Coordination

**Security Engineer** (during Phase 7):
```bash
# Wait for any implementation to be available
ls -1 src/api/*.ts | head -1

# Once code exists, perform security scan
pnpm run security:scan

# Create threat model
cat > .specify/specs/user-authentication/checklists/security.md << 'EOF'
# Security Assessment
...
EOF

# Report issues via manifest
# Developers can address issues during implementation
```

**DevOps Engineer** (during Phase 7):
```bash
# Don't wait for all implementation to complete
# Set up CI/CD early in phase

# Create GitHub Actions workflow
cat > .github/workflows/ci.yml << 'EOF'
...
EOF

# Developers benefit from CI feedback during implementation
```

## Worker Communication

### Via Manifests

Primary communication channel:

```bash
# Developer reports completion
{
  "workComplete": true,
  "recommendations": [
    "tester: Focus on edge cases in password validation (see src/auth/password.ts:45-67)",
    "security-engineer: Review token generation logic for timing attacks"
  ]
}

# Tester reads recommendation and acts
cat .boss/worker-manifest-env-developer-backend-001.json | jq '.recommendations[]'
# Creates focused tests for those areas
```

### Via Spec-Kit Artifacts

Shared knowledge base:

```bash
# Planner documents API contracts
cat .specify/specs/user-authentication/contracts/auth-api.yaml

# Backend developer implements to contract
# Frontend developer consumes contract

# Both reference same contract - no miscommunication
```

### Via Project Config Updates

State tracking:

```bash
# Developer completes T012
jq '.workflow.completedTasks += ["T012"]' .boss/project-config.json > /tmp/config.json
mv /tmp/config.json .boss/project-config.json

# Tester checks if implementation tasks complete before starting
jq '.workflow.completedTasks[]' .boss/project-config.json | grep "T012"
```

## Conductor MCP Tools

Workers don't call these directly - BOSS uses conductor-mcp:

**Key Tools**:
- `spawn_worker` - Create new worker
- `spawn_workers_parallel` - Create multiple workers concurrently
- `get_worker_status` - Check worker state
- `execute_task` - Run additional task in existing worker
- `merge_worker` - Merge worker branch to target
- `terminate_worker` - Cleanup worker environment
- `list_active_workers` - See currently running workers
- `ask_worker` - Query completed worker for information

**Performance Optimizations**:
- `resumeEnvironmentId` - Resume existing worker (saves ~180s vs new spawn)
- Parallel spawning - Multiple workers simultaneously
- Config inspection/import - Learn from worker discoveries

## Understanding Your Role

### Early-Phase Workers (Architect, Clarifier, Spec Writer, Planner)

**Responsibilities**:
- Create foundational artifacts (constitution, spec, plan)
- Establish patterns for implementation workers
- Ensure clarity and completeness for downstream workers

**Key Behaviors**:
- Read predecessors' artifacts carefully
- Document decisions and rationale
- Anticipate questions from implementation workers
- Create actionable, unambiguous deliverables

**Example - Planner**:
```bash
# 1. Read all prerequisites
cat .specify/memory/constitution.md              # Principles to follow
cat .specify/specs/000-requirements/spec.md      # User stories to implement
cat .boss/worker-manifest-env-architect-001.json # Architectural guidance

# 2. Design plan that:
#    - Fulfills user stories from spec.md
#    - Complies with constitution.md principles
#    - Provides clear guidance for developers

# 3. Anticipate review
#    - Reviewer will check against constitution
#    - Include rationale for major decisions
#    - Reference specific principles or user stories
```

### Gate Workers (Reviewer, Consolidator)

**Responsibilities**:
- Validate against constitution and quality standards
- Approve/reject with clear feedback
- Ensure completeness before allowing progression

**Key Behaviors**:
- Thorough validation against checklists
- Specific, actionable feedback for failures
- Clear approve/reject/retry decisions

**Example - Reviewer**:
```bash
# 1. Read constitution
cat .specify/memory/constitution.md

# 2. Read plan to review
cat .specify/specs/user-authentication/plan.md

# 3. Check each NON-NEGOTIABLE principle
grep "MUST" .specify/memory/constitution.md | while read principle; do
  # Verify plan addresses this principle
  grep -q "test" .specify/specs/user-authentication/plan.md || echo "Missing: $principle"
done

# 4. Decide: approved/changes-requested/rejected
{
  "reviewStatus": "approved",
  "workComplete": true
}
```

## Advanced Coordination

### Cross-BOSS Communication

(Future feature - workers in different BOSS instances sharing knowledge)

**Potential pattern**:
```bash
# Query global knowledge base
conductor-kb query "authentication patterns Next.js tRPC"

# Learn from other projects' constitutions
conductor-kb get-constitution "ecommerce-platform"

# Share your successful patterns
conductor-kb contribute pattern "JWT refresh token rotation"
```

### Dynamic Worker Spawning

BOSS can spawn workers dynamically based on discovered needs:

**Example**:
```bash
# Developer discovers need for additional component
{
  "recommendations": [
    "Spawn developer-frontend to create PasswordStrengthMeter component",
    "This component is needed for T013 but was not in original tasks.md"
  ]
}

# BOSS reads recommendation and spawns additional worker
conductor spawn_worker --worker-type developer-frontend \
  --task-prompt "Create PasswordStrengthMeter component per recommendation from env-developer-backend-001"
```

### Resume vs New Worker

**When to resume**:
- Iterative refinement (80% done, need 20% more)
- Address review feedback
- Bug fixes discovered after initial completion
- Performance optimization

**When to spawn new**:
- Different worker type needed
- Completely new task
- Fresh perspective required
- Original worker encountered blocker

## Anti-Patterns

### ❌ Ignoring Dependencies

```bash
# ❌ Bad - spec-writer starting without clarification.md
cat > .specify/specs/000-requirements/spec.md << 'EOF'
# Made-up user stories without clarifications
EOF

# ✅ Good - check dependencies first
test -f .specify/specs/000-requirements/clarification.md || {
  echo "Blocker: Waiting for clarifier to complete"
  exit 1
}
cat .specify/specs/000-requirements/clarification.md
# Write stories based on clarified requirements
```

### ❌ Not Reading Project State

```bash
# ❌ Bad - assume what tasks are assigned
# Implement random feature

# ✅ Good - check project-config.json and tasks.md
cat .boss/project-config.json | jq '.workflow'
grep "Assigned to: developer-backend" .specify/specs/*/tasks.md
# Implement assigned tasks only
```

### ❌ Silent Failures

```bash
# ❌ Bad - encounter blocker but don't report
{
  "workComplete": true,
  "notes": "Skipped API documentation because unclear"
}

# ✅ Good - report blockers explicitly
{
  "workComplete": false,
  "issues": [
    {
      "severity": "high",
      "category": "question",
      "description": "Unclear which API documentation format to use (OpenAPI vs custom)",
      "suggestedResolution": "Get guidance from architect or technical-writer on documentation standards"
    }
  ]
}
```

## When to Use This Skill

- Understanding your position in the 10-phase workflow
- Reading and interpreting project-config.json
- Coordinating with predecessor and successor workers
- Understanding gate worker responsibilities
- Deciding between resume vs new worker spawn
- Interpreting other workers' manifests

## Related Skills

- `boss-manifest-protocol.md` - How to create manifests for communication
- `spec-kit-workflow.md` - Understanding phase-specific artifacts
- `container-use-operations.md` - Working within isolated environments

## Key Takeaways

1. **Understand your phase** - Know which workers come before/after you
2. **Read project-config.json** - Always check current state before starting
3. **Read predecessors' manifests** - Understand context and previous decisions
4. **Coordinate via manifests** - Primary communication with BOSS and other workers
5. **Respect gates** - Reviewer and consolidator approvals are mandatory
6. **Report blockers honestly** - Don't silently fail or skip work
7. **Sequential before Phase 7** - Phases 1-6 must complete in order
8. **Parallel in Phase 7** - Implementation workers run concurrently
