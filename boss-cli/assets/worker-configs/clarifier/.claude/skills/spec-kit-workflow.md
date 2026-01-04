# Spec-Kit Workflow

## Description

Create, modify, and use Spec-Kit commands for executable specifications and structured development workflows. Use when working with constitution, requirements, specifications, planning, implementation, analysis, or validation phases.

## Overview

Spec-Kit is GitHub's executable specification framework integrated into BOSS workflows. Each worker uses specific Spec-Kit commands based on their `primaryCommand` field in metadata.json.

**Available Commands**:
- `/speckit.constitution` - Create NON-NEGOTIABLE governance principles (architect)
- `/speckit.clarify` - Gather and clarify requirements (clarifier, product-owner)
- `/speckit.specify` - Write BDD user stories and acceptance criteria (spec-writer, product-owner)
- `/speckit.plan` - Design technical architecture (planner)
- `/speckit.tasks` - Break down into actionable tasks (planner)
- `/speckit.implement` - TDD implementation (developer-*)
- `/speckit.analyze` - Analyze and review (reviewer, code-reviewer, devops-engineer)
- `/speckit.checklist` - Validation and verification (tester, security-engineer, technical-writer)

## Core Concepts

### Executable Specifications

Spec-Kit artifacts are NOT just documentation - they're executable:
- **constitution.md** - Enforced by automated gates and reviewers
- **spec.md** - Converted directly to test scenarios
- **tasks.md** - Drives parallel worker execution
- **plan.md** - Guides architectural decisions

### Artifact Hierarchy

```
.specify/
├── memory/
│   └── constitution.md          # PHASE 1: Architect (NON-NEGOTIABLE)
├── specs/
│   ├── 000-requirements/
│   │   ├── clarification.md     # PHASE 2: Clarifier (max 5 Q&A)
│   │   └── spec.md              # PHASE 3: Spec Writer (BDD stories)
│   └── {feature-name}/
│       ├── plan.md              # PHASE 4: Planner (architecture)
│       ├── data-model.md        # PHASE 4: Planner (database schema)
│       ├── tasks.md             # PHASE 6: Planner (task breakdown)
│       ├── contracts/           # PHASE 6: Planner (API contracts)
│       ├── research.md          # PHASE 6: Planner (unknowns)
│       ├── quickstart.md        # PHASE 6: Planner (setup guide)
│       └── checklists/
│           ├── validation.md    # PHASE 5: Reviewer
│           ├── security.md      # Security Engineer
│           └── checklist.md     # PHASE 10: Consolidator
```

### Sequential Dependencies

```
constitution.md (architect)
    ↓
clarification.md (clarifier)
    ↓
spec.md (spec-writer)
    ↓
plan.md (planner)
    ↓
validation.md (reviewer) ← Reviews plan against constitution
    ↓
tasks.md (planner) ← Only after plan approved
    ↓
[PARALLEL] implementation (developer-*) + security.md + infrastructure
    ↓
review (code-reviewer)
    ↓
checklist.md (consolidator)
```

## Spec-Kit Commands by Worker

### /speckit.constitution (Architect - Phase 1)

**Purpose**: Establish NON-NEGOTIABLE governing principles.

**Output**: `.specify/memory/constitution.md`

**Key Sections**:
```markdown
# Project Constitution

## NON-NEGOTIABLE Principles

1. **Test-Driven Development (TDD)**
   - MUST: Write tests before implementation
   - MUST: Achieve minimum 80% coverage
   - MUST: Achieve minimum 80% mutation score

2. **Behavior-Driven Development (BDD)**
   - MUST: All user stories in Given/When/Then format
   - MUST: Scenarios directly convertible to tests

3. **Documentation Standards**
   - MUST: All APIs documented with tested examples
   - MUST: Component props documented with usage examples

## Measurable Quality Gates

- Test Coverage: ≥80%
- Mutation Score: ≥80%
- Build Time: <5 minutes
- Linter Errors: 0

## Architectural Decisions

- API-First Design: All services expose well-defined APIs
- Monorepo Structure: Turborepo with shared packages
- Type Safety: TypeScript strict mode mandatory

## Security Requirements

- OWASP Top 10 compliance mandatory
- All secrets via environment variables
- No hardcoded credentials ever
```

**Usage**:
```bash
# Read existing constitution
cat .specify/memory/constitution.md

# Verify principle compliance
grep "NON-NEGOTIABLE" .specify/memory/constitution.md
```

**Best Practices**:
- Principles MUST be measurable and enforceable
- Use "MUST", "SHOULD", "MAY" keywords clearly
- Include quality gates with numeric thresholds
- Document architectural decisions with rationale

### /speckit.clarify (Clarifier - Phase 2)

**Purpose**: Identify ambiguities and gather clarifications.

**Output**: `.specify/specs/000-requirements/clarification.md`

**Key Sections**:
```markdown
# Requirements Clarification

## Questions & Answers

### Q1: User Authentication Method
**Question**: Which authentication method should we use - session-based or JWT?
**Answer**: JWT with refresh tokens for scalability
**Impact**: High - affects session management architecture
**Decision**: Use NextAuth v5 with JWT strategy

### Q2: Password Reset Flow
**Question**: Should password reset be via email or SMS?
**Answer**: Email only for MVP
**Impact**: Medium - affects user model and notification service
**Decision**: Implement email-based reset with token expiry

(Maximum 5 questions total)
```

**Usage**:
```bash
# Read clarifications
cat .specify/specs/000-requirements/clarification.md

# Count questions (should be ≤5)
grep "^### Q" .specify/specs/000-requirements/clarification.md | wc -l
```

**Best Practices**:
- Maximum 5 questions (high-impact ambiguities only)
- Each Q&A must include: question, answer, impact, decision
- Prioritize architectural and critical functional ambiguities
- Answers should be actionable (not "it depends")

### /speckit.specify (Spec Writer - Phase 3)

**Purpose**: Create BDD user stories with acceptance criteria.

**Output**: `.specify/specs/000-requirements/spec.md`

**Key Sections**:
```markdown
# Feature Specification: User Authentication

## User Stories

### Story 1: User Registration

**As a** new user
**I want to** register with email and password
**So that** I can access the application

**Acceptance Criteria**:

**Scenario 1.1: Successful Registration**
- **Given** I am on the registration page
- **When** I enter valid email "user@example.com"
- **And** I enter a strong password (≥8 chars, mixed case, numbers)
- **And** I click "Register"
- **Then** I should see "Registration successful" message
- **And** I should receive a verification email
- **And** I should be redirected to email verification page

**Scenario 1.2: Invalid Email**
- **Given** I am on the registration page
- **When** I enter invalid email "notanemail"
- **And** I click "Register"
- **Then** I should see "Invalid email format" error
- **And** registration should not proceed

(More scenarios for edge cases...)

### Story 2: User Login
(Similar structure...)

## Non-Functional Requirements

- Performance: Login must complete in <2 seconds
- Security: Passwords hashed with bcrypt (cost factor 12)
- Availability: 99.9% uptime for authentication service
```

**Usage**:
```bash
# Read spec
cat .specify/specs/000-requirements/spec.md

# Count user stories
grep "^### Story" .specify/specs/000-requirements/spec.md | wc -l

# Extract scenarios
grep -A 5 "^**Scenario" .specify/specs/000-requirements/spec.md
```

**Best Practices**:
- Every user story: As a/I want to/So that format
- All scenarios: Given/When/Then format
- Scenarios must be testable (directly convertible to code)
- Include both happy path and edge cases
- Add non-functional requirements (performance, security, etc.)

### /speckit.plan (Planner - Phase 4)

**Purpose**: Design technical architecture and approach.

**Output**: `.specify/specs/{feature}/plan.md`

**Key Sections**:
```markdown
# Technical Plan: User Authentication

## Architecture Overview

```
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└────────┬────────┘
         │ tRPC
┌────────▼────────┐
│  Auth Router    │
│  (tRPC)         │
└────────┬────────┘
         │
┌────────▼────────┐
│  NextAuth       │
│  (v5 Beta)      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Prisma         │
│  (PostgreSQL)   │
└─────────────────┘
```

## Components

### 1. Authentication Router (tRPC)
- **Location**: `src/server/api/routers/auth.ts`
- **Responsibilities**: Register, login, logout, session management
- **Dependencies**: NextAuth, Prisma

### 2. NextAuth Configuration
- **Location**: `src/auth.ts`
- **Strategy**: JWT with refresh tokens
- **Session**: Server-side with database persistence
- **Providers**: Credentials (email/password)

## Data Model

See: `data-model.md`

## API Contracts

See: `contracts/auth-api.yaml`

## Security Considerations

- Passwords: bcrypt with cost factor 12
- JWT: 15-minute access tokens, 7-day refresh tokens
- CSRF: Double-submit cookie pattern
- Rate limiting: 5 login attempts per 15 minutes per IP

## Implementation Phases

1. Database schema and migrations (developer-backend)
2. NextAuth configuration (developer-backend)
3. tRPC authentication router (developer-backend)
4. Login/Register UI components (developer-frontend)
5. Integration testing (tester)

## Risk Assessment

**High Risk**:
- NextAuth v5 is beta - may have breaking changes
- Mitigation: Pin exact version, monitor changelog

**Medium Risk**:
- Password reset email delivery
- Mitigation: Use transactional email service (Resend)
```

**Usage**:
```bash
# Read plan
cat .specify/specs/user-authentication/plan.md

# Check for architecture diagram
grep -A 10 "```" .specify/specs/user-authentication/plan.md
```

**Best Practices**:
- Include architecture diagrams (ASCII art acceptable)
- Break down into clear components with responsibilities
- Reference related docs (data-model.md, contracts/)
- Identify risks and mitigations
- Define implementation phases

### /speckit.tasks (Planner - Phase 6)

**Purpose**: Break plan into actionable, parallelizable tasks.

**Output**: `.specify/specs/{feature}/tasks.md`

**Key Sections**:
```markdown
# Tasks: User Authentication

## Task Breakdown

### T010: Database Schema [P]
**Assigned to**: developer-backend
**Dependencies**: None
**Estimated Complexity**: Low
**Deliverables**:
- User model in Prisma schema
- Account model for OAuth providers
- Session model for JWT storage
- Migration files

### T011: NextAuth Configuration [P]
**Assigned to**: developer-backend
**Dependencies**: T010 (database schema)
**Estimated Complexity**: Medium
**Deliverables**:
- src/auth.ts configuration
- JWT strategy setup
- Credentials provider
- Session callbacks

### T012: Registration API [P]
**Assigned to**: developer-backend
**Dependencies**: T011 (NextAuth config)
**Estimated Complexity**: Medium
**Deliverables**:
- /api/auth/register endpoint
- Email validation
- Password hashing
- User creation

### T013: Login UI Component [P]
**Assigned to**: developer-frontend
**Dependencies**: T012 (Registration API exists for consistency)
**Estimated Complexity**: Medium
**Deliverables**:
- LoginForm component
- Form validation
- Error handling
- Loading states

### T014: Integration Tests
**Assigned to**: tester
**Dependencies**: T012, T013 (APIs and UI complete)
**Estimated Complexity**: Medium
**Deliverables**:
- E2E test for registration flow
- E2E test for login flow
- API integration tests

## Parallelization Strategy

**Wave 1** (Parallel):
- T010: Database Schema

**Wave 2** (Parallel, depends on Wave 1):
- T011: NextAuth Configuration

**Wave 3** (Parallel, depends on Wave 2):
- T012: Registration API
- T013: Login UI Component

**Wave 4** (Sequential, depends on Wave 3):
- T014: Integration Tests
```

**Usage**:
```bash
# Read tasks
cat .specify/specs/user-authentication/tasks.md

# Count parallelizable tasks
grep "\[P\]" .specify/specs/user-authentication/tasks.md | wc -l

# Extract dependencies
grep "Dependencies:" .specify/specs/user-authentication/tasks.md
```

**Best Practices**:
- Use [P] marker for parallelizable tasks
- Clear dependency chains (Wave 1 → Wave 2 → Wave 3)
- Assign to specific worker types
- Include deliverables for validation
- Estimate complexity (Low/Medium/High)

### /speckit.implement (Developers - Phase 7)

**Purpose**: TDD implementation following the plan.

**Output**: Source code + tests matching spec.md scenarios.

**Process**:
1. **Read spec.md**: Understand acceptance criteria
2. **Read plan.md**: Understand architecture
3. **Read tasks.md**: Know your assigned tasks
4. **Write test first** (RED): Failing test for scenario
5. **Implement** (GREEN): Make test pass
6. **Refactor**: Clean up while keeping tests green
7. **Repeat**: Next scenario

**Example - Backend Implementation**:
```bash
# 1. Read assigned task
cat .specify/specs/user-authentication/tasks.md | grep "T012"

# 2. Read relevant spec scenarios
cat .specify/specs/user-authentication/spec.md | grep -A 20 "Registration"

# 3. Write test FIRST (RED)
cat > src/api/auth/register.test.ts << 'EOF'
import { test, expect } from 'vitest';
import { registerUser } from './register';

test('successful registration with valid email and password', async () => {
  const result = await registerUser({
    email: 'user@example.com',
    password: 'SecurePass123'
  });

  expect(result.success).toBe(true);
  expect(result.user.email).toBe('user@example.com');
});
EOF

# 4. Run test - should FAIL
pnpm test src/api/auth/register.test.ts
# ❌ FAIL: registerUser is not defined

# 5. Implement (GREEN)
cat > src/api/auth/register.ts << 'EOF'
export async function registerUser(data: { email: string; password: string }) {
  // ... implementation ...
  return { success: true, user: { email: data.email } };
}
EOF

# 6. Run test - should PASS
pnpm test src/api/auth/register.test.ts
# ✅ PASS

# 7. Refactor and add more scenarios
```

**Best Practices**:
- RED → GREEN → REFACTOR cycle mandatory
- One test per acceptance criteria scenario
- Test names match scenario names
- Achieve ≥80% coverage
- Commit after each complete RED-GREEN-REFACTOR cycle

### /speckit.analyze (Reviewer/Code-Reviewer - Phase 5/9)

**Purpose**: Validate against constitution and quality standards.

**Output**: `.specify/specs/{feature}/checklists/validation.md` or `review-report.md`

**Key Sections**:
```markdown
# Validation Report: User Authentication Plan

## Constitution Compliance

### ✅ PASS: Test-Driven Development
- Plan includes test strategy
- Tester assigned to T014
- Coverage target: 80% (matches constitution)

### ❌ FAIL: API Documentation
- Issue: No mention of API documentation in plan
- Required: All APIs must be documented with examples
- Remediation: Add T015 for API documentation to technical-writer

### ✅ PASS: Security Standards
- bcrypt with cost factor 12 (constitution-compliant)
- Rate limiting specified
- CSRF protection planned

## Quality Gates

- [x] Test coverage target: ≥80%
- [x] Mutation testing planned
- [ ] Performance benchmarks missing
- [x] Security review planned

## Recommendations

1. Add API documentation task before implementation
2. Specify performance benchmarks for login (<2s)
3. Add monitoring and alerting to plan

## Decision

**Status**: ❌ CHANGES REQUESTED

**Action Required**: Planner must address API documentation gap before proceeding to tasks.md
```

**Usage**:
```bash
# Read validation report
cat .specify/specs/user-authentication/checklists/validation.md

# Check if approved
grep "Decision:" .specify/specs/user-authentication/checklists/validation.md
```

**Best Practices**:
- Check every NON-NEGOTIABLE principle
- Verify quality gates are met
- Provide specific remediation guidance
- Approve/reject/retry decision must be clear

### /speckit.checklist (Tester/Security/Tech-Writer - Phase 8+)

**Purpose**: Create validation checklists and verify completion.

**Output**: `.specify/specs/{feature}/checklists/{type}.md`

**Tester Checklist Example**:
```markdown
# Test Checklist: User Authentication

## Unit Tests

- [x] User model validation tests (12 tests)
- [x] Password hashing tests (5 tests)
- [x] Email validation tests (8 tests)
- [x] Registration service tests (15 tests)

## Integration Tests

- [x] Registration API endpoint (6 scenarios)
- [x] Login API endpoint (8 scenarios)
- [x] Session management (4 scenarios)

## E2E Tests

- [x] User registration flow (Playwright)
- [x] User login flow (Playwright)
- [x] Password reset flow (Playwright)

## Coverage

- Test Coverage: 87.5% ✅ (target: 80%)
- Mutation Score: 83.2% ✅ (target: 80%)

## Performance

- [x] Login completes in <2s (avg: 1.2s)
- [x] Registration completes in <3s (avg: 2.1s)

## Status

**All tests passing**: ✅ YES
**Ready for merge**: ✅ YES
```

**Security Checklist Example**:
```markdown
# Security Checklist: User Authentication

## OWASP Top 10

- [x] A01: Broken Access Control - JWT validation on all protected routes
- [x] A02: Cryptographic Failures - bcrypt cost 12, secure token generation
- [x] A03: Injection - Parameterized queries (Prisma ORM)
- [x] A04: Insecure Design - Rate limiting, account lockout after 5 failed attempts
- [x] A05: Security Misconfiguration - Secure headers, HTTPS enforced
- [x] A06: Vulnerable Components - Dependencies scanned, no critical vulnerabilities
- [x] A07: Authentication Failures - Strong password policy, JWT expiry
- [x] A08: Data Integrity Failures - JWT signature validation
- [x] A09: Logging Failures - Authentication events logged
- [x] A10: SSRF - No external requests in auth flow

## Threat Model

### Threat: Brute Force Attack
**Mitigation**: Rate limiting (5 attempts per 15min)
**Status**: ✅ Implemented

### Threat: Token Theft
**Mitigation**: Short-lived JWT (15min), httpOnly cookies
**Status**: ✅ Implemented

## Status

**Security Score**: 95/100 ✅
**Critical Issues**: 0 ✅
**Approved for Production**: ✅ YES
```

## Workflow Integration

### Phase-by-Phase Flow

**Phase 1: Constitution (Architect)**
```bash
# Create constitution
# Output: .specify/memory/constitution.md

# Collaborates with: product-owner
```

**Phase 2: Clarification (Clarifier)**
```bash
# Read requirements
# Ask max 5 high-impact questions
# Output: .specify/specs/000-requirements/clarification.md

# Depends on: Product requirements
# Collaborates with: product-owner, architect
```

**Phase 3: Specification (Spec Writer)**
```bash
# Convert clarifications to BDD user stories
# Output: .specify/specs/000-requirements/spec.md

# Depends on: clarification.md
# Collaborates with: clarifier, tester
```

**Phase 4: Planning (Planner)**
```bash
# Design technical architecture
# Output: .specify/specs/{feature}/plan.md, data-model.md, contracts/

# Depends on: spec.md, constitution.md
# Collaborates with: architect, spec-writer
```

**Phase 5: Review (Reviewer)**
```bash
# Validate plan against constitution
# Output: .specify/specs/{feature}/checklists/validation.md

# Depends on: plan.md, constitution.md
# Decision: APPROVED / CHANGES REQUESTED / REJECTED
```

**Phase 6: Task Breakdown (Planner)**
```bash
# Only after plan approved
# Break into actionable tasks with [P] markers
# Output: .specify/specs/{feature}/tasks.md

# Depends on: validation.md (status: APPROVED)
```

**Phase 7: Implementation (Developers)**
```bash
# TDD implementation
# Output: src/ code + tests/

# Depends on: tasks.md
# Follows: /speckit.implement process
```

**Phase 8: Testing (Tester)**
```bash
# Comprehensive test suite
# Output: .specify/specs/{feature}/checklists/test-checklist.md

# Depends on: Implementation complete
```

**Phase 9: Code Review (Code Reviewer)**
```bash
# Review code and tests
# Output: review-report.md

# Depends on: Tests passing
```

**Phase 10: Consolidation (Consolidator)**
```bash
# Final validation and merge
# Output: .specify/specs/{feature}/checklists/checklist.md

# Depends on: All workers complete
```

## Common Patterns

### Referencing Between Artifacts

```bash
# In plan.md, reference spec.md
See user stories in [spec.md](../000-requirements/spec.md)

# In tasks.md, reference plan.md components
Based on Component 1 in [plan.md](./plan.md#component-1)

# In validation.md, reference constitution.md
Validates against principle 1 in [constitution.md](../../memory/constitution.md#principle-1)
```

### Updating Artifacts

```bash
# If constitution changes
architect: Update .specify/memory/constitution.md
reviewer: Re-validate all plans against new constitution
```

### Parallel Worker Coordination

```bash
# Planner creates tasks.md with [P] markers
# Conductor spawns multiple developers in parallel
# Each developer works on independent task marked [P]
# Consolidator merges all parallel work
```

## Anti-Patterns

### ❌ Skipping Tests in Implementation

```bash
# ❌ Bad - implement without tests
cat > src/api/register.ts << 'EOF'
export function register() { /* ... */ }
EOF

# ✅ Good - test first
cat > src/api/register.test.ts << 'EOF'
test('registration succeeds', () => { /* ... */ })
EOF
```

### ❌ Vague Acceptance Criteria

```markdown
❌ Bad:
**Scenario**: User can login
- Given user exists
- When login
- Then success

✅ Good:
**Scenario 1.1**: Successful login with valid credentials
- **Given** user "test@example.com" exists with password "Pass123"
- **When** I enter email "test@example.com"
- **And** I enter password "Pass123"
- **And** I click "Login"
- **Then** I should see "Welcome back" message
- **And** I should be redirected to dashboard ("/dashboard")
- **And** JWT token should be set in cookies
```

## When to Use This Skill

- Understanding your role in the Spec-Kit workflow
- Reading artifacts from previous workers
- Creating artifacts for your assigned phase
- Following TDD/BDD methodology
- Validating work against constitution
- Coordinating with parallel workers

## Related Skills

- `boss-manifest-protocol.md` - How to report results via manifests
- `test-first-methodology.md` - Detailed TDD/BDD implementation guide
- `conductor-orchestration.md` - How phases coordinate

## Key Takeaways

1. **Spec-Kit is sequential** - Each phase depends on previous artifacts
2. **Artifacts are executable** - Not just documentation
3. **Constitution is law** - All work must comply with NON-NEGOTIABLE principles
4. **TDD is mandatory** - Tests before implementation, always
5. **BDD scenarios become tests** - spec.md directly converts to test code
6. **[P] enables parallelism** - Mark independent tasks for concurrent execution
