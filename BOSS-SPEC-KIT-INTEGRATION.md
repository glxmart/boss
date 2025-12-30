# BOSS + Spec-Kit Integration

## How BOSS Leverages Spec-Kit for Automation

This document details how BOSS (Business-Orchestrated Software System) integrates GitHub's Spec-Kit methodology to automate the complete software development lifecycle.

---

## Spec-Kit Overview

**Spec-Kit** is GitHub's open-source toolkit for "Spec-Driven Development" - a methodology that treats specifications as executable, foundational artifacts rather than temporary scaffolding.

### Spec-Kit's Seven Phases

```
1. Principles      → Establish governing guidelines (constitution)
2. Specifications  → Document what to build (not how)
3. Clarification   → Resolve ambiguities
4. Planning        → Define technical approach
5. Validation      → Audit completeness
6. Task Breakdown  → Create dependency-ordered tasks with [P]arallel markers
7. Implementation  → Execute with TDD
```

### Spec-Kit Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project governing principles (NON-NEGOTIABLE)
│
├── specs/
│   └── 001-feature-name/        # Each feature gets a directory
│       ├── spec.md              # User stories & acceptance criteria
│       ├── plan.md              # Technical implementation strategy
│       ├── tasks.md             # Granular task breakdown with [P] markers
│       ├── research.md          # Technology research & validation
│       ├── data-model.md        # Database schema & entities
│       ├── contracts/           # API specs & integration contracts
│       ├── quickstart.md        # Setup & running instructions
│       └── checklist.md         # Quality validation criteria
│
├── scripts/
│   ├── check-prerequisites.sh   # Environment validation
│   ├── common.sh                # Shared utilities
│   ├── create-new-feature.sh    # Feature scaffolding
│   ├── setup-plan.sh            # Plan initialization
│   └── update-claude-md.sh      # CLAUDE.md sync
│
└── templates/
    ├── spec-template.md
    ├── plan-template.md
    ├── tasks-template.md
    ├── checklist-template.md
    └── commands/                # Command templates
```

### Spec-Kit Slash Commands

```
/speckit.constitution    # Establish project principles
/speckit.specify         # Define requirements & user stories
/speckit.clarify         # Resolve specification ambiguities
/speckit.plan            # Create technical implementation strategy
/speckit.analyze         # Validate consistency across artifacts
/speckit.tasks           # Generate ordered task breakdown
/speckit.implement       # Execute implementation
/speckit.checklist       # Create quality validation criteria
```

---

## How BOSS Automates Spec-Kit

BOSS transforms Spec-Kit from a **manual methodology** into a **fully automated orchestration system**.

### The BOSS + Spec-Kit Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                    BOSS Controller                           │
│                  (Orchestrates Everything)                   │
└────────────┬─────────────────────────────────────────────────┘
             │
             ├─► Phase 0: Bootstrap
             │   └─► Creates .specify/ structure with templates
             │
             ├─► Phase 1: Constitution (Worker: Architect)
             │   └─► Creates memory/constitution.md
             │
             ├─► Phase 2: Clarification (Worker: Clarifier)
             │   └─► Asks business questions, gathers requirements
             │
             ├─► Phase 3: Specification (Worker: Spec-Writer)
             │   └─► Creates specs/001-feature/spec.md
             │
             ├─► [GATE 1: Human Approval]
             │   └─► User reviews spec.md
             │
             ├─► Phase 4: Planning (Worker: Planner)
             │   └─► Creates plan.md, data-model.md, contracts/
             │
             ├─► Phase 5: Validation (Worker: Reviewer)
             │   └─► Validates against constitution.md
             │
             ├─► [AUTO-GATE: Constitution Compliance]
             │   └─► Automatic check (up to 3 retries)
             │
             ├─► Phase 6: Task Breakdown (Worker: Planner)
             │   └─► Creates tasks.md with [P] parallelization markers
             │
             ├─► Phase 7: Implementation (Workers: Developers)
             │   ├─► Launches parallel workers based on [P] markers
             │   ├─► Each worker implements with TDD
             │   └─► Creates quickstart.md, checklist.md
             │
             ├─► Phase 8: Consolidation (Worker: Consolidator)
             │   └─► Merges branches, runs integration tests
             │
             └─► [GATE 2: Human Review]
                 └─► User reviews PR with all artifacts
```

---

## Phase-by-Phase Integration

### Phase 0: Bootstrap

**BOSS Action:** Creates complete .specify/ structure during project bootstrap

```bash
boss bootstrap --template nextjs-app-turbo --quality production

# Creates:
.specify/
├── memory/
│   └── constitution.md (from template)
├── specs/ (empty, ready for features)
├── scripts/ (all spec-kit scripts)
└── templates/ (all spec-kit templates)
```

**Worker:** None (BOSS direct action)

**Artifacts:**
- Empty `.specify/` structure
- Constitution template
- All spec-kit scripts
- All spec-kit templates

---

### Phase 1: Constitution

**BOSS Action:** Spawns Architect worker to establish project constitution

**Worker:** `architect`

**Worker Prompt:**
```markdown
# Constitution Architect

You are establishing the project constitution based on the bootstrap configuration.

## Your Task

Create `.specify/memory/constitution.md` following the spec-kit constitution template.

## Input Context

- Bootstrap template: ${template}
- Quality preset: ${quality_preset}
- Tech stack policy: ${tech_stack_policy}
- Project type: ${project_type}

## Required Sections

1. **Architectural Principles**
   - Based on project type (web app, API, CLI, etc.)
   - Component structure (library-first, modular, etc.)

2. **Interface Requirements**
   - API patterns (REST, GraphQL, gRPC)
   - CLI interface standards
   - Frontend patterns

3. **Development Methodology**
   - Test-First (NON-NEGOTIABLE)
   - TDD cycle: red → green → refactor
   - Human approval between test definition and implementation

4. **Testing Standards**
   - Unit testing (≥80% coverage)
   - Integration testing (contract validation)
   - Mutation testing (≥80% score)
   - E2E testing (critical paths)

5. **Cross-Cutting Concerns**
   - Logging (structured)
   - Error handling patterns
   - Versioning (MAJOR.MINOR.BUILD)
   - Simplicity (YAGNI principles)

6. **Technology Stack**
   - Allowed technologies: ${allowed_stack}
   - Prohibited technologies: ${prohibited_stack}
   - Rationale for each decision

7. **Quality Gates**
   - Pre-commit hooks
   - CI/CD requirements
   - Security scanning
   - Performance benchmarks

## Output

Create `memory/constitution.md` with all sections populated based on the bootstrap configuration.

This constitution is **NON-NEGOTIABLE** and will govern all future development.
```

**Artifacts Created:**
- `.specify/memory/constitution.md`

**No Gate:** Constitution is based on bootstrap config (pre-approved)

---

### Phase 2: Clarification

**BOSS Action:** Spawns Clarifier worker to gather business requirements

**Worker:** `clarifier`

**Worker Prompt:**
```markdown
# Business Clarifier

You gather business requirements through conversation, NOT technical decisions.

## Your Role

Ask questions to understand:
- **Who** are the users?
- **What** problems do they face?
- **Why** does this solution matter?
- **How** do they work today?

DO NOT ask about:
- Technology choices (governed by constitution)
- Architecture patterns (will be planned later)
- Implementation details (not your concern)

## Conversation Structure

1. Start with: "Tell me about your users and their needs"
2. Ask follow-up questions about:
   - User personas
   - Workflows
   - Pain points
   - Success criteria
3. Summarize understanding
4. Confirm with user

## Output

Create a summary document with:
- User personas
- Current workflow
- Problems to solve
- Success criteria
- Business constraints

This will be input for the Specification phase.
```

**Artifacts Created:**
- `.specify/specs/000-requirements/clarification.md`

**No Gate:** Conversational phase, no approval needed

---

### Phase 3: Specification

**BOSS Action:** Spawns Spec-Writer worker to create spec.md

**Worker:** `spec-writer`

**Input:**
- Clarification summary
- Constitution.md
- Knowledge base (similar specs from other projects)

**Worker Prompt:**
```markdown
# Specification Writer

You create feature specifications following the spec-kit spec-template.md.

## Input

- Clarification summary: ${clarification_summary}
- Constitution: ${constitution}
- Similar specs from knowledge base: ${similar_specs}

## Your Task

Create `.specify/specs/001-${feature_name}/spec.md` following this structure:

### 1. Metadata
- Feature Branch: feature/${feature_name}
- Created: ${date}
- Status: Draft
- Input: From clarification phase

### 2. User Scenarios & Testing

For each user journey, create:

**User Story** (P1, P2, P3 priority)
- Journey description in plain language
- Priority justification
- Independent testing approach
- Acceptance scenarios (Given/When/Then)

Example:
```
**US1 (P1): User Authentication**
As a team member, I need to log in securely so I can access team tasks.

Priority: P1 - Blocks all other features
Testing: Can deploy and test login flow independently

Scenarios:
- Given valid credentials, When user logs in, Then dashboard loads
- Given invalid password, When user logs in, Then error message shown
- Given unverified email, When user logs in, Then verification prompt shown
```

Include **Edge Cases** subsection for boundary conditions.

### 3. Requirements

**Functional Requirements**
- FR-001: System shall support email/password authentication
- FR-002: System shall send verification emails
- FR-003: System shall rate-limit failed login attempts
- [NEEDS CLARIFICATION: Session timeout duration?]

**Key Entities**
- User (id, email, password_hash, verified, created_at)
- Session (id, user_id, token, expires_at)

### 4. Success Criteria

**Measurable Outcomes**
- SC-001: 95% of users can log in within 3 seconds
- SC-002: Zero security vulnerabilities in auth flow
- SC-003: 99.9% uptime for auth service

## Constitution Compliance

Ensure the spec:
- Follows architectural principles from constitution
- Respects technology constraints
- Adheres to quality standards
- Aligns with development methodology

## Output

Create complete `spec.md` with all sections populated.
Each user story MUST be independently testable and deployable.
```

**Artifacts Created:**
- `.specify/specs/001-${feature_name}/spec.md`

**Gate:** **GATE 1 - Human Approval**

```
BOSS: 🚦 GATE 1: Specification Approval

I've created a complete specification for ${feature_name}:

📄 Specification:
   - ${user_story_count} user stories
   - ${requirement_count} functional requirements
   - ${entity_count} key entities
   - ${success_criteria_count} success criteria

Review the specification:
👉 .specify/specs/001-${feature_name}/spec.md

I've also created a PR for review:
👉 PR #1: Specification for ${feature_name}

And a Plane task:
👉 TASK-001: Review Specification

Please approve to proceed with planning!
```

---

### Phase 4: Planning

**BOSS Action:** Spawns Planner worker to create technical plan

**Worker:** `planner`

**Input:**
- Approved spec.md
- Constitution.md
- Tech stack policy
- Knowledge base (similar plans, architectural patterns)

**Worker Prompt:**
```markdown
# Technical Planner

You create technical implementation plans following spec-kit plan-template.md.

## Input

- Specification: ${spec_md}
- Constitution: ${constitution}
- Tech stack policy: ${tech_stack_policy}
- Similar plans: ${similar_plans}
- Architectural patterns: ${arch_patterns}

## Your Task

Create `.specify/specs/001-${feature_name}/plan.md` following this structure:

### 1. Header
- Branch: feature/${feature_name}
- Date: ${date}
- Spec: Link to spec.md
- Input: Approved specification

### 2. Summary
- Primary requirement (one sentence)
- Technical approach (high-level)

### 3. Technical Context

Answer these 9 questions:

1. **Language/Version**: ${language} ${version} (from tech stack policy)
2. **Dependencies**: ${dependencies} (check constitution for allowed packages)
3. **Storage**: ${database} (from tech stack policy)
4. **Testing Framework**: ${test_framework} (from constitution)
5. **Target Platform**: ${platform} (web, mobile, CLI, API)
6. **Project Type**: ${project_type} (greenfield, brownfield, enhancement)
7. **Performance Goals**: ${performance_goals} (from spec success criteria)
8. **Constraints**: ${constraints} (from constitution and spec)
9. **Scale/Scope**: ${scale} (users, data, requests)

### 4. Constitution Check

Validate plan against constitution:

| Principle | Compliance | Notes |
|-----------|------------|-------|
| Architectural approach | ✅ | Follows library-first pattern |
| Interface requirements | ✅ | REST API per constitution |
| Test-first methodology | ✅ | TDD cycle planned |
| Testing standards | ⚠️  | Need mutation testing setup |
| Tech stack | ✅ | All allowed technologies |

If any ⚠️ or ❌, document in Complexity Tracking section with:
- Violation type
- Necessity rationale
- Rejected alternatives

### 5. Project Structure

**Documentation**
```
.specify/specs/001-${feature_name}/
├── spec.md              ✅ Complete
├── plan.md              ← You're creating this
├── tasks.md             ← Next phase
├── research.md          ← Create if needed
├── data-model.md        ← Create now
├── quickstart.md        ← Implementation phase
├── checklist.md         ← Implementation phase
└── contracts/           ← Create API specs now
    └── auth-api.yaml
```

**Source Code** (choose based on project type)

For Web Application:
```
src/
├── backend/
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── api/            # API routes
│   └── lib/            # Utilities
├── frontend/
│   ├── components/     # React components
│   ├── pages/          # Next.js pages
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilities
└── shared/
    └── types/          # Shared TypeScript types
```

### 6. Architecture Decisions

For each major decision, create an ADR:

**ADR-001: Authentication Strategy**
- Decision: JWT tokens with httpOnly cookies
- Rationale: Balance security and UX
- Alternatives considered: Session-based, OAuth only
- Consequences: Need token refresh mechanism

### 7. Data Model Design

Create `data-model.md`:

```yaml
entities:
  User:
    attributes:
      id: uuid (PK)
      email: string (unique, indexed)
      password_hash: string
      verified: boolean
      created_at: timestamp
    relationships:
      sessions: hasMany(Session)

  Session:
    attributes:
      id: uuid (PK)
      user_id: uuid (FK)
      token: string (unique)
      expires_at: timestamp
    relationships:
      user: belongsTo(User)
```

### 8. API Contracts

Create `contracts/auth-api.yaml` (OpenAPI):

```yaml
openapi: 3.0.0
info:
  title: Auth API
  version: 1.0.0

paths:
  /auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: string
                password: string
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: string
                  user: object
        401:
          description: Invalid credentials
```

## Constitution Compliance Check

Before completing the plan:
1. Verify all technology choices against tech stack policy
2. Confirm testing approach follows Test-First methodology
3. Validate architecture against principles
4. Document any violations with rationale

## Output

Create complete `plan.md`, `data-model.md`, and `contracts/` directory.
```

**Artifacts Created:**
- `.specify/specs/001-${feature_name}/plan.md`
- `.specify/specs/001-${feature_name}/data-model.md`
- `.specify/specs/001-${feature_name}/contracts/auth-api.yaml`
- `.specify/specs/001-${feature_name}/research.md` (if needed)

---

### Phase 5: Validation

**BOSS Action:** Spawns Reviewer worker to validate plan against constitution

**Worker:** `reviewer`

**Input:**
- plan.md
- constitution.md
- spec.md

**Worker Prompt:**
```markdown
# Plan Reviewer

You validate the technical plan against the project constitution.

## Input

- Plan: ${plan_md}
- Constitution: ${constitution}
- Spec: ${spec_md}

## Your Task

Validate the plan against each constitutional principle:

### 1. Architectural Compliance
- [ ] Follows specified architectural approach
- [ ] Component structure adheres to principles
- [ ] Proper separation of concerns

### 2. Interface Requirements
- [ ] API design matches constitutional standards
- [ ] Error handling follows patterns
- [ ] Response formats are consistent

### 3. Test-First Methodology
- [ ] TDD approach clearly defined
- [ ] Test structure planned
- [ ] Coverage goals specified

### 4. Testing Standards
- [ ] Unit tests planned (≥80% coverage)
- [ ] Integration tests defined
- [ ] Mutation testing included (≥80%)
- [ ] E2E tests for critical paths

### 5. Technology Stack
- [ ] All dependencies are allowed
- [ ] No prohibited technologies used
- [ ] Rationale provided for choices

### 6. Cross-Cutting Concerns
- [ ] Logging strategy defined
- [ ] Error handling patterns specified
- [ ] Versioning approach documented
- [ ] Simplicity maintained (YAGNI)

### 7. Quality Gates
- [ ] Pre-commit hooks planned
- [ ] CI/CD pipeline defined
- [ ] Security scanning included
- [ ] Performance benchmarks set

## Validation Levels

**PASS** ✅
- All constitutional principles followed
- Plan can proceed to task breakdown

**PASS WITH WARNINGS** ⚠️
- Minor deviations documented with rationale
- Alternatives considered and rejected
- Plan can proceed with monitoring

**FAIL** ❌
- Constitutional violations without justification
- Missing critical components
- Plan must be revised

## Output

Validation report:
```yaml
validation_result: PASS | PASS_WITH_WARNINGS | FAIL

compliance:
  architectural: PASS
  interface: PASS
  methodology: PASS
  testing: PASS_WITH_WARNINGS
  tech_stack: PASS
  cross_cutting: PASS
  quality_gates: PASS

warnings:
  - "Mutation testing setup needs clarification in tasks phase"

violations: []

recommendations:
  - "Consider adding performance monitoring to logging strategy"
  - "Add security headers to API contract"

approved: true
retry_count: 0
```

If FAIL: Provide specific feedback for Planner to revise.
```

**Artifacts Created:**
- `.specify/specs/001-${feature_name}/validation-report.md`

**Gate:** **AUTO-GATE - Constitution Compliance**

```
BOSS: 🤖 AUTO-GATE: Constitution Compliance Check

Running automated validation...

Result: ✅ PASSED (with 1 warning)

Compliance Report:
  ✅ Architectural principles: PASS
  ✅ Interface requirements: PASS
  ✅ Test-first methodology: PASS
  ⚠️  Testing standards: PASS_WITH_WARNINGS
      └─ Mutation testing setup needs clarification
  ✅ Technology stack: PASS
  ✅ Cross-cutting concerns: PASS
  ✅ Quality gates: PASS

Recommendations:
  - Add performance monitoring to logging strategy
  - Add security headers to API contract

Proceeding to task breakdown phase...
```

**If FAIL:** Retry up to 3 times with feedback, then escalate to human.

---

### Phase 6: Task Breakdown

**BOSS Action:** Spawns Planner worker to create tasks.md

**Worker:** `planner`

**Input:**
- Approved plan.md
- spec.md (user stories)
- constitution.md

**Worker Prompt:**
```markdown
# Task Breakdown Specialist

You create granular, ordered task breakdowns following spec-kit tasks-template.md.

## Input

- Plan: ${plan_md}
- Spec: ${spec_md}
- Constitution: ${constitution}
- Similar task breakdowns: ${similar_tasks}

## Your Task

Create `.specify/specs/001-${feature_name}/tasks.md` following this structure:

### Metadata
- Description: Task breakdown for ${feature_name}
- Input: plan.md, spec.md
- Prerequisites: Environment setup, dependencies installed

### Task Format

Each task follows this format:

```
[ID] [P?] [Story] Description with specific file paths

Examples:
[T001] [P] [SETUP] Initialize PostgreSQL schema with User and Session tables
[T002] [P] [SETUP] Configure Prisma client with connection pooling
[T003] [US1] Write failing test for POST /auth/login with valid credentials
[T004] [US1] Implement login endpoint to make test pass → src/api/auth/login.ts
```

**Fields:**
- `[ID]`: Unique identifier (T001, T002, ...)
- `[P]`: Parallelization flag (can run in parallel with other [P] tasks)
- `[Story]`: User story reference (US1, US2, ...) or SETUP, POLISH
- Description: Specific implementation detail with file paths

### Phase Structure

#### Phase 1: Setup [P] (Non-blocking infrastructure)

```
[T001] [P] [SETUP] Initialize PostgreSQL schema with User and Session tables
[T002] [P] [SETUP] Configure Prisma client with connection pooling
[T003] [P] [SETUP] Set up JWT token generation utility → src/lib/jwt.ts
[T004] [P] [SETUP] Configure bcrypt for password hashing → src/lib/password.ts
[T005] [P] [SETUP] Set up test database with Docker Compose
```

All Phase 1 tasks marked [P] - can run in parallel.

#### Phase 2: Foundation (MUST complete before user stories)

```
[T006] [FOUNDATION] Create User model with Prisma → src/models/user.ts
[T007] [FOUNDATION] Create Session model with Prisma → src/models/session.ts
[T008] [FOUNDATION] Write contract tests for auth API → tests/contracts/auth.test.ts
[T009] [FOUNDATION] Set up API error handling middleware → src/api/middleware/errors.ts
```

Sequential execution - each builds on previous.

#### Phase 3: User Story 1 - User Authentication

**Goal:** Users can log in with email/password

**Independent Test:** Can deploy auth service standalone and test login flow

**Tasks:**

```
# Tests (TDD - write first)
[T010] [US1] Write failing test: POST /auth/login with valid credentials returns 200 + token
[T011] [US1] Write failing test: POST /auth/login with invalid password returns 401
[T012] [US1] Write failing test: POST /auth/login with unverified email returns 403
[T013] [US1] Write failing test: Rate limiting after 5 failed attempts

# Implementation (make tests pass)
[T014] [US1] Implement login endpoint → src/api/auth/login.ts
     Dependencies: T010, T011, T012, T013
[T015] [US1] Implement user lookup by email → src/services/user.service.ts
     Dependencies: T014
[T016] [US1] Implement password verification → src/services/auth.service.ts
     Dependencies: T015
[T017] [US1] Implement JWT token generation on successful login
     Dependencies: T016
[T018] [US1] Implement rate limiting with Redis → src/middleware/rate-limit.ts
     Dependencies: T013

# Integration
[T019] [US1] Integration test: Full login flow with database
     Dependencies: T014-T018

# Checkpoint
[T020] [US1] Verify: Can deploy auth service and test login independently
```

#### Phase 4: User Story 2 - User Registration [P]

**Note:** Can run in parallel with US1 (marked [P])

```
# Tests
[T021] [P] [US2] Write failing test: POST /auth/register with valid data creates user
[T022] [P] [US2] Write failing test: POST /auth/register with duplicate email returns 409
[T023] [P] [US2] Write failing test: Email verification sent on registration

# Implementation
[T024] [P] [US2] Implement registration endpoint → src/api/auth/register.ts
     Dependencies: T021, T022, T023
[T025] [P] [US2] Implement user creation service → src/services/user.service.ts
     Dependencies: T024
[T026] [P] [US2] Implement email verification service → src/services/email.service.ts
     Dependencies: T025
[T027] [P] [US2] Integration test: Full registration flow
     Dependencies: T024-T026

# Checkpoint
[T028] [P] [US2] Verify: Registration works independently
```

#### Phase 5: User Story 3 - Password Reset [P]

```
# Tests
[T029] [P] [US3] Write failing test: POST /auth/forgot-password sends reset email
[T030] [P] [US3] Write failing test: POST /auth/reset-password with valid token updates password

# Implementation
[T031] [P] [US3] Implement forgot-password endpoint → src/api/auth/forgot-password.ts
[T032] [P] [US3] Implement reset-password endpoint → src/api/auth/reset-password.ts
[T033] [P] [US3] Implement reset token generation → src/services/token.service.ts
[T034] [P] [US3] Integration test: Password reset flow

# Checkpoint
[T035] [P] [US3] Verify: Password reset works independently
```

#### Phase 6: Polish (Cross-cutting improvements)

```
[T036] [POLISH] Add comprehensive API documentation → docs/api.md
[T037] [POLISH] Add quickstart guide → .specify/specs/001-auth/quickstart.md
[T038] [POLISH] Create deployment checklist → .specify/specs/001-auth/checklist.md
[T039] [POLISH] Refactor common error messages → src/lib/errors.ts
[T040] [POLISH] Add security headers to all endpoints
[T041] [POLISH] Add request logging middleware
[T042] [POLISH] Final security audit with npm audit
```

## Task Dependencies

Document dependencies explicitly:

```yaml
dependencies:
  T014:  # Login endpoint
    depends_on: [T010, T011, T012, T013]  # All tests must be written first
  T015:  # User lookup
    depends_on: [T014]  # Needs login endpoint structure
  T019:  # Integration test
    depends_on: [T014, T015, T016, T017, T018]  # All implementation complete
```

## Parallelization Strategy

Tasks marked `[P]` can run in parallel IF:
1. No dependencies on each other
2. Work on different files
3. Independently testable

**Example:**
- T001-T005 (Setup): All [P] - different infrastructure pieces
- T024-T028 (US2) and T029-T035 (US3): Can run in parallel

**Sequential:**
- T010-T019 (US1): Must run in sequence (TDD cycle)
- T036-T042 (Polish): Run after all user stories complete

## Output

Create complete `tasks.md` with:
- All phases defined
- All tasks with IDs, [P] markers, story tags
- Specific file paths for implementation
- Explicit dependencies
- Checkpoints for independent testing
```

**Artifacts Created:**
- `.specify/specs/001-${feature_name}/tasks.md`

**No Gate:** Task breakdown approved implicitly (plan was approved)

---

### Phase 7: Implementation

**BOSS Action:** Launches parallel workers based on [P] markers

**Workers:** `developer-frontend`, `developer-backend`, `developer-fullstack`

**Parallelization Logic:**

```typescript
// BOSS analyzes tasks.md and creates execution plan

interface Task {
  id: string;           // T001
  parallel: boolean;    // [P] flag
  story: string;        // US1, US2, SETUP, etc.
  description: string;
  dependencies: string[];
  filePath?: string;
}

// Group tasks by phase and parallelization
const executionPlan = {
  phase1_setup: {
    tasks: [T001, T002, T003, T004, T005],
    parallel: true,          // All marked [P]
    workers: 5               // Spawn 5 workers
  },

  phase2_foundation: {
    tasks: [T006, T007, T008, T009],
    parallel: false,         // Sequential
    workers: 1
  },

  phase3_us1: {
    tasks: [T010-T020],
    parallel: false,         // TDD cycle - sequential
    workers: 1,
    worker_type: 'developer-fullstack'
  },

  phase4_us2: {
    tasks: [T021-T028],
    parallel: true,          // Can run parallel with US3
    workers: 1,
    worker_type: 'developer-backend'
  },

  phase4_us3: {
    tasks: [T029-T035],
    parallel: true,          // Can run parallel with US2
    workers: 1,
    worker_type: 'developer-backend'
  },

  phase6_polish: {
    tasks: [T036-T042],
    parallel: false,         // After all stories
    workers: 1
  }
};
```

**Worker Assignment:**

BOSS assigns workers based on task requirements:

```typescript
// Analyze task to determine required skills
function getRequiredSkills(task: Task): string[] {
  const skills: string[] = [];

  if (task.filePath?.includes('frontend/') || task.filePath?.includes('components/')) {
    skills.push('react', 'nextjs', 'tailwind');
  }

  if (task.filePath?.includes('backend/') || task.filePath?.includes('api/')) {
    skills.push('nodejs', 'api-design', 'prisma');
  }

  if (task.filePath?.includes('models/') || task.filePath?.includes('database/')) {
    skills.push('database', 'prisma', 'postgres');
  }

  if (task.story === 'SETUP') {
    skills.push('devops', 'infrastructure');
  }

  return skills;
}

// Select worker with matching skills
function selectWorker(skills: string[]): WorkerType {
  const hasReact = skills.includes('react');
  const hasNode = skills.includes('nodejs');

  if (hasReact && hasNode) return 'developer-fullstack';
  if (hasReact) return 'developer-frontend';
  if (hasNode) return 'developer-backend';

  return 'developer-fullstack';  // Default
}
```

**Worker Prompt (Example: Developer-Fullstack for US1):**

```markdown
# Developer - User Story 1: User Authentication

You are implementing User Story 1 following Test-Driven Development.

## Context

- **Feature**: User Authentication
- **Spec**: ${spec_md}
- **Plan**: ${plan_md}
- **Tasks**: T010-T020 (Login flow)
- **Constitution**: ${constitution}
- **Similar implementations**: ${similar_code_patterns}

## Your Tasks (Sequential TDD)

### 1. Write Tests FIRST [T010-T013]

**T010:** Write failing test for valid login
```typescript
// tests/api/auth/login.test.ts
describe('POST /auth/login', () => {
  it('returns 200 + token with valid credentials', async () => {
    // Arrange
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'Password123!',
      verified: true
    });

    // Act
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toBeTruthy();
  });
});
```

Run test: ❌ FAIL (endpoint doesn't exist)

**T011:** Write failing test for invalid password
```typescript
it('returns 401 with invalid password', async () => {
  await createTestUser({
    email: 'test@example.com',
    password: 'Password123!'
  });

  const response = await request(app)
    .post('/auth/login')
    .send({
      email: 'test@example.com',
      password: 'WrongPassword'
    });

  expect(response.status).toBe(401);
  expect(response.body.error).toBe('Invalid credentials');
});
```

Run test: ❌ FAIL

**T012:** Write failing test for unverified email

**T013:** Write failing test for rate limiting

### 2. Implement to Make Tests Pass [T014-T018]

**T014:** Implement login endpoint
```typescript
// src/api/auth/login.ts
export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body;

  // Will implement in next tasks
  const user = await findUserByEmail(email);  // T015
  const isValid = await verifyPassword(password, user.password_hash);  // T016
  const token = await generateToken(user);  // T017

  return res.json({ token });
}
```

Run tests: ❌ FAIL (services not implemented)

**T015:** Implement user lookup service
```typescript
// src/services/user.service.ts
export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email }
  });
}
```

Run tests: ❌ FAIL (password verification not implemented)

**T016:** Implement password verification
```typescript
// src/services/auth.service.ts
import bcrypt from 'bcryptjs';

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

Run tests: ❌ FAIL (token generation not implemented)

**T017:** Implement JWT token generation
```typescript
// src/lib/jwt.ts
import jwt from 'jsonwebtoken';

export async function generateToken(user: User): Promise<string> {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}
```

Run tests: ✅ PASS (tests T010, T011 passing)

**T018:** Implement rate limiting
```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests
  message: 'Too many login attempts'
});
```

Run tests: ✅ ALL PASS (T010-T013)

### 3. Integration Test [T019]

```typescript
// tests/integration/auth-flow.test.ts
describe('Authentication Flow', () => {
  it('complete login flow with database', async () => {
    // Create user in real test database
    const user = await prisma.user.create({
      data: {
        email: 'integration@test.com',
        password_hash: await bcrypt.hash('Password123!', 10),
        verified: true
      }
    });

    // Test full flow
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(200);

    // Verify token is valid
    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!);
    expect(decoded.userId).toBe(user.id);

    // Verify session created in database
    const session = await prisma.session.findFirst({
      where: { userId: user.id }
    });
    expect(session).toBeTruthy();
  });
});
```

Run: ✅ PASS

### 4. Checkpoint [T020]

Verify independently deployable:
- [ ] All tests passing (unit + integration)
- [ ] Coverage ≥ 80%
- [ ] Can start auth service standalone
- [ ] Can test login flow end-to-end
- [ ] Mutation score ≥ 80%

Run quality gate checks:
```bash
pnpm typecheck  # ✅
pnpm lint       # ✅
pnpm test       # ✅ 47 tests passing
pnpm coverage   # ✅ 89% coverage
pnpm mutation   # ✅ 84% mutation score
```

## Constitution Compliance

Your implementation MUST follow:
- ✅ Test-First (NON-NEGOTIABLE): Tests written before implementation
- ✅ TDD Cycle: Red → Green → Refactor
- ✅ Coverage: ≥80% (achieved 89%)
- ✅ Mutation: ≥80% (achieved 84%)
- ✅ Tech Stack: Only allowed dependencies
- ✅ Code Quality: ESLint passing

## Output

When complete:
1. Create PR for User Story 1
2. Include test results in PR description
3. Include coverage report
4. Link to spec.md and tasks.md
5. Tag checkpoint: ✅ T020

Then report to BOSS:
```yaml
worker_id: worker_001
status: completed
user_story: US1
tasks_completed: [T010, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020]
pr_number: 2
test_results:
  total: 47
  passing: 47
  failing: 0
  coverage: 89%
  mutation: 84%
quality_gate: PASSED
```
```

**Artifacts Created:**
- Implementation code (src/)
- Test code (tests/)
- Integration tests (tests/integration/)
- Coverage reports
- PR with implementation

**Quality Gate (Automatic):**

Each worker must pass quality gates before PR:

```
Quality Gate: User Story 1 Implementation

Running checks...
  ✅ TypeCheck: 0 errors
  ✅ Lint: 0 warnings
  ✅ Tests: 47/47 passing
  ✅ Coverage: 89% (required: 80%)
  ✅ Mutation: 84% (required: 80%)
  ✅ Security: 0 vulnerabilities
  ✅ Build: successful

Quality Gate: PASSED ✅

Creating PR #2: User Story 1 - User Authentication
```

---

### Phase 8: Consolidation

**BOSS Action:** Spawns Consolidator worker to merge all branches

**Worker:** `consolidator`

**Input:**
- All worker PRs (PR #2, #3, #4, ...)
- tasks.md with checkpoints
- Constitution.md

**Worker Prompt:**
```markdown
# Consolidator

You merge parallel work and ensure everything integrates correctly.

## Input

- Worker PRs: ${prs}
- Tasks: ${tasks_md}
- Constitution: ${constitution}

## Your Tasks

### 1. Merge Branches

Merge all worker branches into integration branch:

```bash
git checkout -b integration/run_${run_id}
git merge container-use/worker_001  # US1
git merge container-use/worker_002  # US2
git merge container-use/worker_003  # US3
```

### 2. Resolve Conflicts

If conflicts, analyze and resolve:
- Prefer newer implementation if both valid
- Consult knowledge base for patterns
- Maintain constitutional compliance
- Document resolution in commit message

### 3. Integration Tests

Run full integration test suite:

```typescript
// tests/integration/complete-auth-flow.test.ts
describe('Complete Authentication System', () => {
  it('supports full user lifecycle', async () => {
    // Register
    const registerRes = await request(app)
      .post('/auth/register')
      .send({ email: 'user@test.com', password: 'Pass123!' });

    expect(registerRes.status).toBe(201);

    // Verify email (mock)
    await verifyEmail(registerRes.body.userId);

    // Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'Pass123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();

    // Password reset flow
    const forgotRes = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'user@test.com' });

    expect(forgotRes.status).toBe(200);

    // Verify all database records created correctly
    const user = await prisma.user.findUnique({
      where: { email: 'user@test.com' },
      include: { sessions: true }
    });

    expect(user).toBeTruthy();
    expect(user.sessions.length).toBeGreaterThan(0);
  });
});
```

### 4. Create Final Artifacts

**quickstart.md**
```markdown
# Authentication Service - Quick Start

## Prerequisites
- Node.js 22+
- PostgreSQL 16
- Redis 7

## Setup

1. Clone repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env`
4. Start database: `docker-compose up -d`
5. Run migrations: `pnpm prisma migrate dev`
6. Start service: `pnpm dev`

## Testing

Run: `curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'`

Expected: `{"token":"eyJ..."}`

## API Documentation

See `docs/api.md` or visit http://localhost:3000/docs
```

**checklist.md**
```markdown
# Authentication Service - Quality Checklist

## Code Quality
- [x] All TypeScript types defined
- [x] No `any` types used
- [x] ESLint passing (0 errors, 0 warnings)
- [x] Prettier formatted

## Testing
- [x] Unit tests: 47 tests, 100% passing
- [x] Integration tests: 12 tests, 100% passing
- [x] E2E tests: 5 tests, 100% passing
- [x] Coverage: 89% (requirement: 80%)
- [x] Mutation score: 84% (requirement: 80%)

## Security
- [x] npm audit: 0 vulnerabilities
- [x] Passwords hashed with bcrypt
- [x] JWT tokens secure (httpOnly, secure flags)
- [x] Rate limiting implemented
- [x] Input validation on all endpoints
- [x] SQL injection prevention (Prisma ORM)

## Documentation
- [x] API documented (OpenAPI spec)
- [x] README.md complete
- [x] Quickstart guide created
- [x] Deployment guide included

## Performance
- [x] Login endpoint: <100ms avg
- [x] Database queries optimized
- [x] Connection pooling configured
- [x] Load tested: 1000 concurrent users

## Constitution Compliance
- [x] Test-First methodology followed
- [x] All allowed technologies used
- [x] Architectural principles followed
- [x] Quality gates passed
```

### 5. Final Quality Gate

Run complete quality check:

```bash
pnpm typecheck      # All types valid
pnpm lint           # 0 errors
pnpm test           # All tests passing
pnpm test:e2e       # E2E tests passing
pnpm coverage       # ≥80%
pnpm mutation       # ≥80%
pnpm audit          # 0 vulnerabilities
pnpm build          # Successful
```

### 6. Create Main PR

Create consolidated PR with:
- All user stories implemented
- All quality gates passed
- Quickstart guide
- Quality checklist
- API documentation
- Link to all individual PRs
- Link to spec.md, plan.md, tasks.md

## Output

```yaml
consolidation_result:
  status: completed
  integration_branch: integration/run_2024_001
  merged_prs: [2, 3, 4]
  conflicts_resolved: 0

  tests:
    unit: 47 passing
    integration: 12 passing
    e2e: 5 passing
    total_coverage: 89%
    mutation_score: 84%

  artifacts:
    - .specify/specs/001-auth/quickstart.md
    - .specify/specs/001-auth/checklist.md
    - docs/api.md

  quality_gate: PASSED

  main_pr: 7
  main_pr_url: https://github.com/user/my-app/pull/7
```
```

**Artifacts Created:**
- `.specify/specs/001-${feature_name}/quickstart.md`
- `.specify/specs/001-${feature_name}/checklist.md`
- `docs/api.md` (or other documentation)
- Main PR with all implementations

**Gate:** **GATE 2 - Human Review**

```
BOSS: 🚦 GATE 2: Implementation Review

I've completed the implementation of ${feature_name}!

📊 Summary:
   - 3 user stories implemented
   - 42 tasks completed
   - 64 tests written (all passing)
   - 89% code coverage
   - 84% mutation score
   - 0 security vulnerabilities

Individual PRs:
   - PR #2: User Story 1 - Login ✅
   - PR #3: User Story 2 - Registration ✅
   - PR #4: User Story 3 - Password Reset ✅

Main PR: PR #7 (consolidated)
👉 https://github.com/user/my-app/pull/7

Preview Deployment:
👉 https://my-app-pr7.vercel.app

Documentation:
   - Quickstart: .specify/specs/001-auth/quickstart.md
   - Checklist: .specify/specs/001-auth/checklist.md
   - API Docs: docs/api.md

Quality Checklist:
   ✅ All tests passing
   ✅ Coverage ≥ 80%
   ✅ Mutation score ≥ 80%
   ✅ No security vulnerabilities
   ✅ Constitution compliant
   ✅ Documentation complete

Please review and approve to merge!
```

---

## Complete Spec-Kit Integration Summary

### Artifacts Created Throughout Workflow

```
.specify/
├── memory/
│   └── constitution.md                        [Phase 1: Constitution]
│
├── specs/
│   └── 001-user-authentication/
│       ├── spec.md                            [Phase 3: Specification]
│       ├── plan.md                            [Phase 4: Planning]
│       ├── data-model.md                      [Phase 4: Planning]
│       ├── contracts/
│       │   └── auth-api.yaml                  [Phase 4: Planning]
│       ├── research.md                        [Phase 4: Planning, if needed]
│       ├── validation-report.md               [Phase 5: Validation]
│       ├── tasks.md                           [Phase 6: Task Breakdown]
│       ├── quickstart.md                      [Phase 8: Consolidation]
│       └── checklist.md                       [Phase 8: Consolidation]
│
├── scripts/
│   ├── check-prerequisites.sh                 [Phase 0: Bootstrap]
│   ├── common.sh                              [Phase 0: Bootstrap]
│   ├── create-new-feature.sh                  [Phase 0: Bootstrap]
│   ├── setup-plan.sh                          [Phase 0: Bootstrap]
│   └── update-claude-md.sh                    [Phase 0: Bootstrap]
│
└── templates/
    ├── spec-template.md                       [Phase 0: Bootstrap]
    ├── plan-template.md                       [Phase 0: Bootstrap]
    ├── tasks-template.md                      [Phase 0: Bootstrap]
    └── checklist-template.md                  [Phase 0: Bootstrap]
```

### Spec-Kit Principles Enforced by BOSS

| Principle | How BOSS Enforces |
|-----------|-------------------|
| **Specifications are executable** | Spec.md drives entire implementation, not just guides it |
| **Test-First (NON-NEGOTIABLE)** | Constitution enforces TDD, quality gates verify |
| **Multi-step refinement** | Seven sequential phases, not one-shot generation |
| **Independent testability** | Each user story has checkpoint, can deploy standalone |
| **Dependency-ordered tasks** | Tasks.md with explicit dependencies, BOSS respects order |
| **Parallelization** | [P] markers in tasks.md, BOSS spawns parallel workers |
| **Constitution governs** | All phases validated against constitution.md |
| **Continuous dialogue** | Human gates at planning and review, not fire-and-forget |

---

## Key Innovations in BOSS's Spec-Kit Automation

### 1. Automated Phase Progression

**Traditional Spec-Kit:** Human manually runs slash commands
**BOSS:** Automatically progresses through phases with workers

### 2. Parallel Worker Execution

**Traditional Spec-Kit:** Sequential implementation by single developer
**BOSS:** Analyzes [P] markers and spawns parallel workers for independent user stories

### 3. Knowledge Base Integration

**Traditional Spec-Kit:** Each project starts from scratch
**BOSS:** Queries knowledge base for similar specs, plans, patterns

### 4. Constitutional Compliance Automation

**Traditional Spec-Kit:** Human ensures compliance
**BOSS:** Auto-gate validates every plan against constitution with retry

### 5. Quality Gates Integration

**Traditional Spec-Kit:** Manual quality checks
**BOSS:** Automated quality gates (typecheck, lint, test, coverage, mutation, security)

### 6. Cross-Project Learning

**Traditional Spec-Kit:** Patterns stay within project
**BOSS:** All specs, plans, patterns indexed in knowledge base for future projects

---

## Benefits of BOSS + Spec-Kit Integration

1. **Consistency:** Every project follows exact same Spec-Kit structure
2. **Quality:** Constitutional principles enforced automatically
3. **Speed:** Parallel workers complete implementation faster
4. **Learning:** Knowledge compounds across projects
5. **Traceability:** Complete audit trail from spec → plan → tasks → code
6. **Reproducibility:** Can replay entire workflow from spec-kit artifacts
7. **Governance:** Human approval at strategic gates (planning, review)
8. **Automation:** Removes manual toil, but keeps human oversight

---

## Next Steps for BOSS Implementation

To fully automate Spec-Kit, BOSS needs:

### 1. Spec-Kit Template Integration
- Include all spec-kit templates in bootstrap
- Customize templates based on project type
- Pre-populate constitution based on tech stack policy

### 2. Worker Prompts
- Create detailed prompts for each phase
- Include spec-kit structure knowledge
- Enforce template compliance

### 3. Quality Gate Integration
- Validate all artifacts against templates
- Check constitution compliance automatically
- Verify independent testability at checkpoints

### 4. Task Execution Engine
- Parse tasks.md for dependencies
- Respect parallelization markers [P]
- Spawn workers based on required skills
- Enforce TDD cycle (tests before implementation)

### 5. Knowledge Base Enhancement
- Index all spec-kit artifacts
- Enable semantic search across specs, plans, tasks
- Surface similar patterns to workers
- Learn from successful implementations

---

This integration makes Spec-Kit **executable and autonomous** while maintaining its core principles of specification-driven development, test-first methodology, and human governance at strategic decision points.
