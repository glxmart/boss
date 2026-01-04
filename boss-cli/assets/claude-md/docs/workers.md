# Available Workers

BOSS has access to **15 specialized workers** that form a fully functional, high-performance engineering team. Each worker is aware of their role, uses Spec-Kit commands, and follows team collaboration patterns.

## How to Discover and Load Workers

**CRITICAL: Worker Discovery Instructions**

When you need to find available workers or load a worker's configuration:

1. **Discover Available Workers:**
   - List directories in `.boss/workers/` to find available worker names
   - Use: `ls -la .boss/workers/` or list the directory contents
   - Each worker is a **directory** (not a file), named after the worker type (e.g., `architect`, `clarifier`, `spec-writer`)
   - **DO NOT** search for `*.yaml` files - workers are directories, not YAML files

2. **Load Worker Configuration:**
   - **Worker prompt:** Read `.boss/workers/[worker-name]/prompt.md` (contains the worker's role and instructions)
   - **Worker instructions:** Read `.boss/workers/[worker-name]/CLAUDE.md` (contains execution guidelines)
   - **Container config:** Read `.boss/workers/[worker-name]/container-config.json` (contains container-use environment settings)
   - **DO NOT** look for `README.md` files - use `prompt.md` and `CLAUDE.md` instead

3. **Container-Use Configuration:**
   - **Global config:** Read `.container-use/environment.json` (NOT `config.yaml`)
   - This file contains base container settings and environment variables
   - **DO NOT** look for `.container-use/config.yaml` - it doesn't exist

**Example Worker Discovery:**
```bash
# List available workers
ls .boss/workers/
# Output: architect  clarifier  spec-writer  planner  ...

# Load architect worker prompt
cat .boss/workers/architect/prompt.md

# Load architect container config
cat .boss/workers/architect/container-config.json
```

**Common Mistakes to Avoid:**
- NOT OK **DO NOT** search for `.boss/workers/*.yaml` - workers are directories, not YAML files
- NOT OK **DO NOT** read `.boss/workers/[worker-name]/README.md` - use `prompt.md` instead
- NOT OK **DO NOT** read `.container-use/config.yaml` - read `.container-use/environment.json` instead

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

**Worker Execution (MANDATORY - BOSS Must Spawn Workers):**

**CRITICAL:** BOSS must ALWAYS spawn workers using Conductor MCP. BOSS must NEVER write deliverables directly.

1. **Spawn worker using Conductor:**
   ```typescript
   await conductor.spawn_worker({
     workerType: 'architect',
     taskPrompt: 'Create constitution with TDD, BDD, and quality standards',
     targetBranch: 'feature/boss-initial-setup'
   });
   ```

2. **Conductor handles everything:**
   - Loads worker config from `.boss/workers/[worker-name]/`
   - Creates container environment
   - Configures `.claude/CLAUDE.md` with worker-specific instructions
   - Copies worker-specific `.claude/` files to container
   - Executes worker task in isolated environment
   - Tracks worker state and manifest

3. **Review work:**
   - Check worker status: `conductor.get_worker_status({ workerId })`
   - Review worker manifest for deliverables

4. **Merge worker branch:**
   - Use `conductor.merge_worker({ workerId })` to merge worker's branch

5. **Update `project-config.json`** with worker summary

**BOSS MUST NEVER:**
- NOT OK Write deliverables directly (constitution.md, spec.md, plan.md, code, tests, etc.)
- NOT OK Use container-use MCP directly - use Conductor instead
- NOT OK Read worker prompts and then do the work yourself - spawn the worker instead

**BOSS ONLY:**
- OK Call Conductor tools to spawn workers
- OK Provide task prompts for workers
- OK Monitor worker status
- OK Decide when to merge or terminate workers

**Communication Guidelines:**
- **CRITICAL:** Use plain text only when communicating with workers - NO emojis
- All messages, instructions, prompts, and feedback to workers must be in plain text format
- When loading worker prompts or sending instructions via Container-Use, use text-only communication
- Emojis should not be used in any worker-related communication, prompts, or instructions

