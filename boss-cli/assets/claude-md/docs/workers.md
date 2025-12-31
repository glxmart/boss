# Available Workers

BOSS has access to **15 specialized workers** that form a fully functional, high-performance engineering team. Each worker is aware of their role, uses Spec-Kit commands, and follows team collaboration patterns.

## Phase-Specific Workers

**Phase 1: Constitution**
- **`architect`** - Creates `.specify/memory/constitution.md` with governing principles. Establishes NON-NEGOTIABLE standards: Test-First, BDD, Documentation. Defines architectural principles and development methodology.

**Phase 2: Clarification**
- **`clarifier`** - Gathers business requirements through conversation. Uses `/speckit.clarify` to identify ambiguities. Asks business questions (not technical). Documents user personas and workflows.

**Phase 3: Specification**
- **`spec-writer`** - Creates `spec.md` with user stories in Given/When/Then format (BDD). Uses `/speckit.specify` and `/speckit.checklist`. Includes acceptance criteria and edge cases. Ensures specs are testable and actionable.

**Phase 4: Planning**
- **`planner`** - Creates `plan.md`, `data-model.md`, `contracts/`. Uses `/speckit.plan` to generate technical approach. Plans BDD test strategy and documentation structure.

**Phase 5: Validation**
- **`reviewer`** - Validates plan against constitution. Checks TDD/BDD/Documentation compliance. Uses `/speckit.analyze`. Verifies BDD layer and documentation requirements. Ensures constitution compliance.

**Phase 6: Task Breakdown**
- **`planner`** - Creates `tasks.md` with [P] parallel markers. Uses `/speckit.tasks` to break down plans. Orders tasks by dependencies. Enables parallel execution where possible.

**Phase 7: Implementation**
- **`developer-frontend`** - Implements frontend features following TDD + BDD. Uses `/speckit.implement`. Creates BDD tests and feature documentation. Ensures accessibility, performance, and responsive design.
- **`developer-backend`** - Implements backend features following TDD + BDD. Uses `/speckit.implement`. Creates API documentation and feature documentation. Ensures security, performance, and scalability.
- **`developer-fullstack`** - Implements fullstack features following TDD + BDD. Uses `/speckit.implement`. Creates comprehensive tests and documentation. Ensures seamless frontend-backend integration.
- **`tester`** - Creates comprehensive test suites (BDD, unit, integration, E2E). Uses `/speckit.checklist` for test requirements. Ensures test coverage ≥80% and mutation score ≥80%. Validates implementations meet specifications.
- **`code-reviewer`** - Reviews code for quality, maintainability, and adherence to coding standards. Uses `/speckit.analyze`. Provides constructive feedback. Validates code follows TDD/BDD practices and architecture principles.

**Phase 8: Consolidation**
- **`consolidator`** - Merges all worker branches. Creates `quickstart.md` and `checklist.md`. Uses `/speckit.analyze`. Validates documentation completeness. Runs integration tests. Prepares artifacts for PR creation.

## Cross-Phase Workers

These workers can be spawned at any phase as needed:

- **`product-owner`** - Represents business and user needs throughout the lifecycle. Prioritizes user stories (P1, P2, P3) based on business value. Validates acceptance criteria are measurable and business-focused. Works with Clarifier, Spec Writer, and all team members.

- **`security-engineer`** - Ensures applications are secure and compliant. Performs security reviews, threat modeling, and vulnerability scanning. Uses `/speckit.checklist` for security requirements. Integrates security into CI/CD pipeline. Follows OWASP Top 10 and security best practices.

- **`devops-engineer`** - Sets up CI/CD pipelines, infrastructure, and deployment automation. Ensures applications are deployable, scalable, and maintainable. Configures monitoring, logging, and alerting. Creates deployment documentation in `quickstart.md`.

- **`technical-writer`** - Creates comprehensive documentation (API docs, user guides, developer docs). Uses `/speckit.checklist` for documentation quality. Maintains documentation quality and completeness. Updates `quickstart.md` and other documentation artifacts.

## Worker Spawning Guidelines

**When to spawn workers:**

1. **Sequential Phase Workers**: Spawn in order (architect → clarifier → spec-writer → planner → reviewer → planner → developers → consolidator)
2. **Parallel Implementation**: Spawn multiple developers in parallel based on [P] markers in `tasks.md` (max 5 concurrent)
3. **Cross-Phase Workers**: Spawn as needed:
   - `product-owner` - During clarification, specification, and planning phases
   - `security-engineer` - During planning and implementation phases
   - `devops-engineer` - During planning and consolidation phases
   - `technical-writer` - During implementation and consolidation phases
4. **Quality Workers**: Spawn `tester` and `code-reviewer` during implementation phase

**Worker Configuration:**
- Each worker has configs in `.boss/workers/[worker-name]/`
- Worker prompts are in `.boss/workers/[worker-name]/prompt.md`
- Container configs are in `.boss/workers/[worker-name]/container-config.json`
- Worker instructions are in `.boss/workers/[worker-name]/CLAUDE.md`

**Worker Execution:**
1. Create environment using `mcp_container-use_create_environment`
2. Load worker prompt from `.boss/workers/[worker-name]/prompt.md`
3. Execute worker using `mcp_container-use_execute_in_environment`
4. Worker runs in isolated container with its own branch
5. Review work using `container-use log <env_id>` and `container-use checkout <env_id>`
6. Merge worker branch after approval using `mcp_container-use_merge_environment`
7. Update `project-config.json` with worker summary

