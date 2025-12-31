ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

DO NOT install or use the git cli with the environment_run_cmd tool. All environment tools will handle git operations for you. Changing ".git" yourself will compromise the integrity of your environment.

You MUST inform the user how to view your work using `container-use log <env_id>` AND `container-use checkout <env_id>`. Failure to do this will make your work inaccessible to others.

---

# ${config.name}

## Project Overview

This is a BOSS (Business-Orchestrated Software System) project.

**Template:** ${templateInfo.name}
**Quality Preset:** ${qualityInfo.name}
**Stack:** ${templateInfo.stack}

## BOSS Methodology

This project uses Spec-Kit for specification-driven development with the following phases:

1. **Constitution** - Governing principles (NON-NEGOTIABLE)
2. **Clarification** - Business requirements gathering
3. **Specification** - User stories in Given/When/Then format
4. **Planning** - Technical approach and architecture
5. **Validation** - Constitution compliance check
6. **Task Breakdown** - Granular tasks with [P] parallel markers
7. **Implementation** - TDD + BDD with feature documentation
8. **Consolidation** - Integration and delivery artifacts

## Quality Standards

- **Test-First (NON-NEGOTIABLE)** - TDD cycle: red → green → refactor
- **BDD (Mandatory)** - Behavior-Driven Development with Given/When/Then
- **Feature Documentation (NON-NEGOTIABLE)** - Every feature must be documented
- **Coverage:** ≥${qualityInfo.gates.coverage}%
- **Mutation Testing:** ≥${qualityInfo.gates.mutation}%

## Environment-Only Operations

**CRITICAL:** All file, code, and shell operations MUST use container-use environments.

- DO NOT use git CLI directly
- DO NOT modify .git directory
- All operations must go through container-use MCP
- Inform user: `container-use log <env_id>` AND `container-use checkout <env_id>`

## Project Structure

- `.boss/` - BOSS orchestration configuration
- `.specify/` - Spec-Kit structure (templates, scripts, memory, specs)
- `.container-use/` - Container-use environment configuration
- `.claude/` - Claude Code/Cursor rules and commands

## References

- See `.claude/rules/` for detailed coding standards
- See `.specify/memory/constitution.md` for project constitution
- See `.boss/config.yaml` for BOSS configuration

