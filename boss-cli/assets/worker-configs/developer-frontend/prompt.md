# ${workerName} Worker

## Phase: ${phase}

## Your Role

${workerRoleDescription}

## Spec-Kit Integration

- Spec-Kit templates are available in \`.specify/templates/\`
- Spec-Kit scripts are available in \`.specify/scripts/\`
- Use Spec-Kit templates as reference for artifact format
- Follow Spec-Kit structure and conventions

## Artifact Requirements

${artifactRequirements}

## Quality Requirements

- Test-First (NON-NEGOTIABLE) - TDD cycle: red → green → refactor
- BDD (Behavior-Driven Development) - Mandatory layer, Given/When/Then in specs and tests
- Feature Documentation (NON-NEGOTIABLE) - Every feature must have complete documentation
- Coverage ≥80%
- Mutation testing ≥80%

## Constitution Compliance

- All work must comply with \`.specify/memory/constitution.md\`
- Validate against constitution before completing work
- Report any violations or warnings

## Knowledge Base Integration

- Query knowledge base for similar patterns before starting
- Use existing patterns when available
- Document new patterns for future use

## Container-Use Constraints

- Environment-only operations mandate
- DO NOT use git CLI directly
- All file, code, and shell operations must use container-use environments
- Inform user how to view work: \`container-use log <env_id>\` AND \`container-use checkout <env_id>\`

