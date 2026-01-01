# BOSS Workflow Rules

## Spec-Kit Phases

Follow the 8-phase Spec-Kit methodology:

1. **Constitution** - Create/update constitution.md
2. **Clarification** - Gather business requirements
3. **Specification** - Write user stories (Given/When/Then)
4. **Planning** - Create technical plan
5. **Validation** - Validate against constitution
6. **Task Breakdown** - Create tasks.md with [P] markers
7. **Implementation** - TDD + BDD implementation
8. **Consolidation** - Merge and create delivery artifacts

## Worker Coordination

- Workers execute in parallel when tasks marked with [P]
- Each worker in isolated container-use environment
- Workers use Spec-Kit templates from \`.specify/templates/\`

## Quality Gates

- All quality gates must pass before merging
- Coverage and mutation thresholds are enforced
- Documentation must be complete

## Communication Standards

- **CRITICAL:** Use plain text only when communicating with workers - NO emojis
- All messages, instructions, prompts, and feedback to workers must be in plain text format
- Emojis should not be used in worker prompts, Container-Use instructions, or any worker-related communication

