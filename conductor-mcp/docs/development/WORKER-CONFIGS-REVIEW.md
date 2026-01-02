# Worker Configurations Review

**Generated**: 2026-01-02
**Scope**: Comprehensive analysis of all 15 worker configurations in Conductor MCP

---

## Executive Summary

### Key Findings

1. **CRITICAL ISSUE**: Architect's CLAUDE.md has outdated schema-based communication protocol that doesn't align with conductor-mcp's actual implementation
2. **Inconsistency**: All CLAUDE.md files reference project-config.json updates, but the new schema-based approach suggests automatic manifest handling
3. **Missing Metadata**: NO worker has a metadata.json file defining expected outputs for schema validation
4. **Template Variables**: All prompt.md files use template variables (${workerName}, ${phase}, ${artifactRequirements}, ${workerRoleDescription}) indicating they need preprocessing
5. **Good Structure**: All workers have consistent file structure (prompt.md, CLAUDE.md, container-config.json, .claude/ directory)

### Recommended Actions (Priority Order)

1. **HIGH**: Create metadata.json schema for each worker defining expected outputs
2. **HIGH**: Clarify communication protocol - remove conflicting instructions from CLAUDE.md files
3. **MEDIUM**: Add worker-specific skills/commands to .claude/ directories
4. **MEDIUM**: Document template variable resolution process
5. **LOW**: Standardize artifact requirements descriptions

---

## Common Patterns Across Workers

### File Structure (Consistent ✅)
```
worker-configs/
├── <worker-name>/
│   ├── prompt.md              # Role definition, workflow, quality standards
│   ├── CLAUDE.md              # Container context, communication protocol
│   ├── container-config.json  # Docker/container setup
│   └── .claude/               # Worker-specific resources
│       ├── agents/            # (empty - .gitkeep only)
│       ├── commands/          # (empty - .gitkeep only)
│       └── skills/            # (empty - .gitkeep only)
```

### Template Variables (All Workers)
- `${workerName}` - Worker type/role name
- `${phase}` - Development phase
- `${workerRoleDescription}` - Role description
- `${artifactRequirements}` - Expected outputs/deliverables

### Communication Protocol Issues

**CONFLICT IDENTIFIED**: Two different approaches described:

1. **Schema-Based (Architect's CLAUDE.md)**:
   - Worker outputs JSON at end of work
   - Conductor parses and creates `.boss/worker-manifest-${workerId}.json`
   - Worker doesn't manually write manifest files

2. **Manual Update (Other CLAUDE.md files)**:
   - Worker updates `.boss/project-config.json` manually
   - Worker adds summaries to `workers.summaries`
   - Worker manages `workflow.activeWorkers`

**RECOMMENDATION**: Choose ONE approach and standardize across all workers. Schema-based is superior for:
- Validation against schemas
- Preventing human error
- Consistent structure
- Automatic manifest generation

### Spec-Kit Integration (Consistent ✅)

All workers reference:
- `/speckit.*` commands
- `.specify/` directory structure
- `.specify/memory/constitution.md` as governing document
- Templates in `.specify/templates/`

### Quality Requirements (Consistent ✅)

All workers enforce:
- Test-First (TDD): Red → Green → Refactor
- BDD: Given/When/Then format
- Documentation: NON-NEGOTIABLE
- Coverage: ≥80%
- Mutation Testing: ≥80%

### Container Configuration (Identical ✅)

All workers use same `container-config.json`:
- Base: `node:22-slim`
- Tools: git, curl, build-essential, pnpm, @anthropic-ai/claude-code
- Env vars: WORKER_ROLE, NODE_ENV, SPEC_KIT_MODE, SPEC_KIT_PATH
- Secrets: CLAUDE_CODE_OAUTH_TOKEN from 1Password
- Network: npmjs.org, github.com, api.anthropic.com, claude.ai

---

## Detailed Worker Analysis

### 1. Architect

**Phase**: 1 (Foundation)

**Role**: Establishes technical constitution - the NON-NEGOTIABLE governing principles for all development work.

**Primary Output**:
- `.specify/memory/constitution.md` (Project constitution)

**Primary Spec-Kit Command**: `/speckit.constitution`

**Unique Characteristics**:
- First worker in workflow - sets foundation
- Non-negotiable standards enforcer
- Works with Product Owner to translate business constraints to technical principles
- Constitution governs all other workers

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/memory/constitution.md",
      "action": "created|updated",
      "purpose": "Project constitution with governing principles",
      "sections": ["Architectural Principles", "Development Methodology", "Testing Standards", "Documentation Standards"]
    }
  ],
  "decisions": [
    {
      "decision": "string (e.g., 'Enforced TDD as non-negotiable')",
      "rationale": "string",
      "impact": "high|medium|low",
      "reversible": boolean
    }
  ],
  "principlesEstablished": [
    "string (e.g., 'Test-First Development', 'BDD Layer', 'Documentation Standards')"
  ],
  "issues": [],
  "recommendations": [
    "string (next steps for BOSS)"
  ],
  "tasksCompleted": ["string"],
  "workComplete": boolean,
  "nextSteps": ["string"]
}
```

**CLAUDE.md Issues**:
- Contains outdated schema-based protocol (lines 11-76)
- Conflicts with manual project-config.json updates in other workers
- References worker manifest files that may not exist yet

**Proposed metadata.json**:
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
          "sections": ["Architectural Principles", "Development Methodology", "Testing Standards", "Documentation Standards", "Quality Gates"]
        }
      }
    ],
    "optional": []
  },
  "decisionTypes": [
    "Architectural principles",
    "Development methodology (TDD/BDD)",
    "Quality gates (coverage, mutation testing)",
    "Documentation standards"
  ],
  "collaboratesWith": ["product-owner", "clarifier", "reviewer"],
  "workflowPosition": "first",
  "blockers": [],
  "quality": {
    "constitutionMustInclude": ["Architectural Principles", "Development Methodology", "Testing Standards", "Documentation Standards"],
    "allPrinciplesMustBe": "measurable and enforceable",
    "retries": 3
  }
}
```

---

### 2. Clarifier

**Phase**: 2 (Requirements Gathering)

**Role**: Identifies ambiguities in requirements and asks targeted clarification questions to reduce downstream rework.

**Primary Output**:
- `.specify/specs/000-requirements/clarification.md` (Clarification questions and answers)

**Primary Spec-Kit Command**: `/speckit.clarify`

**Unique Characteristics**:
- Maximum 5 questions per session (prioritize high-impact)
- Questions must be answerable in ≤5 words or multiple choice
- Works with Product Owner for business context
- Feeds into Spec Writer's work

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/000-requirements/clarification.md",
      "action": "created|updated",
      "purpose": "Clarification questions and resolved ambiguities",
      "questionsAsked": 5
    }
  ],
  "decisions": [
    {
      "decision": "string",
      "rationale": "string",
      "impact": "high|medium|low",
      "reversible": boolean
    }
  ],
  "questionsAsked": 5,
  "ambiguitiesResolved": 5,
  "userPersonasIdentified": 0,
  "workflowsDocumented": 0,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Clarification phase"],
  "workComplete": boolean,
  "nextSteps": ["Spec Writer should create feature specifications"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "clarifier",
  "phase": 2,
  "description": "Identifies ambiguities and asks targeted clarification questions",
  "primaryCommand": "/speckit.clarify",
  "inputs": {
    "required": ["Initial requirements or user request"],
    "optional": ["Product Owner input", "Architect's constitution"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/000-requirements/clarification.md",
        "type": "markdown",
        "description": "Clarification questions and answers",
        "schema": {
          "maxQuestions": 5,
          "format": "Short answer (≤5 words) or multiple choice"
        }
      }
    ],
    "optional": []
  },
  "constraints": {
    "maxQuestions": 5,
    "questionFormat": "answerable in ≤5 words or multiple choice",
    "prioritization": "high-impact ambiguities affecting architecture, data modeling, or test design"
  },
  "decisionTypes": [
    "Which ambiguities to prioritize",
    "How to phrase questions for clarity",
    "When sufficient clarity achieved"
  ],
  "collaboratesWith": ["product-owner", "spec-writer", "architect"],
  "workflowPosition": "early",
  "blockers": []
}
```

---

### 3. Spec Writer

**Phase**: 3 (Specification)

**Role**: Translates business requirements into technical specifications with user stories in BDD format (Given/When/Then).

**Primary Output**:
- `.specify/specs/[feature-name]/spec.md` (Feature specification)

**Primary Spec-Kit Command**: `/speckit.specify`

**Unique Characteristics**:
- ALL user stories MUST be in Given/When/Then format (BDD)
- Works closely with Clarifier for resolved ambiguities
- Specifications become source of truth for implementation
- Must ensure specs are testable and actionable

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/[feature-name]/spec.md",
      "action": "created|updated",
      "purpose": "Feature specification with BDD user stories",
      "userStoriesWritten": 8,
      "acceptanceCriteriaDefined": 24
    }
  ],
  "decisions": [
    {
      "decision": "string",
      "rationale": "string",
      "impact": "high|medium|low",
      "reversible": boolean
    }
  ],
  "userStoriesWritten": 8,
  "acceptanceCriteriaDefined": 24,
  "bddFormat": true,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Specification phase"],
  "workComplete": boolean,
  "nextSteps": ["Planner should create technical implementation plan"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "spec-writer",
  "phase": 3,
  "description": "Creates feature specifications with BDD user stories",
  "primaryCommand": "/speckit.specify",
  "inputs": {
    "required": ["Clarification.md from Clarifier"],
    "optional": ["Product Owner input", "Architect's constitution"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/[feature-name]/spec.md",
        "type": "markdown",
        "description": "Feature specification with BDD user stories",
        "schema": {
          "userStoryFormat": "Given/When/Then (MANDATORY)",
          "sections": ["Overview", "User Stories", "Acceptance Criteria", "Edge Cases", "Non-Functional Requirements"]
        }
      }
    ],
    "optional": []
  },
  "constraints": {
    "userStoryFormat": "Given/When/Then (BDD format is MANDATORY)",
    "testability": "All user stories must be testable",
    "clarity": "Avoid ambiguous terms - quantify requirements"
  },
  "decisionTypes": [
    "How to structure user stories",
    "Which edge cases to include",
    "Non-functional requirements priority"
  ],
  "collaboratesWith": ["clarifier", "product-owner", "planner", "tester"],
  "workflowPosition": "early-middle",
  "blockers": ["Incomplete clarifications"]
}
```

---

### 4. Planner

**Phase**: 4 (Planning) and 6 (Task Breakdown)

**Role**: Creates technical implementation plans and breaks down into actionable tasks with [P] parallel markers.

**Primary Outputs**:
- `.specify/specs/[feature]/plan.md` (Technical implementation plan)
- `.specify/specs/[feature]/data-model.md` (Data model)
- `.specify/specs/[feature]/tasks.md` (Task breakdown with [P] markers)
- `.specify/specs/[feature]/contracts/` (API contracts)
- `.specify/specs/[feature]/research.md` (Research/unknowns)
- `.specify/specs/[feature]/quickstart.md` (Setup guide)

**Primary Spec-Kit Commands**: `/speckit.plan`, `/speckit.tasks`

**Unique Characteristics**:
- Works in TWO phases (4 and 6)
- Marks tasks with [P] for parallel execution
- Ensures TDD structure (test tasks before implementation)
- Creates most artifacts of any worker
- Enables parallel development

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/[feature]/plan.md",
      "action": "created",
      "purpose": "Technical implementation plan"
    },
    {
      "path": ".specify/specs/[feature]/data-model.md",
      "action": "created",
      "purpose": "Data model and schema definitions"
    },
    {
      "path": ".specify/specs/[feature]/tasks.md",
      "action": "created",
      "purpose": "Task breakdown with dependencies and [P] markers",
      "taskCount": 35,
      "parallelTasks": 12
    },
    {
      "path": ".specify/specs/[feature]/contracts/",
      "action": "created",
      "purpose": "API contracts and specifications"
    },
    {
      "path": ".specify/specs/[feature]/research.md",
      "action": "created",
      "purpose": "Research and unknowns to resolve"
    },
    {
      "path": ".specify/specs/[feature]/quickstart.md",
      "action": "created",
      "purpose": "Setup and quickstart guide"
    }
  ],
  "decisions": [],
  "tasksBrokenDown": 35,
  "parallelTasksIdentified": 12,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Planning phase", "Task breakdown phase"],
  "workComplete": boolean,
  "nextSteps": ["Reviewer should validate plan", "Developers can start parallel tasks"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "planner",
  "phase": [4, 6],
  "description": "Creates technical plans and breaks down into actionable tasks",
  "primaryCommand": ["/speckit.plan", "/speckit.tasks"],
  "inputs": {
    "required": ["spec.md from Spec Writer"],
    "optional": ["Architect's constitution", "Clarifications"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/[feature]/plan.md",
        "type": "markdown",
        "description": "Technical implementation plan"
      },
      {
        "path": ".specify/specs/[feature]/data-model.md",
        "type": "markdown",
        "description": "Data model and schema"
      },
      {
        "path": ".specify/specs/[feature]/tasks.md",
        "type": "markdown",
        "description": "Task breakdown with [P] parallel markers",
        "schema": {
          "taskFormat": "Dependency-ordered with [P] markers",
          "includeFilePaths": true,
          "tddStructure": "Test tasks before implementation tasks"
        }
      },
      {
        "path": ".specify/specs/[feature]/contracts/",
        "type": "directory",
        "description": "API contract definitions"
      },
      {
        "path": ".specify/specs/[feature]/research.md",
        "type": "markdown",
        "description": "Research document for unknowns"
      },
      {
        "path": ".specify/specs/[feature]/quickstart.md",
        "type": "markdown",
        "description": "Setup and quickstart guide"
      }
    ],
    "optional": []
  },
  "constraints": {
    "parallelization": "Mark independent tasks with [P]",
    "dependencies": "Respect file-based dependencies (models → services → endpoints)",
    "tddStructure": "Test tasks must precede implementation tasks"
  },
  "decisionTypes": [
    "Technical approach and architecture",
    "Task ordering and dependencies",
    "Which tasks can run in parallel",
    "Data model structure"
  ],
  "collaboratesWith": ["spec-writer", "architect", "developer-*", "reviewer", "devops-engineer", "security-engineer"],
  "workflowPosition": "middle",
  "blockers": ["Unresolved clarifications in spec.md"]
}
```

---

### 5. Reviewer

**Phase**: 5 (Validation)

**Role**: Validates technical plans against constitution to ensure compliance before implementation.

**Primary Output**:
- `.specify/specs/[feature]/validation-report.md` (Constitution compliance report)

**Primary Spec-Kit Command**: `/speckit.analyze`

**Unique Characteristics**:
- Quality gatekeeper
- Validates TDD/BDD/Documentation compliance
- Allows up to 3 retries for compliance fixes
- Prevents technical debt early

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/[feature]/validation-report.md",
      "action": "created",
      "purpose": "Constitution compliance validation report"
    }
  ],
  "decisions": [],
  "complianceChecksPerformed": ["TDD", "BDD", "Documentation", "Quality Gates"],
  "violations": [],
  "warnings": [],
  "approvalStatus": "approved|rejected|retry",
  "retriesRemaining": 3,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Validation phase"],
  "workComplete": boolean,
  "nextSteps": ["Proceed to implementation if approved", "Fix violations and retry if rejected"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "reviewer",
  "phase": 5,
  "description": "Validates plans against constitution for compliance",
  "primaryCommand": "/speckit.analyze",
  "inputs": {
    "required": [".specify/memory/constitution.md", "plan.md from Planner"],
    "optional": ["spec.md", "tasks.md"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/[feature]/validation-report.md",
        "type": "markdown",
        "description": "Constitution compliance validation report",
        "schema": {
          "sections": ["Violations", "Warnings", "Recommendations", "Approval Status"],
          "approvalStatus": "approved|rejected|retry"
        }
      }
    ],
    "optional": []
  },
  "constraints": {
    "maxRetries": 3,
    "mustValidate": ["TDD compliance", "BDD compliance", "Documentation requirements", "Quality gates"]
  },
  "decisionTypes": [
    "Approve or reject plan",
    "Identify constitution violations",
    "Determine retry vs. rejection"
  ],
  "collaboratesWith": ["architect", "planner", "developer-*"],
  "workflowPosition": "middle-gate",
  "blockers": ["Missing constitution", "Incomplete plan"]
}
```

---

### 6. Developer (Frontend)

**Phase**: 7 (Implementation)

**Role**: Implements frontend features following TDD+BDD, delivering production-ready, accessible, performant, well-tested code.

**Primary Outputs**:
- `src/components/**/*.tsx` (React/Vue/etc. components)
- `tests/components/**/*.test.tsx` (BDD + unit tests)
- `docs/components/**/*.md` (Component documentation)
- Storybook stories (if applicable)

**Primary Spec-Kit Command**: `/speckit.implement`

**Unique Characteristics**:
- Accessibility focus (WCAG, keyboard nav, screen readers, ARIA)
- Performance focus (bundle size, lazy loading, code splitting)
- Responsive design (mobile-first)
- Security (XSS prevention, CSRF, input validation)
- Works with Backend for API contracts

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": "src/components/**",
      "action": "created|updated",
      "purpose": "Frontend components implementation",
      "filesChanged": ["src/components/UserCard.tsx"]
    },
    {
      "path": "tests/components/**",
      "action": "created|updated",
      "purpose": "BDD and unit tests for components",
      "testsWritten": 5,
      "testsUpdated": 2
    },
    {
      "path": "docs/components/**",
      "action": "created",
      "purpose": "Component documentation",
      "documentationCreated": ["docs/components/UserCard.md"]
    }
  ],
  "decisions": [],
  "tasksCompleted": ["T010", "T011", "T012"],
  "testsPassed": true,
  "coverageAchieved": 85,
  "accessibilityAuditPassed": true,
  "issues": [],
  "recommendations": [],
  "workComplete": boolean,
  "nextSteps": ["Code Reviewer should review implementation"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "developer-frontend",
  "phase": 7,
  "description": "Implements frontend features with TDD+BDD, accessibility, and performance",
  "primaryCommand": "/speckit.implement",
  "inputs": {
    "required": ["tasks.md from Planner", "spec.md from Spec Writer"],
    "optional": ["API contracts from Planner", "UX/design specifications"]
  },
  "outputs": {
    "required": [
      {
        "path": "src/components/**",
        "type": "code",
        "description": "Frontend component implementations"
      },
      {
        "path": "tests/components/**",
        "type": "test",
        "description": "BDD + unit tests (Given/When/Then format)",
        "constraints": {
          "coverage": "≥80%",
          "bddFormat": "Given/When/Then"
        }
      },
      {
        "path": "docs/components/**",
        "type": "markdown",
        "description": "Component documentation"
      }
    ],
    "optional": [
      {
        "path": "src/**/*.stories.tsx",
        "type": "storybook",
        "description": "Storybook stories for component showcase"
      }
    ]
  },
  "constraints": {
    "tdd": "Write tests before implementation (red → green → refactor)",
    "accessibility": "WCAG compliance, keyboard navigation, screen readers, ARIA",
    "performance": "Optimize bundle size, lazy loading, code splitting",
    "responsive": "Mobile-first responsive design",
    "security": "XSS prevention, CSRF protection, input validation"
  },
  "decisionTypes": [
    "Component structure and architecture",
    "State management approach",
    "Styling approach",
    "Testing strategy"
  ],
  "collaboratesWith": ["planner", "developer-backend", "tester", "code-reviewer", "devops-engineer", "security-engineer", "technical-writer"],
  "workflowPosition": "implementation",
  "blockers": ["Missing API contracts", "Incomplete tasks.md"]
}
```

---

### 7. Developer (Backend)

**Phase**: 7 (Implementation)

**Role**: Implements backend features following TDD+BDD, delivering production-ready, well-tested, documented API and business logic.

**Primary Outputs**:
- `src/api/**/*.ts` (API endpoints, controllers)
- `src/services/**/*.ts` (Business logic services)
- `src/models/**/*.ts` (Data models)
- `tests/api/**/*.test.ts` (BDD + unit tests)
- `docs/api/**/*.md` (API documentation)

**Primary Spec-Kit Command**: `/speckit.implement`

**Unique Characteristics**:
- API documentation for all endpoints
- Contract-first development (follows contracts/ from Planner)
- Performance considerations (latency, throughput)
- Security focus (auth, input validation, encryption)
- Works with Frontend to ensure API contracts match

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": "src/api/**",
      "action": "created|updated",
      "purpose": "API endpoints implementation",
      "filesChanged": ["src/api/users.ts"]
    },
    {
      "path": "src/services/**",
      "action": "created|updated",
      "purpose": "Business logic services"
    },
    {
      "path": "src/models/**",
      "action": "created|updated",
      "purpose": "Data models and schemas"
    },
    {
      "path": "tests/api/**",
      "action": "created|updated",
      "purpose": "BDD and unit tests for APIs",
      "testsWritten": 5,
      "testsUpdated": 2
    },
    {
      "path": "docs/api/**",
      "action": "created",
      "purpose": "API documentation",
      "documentationCreated": ["docs/api/users.md"]
    }
  ],
  "decisions": [],
  "tasksCompleted": ["T010", "T011", "T012"],
  "testsPassed": true,
  "coverageAchieved": 85,
  "mutationScore": 82,
  "issues": [],
  "recommendations": [],
  "workComplete": boolean,
  "nextSteps": ["Code Reviewer should review implementation"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "developer-backend",
  "phase": 7,
  "description": "Implements backend features with TDD+BDD, API contracts, and security",
  "primaryCommand": "/speckit.implement",
  "inputs": {
    "required": ["tasks.md from Planner", "spec.md from Spec Writer", "API contracts from Planner"],
    "optional": ["data-model.md from Planner"]
  },
  "outputs": {
    "required": [
      {
        "path": "src/api/**",
        "type": "code",
        "description": "API endpoint implementations"
      },
      {
        "path": "src/services/**",
        "type": "code",
        "description": "Business logic services"
      },
      {
        "path": "src/models/**",
        "type": "code",
        "description": "Data models and schemas"
      },
      {
        "path": "tests/api/**",
        "type": "test",
        "description": "BDD + unit tests (Given/When/Then format)",
        "constraints": {
          "coverage": "≥80%",
          "mutationScore": "≥80%",
          "bddFormat": "Given/When/Then"
        }
      },
      {
        "path": "docs/api/**",
        "type": "markdown",
        "description": "API documentation with examples"
      }
    ],
    "optional": []
  },
  "constraints": {
    "tdd": "Write tests before implementation (red → green → refactor)",
    "contracts": "Follow API contracts from Planner",
    "performance": "Consider latency, throughput, and scalability",
    "security": "Auth, input validation, encryption, OWASP Top 10"
  },
  "decisionTypes": [
    "API design and endpoint structure",
    "Business logic organization",
    "Data model implementation",
    "Error handling strategy"
  ],
  "collaboratesWith": ["planner", "developer-frontend", "tester", "code-reviewer", "devops-engineer", "security-engineer", "technical-writer"],
  "workflowPosition": "implementation",
  "blockers": ["Missing API contracts", "Incomplete data model", "Incomplete tasks.md"]
}
```

---

### 8. Developer (Fullstack)

**Phase**: 7 (Implementation)

**Role**: Implements fullstack features (frontend + backend) following TDD+BDD, ensuring seamless integration.

**Primary Outputs**:
- Frontend components (src/components/**)
- Backend APIs (src/api/**)
- Integration tests
- Comprehensive documentation

**Primary Spec-Kit Command**: `/speckit.implement`

**Unique Characteristics**:
- Handles both frontend and backend
- Focus on integration testing
- Ensures API contracts work end-to-end
- Comprehensive fullstack documentation

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": "src/api/**",
      "action": "created|updated",
      "purpose": "Backend API implementation",
      "filesChanged": ["src/api/users.ts"]
    },
    {
      "path": "src/components/**",
      "action": "created|updated",
      "purpose": "Frontend components implementation",
      "filesChanged": ["src/components/UserCard.tsx"]
    },
    {
      "path": "tests/**",
      "action": "created|updated",
      "purpose": "BDD, unit, and integration tests",
      "testsWritten": 8,
      "testsUpdated": 3
    },
    {
      "path": "docs/**",
      "action": "created",
      "purpose": "Fullstack feature documentation",
      "documentationCreated": ["docs/api/users.md", "docs/components/UserCard.md"]
    }
  ],
  "decisions": [],
  "tasksCompleted": ["T010", "T011", "T012"],
  "testsPassed": true,
  "coverageAchieved": 85,
  "integrationTestsPassed": true,
  "issues": [],
  "recommendations": [],
  "workComplete": boolean,
  "nextSteps": ["Code Reviewer should review implementation"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "developer-fullstack",
  "phase": 7,
  "description": "Implements fullstack features with end-to-end integration",
  "primaryCommand": "/speckit.implement",
  "inputs": {
    "required": ["tasks.md from Planner", "spec.md from Spec Writer", "API contracts"],
    "optional": ["UX/design specs", "data-model.md"]
  },
  "outputs": {
    "required": [
      {
        "path": "src/api/**",
        "type": "code",
        "description": "Backend API implementations"
      },
      {
        "path": "src/components/**",
        "type": "code",
        "description": "Frontend component implementations"
      },
      {
        "path": "tests/**",
        "type": "test",
        "description": "BDD, unit, and integration tests",
        "constraints": {
          "coverage": "≥80%",
          "integrationTests": "required",
          "bddFormat": "Given/When/Then"
        }
      },
      {
        "path": "docs/**",
        "type": "markdown",
        "description": "Fullstack feature documentation"
      }
    ],
    "optional": []
  },
  "constraints": {
    "tdd": "Write tests before implementation (red → green → refactor)",
    "integration": "Test frontend-backend integration thoroughly",
    "contracts": "Ensure API contracts work end-to-end",
    "performance": "Optimize both frontend and backend performance"
  },
  "decisionTypes": [
    "Fullstack architecture decisions",
    "Integration patterns",
    "Error handling across stack",
    "State management across frontend/backend"
  ],
  "collaboratesWith": ["planner", "tester", "code-reviewer", "devops-engineer", "security-engineer", "technical-writer"],
  "workflowPosition": "implementation",
  "blockers": ["Missing API contracts", "Incomplete tasks.md"]
}
```

---

### 9. Tester

**Phase**: 8 (Testing)

**Role**: Creates comprehensive test suite (BDD, unit, integration, E2E, performance, accessibility) to validate implementations.

**Primary Outputs**:
- `tests/**/*.test.ts` (BDD, unit, integration tests)
- Test reports (coverage, mutation testing)
- Test documentation

**Primary Spec-Kit Command**: `/speckit.checklist`

**Unique Characteristics**:
- Validates implementations against spec.md acceptance criteria
- Ensures test coverage ≥80% and mutation score ≥80%
- Creates test utilities, fixtures, and test data
- Balances test pyramid (70% unit, 20% integration, 10% E2E)

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": "tests/**/*.test.ts",
      "action": "created|updated",
      "purpose": "Comprehensive test suite",
      "testsCreated": 15
    },
    {
      "path": "tests/fixtures/**",
      "action": "created",
      "purpose": "Test fixtures and data"
    },
    {
      "path": "coverage-report.html",
      "action": "created",
      "purpose": "Test coverage report"
    }
  ],
  "decisions": [],
  "testsCreated": 15,
  "coverageAchieved": 85,
  "mutationScore": 82,
  "testPyramid": {
    "unit": 70,
    "integration": 20,
    "e2e": 10
  },
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["BDD test suite", "Integration tests", "Performance tests"],
  "workComplete": boolean,
  "nextSteps": ["Code Reviewer should review tests"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "tester",
  "phase": 8,
  "description": "Creates comprehensive test suite to validate implementations",
  "primaryCommand": "/speckit.checklist",
  "inputs": {
    "required": ["spec.md from Spec Writer", "Implementation code from Developers"],
    "optional": ["plan.md from Planner"]
  },
  "outputs": {
    "required": [
      {
        "path": "tests/**/*.test.ts",
        "type": "test",
        "description": "BDD, unit, integration, E2E tests",
        "constraints": {
          "coverage": "≥80%",
          "mutationScore": "≥80%",
          "bddFormat": "Given/When/Then matching spec.md",
          "testPyramid": "70% unit, 20% integration, 10% E2E"
        }
      },
      {
        "path": "tests/fixtures/**",
        "type": "code",
        "description": "Test fixtures and test data"
      },
      {
        "path": "coverage-report.html",
        "type": "report",
        "description": "Test coverage report"
      }
    ],
    "optional": [
      {
        "path": "mutation-report.html",
        "type": "report",
        "description": "Mutation testing report"
      }
    ]
  },
  "constraints": {
    "coverage": "≥80% (as per constitution)",
    "mutationScore": "≥80% (as per constitution)",
    "bddTests": "Must match Given/When/Then scenarios from spec.md",
    "testPyramid": "Balance unit, integration, E2E tests",
    "testIsolation": "Tests must be independent and runnable in parallel"
  },
  "decisionTypes": [
    "Test strategy and coverage approach",
    "Test data management",
    "Performance testing scenarios",
    "Accessibility testing approach"
  ],
  "collaboratesWith": ["spec-writer", "developer-*", "code-reviewer", "product-owner"],
  "workflowPosition": "post-implementation",
  "blockers": ["Incomplete implementation", "Missing spec.md"]
}
```

---

### 10. Code Reviewer

**Phase**: 9 (Code Review)

**Role**: Reviews code quality, test quality, architecture compliance, performance, and security before approval.

**Primary Output**:
- `review-report.md` (Code review report)

**Primary Spec-Kit Command**: `/speckit.analyze`

**Unique Characteristics**:
- Provides constructive feedback for learning
- Reviews code AND test quality
- Ensures architecture compliance
- Validates security best practices

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": "review-report.md",
      "action": "created",
      "purpose": "Code review report with findings and recommendations"
    }
  ],
  "decisions": [],
  "issuesFound": 3,
  "issuesResolved": 3,
  "approvalStatus": "approved|changes-requested",
  "reviewCategories": {
    "codeQuality": "pass|fail",
    "testQuality": "pass|fail",
    "architecture": "pass|fail",
    "performance": "pass|fail",
    "security": "pass|fail"
  },
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Code review", "Test review", "Quality validation"],
  "workComplete": boolean,
  "nextSteps": ["Merge if approved", "Fix issues if changes requested"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "code-reviewer",
  "phase": 9,
  "description": "Reviews code and test quality, architecture, performance, security",
  "primaryCommand": "/speckit.analyze",
  "inputs": {
    "required": ["Implementation code from Developers", "Tests from Tester", ".specify/memory/constitution.md"],
    "optional": ["plan.md from Planner"]
  },
  "outputs": {
    "required": [
      {
        "path": "review-report.md",
        "type": "markdown",
        "description": "Code review report",
        "schema": {
          "sections": ["Code Quality", "Test Quality", "Architecture Compliance", "Performance", "Security", "Recommendations"],
          "approvalStatus": "approved|changes-requested"
        }
      }
    ],
    "optional": []
  },
  "constraints": {
    "mustReview": ["Code quality", "Test quality", "Architecture compliance", "Performance", "Security"],
    "feedback": "Constructive and actionable",
    "learningFocus": "Share knowledge and best practices"
  },
  "decisionTypes": [
    "Approve or request changes",
    "Code quality issues to flag",
    "Test quality improvements needed",
    "Architecture violations to address"
  ],
  "collaboratesWith": ["developer-*", "tester", "architect", "reviewer", "security-engineer"],
  "workflowPosition": "post-testing",
  "blockers": ["Incomplete implementation", "Missing tests"]
}
```

---

### 11. Consolidator

**Phase**: 10 (Consolidation)

**Role**: Merges all worker branches, runs integration tests, creates quickstart.md and checklist.md, prepares for PR.

**Primary Outputs**:
- `.specify/specs/[feature]/quickstart.md` (Setup and usage guide)
- `.specify/specs/[feature]/checklist.md` (Quality validation checklist)
- Merged feature branch (ready for PR)

**Primary Spec-Kit Command**: `/speckit.analyze`

**Unique Characteristics**:
- Final quality gate before PR
- Merges multiple worker branches
- Validates documentation completeness
- Ensures all Spec-Kit artifacts are present

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/[feature]/quickstart.md",
      "action": "created",
      "purpose": "Setup and usage instructions"
    },
    {
      "path": ".specify/specs/[feature]/checklist.md",
      "action": "created",
      "purpose": "Quality validation checklist"
    }
  ],
  "decisions": [],
  "branchesMerged": 5,
  "integrationTestsPassed": true,
  "documentationComplete": true,
  "allArtifactsPresent": true,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Consolidation phase"],
  "workComplete": boolean,
  "nextSteps": ["Create PR with consolidated branch"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "consolidator",
  "phase": 10,
  "description": "Merges worker branches and prepares for PR creation",
  "primaryCommand": "/speckit.analyze",
  "inputs": {
    "required": ["All worker branches from previous phases", "Worker summaries from .boss/project-config.json"],
    "optional": []
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/[feature]/quickstart.md",
        "type": "markdown",
        "description": "Setup and usage instructions"
      },
      {
        "path": ".specify/specs/[feature]/checklist.md",
        "type": "markdown",
        "description": "Quality validation checklist"
      },
      {
        "path": "feature-branch",
        "type": "git-branch",
        "description": "Merged feature branch ready for PR"
      }
    ],
    "optional": []
  },
  "constraints": {
    "mustMerge": "All worker branches",
    "mustValidate": "Integration tests, documentation completeness, artifact presence",
    "conflictResolution": "Resolve all merge conflicts intelligently"
  },
  "decisionTypes": [
    "How to resolve merge conflicts",
    "Which integration tests to run",
    "Whether all artifacts are complete"
  ],
  "collaboratesWith": ["all-workers", "devops-engineer", "technical-writer"],
  "workflowPosition": "final-gate",
  "blockers": ["Incomplete worker branches", "Failed integration tests"]
}
```

---

### 12. Security Engineer

**Phase**: Ongoing (runs alongside Planning and Implementation)

**Role**: Performs security reviews, threat modeling, vulnerability scanning, and ensures security compliance.

**Primary Outputs**:
- `.specify/specs/[feature]/checklists/security.md` (Security checklist)
- Threat model documentation
- Security scan reports
- Security documentation

**Primary Spec-Kit Command**: `/speckit.checklist`

**Unique Characteristics**:
- Security by Design - involved early in planning
- Threat modeling during planning phase
- Security scanning in CI/CD
- OWASP Top 10 compliance

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/[feature]/checklists/security.md",
      "action": "created",
      "purpose": "Security checklist and threat model"
    },
    {
      "path": "security-scan-report.html",
      "action": "created",
      "purpose": "Vulnerability scan report"
    }
  ],
  "decisions": [],
  "vulnerabilities": {
    "found": 2,
    "remediated": 2,
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 0
  },
  "complianceChecks": ["OWASP Top 10", "Input validation", "Authentication", "Authorization", "Encryption"],
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["Security review", "Threat modeling", "Vulnerability scanning"],
  "workComplete": boolean,
  "nextSteps": ["Integrate security scanning into CI/CD"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "security-engineer",
  "phase": "ongoing",
  "description": "Performs security reviews, threat modeling, and vulnerability scanning",
  "primaryCommand": "/speckit.checklist",
  "inputs": {
    "required": ["plan.md from Planner", "Implementation code from Developers"],
    "optional": [".specify/memory/constitution.md"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/[feature]/checklists/security.md",
        "type": "markdown",
        "description": "Security checklist and threat model",
        "schema": {
          "sections": ["Threat Model", "Security Requirements", "OWASP Top 10 Compliance", "Vulnerabilities"]
        }
      },
      {
        "path": "security-scan-report.html",
        "type": "report",
        "description": "Vulnerability scan report"
      }
    ],
    "optional": []
  },
  "constraints": {
    "threatModeling": "Required during planning phase",
    "owaspCompliance": "OWASP Top 10 checks required",
    "zeroTolerance": "Critical vulnerabilities must be fixed before approval"
  },
  "decisionTypes": [
    "Security requirements and threat model",
    "Vulnerability remediation priority",
    "Security testing approach",
    "Compliance requirements"
  ],
  "collaboratesWith": ["architect", "planner", "developer-*", "devops-engineer", "code-reviewer"],
  "workflowPosition": "ongoing",
  "blockers": ["Missing threat model in plan.md"]
}
```

---

### 13. DevOps Engineer

**Phase**: Ongoing (runs alongside Planning and Implementation)

**Role**: Sets up CI/CD pipelines, infrastructure as code, monitoring, and deployment processes.

**Primary Outputs**:
- `.github/workflows/*.yml` (CI/CD pipeline configs)
- `terraform/` or infrastructure code
- `.specify/specs/[feature]/quickstart.md` (Deployment instructions)
- Monitoring and logging configs

**Primary Spec-Kit Command**: `/speckit.analyze`

**Unique Characteristics**:
- Infrastructure as Code (Terraform, CloudFormation)
- CI/CD automation (GitHub Actions, GitLab CI, etc.)
- Monitoring and observability
- Blue-green deployments
- Disaster recovery

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".github/workflows/ci.yml",
      "action": "created",
      "purpose": "CI/CD pipeline configuration"
    },
    {
      "path": "terraform/",
      "action": "created",
      "purpose": "Infrastructure as code"
    },
    {
      "path": ".specify/specs/[feature]/quickstart.md",
      "action": "updated",
      "purpose": "Deployment instructions"
    }
  ],
  "decisions": [],
  "environments": ["dev", "staging", "production"],
  "cicdPipelineConfigured": true,
  "infrastructureProvisioned": true,
  "monitoringSetup": true,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["CI/CD pipeline", "Infrastructure setup", "Monitoring setup"],
  "workComplete": boolean,
  "nextSteps": ["Deploy to dev environment", "Validate deployment"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "devops-engineer",
  "phase": "ongoing",
  "description": "Sets up CI/CD, infrastructure, monitoring, and deployment",
  "primaryCommand": "/speckit.analyze",
  "inputs": {
    "required": ["plan.md from Planner"],
    "optional": ["Implementation code from Developers"]
  },
  "outputs": {
    "required": [
      {
        "path": ".github/workflows/*.yml",
        "type": "yaml",
        "description": "CI/CD pipeline configurations"
      },
      {
        "path": "terraform/",
        "type": "directory",
        "description": "Infrastructure as code"
      },
      {
        "path": ".specify/specs/[feature]/quickstart.md",
        "type": "markdown",
        "description": "Deployment instructions (updated)"
      },
      {
        "path": "monitoring/",
        "type": "directory",
        "description": "Monitoring and logging configs"
      }
    ],
    "optional": []
  },
  "constraints": {
    "infrastructureAsCode": "All infrastructure must be version-controlled",
    "cicdAutomation": "All deployments must be automated",
    "monitoring": "Comprehensive logging, metrics, alerting required",
    "securityScanning": "Security scanning in CI/CD required"
  },
  "decisionTypes": [
    "Infrastructure architecture",
    "CI/CD pipeline structure",
    "Deployment strategy (blue-green, canary, etc.)",
    "Monitoring and alerting strategy"
  ],
  "collaboratesWith": ["planner", "developer-*", "tester", "security-engineer", "consolidator"],
  "workflowPosition": "ongoing",
  "blockers": ["Missing infrastructure requirements in plan.md"]
}
```

---

### 14. Technical Writer

**Phase**: Ongoing (runs alongside Implementation)

**Role**: Creates comprehensive documentation (API docs, user guides, developer docs, quickstart).

**Primary Outputs**:
- `docs/api/**/*.md` (API documentation)
- `docs/user-guide.md` (User guide)
- `docs/developer-guide.md` (Developer documentation)
- `.specify/specs/[feature]/quickstart.md` (Setup guide)

**Primary Spec-Kit Command**: `/speckit.checklist`

**Unique Characteristics**:
- Documentation as Code (version-controlled)
- API documentation with examples
- User-facing documentation
- Developer documentation (architecture, patterns)
- Code examples must be tested

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": "docs/api/*.md",
      "action": "created",
      "purpose": "API documentation with examples"
    },
    {
      "path": "docs/user-guide.md",
      "action": "created",
      "purpose": "User guide and tutorials"
    },
    {
      "path": ".specify/specs/[feature]/quickstart.md",
      "action": "updated",
      "purpose": "Setup and quickstart guide"
    }
  ],
  "decisions": [],
  "coverage": "100%",
  "examplesTested": true,
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["API documentation", "User guide", "Quickstart"],
  "workComplete": boolean,
  "nextSteps": ["Review documentation for clarity"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "technical-writer",
  "phase": "ongoing",
  "description": "Creates comprehensive documentation for users, developers, and operators",
  "primaryCommand": "/speckit.checklist",
  "inputs": {
    "required": ["spec.md from Spec Writer", "Implementation code from Developers"],
    "optional": ["plan.md from Planner", "API contracts"]
  },
  "outputs": {
    "required": [
      {
        "path": "docs/api/**/*.md",
        "type": "markdown",
        "description": "API documentation with examples",
        "constraints": {
          "examplesTested": true
        }
      },
      {
        "path": "docs/user-guide.md",
        "type": "markdown",
        "description": "User guide and tutorials"
      },
      {
        "path": "docs/developer-guide.md",
        "type": "markdown",
        "description": "Developer documentation (architecture, patterns)"
      },
      {
        "path": ".specify/specs/[feature]/quickstart.md",
        "type": "markdown",
        "description": "Setup and quickstart guide"
      }
    ],
    "optional": []
  },
  "constraints": {
    "documentationAsCode": "Documentation must be version-controlled",
    "examplesTested": "All code examples must be tested and working",
    "clarity": "Documentation must be clear, concise, and accessible",
    "completeness": "All features, APIs, and processes must be documented"
  },
  "decisionTypes": [
    "Documentation structure and organization",
    "Which examples to include",
    "Documentation depth and detail level",
    "User vs. developer documentation split"
  ],
  "collaboratesWith": ["developer-*", "product-owner", "devops-engineer"],
  "workflowPosition": "ongoing",
  "blockers": ["Incomplete implementation", "Missing API contracts"]
}
```

---

### 15. Product Owner

**Phase**: 1-2 (Early) and Ongoing (Validation)

**Role**: Represents business and user needs, prioritizes user stories, validates acceptance criteria.

**Primary Outputs**:
- Prioritized user stories in spec.md (P1, P2, P3)
- Business requirements documentation
- Acceptance criteria validation

**Primary Spec-Kit Commands**: `/speckit.clarify`, `/speckit.specify`

**Unique Characteristics**:
- Business value focus
- User-centric approach
- Prioritization based on business impact
- Works closely with Clarifier and Spec Writer
- Validates implementations meet business requirements

**Expected Outputs for Schema**:
```json
{
  "artifacts": [
    {
      "path": ".specify/specs/[feature]/spec.md",
      "action": "updated",
      "purpose": "Prioritized user stories with business value"
    }
  ],
  "decisions": [],
  "priorities": {
    "P1": 3,
    "P2": 5,
    "P3": 2
  },
  "businessValueDelivered": "High",
  "issues": [],
  "recommendations": [],
  "tasksCompleted": ["User story prioritization", "Acceptance criteria validation"],
  "workComplete": boolean,
  "nextSteps": ["Spec Writer should incorporate priorities"]
}
```

**Proposed metadata.json**:
```json
{
  "workerType": "product-owner",
  "phase": "early-and-ongoing",
  "description": "Represents business needs, prioritizes user stories, validates implementations",
  "primaryCommand": ["/speckit.clarify", "/speckit.specify"],
  "inputs": {
    "required": ["Business requirements"],
    "optional": ["Clarifications from Clarifier", "spec.md from Spec Writer"]
  },
  "outputs": {
    "required": [
      {
        "path": ".specify/specs/[feature]/spec.md",
        "type": "markdown",
        "description": "Prioritized user stories (P1, P2, P3)",
        "schema": {
          "priorities": "P1|P2|P3",
          "businessValue": "required for each user story"
        }
      }
    ],
    "optional": []
  },
  "constraints": {
    "businessValueFocus": "Every feature must deliver measurable business value",
    "userCentric": "Specifications must prioritize user needs",
    "measurableAcceptanceCriteria": "All acceptance criteria must be objectively verifiable"
  },
  "decisionTypes": [
    "User story prioritization (P1, P2, P3)",
    "Business value assessment",
    "Acceptance criteria validation",
    "Trade-offs between business needs and technical constraints"
  ],
  "collaboratesWith": ["clarifier", "spec-writer", "architect", "developer-*", "tester"],
  "workflowPosition": "early-and-ongoing",
  "blockers": []
}
```

---

## Critical Issues & Recommendations

### 1. Communication Protocol Conflict (CRITICAL)

**Issue**: Architect's CLAUDE.md describes schema-based output (lines 11-76), while all other workers' CLAUDE.md files describe manual project-config.json updates.

**Impact**:
- Confusion for workers about how to communicate with BOSS
- Risk of workers writing JSON incorrectly
- Inconsistent manifest files
- Harder to validate outputs

**Recommendation**:
1. **CHOOSE SCHEMA-BASED APPROACH** (from Architect's CLAUDE.md)
   - Workers output JSON at end of work
   - Claude Code validates against schema (--output-format json --json-schema flags)
   - Conductor parses and creates `.boss/worker-manifest-${workerId}.json`
   - Workers DON'T manually write manifest files

2. **UPDATE ALL CLAUDE.md files** to remove manual project-config.json update instructions (lines 30-62 in most CLAUDE.md files)

3. **CREATE JSON SCHEMAS** for each worker type (use metadata.json as basis)

4. **DOCUMENT IN CONDUCTOR** how schema validation works

**Files to Update**:
- All 15 worker-configs/*/CLAUDE.md files (remove project-config.json update sections)
- Add JSON schema definitions to conductor-mcp

---

### 2. Missing metadata.json Files (HIGH PRIORITY)

**Issue**: NO worker has a metadata.json file. All metadata is embedded in prompt.md and CLAUDE.md as text.

**Impact**:
- Cannot programmatically validate worker outputs
- Cannot enforce schema validation
- Hard to query "what does this worker produce?"
- No machine-readable worker specifications

**Recommendation**:
1. **CREATE metadata.json for each worker** using the proposed schemas in this review
2. **VALIDATE metadata.json** against a master schema
3. **USE metadata.json** in Conductor to:
   - Generate JSON schemas for output validation
   - Display worker capabilities in CLI
   - Validate worker configurations on startup
   - Enable dynamic worker discovery

**Example metadata.json structure**:
```json
{
  "workerType": "string",
  "phase": "number|array|string",
  "description": "string",
  "primaryCommand": "string|array",
  "inputs": {
    "required": ["string"],
    "optional": ["string"]
  },
  "outputs": {
    "required": [
      {
        "path": "string",
        "type": "string",
        "description": "string",
        "schema": {},
        "constraints": {}
      }
    ],
    "optional": []
  },
  "constraints": {},
  "decisionTypes": ["string"],
  "collaboratesWith": ["string"],
  "workflowPosition": "string",
  "blockers": ["string"],
  "quality": {}
}
```

---

### 3. Template Variable Resolution (MEDIUM PRIORITY)

**Issue**: All prompt.md files use template variables (${workerName}, ${phase}, etc.) but resolution process is undocumented.

**Impact**:
- Unclear how templates are processed
- Risk of unresolved variables in worker prompts
- Hard to test worker configurations

**Recommendation**:
1. **DOCUMENT template resolution** in conductor-mcp README
2. **CREATE template processor** that validates all variables are resolved
3. **ADD TEST** to verify template resolution works correctly
4. **CONSIDER** using metadata.json values to resolve templates

**Template Variables Used**:
- `${workerName}` - Worker type (e.g., "architect", "clarifier")
- `${phase}` - Development phase number or description
- `${workerRoleDescription}` - Role description from metadata.json
- `${artifactRequirements}` - Expected outputs from metadata.json
- `${workerId}` - Runtime worker instance ID (in CLAUDE.md)

---

### 4. Empty .claude/ Directories (LOW-MEDIUM PRIORITY)

**Issue**: All workers have `.claude/{agents,commands,skills}/` directories with only .gitkeep files.

**Impact**:
- Missing opportunity for worker-specific skills/commands
- Workers can't leverage specialized agents
- No custom commands for common tasks

**Recommendation**:
1. **POPULATE .claude/skills/** with worker-specific skills:
   - architect: constitution-writer.md, architecture-review.md
   - clarifier: question-generator.md, ambiguity-detector.md
   - spec-writer: bdd-formatter.md, acceptance-criteria-generator.md
   - planner: task-breakdown.md, dependency-analyzer.md
   - developer-*: tdd-helper.md, code-generator.md
   - tester: test-generator.md, coverage-analyzer.md
   - etc.

2. **ADD .claude/commands/** for common tasks:
   - /validate-constitution
   - /check-bdd-format
   - /analyze-coverage
   - /generate-tasks
   - etc.

3. **CREATE .claude/agents/** for specialized sub-agents:
   - research-subagent for looking up documentation
   - security-audit for security scanning
   - etc.

---

### 5. Artifact Path Consistency (LOW PRIORITY)

**Issue**: Some artifact paths use placeholders ([feature-name], [feature]), some use wildcard (**), and some use specific names.

**Impact**:
- Inconsistent expectations
- Hard to validate artifact presence

**Recommendation**:
1. **STANDARDIZE placeholder format**: Use `[feature-id]` consistently
2. **DOCUMENT path conventions** in conductor-mcp
3. **CREATE path resolver** that converts placeholders to actual paths

---

## Workflow Dependencies & Orchestration

### Worker Dependency Graph

```
Phase 1: Foundation
├─ architect (creates constitution)
└─ product-owner (provides business context)

Phase 2: Requirements
├─ clarifier (asks clarification questions)
│   └─ depends on: product-owner
└─ product-owner (answers questions)

Phase 3: Specification
└─ spec-writer (creates spec.md with BDD user stories)
    └─ depends on: clarifier, product-owner

Phase 4: Planning
└─ planner (creates plan.md, data-model.md, contracts/, research.md, quickstart.md)
    └─ depends on: spec-writer, architect

Phase 5: Validation
└─ reviewer (validates plan against constitution)
    └─ depends on: planner, architect

Phase 6: Task Breakdown
└─ planner (creates tasks.md with [P] markers)
    └─ depends on: reviewer approval

Phase 7: Implementation (PARALLEL)
├─ developer-frontend (implements UI components)
│   └─ depends on: planner (tasks.md), planner (contracts/)
├─ developer-backend (implements API endpoints)
│   └─ depends on: planner (tasks.md), planner (data-model.md), planner (contracts/)
└─ developer-fullstack (implements fullstack features)
    └─ depends on: planner (tasks.md), planner (contracts/)

Ongoing: Support Roles
├─ security-engineer (security review, threat modeling)
│   └─ works with: planner (threat model in plan.md), developer-* (code review)
├─ devops-engineer (CI/CD, infrastructure, monitoring)
│   └─ works with: planner (infrastructure requirements), developer-* (deployment)
└─ technical-writer (documentation)
    └─ works with: developer-* (API docs), planner (quickstart.md)

Phase 8: Testing
└─ tester (creates test suite, validates coverage)
    └─ depends on: spec-writer (acceptance criteria), developer-* (implementation)

Phase 9: Code Review
└─ code-reviewer (reviews code and test quality)
    └─ depends on: developer-*, tester

Phase 10: Consolidation
└─ consolidator (merges branches, creates quickstart.md, checklist.md)
    └─ depends on: all previous phases complete
```

### Parallel Execution Opportunities

1. **Phase 7 (Implementation)**:
   - developer-frontend, developer-backend, developer-fullstack can work in parallel
   - Use [P] markers from planner to coordinate file-based dependencies

2. **Ongoing Support Roles**:
   - security-engineer, devops-engineer, technical-writer can work in parallel
   - Coordinate with implementation workers as needed

3. **Multi-Feature Development**:
   - Multiple features can be in different phases simultaneously
   - Architect → Feature A (Phase 3) + Feature B (Phase 7) + Feature C (Phase 10)

---

## Quality Gates & Validation

### Constitution Compliance (Phase 5 - Reviewer)

**Validates**:
- TDD compliance (tests before implementation)
- BDD compliance (Given/When/Then format)
- Documentation requirements addressed
- Quality gates defined (coverage ≥80%, mutation ≥80%)

**Output**: validation-report.md with violations/warnings/recommendations

**Retry**: Up to 3 retries if violations found

---

### Code Quality (Phase 9 - Code Reviewer)

**Validates**:
- Code quality (readability, maintainability, performance)
- Test quality (coverage, clarity, edge cases)
- Architecture compliance
- Security best practices

**Output**: review-report.md with approval status

**Retry**: Changes requested until issues resolved

---

### Final Quality Gate (Phase 10 - Consolidator)

**Validates**:
- All worker branches merged successfully
- Integration tests pass
- Documentation completeness
- All Spec-Kit artifacts present

**Output**: quickstart.md, checklist.md, merged feature branch

**Blocker**: Cannot create PR until all validations pass

---

## Recommended metadata.json Schema (Master)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "workerType",
    "phase",
    "description",
    "primaryCommand",
    "inputs",
    "outputs",
    "collaboratesWith",
    "workflowPosition"
  ],
  "properties": {
    "workerType": {
      "type": "string",
      "enum": [
        "architect",
        "clarifier",
        "spec-writer",
        "planner",
        "reviewer",
        "developer-frontend",
        "developer-backend",
        "developer-fullstack",
        "tester",
        "code-reviewer",
        "consolidator",
        "security-engineer",
        "devops-engineer",
        "technical-writer",
        "product-owner"
      ]
    },
    "phase": {
      "oneOf": [
        { "type": "number" },
        { "type": "array", "items": { "type": "number" } },
        { "type": "string", "enum": ["ongoing", "early-and-ongoing"] }
      ]
    },
    "description": {
      "type": "string",
      "minLength": 10,
      "maxLength": 200
    },
    "primaryCommand": {
      "oneOf": [
        { "type": "string", "pattern": "^/speckit\\." },
        { "type": "array", "items": { "type": "string", "pattern": "^/speckit\\." } }
      ]
    },
    "inputs": {
      "type": "object",
      "required": ["required", "optional"],
      "properties": {
        "required": {
          "type": "array",
          "items": { "type": "string" }
        },
        "optional": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "outputs": {
      "type": "object",
      "required": ["required", "optional"],
      "properties": {
        "required": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "type", "description"],
            "properties": {
              "path": { "type": "string" },
              "type": {
                "type": "string",
                "enum": ["markdown", "code", "test", "yaml", "json", "directory", "report", "git-branch", "storybook"]
              },
              "description": { "type": "string" },
              "schema": { "type": "object" },
              "constraints": { "type": "object" }
            }
          }
        },
        "optional": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "type", "description"],
            "properties": {
              "path": { "type": "string" },
              "type": {
                "type": "string",
                "enum": ["markdown", "code", "test", "yaml", "json", "directory", "report", "storybook"]
              },
              "description": { "type": "string" },
              "schema": { "type": "object" },
              "constraints": { "type": "object" }
            }
          }
        }
      }
    },
    "constraints": {
      "type": "object"
    },
    "decisionTypes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "collaboratesWith": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "architect",
          "clarifier",
          "spec-writer",
          "planner",
          "reviewer",
          "developer-frontend",
          "developer-backend",
          "developer-fullstack",
          "developer-*",
          "tester",
          "code-reviewer",
          "consolidator",
          "security-engineer",
          "devops-engineer",
          "technical-writer",
          "product-owner",
          "all-workers"
        ]
      }
    },
    "workflowPosition": {
      "type": "string",
      "enum": [
        "first",
        "early",
        "early-middle",
        "middle",
        "middle-gate",
        "implementation",
        "post-implementation",
        "post-testing",
        "final-gate",
        "ongoing",
        "early-and-ongoing"
      ]
    },
    "blockers": {
      "type": "array",
      "items": { "type": "string" }
    },
    "quality": {
      "type": "object"
    }
  }
}
```

---

## Next Steps (Prioritized)

### Phase 1: Critical Fixes (Week 1)

1. **Resolve Communication Protocol Conflict**
   - [ ] Choose schema-based approach
   - [ ] Update all CLAUDE.md files to remove project-config.json manual update sections
   - [ ] Document schema-based communication in conductor-mcp README
   - [ ] Create JSON schema generator from metadata.json

2. **Create metadata.json for All Workers**
   - [ ] Use proposed schemas from this review
   - [ ] Create master metadata.json schema
   - [ ] Validate all metadata.json files against master schema
   - [ ] Add metadata validation to conductor-mcp startup

### Phase 2: Enhancement (Week 2)

3. **Document Template Resolution**
   - [ ] Document how template variables are resolved
   - [ ] Create template processor
   - [ ] Add tests for template resolution
   - [ ] Use metadata.json to resolve artifact requirements

4. **Populate .claude/ Directories**
   - [ ] Create worker-specific skills in .claude/skills/
   - [ ] Add common commands in .claude/commands/
   - [ ] Create specialized agents in .claude/agents/

### Phase 3: Refinement (Week 3)

5. **Standardize Artifact Paths**
   - [ ] Standardize placeholder format ([feature-id])
   - [ ] Document path conventions
   - [ ] Create path resolver utility

6. **Create Worker Testing Framework**
   - [ ] Test each worker configuration loads correctly
   - [ ] Validate metadata.json schemas
   - [ ] Test template resolution
   - [ ] Validate container-config.json

### Phase 4: Documentation (Week 4)

7. **Comprehensive Documentation**
   - [ ] Document worker dependency graph
   - [ ] Document parallel execution opportunities
   - [ ] Document quality gates
   - [ ] Create worker onboarding guide

---

## Appendix: Worker Output Schemas

### Common Schema Structure

All workers output JSON with this base structure:

```json
{
  "artifacts": [
    {
      "path": "string",
      "action": "created|updated|deleted",
      "purpose": "string"
    }
  ],
  "decisions": [
    {
      "decision": "string",
      "rationale": "string",
      "impact": "high|medium|low",
      "reversible": boolean
    }
  ],
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string"],
  "tasksCompleted": ["string"],
  "workComplete": boolean,
  "nextSteps": ["string"]
}
```

### Worker-Specific Extensions

Each worker adds specific fields to the base schema:

- **architect**: `principlesEstablished: string[]`
- **clarifier**: `questionsAsked: number`, `ambiguitiesResolved: number`
- **spec-writer**: `userStoriesWritten: number`, `acceptanceCriteriaDefined: number`
- **planner**: `tasksBrokenDown: number`, `parallelTasksIdentified: number`
- **reviewer**: `complianceChecksPerformed: string[]`, `violations: object[]`, `approvalStatus: string`
- **developer-***: `testsPassed: boolean`, `coverageAchieved: number`
- **tester**: `testsCreated: number`, `coverageAchieved: number`, `mutationScore: number`
- **code-reviewer**: `issuesFound: number`, `issuesResolved: number`, `approvalStatus: string`
- **consolidator**: `branchesMerged: number`, `integrationTestsPassed: boolean`
- **security-engineer**: `vulnerabilities: object`, `complianceChecks: string[]`
- **devops-engineer**: `environments: string[]`, `cicdPipelineConfigured: boolean`
- **technical-writer**: `coverage: string`, `examplesTested: boolean`
- **product-owner**: `priorities: object`, `businessValueDelivered: string`

---

## Summary

This comprehensive review analyzed all 15 worker configurations in conductor-mcp and identified:

1. **CRITICAL**: Communication protocol conflict between schema-based and manual approaches
2. **HIGH**: Missing metadata.json files for schema validation
3. **MEDIUM**: Undocumented template variable resolution
4. **MEDIUM**: Empty .claude/ directories missing worker-specific resources
5. **LOW**: Inconsistent artifact path conventions

**Recommended Approach**:
- Use schema-based communication (from Architect's CLAUDE.md)
- Create metadata.json for each worker (schemas provided in this review)
- Populate .claude/ directories with worker-specific skills/commands
- Document template resolution process
- Standardize artifact path conventions

**Benefits**:
- Automatic output validation
- Reduced human error
- Consistent worker behavior
- Programmatic worker discovery
- Easier testing and debugging

This review provides the foundation for enhancing conductor-mcp's worker orchestration capabilities.
