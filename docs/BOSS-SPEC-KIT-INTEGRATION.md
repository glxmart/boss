# BOSS + Spec-Kit Integration

**How BOSS automates GitHub's Spec-Kit methodology**

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [BOSS Vision](./BOSS-ENHANCED-VISION.md) | [Container-Use Integration](./BOSS-CONTAINER-USE-INTEGRATION.md) | [GitHub Integration](./BOSS-GITHUB-INTEGRATION.md) | [Host Setup](./BOSS-HOST-SETUP.md) | [Docker Setup](./DOCKER-SETUP.md)

This document explains how BOSS transforms Spec-Kit from a manual methodology into a fully automated orchestration system while preserving its core principles.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Workflow Overview](#workflow-overview)
4. [Phase-by-Phase Guide](#phase-by-phase-guide)
5. [Worker Implementation](#worker-implementation)
6. [Quality Gates](#quality-gates)
7. [Reference](#reference)

---

## Quick Start

### The 30-Second Overview

**Spec-Kit** is GitHub's methodology for specification-driven development.
**BOSS** automates all Spec-Kit phases with AI workers.

```
Manual Spec-Kit                    BOSS + Spec-Kit
────────────────                   ───────────────
Human runs commands    →           Workers execute automatically
Sequential phases      →           Parallel where possible
Manual validation      →           Automated quality gates
Single developer       →           Multiple specialized workers
No cross-project       →           Knowledge base integration
```

### What You Get

- ✅ **8 automated phases** - From principles to production
- ✅ **Parallel execution** - Based on `[P]` markers in tasks
- ✅ **TDD enforced** - Tests before implementation (non-negotiable)
- ✅ **Quality gates** - Automated validation at every phase
- ✅ **Knowledge base** - Learn from similar projects
- ✅ **Human governance** - Approval at strategic decision points

### Key Artifacts Created

| Phase | Artifact | Purpose |
|-------|----------|---------|
| 1. Constitution | `constitution.md` | Governing principles (non-negotiable) |
| 3. Specification | `spec.md` | User stories & acceptance criteria |
| 4. Planning | `plan.md`, `data-model.md`, `contracts/` | Technical approach |
| 5. Validation | `validation-report.md` | Constitution compliance |
| 6. Task Breakdown | `tasks.md` | Ordered tasks with `[P]` markers |
| 8. Consolidation | `quickstart.md`, `checklist.md` | Delivery artifacts |

---

## Core Concepts

### 1. What is Spec-Kit?

**Spec-Kit** is GitHub's open-source toolkit for "Spec-Driven Development."

**Key Principles:**
- Specifications are **executable**, not temporary scaffolding
- Test-First methodology is **non-negotiable**
- Multi-step refinement (7 phases)
- Each feature independently testable
- Constitution governs all decisions

**Spec-Kit Phases:**
```
1. Principles      → Establish constitution
2. Clarification   → Gather requirements
3. Specification   → Document user stories
4. Planning        → Define technical approach
5. Validation      → Check compliance
6. Task Breakdown  → Create ordered tasks
7. Implementation  → Execute with TDD
```

### 2. How BOSS Automates Spec-Kit

**Traditional Spec-Kit:**
- Human runs `/speckit.*` commands
- Manual phase progression
- Single developer implementation
- No cross-project learning

**BOSS + Spec-Kit:**
- Workers execute phases automatically
- Parallel execution where possible
- Multiple specialized workers
- Knowledge base integration
- Automated quality gates

**The Transformation:**

```
BOSS (Claude Code/Cursor)
├─► Phase 1: Architect worker → Creates constitution
├─► Phase 2: Clarifier worker → Gathers requirements
├─► Phase 3: Spec-Writer worker → Writes spec.md
├─► [GATE 1: Human Approval]
├─► Phase 4: Planner worker → Creates plan.md
├─► Phase 5: Reviewer worker → Validates compliance
├─► [AUTO-GATE: Constitution Check]
├─► Phase 6: Planner worker → Creates tasks.md
├─► Phase 7: Developer workers → Parallel implementation
├─► Phase 8: Consolidator worker → Merges & tests
└─► [GATE 2: Human Review]
```

### 3. BOSS = Claude Code/Cursor + MCPs

**Important:** BOSS is NOT a standalone application.

**BOSS is:**
- Claude Code or Cursor running on your machine
- Configured with BOSS skills
- Connected to MCP servers

**When docs say "BOSS spawns a worker":**

```typescript
// This is what happens under the hood
const env = await mcp.containerUse.createEnvironment({
  title: "clarifier-worker",
  config: ".boss/workers/clarifier/container-config.json"
});

await mcp.containerUse.executeInEnvironment({
  env_id: env.env_id,
  prompt: clarifierPrompt,
  skills: ["business-analysis", "requirements-gathering"]
});
```

### 4. Quality Gate Strategy

BOSS enforces quality through **iteration, not prevention**:

```
Worker completes task
  ↓
Quality gates run automatically
  ↓
┌─────────────────────────┐
│  Quality Gates Pass?    │
└────┬──────────────┬─────┘
     │              │
     ✅             ❌
     │              │
Merge branch    Delete environment
     │              │
     │         Analyze failure
     │              │
     │         Create improved prompt
     │              │
     │         Spawn NEW worker
     │              │
     │         Retry (max 3 attempts)
     │              │
     └──────────────┘
```

**Quality Checks:**
- ✅ TypeScript: No errors
- ✅ Lint: No warnings
- ✅ Tests: All passing
- ✅ Coverage: ≥ 80%
- ✅ Mutation: ≥ 80%
- ✅ Security: No vulnerabilities

### 5. Directory Structure

```
.specify/
├── memory/
│   └── constitution.md              # NON-NEGOTIABLE principles
│
├── specs/
│   └── 001-feature-name/
│       ├── spec.md                  # User stories (Phase 3)
│       ├── plan.md                  # Technical approach (Phase 4)
│       ├── data-model.md            # Database schema (Phase 4)
│       ├── contracts/               # API specs (Phase 4)
│       │   └── api.yaml
│       ├── validation-report.md     # Compliance (Phase 5)
│       ├── tasks.md                 # Task breakdown (Phase 6)
│       ├── quickstart.md            # Setup guide (Phase 8)
│       └── checklist.md             # Quality validation (Phase 8)
│
├── scripts/                         # Automation helpers
└── templates/                       # Spec-Kit templates
```

---

## Workflow Overview

### Complete BOSS + Spec-Kit Flow

```
┌──────────────────────────────────────────────────────────┐
│  Phase 0: Bootstrap                                      │
│  Creates .specify/ structure with templates              │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 1: Constitution                                   │
│  Worker: Architect                                       │
│  Output: constitution.md (governing principles)          │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 2: Clarification                                  │
│  Worker: Clarifier                                       │
│  Output: Requirement summary (business questions)        │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 3: Specification                                  │
│  Worker: Spec-Writer                                     │
│  Output: spec.md (user stories + acceptance criteria)    │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  🚦 GATE 1: Human Approval                               │
│  User reviews spec.md and approves via PR                │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 4: Planning                                       │
│  Worker: Planner                                         │
│  Output: plan.md, data-model.md, contracts/             │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 5: Validation                                     │
│  Worker: Reviewer                                        │
│  Output: validation-report.md                            │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  🤖 AUTO-GATE: Constitution Compliance                   │
│  Automatic check (up to 3 retries if failed)            │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 6: Task Breakdown                                 │
│  Worker: Planner                                         │
│  Output: tasks.md (with [P] parallelization markers)     │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 7: Implementation (PARALLEL)                      │
│  Workers: Developers (Frontend, Backend, Fullstack)      │
│  Output: Code + tests (following TDD)                    │
│  Note: Multiple workers run in parallel based on [P]     │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 8: Consolidation                                  │
│  Worker: Consolidator                                    │
│  Output: quickstart.md, checklist.md, main PR           │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│  🚦 GATE 2: Human Review                                 │
│  User reviews PR with all artifacts and approves         │
└──────────────────────────────────────────────────────────┘
                         ↓
                    Merge & Deploy
```

### Parallel Execution Example

**Phase 7 with 3 user stories:**

```
US1: Login (T010-T020)           [Sequential - TDD]
  Worker 1 (Fullstack)
  ├─ Write tests first
  ├─ Implement features
  └─ Integration tests

US2: Registration (T021-T028)    [P] Parallel with US3
  Worker 2 (Backend)
  ├─ Write tests first
  ├─ Implement features
  └─ Integration tests

US3: Password Reset (T029-T035)  [P] Parallel with US2
  Worker 3 (Backend)
  ├─ Write tests first
  ├─ Implement features
  └─ Integration tests
```

**Timeline:**
- Traditional: 3 stories × 2 hours = 6 hours
- BOSS parallel: max(2h, 2h, 2h) = 2 hours

---

## Phase-by-Phase Guide

### Phase 0: Bootstrap

**Action:** BOSS creates `.specify/` structure during project bootstrap

**Command:**
```bash
boss bootstrap --template nextjs-app-turbo --quality production
```

**Created:**
```
.specify/
├── memory/
│   └── constitution.md (template)
├── specs/ (empty, ready for features)
├── scripts/ (all automation scripts)
└── templates/ (all spec-kit templates)
```

**Worker:** None (BOSS direct action)

---

### Phase 1: Constitution

**Purpose:** Establish project governing principles

**Worker:** `architect`

**Input:**
- Bootstrap template
- Quality preset
- Tech stack policy

**Output:**
- `.specify/memory/constitution.md`

**Constitution Sections:**

1. **Architectural Principles** - Component structure, patterns
2. **Interface Requirements** - API design, CLI standards
3. **Development Methodology** - Test-First (NON-NEGOTIABLE)
4. **Testing Standards** - Unit (≥80%), Integration, Mutation (≥80%)
5. **Cross-Cutting Concerns** - Logging, errors, versioning
6. **Technology Stack** - Allowed/prohibited with rationale
7. **Quality Gates** - Pre-commit, CI/CD, security

**Example Constitution:**

```markdown
# Project Constitution

## Development Methodology

### Test-First (NON-NEGOTIABLE)
- All code MUST be written using TDD
- Cycle: Red (write failing test) → Green (make it pass) → Refactor
- No implementation without tests first

## Testing Standards
- Unit test coverage: ≥80%
- Mutation testing score: ≥80%
- Integration tests for all API endpoints
- E2E tests for critical user paths

## Technology Stack

### Allowed
- TypeScript (strict mode)
- Next.js 15 (App Router)
- Prisma ORM
- Vitest (testing)

### Prohibited
- JavaScript (must use TypeScript)
- Jest (use Vitest)
- Class components (use functional)

### Rationale
- TypeScript: Type safety prevents runtime errors
- Vitest: Faster, better DX than Jest
```

**Gate:** None (based on bootstrap config)

---

### Phase 2: Clarification

**Purpose:** Gather business requirements through conversation

**Worker:** `clarifier`

**Role:**
- Ask **business** questions (not technical)
- Understand users and their needs
- Document pain points and workflows

**Questions to Ask:**
- **Who** are the users?
- **What** problems do they face?
- **Why** does this solution matter?
- **How** do they work today?

**NOT to Ask:**
- Technology choices (governed by constitution)
- Architecture patterns (planned later)
- Implementation details (not relevant yet)

**Output:**
- `.specify/specs/000-requirements/clarification.md`

**Example Output:**

```markdown
# Requirement Clarification

## User Personas
- **Team Leads** - Manage 5-10 people, need visibility
- **Team Members** - Execute tasks, need clarity

## Current Workflow
1. Manager assigns tasks verbally
2. Tasks tracked in spreadsheet
3. Status updates in daily standup

## Problems
- Tasks get lost in spreadsheets
- No visibility into progress
- Difficult to track dependencies

## Success Criteria
- 95% of tasks tracked digitally
- Real-time progress visibility
- < 2 minutes to assign a task
```

**Gate:** None (conversational phase)

---

### Phase 3: Specification

**Purpose:** Create formal specification with user stories

**Worker:** `spec-writer`

**Input:**
- Clarification summary
- Constitution
- Knowledge base (similar specs)

**Output:**
- `.specify/specs/001-${feature}/spec.md`

**Spec Structure:**

```markdown
# Feature: Task Management

## Metadata
- Branch: feature/task-management
- Status: Draft
- Created: 2024-01-15

## User Stories

### US1 (P1): Task Creation
As a team lead, I need to create tasks so team members know what to do.

**Priority:** P1 - Foundational feature
**Testing:** Can test task creation independently

**Scenarios:**
- Given valid task data, When I create task, Then task saved with ID
- Given missing title, When I create task, Then error shown
- Given invalid assignee, When I create task, Then validation error

**Edge Cases:**
- Very long task descriptions (>10,000 chars)
- Special characters in title
- Assigning to user not in team

### US2 (P2): Task Assignment
As a team lead, I need to assign tasks to specific members.

**Priority:** P2 - Depends on US1
**Testing:** Can test assignment flow independently

[Scenarios...]

## Requirements

### Functional
- FR-001: System shall support task creation with title, description, assignee
- FR-002: System shall validate assignee exists in team
- FR-003: System shall send notification on assignment

### Non-Functional
- NFR-001: Task creation shall complete in <200ms
- NFR-002: Support 1000 concurrent task creations

## Key Entities
- Task (id, title, description, assignee_id, status, created_at)
- User (id, name, email, team_id)

## Success Criteria
- SC-001: 95% of tasks tracked digitally within 1 week
- SC-002: Task creation takes <2 minutes
- SC-003: 0 lost tasks (100% persistence)
```

**Gate:** **GATE 1 - Human Approval**

BOSS creates PR for review. User approves via GitHub PR review.

---

### Phase 4: Planning

**Purpose:** Create technical implementation plan

**Worker:** `planner`

**Input:**
- Approved spec.md
- Constitution
- Tech stack policy
- Knowledge base (similar plans)

**Output:**
- `.specify/specs/001-${feature}/plan.md`
- `.specify/specs/001-${feature}/data-model.md`
- `.specify/specs/001-${feature}/contracts/`

**Plan Sections:**

1. **Summary** - One-sentence requirement, high-level approach
2. **Technical Context** - 9 key questions answered
3. **Constitution Check** - Validate against each principle
4. **Project Structure** - File organization
5. **Architecture Decisions** - ADRs for major choices
6. **Data Model** - Entity relationships
7. **API Contracts** - OpenAPI specifications

**Technical Context (9 Questions):**

1. Language/Version?
2. Dependencies?
3. Storage?
4. Testing Framework?
5. Target Platform?
6. Project Type?
7. Performance Goals?
8. Constraints?
9. Scale/Scope?

**Example plan.md:**

```markdown
# Implementation Plan: Task Management

## Summary
Enable team leads to create and assign tasks digitally.

Technical Approach: REST API with PostgreSQL, Next.js frontend

## Technical Context

1. **Language:** TypeScript 5.x (from constitution)
2. **Dependencies:** Prisma, Next.js, Vitest
3. **Storage:** PostgreSQL (from tech stack policy)
4. **Testing:** Vitest (from constitution)
5. **Platform:** Web application
6. **Type:** Greenfield feature in existing app
7. **Performance:** <200ms task creation, 1000 concurrent users
8. **Constraints:** Must integrate with existing auth system
9. **Scale:** 10,000 tasks/month initially

## Constitution Check

| Principle | Compliance | Notes |
|-----------|------------|-------|
| Architectural | ✅ | REST API pattern per constitution |
| Test-First | ✅ | TDD planned for all endpoints |
| Tech Stack | ✅ | All allowed technologies |
| Testing Standards | ✅ | Unit + integration + E2E planned |

## Architecture Decisions

### ADR-001: REST vs GraphQL
**Decision:** REST API
**Rationale:**
- Constitution specifies REST
- Simpler for this use case
- Existing auth uses REST
**Alternatives:** GraphQL (more complex, not needed)
**Consequences:** Need versioning strategy

## Data Model

```yaml
Task:
  id: uuid (PK)
  title: string (max 200)
  description: text
  assignee_id: uuid (FK → User)
  status: enum (pending, in_progress, done)
  created_at: timestamp
  updated_at: timestamp

User:
  id: uuid (PK)
  name: string
  email: string
  team_id: uuid (FK → Team)
```

## API Contracts

See `contracts/task-api.yaml` (OpenAPI 3.0)

Key endpoints:
- POST /api/tasks - Create task
- GET /api/tasks/:id - Get task
- PATCH /api/tasks/:id - Update task
- POST /api/tasks/:id/assign - Assign task
```

**Gate:** None (will be validated next phase)

---

### Phase 5: Validation

**Purpose:** Validate plan against constitution

**Worker:** `reviewer`

**Input:**
- plan.md
- constitution.md
- spec.md

**Output:**
- `.specify/specs/001-${feature}/validation-report.md`

**Validation Checklist:**

```markdown
## Architectural Compliance
- [ ] Follows specified architectural approach
- [ ] Component structure adheres to principles
- [ ] Proper separation of concerns

## Test-First Methodology
- [ ] TDD approach clearly defined
- [ ] Test structure planned
- [ ] Coverage goals specified

## Testing Standards
- [ ] Unit tests planned (≥80% coverage)
- [ ] Integration tests defined
- [ ] Mutation testing included (≥80%)

## Technology Stack
- [ ] All dependencies are allowed
- [ ] No prohibited technologies used
- [ ] Rationale provided for choices
```

**Validation Result:**

```yaml
validation_result: PASS | PASS_WITH_WARNINGS | FAIL

compliance:
  architectural: PASS
  interface: PASS
  methodology: PASS
  testing: PASS_WITH_WARNINGS
  tech_stack: PASS
  cross_cutting: PASS

warnings:
  - "Mutation testing setup needs clarification"

violations: []

approved: true
retry_count: 0
```

**Gate:** **AUTO-GATE - Constitution Compliance**

- ✅ **PASS**: Proceed to task breakdown
- ⚠️ **PASS_WITH_WARNINGS**: Proceed with monitoring
- ❌ **FAIL**: Retry (up to 3 times), then escalate to human

---

### Phase 6: Task Breakdown

**Purpose:** Create granular, ordered task list

**Worker:** `planner`

**Input:**
- Approved plan.md
- spec.md (user stories)
- Constitution

**Output:**
- `.specify/specs/001-${feature}/tasks.md`

**Task Format:**

```
[ID] [P?] [Story] Description with file paths

[T001] [P] [SETUP] Initialize PostgreSQL schema
[T002] [P] [SETUP] Configure Prisma client
[T003] [US1] Write failing test: POST /api/tasks returns 201
[T004] [US1] Implement endpoint to make test pass → src/api/tasks/create.ts
```

**Fields:**
- `[ID]` - Unique identifier (T001, T002, ...)
- `[P]` - Parallelization flag (can run parallel)
- `[Story]` - User story (US1, US2) or SETUP, POLISH
- Description - Specific action with file paths

**Phase Structure:**

```markdown
## Phase 1: Setup [P]
All tasks can run in parallel

[T001] [P] [SETUP] Initialize PostgreSQL schema with Task table
[T002] [P] [SETUP] Configure Prisma client → src/lib/prisma.ts
[T003] [P] [SETUP] Set up test database with Docker
[T004] [P] [SETUP] Configure API error handling → src/api/middleware/errors.ts

## Phase 2: Foundation
Sequential - each builds on previous

[T005] [FOUNDATION] Create Task model → src/models/task.ts
[T006] [FOUNDATION] Create API contract tests → tests/contracts/task.test.ts

## Phase 3: User Story 1 - Task Creation
Sequential TDD cycle

# Tests (write first)
[T007] [US1] Write failing test: POST /api/tasks with valid data returns 201
[T008] [US1] Write failing test: POST /api/tasks with missing title returns 400
[T009] [US1] Write failing test: POST /api/tasks with invalid assignee returns 404

# Implementation (make tests pass)
[T010] [US1] Implement create endpoint → src/api/tasks/create.ts
     Dependencies: T007, T008, T009
[T011] [US1] Implement task validation service → src/services/task.service.ts
     Dependencies: T010
[T012] [US1] Integration test: Full task creation flow
     Dependencies: T010, T011

## Phase 4: User Story 2 - Task Assignment [P]
Can run parallel with US1

[T013] [P] [US2] Write failing test: POST /api/tasks/:id/assign
[T014] [P] [US2] Implement assign endpoint → src/api/tasks/assign.ts
[T015] [P] [US2] Integration test: Assignment flow

## Dependencies

dependencies:
  T010:  # Create endpoint
    depends_on: [T007, T008, T009]  # All tests first
  T012:  # Integration
    depends_on: [T010, T011]  # All implementation done
```

**Parallelization Rules:**

Tasks marked `[P]` can run parallel IF:
1. No dependencies on each other
2. Work on different files
3. Independently testable

**Gate:** None (plan was approved)

---

### Phase 7: Implementation

**Purpose:** Execute tasks with TDD methodology

**Workers:** `developer-frontend`, `developer-backend`, `developer-fullstack`

**Parallelization Logic:**

```typescript
// BOSS analyzes tasks.md for parallel execution

const executionPlan = {
  phase1_setup: {
    tasks: [T001, T002, T003, T004],
    parallel: true,          // All marked [P]
    workers: 4
  },

  phase3_us1: {
    tasks: [T007-T012],
    parallel: false,         // TDD - sequential
    workers: 1,
    worker_type: 'developer-backend'
  },

  phase4_us2: {
    tasks: [T013-T015],
    parallel: true,          // Can run with US1
    workers: 1,
    worker_type: 'developer-backend'
  }
};
```

**TDD Cycle (Example: US1):**

```typescript
// 1. Write failing test [T007]
describe('POST /api/tasks', () => {
  it('creates task with valid data', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test task',
        description: 'Test description',
        assignee_id: testUser.id
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
// Run: ❌ FAIL (endpoint doesn't exist)

// 2. Write more failing tests [T008, T009]
// All tests fail

// 3. Implement to make tests pass [T010]
export async function createTask(req: Request, res: Response) {
  const { title, description, assignee_id } = req.body;

  const task = await prisma.task.create({
    data: { title, description, assignee_id }
  });

  return res.status(201).json(task);
}
// Run: ✅ PASS (basic test passes)

// 4. Add validation [T011]
export async function validateTask(data: TaskInput) {
  if (!data.title) throw new Error('Title required');
  // ... more validation
}
// Run: ✅ ALL PASS

// 5. Integration test [T012]
// Tests full flow with real database
// Run: ✅ PASS
```

**Quality Gate (Per Worker):**

```
Quality Gate: US1 Implementation

Running checks...
  ✅ TypeCheck: 0 errors
  ✅ Lint: 0 warnings
  ✅ Tests: 24/24 passing
  ✅ Coverage: 87% (required: 80%)
  ✅ Mutation: 82% (required: 80%)
  ✅ Security: 0 vulnerabilities
  ✅ Build: successful

Quality Gate: PASSED ✅

Creating PR #2: User Story 1 - Task Creation
```

**Gate:** Automatic per worker (must pass before PR)

---

### Phase 8: Consolidation

**Purpose:** Merge all work and create final artifacts

**Worker:** `consolidator`

**Input:**
- All worker PRs
- tasks.md
- Constitution

**Tasks:**

1. **Merge Branches**
   ```bash
   git checkout -b integration/run_001
   git merge container-use/worker_001  # US1
   git merge container-use/worker_002  # US2
   # Resolve conflicts if any
   ```

2. **Integration Tests**
   ```typescript
   // Test complete system
   describe('Complete Task Management', () => {
     it('supports full task lifecycle', async () => {
       // Create task
       const createRes = await request(app)
         .post('/api/tasks')
         .send({ title: 'Test', assignee_id: user.id });

       // Assign task
       const assignRes = await request(app)
         .post(`/api/tasks/${createRes.body.id}/assign`)
         .send({ assignee_id: newUser.id });

       // Verify in database
       const task = await prisma.task.findUnique({
         where: { id: createRes.body.id }
       });
       expect(task.assignee_id).toBe(newUser.id);
     });
   });
   ```

3. **Create Final Artifacts**

   **quickstart.md:**
   ```markdown
   # Task Management - Quick Start

   ## Prerequisites
   - Node.js 22+
   - PostgreSQL 16

   ## Setup
   1. `pnpm install`
   2. Copy `.env.example` to `.env`
   3. `pnpm prisma migrate dev`
   4. `pnpm dev`

   ## Test
   ```bash
   curl -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Test task","assignee_id":"..."}'
   ```

   Expected: `{"id":"...","title":"Test task",...}`
   ```

   **checklist.md:**
   ```markdown
   # Quality Checklist

   ## Code Quality
   - [x] TypeScript strict mode
   - [x] ESLint passing (0 errors)
   - [x] No `any` types

   ## Testing
   - [x] Unit tests: 47/47 passing
   - [x] Integration: 12/12 passing
   - [x] E2E: 5/5 passing
   - [x] Coverage: 89% (≥80%)
   - [x] Mutation: 84% (≥80%)

   ## Security
   - [x] npm audit: 0 vulnerabilities
   - [x] Input validation on all endpoints
   - [x] SQL injection prevention (Prisma)

   ## Documentation
   - [x] API documented (OpenAPI)
   - [x] README complete
   - [x] Quickstart guide
   ```

4. **Final Quality Gate**
   ```bash
   pnpm typecheck      # ✅
   pnpm lint           # ✅
   pnpm test           # ✅ 64 tests
   pnpm coverage       # ✅ 89%
   pnpm mutation       # ✅ 84%
   pnpm build          # ✅
   ```

5. **Create Main PR**
   ```
   PR #7: Complete Task Management Feature

   Summary:
   - 2 user stories implemented
   - 24 tasks completed
   - 64 tests (all passing)
   - 89% coverage
   - 84% mutation score

   Individual PRs:
   - PR #2: Task Creation ✅
   - PR #3: Task Assignment ✅

   Documentation:
   - Quickstart: .specify/specs/001-tasks/quickstart.md
   - Checklist: .specify/specs/001-tasks/checklist.md

   Preview: https://my-app-pr7.vercel.app
   ```

**Gate:** **GATE 2 - Human Review**

User reviews PR with all artifacts and approves.

---

## Worker Implementation

### Worker Selection

BOSS selects workers based on task requirements:

```typescript
function selectWorker(task: Task): WorkerType {
  const skills = analyzeTaskSkills(task);

  const hasReact = skills.includes('react');
  const hasNode = skills.includes('nodejs');
  const hasDB = skills.includes('database');

  if (hasReact && hasNode) return 'developer-fullstack';
  if (hasReact) return 'developer-frontend';
  if (hasNode || hasDB) return 'developer-backend';

  return 'developer-fullstack';  // Default
}

function analyzeTaskSkills(task: Task): string[] {
  const skills = [];

  if (task.filePath?.includes('components/')) {
    skills.push('react', 'nextjs', 'tailwind');
  }

  if (task.filePath?.includes('api/')) {
    skills.push('nodejs', 'api-design');
  }

  if (task.filePath?.includes('models/')) {
    skills.push('database', 'prisma');
  }

  return skills;
}
```

### Worker Prompts

Each worker receives detailed context:

```markdown
# Developer - User Story 1: Task Creation

## Context
- Feature: Task Management
- Spec: [spec.md content]
- Plan: [plan.md content]
- Tasks: T007-T012
- Constitution: [constitution principles]
- Similar code: [patterns from knowledge base]

## Your Tasks (TDD Cycle)

### 1. Write Tests FIRST [T007-T009]
[Failing test examples...]

### 2. Implement [T010-T011]
[Implementation to make tests pass...]

### 3. Integration Test [T012]
[Full flow test...]

### 4. Checkpoint
- [ ] All tests passing
- [ ] Coverage ≥ 80%
- [ ] Can deploy independently
- [ ] Mutation score ≥ 80%

## Constitution Compliance
- ✅ Test-First (NON-NEGOTIABLE)
- ✅ TDD Cycle: Red → Green → Refactor
- ✅ Coverage ≥ 80%
- ✅ Allowed tech stack only

## Output
When complete:
1. Create PR
2. Include test results
3. Link to spec/tasks
```

---

## Quality Gates

### Gate Types

| Gate | Type | Phase | Trigger |
|------|------|-------|---------|
| **Gate 1** | Human | After Specification | Manual PR approval |
| **Auto-Gate** | Automated | After Validation | Automatic (3 retries) |
| **Worker Gates** | Automated | During Implementation | Per worker completion |
| **Gate 2** | Human | After Consolidation | Manual PR approval |

### Quality Checks

**Every Worker Must Pass:**

```yaml
TypeCheck:
  command: pnpm typecheck
  threshold: 0 errors

Lint:
  command: pnpm lint
  threshold: 0 errors, 0 warnings

Tests:
  command: pnpm test
  threshold: 100% passing

Coverage:
  command: pnpm coverage
  threshold: ≥ 80%

Mutation:
  command: pnpm mutation
  threshold: ≥ 80%

Security:
  command: pnpm audit
  threshold: 0 high/critical vulnerabilities

Build:
  command: pnpm build
  threshold: successful
```

### Retry Strategy

```
Worker fails quality gate
  ↓
Analyze failure:
- What checks failed?
- Why did they fail?
- What needs improvement?
  ↓
Create improved prompt:
"PREVIOUS ATTEMPT FAILED:
- Coverage was 76% (need ≥80%)
- Missing tests for error cases

THIS TIME:
- Write tests for all edge cases
- Test error handling thoroughly
- Aim for 85%+ coverage"
  ↓
Delete failed environment
  ↓
Spawn NEW worker with improved prompt
  ↓
Retry (max 3 attempts)
  ↓
Still failing?
  → Escalate to human
```

---

## Reference

### Complete Artifact List

```
Phase 0: Bootstrap
├─ .specify/memory/ (directory)
├─ .specify/specs/ (directory)
├─ .specify/scripts/ (automation)
└─ .specify/templates/ (spec-kit templates)

Phase 1: Constitution
└─ .specify/memory/constitution.md

Phase 2: Clarification
└─ .specify/specs/000-requirements/clarification.md

Phase 3: Specification
└─ .specify/specs/001-feature/spec.md

Phase 4: Planning
├─ .specify/specs/001-feature/plan.md
├─ .specify/specs/001-feature/data-model.md
├─ .specify/specs/001-feature/contracts/
└─ .specify/specs/001-feature/research.md (if needed)

Phase 5: Validation
└─ .specify/specs/001-feature/validation-report.md

Phase 6: Task Breakdown
└─ .specify/specs/001-feature/tasks.md

Phase 7: Implementation
├─ src/ (implementation code)
├─ tests/ (test code)
└─ Multiple PRs (one per worker)

Phase 8: Consolidation
├─ .specify/specs/001-feature/quickstart.md
├─ .specify/specs/001-feature/checklist.md
└─ Main PR (consolidated)
```

### Spec-Kit Principles Enforced

| Principle | How BOSS Enforces |
|-----------|-------------------|
| **Specifications executable** | spec.md drives entire implementation |
| **Test-First mandatory** | Constitution enforces, quality gates verify |
| **Multi-step refinement** | 8 sequential phases |
| **Independent testability** | Checkpoints in each user story |
| **Dependency-ordered** | tasks.md with explicit dependencies |
| **Parallelization** | `[P]` markers → parallel workers |
| **Constitution governs** | All phases validated against constitution |
| **Human governance** | Strategic gates (planning, review) |

### Key Innovations

1. **Automated Phase Progression**
   - Traditional: Manual `/speckit.*` commands
   - BOSS: Automatic worker progression

2. **Parallel Execution**
   - Traditional: Sequential by single dev
   - BOSS: Multiple workers based on `[P]` markers

3. **Knowledge Base**
   - Traditional: Each project from scratch
   - BOSS: Learn from similar projects

4. **Constitutional Compliance**
   - Traditional: Manual validation
   - BOSS: Automated with retry

5. **Quality Gates**
   - Traditional: Manual checks
   - BOSS: Automated (type/lint/test/coverage/mutation)

6. **Cross-Project Learning**
   - Traditional: Patterns stay in project
   - BOSS: All indexed in knowledge base

### Benefits Summary

1. **Consistency** - Every project follows same structure
2. **Quality** - Constitution enforced automatically
3. **Speed** - Parallel workers finish faster
4. **Learning** - Knowledge compounds across projects
5. **Traceability** - Complete audit trail (spec → code)
6. **Reproducibility** - Can replay from artifacts
7. **Governance** - Human approval at strategic points
8. **Automation** - Remove toil, keep oversight

### Task Format Reference

```
[ID] [P?] [Story] Description with file paths

Components:
- [T001]     → Unique task identifier
- [P]        → Parallel flag (optional)
- [SETUP]    → Story tag (SETUP, US1, US2, POLISH, FOUNDATION)
- Initialize → Action description
- → path.ts  → File path (optional but recommended)

Examples:
[T001] [P] [SETUP] Initialize database → prisma/schema.prisma
[T005] [US1] Write failing test → tests/api/tasks.test.ts
[T006] [US1] Implement endpoint → src/api/tasks.ts
[T010] [P] [US2] Write tests → tests/api/assign.test.ts
[T015] [POLISH] Add documentation → docs/api.md
```

### Dependencies Format

```yaml
dependencies:
  T006:  # Task ID
    depends_on: [T005]  # Must complete T005 first

  T012:  # Integration test
    depends_on: [T006, T007, T008]  # All implementation done
```

---

## Summary

**BOSS + Spec-Kit provides automated, spec-driven development:**

1. ✅ **8 Automated Phases** - From constitution to consolidation
2. ✅ **Parallel Execution** - Based on `[P]` markers in tasks
3. ✅ **TDD Enforced** - Tests before implementation (non-negotiable)
4. ✅ **Quality Gates** - Automated validation at every phase
5. ✅ **Knowledge Base** - Learn from similar projects
6. ✅ **Human Governance** - Approval at strategic decision points
7. ✅ **Complete Traceability** - Audit trail from spec to code
8. ✅ **Constitutional Compliance** - All work validated against principles

**Spec-Kit provides the methodology. BOSS makes it autonomous.** 🚀

---

**Next:** See [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md) for how workers execute securely in isolated environments with secret management.
