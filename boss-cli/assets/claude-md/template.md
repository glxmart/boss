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

## Branch Management & Workflow

**MANDATORY WORKFLOW FOR EVERY CHANGE:**

1. **Create New Branch** - ALWAYS create a new branch for every change/feature/task
   - Use container-use MCP to create environments (each environment = new branch)
   - Container-use automatically creates branches: `container-use/env-<id>`
   - These branches are created locally and will be pushed to remote

2. **Spawn Workers via Container-Use**
   - Use `container-use` MCP to spawn workers for all implementation tasks
   - Each worker runs in an isolated container with its own branch
   - Container-use manages all git operations (commits, branches) automatically
   - **DO NOT** use git CLI directly - container-use handles everything

3. **Review & Approve Work**
   - Use `container-use log <env_id>` to review worker activity
   - Use `container-use diff <env_id>` to review code changes
   - Use `container-use checkout <env_id>` to test locally
   - Wait for human approval before merging

4. **Merge Approved Work**
   - After approval, use `container-use merge <env_id>` to merge worker changes
   - Container-use will merge the worker's branch into the target branch
   - This consolidates all worker changes into a single branch

5. **Push Branch to Remote**
   - After merging worker changes, push the branch to remote repository
   - Use GitHub MCP to push the branch: `mcp__github__*` tools

6. **Create Pull Request**
   - Use GitHub MCP to create a PR from the branch
   - Include details about the changes, workers used, and quality gate results
   - Link to related specifications or issues

**IMPORTANT NOTES:**
- Container-use creates remote branches locally - BOSS must use container-use MCP to manage all worker changes
- Never use git CLI directly - container-use handles all branch operations
- Each worker environment = isolated branch = isolated work
- All worker branches must be merged via container-use before creating PR
- The final PR should contain all approved worker changes merged together

## GitHub Repository Requirements

**CRITICAL: Repository Privacy Policy**

- **ALL GitHub repositories MUST be created as PRIVATE** - NO EXCEPTIONS
- **NEVER create public repositories** - This is a security requirement
- When using GitHub MCP to create repositories, ALWAYS set `private: true`
- This applies to:
  - Initial repository creation during bootstrap
  - Any new repositories created for projects, features, or sub-projects
  - Forked repositories (if applicable)

**Repository Creation Example:**
```typescript
// ✅ CORRECT - Always use private: true
await mcp.github.createRepository({
  name: "project-name",
  description: "BOSS project",
  private: true,  // MANDATORY - Never false
  // ... other settings
});

// ❌ WRONG - Never create public repos
// private: false  // FORBIDDEN
```

## Project Structure

- `.boss/` - BOSS orchestration configuration
- `.specify/` - Spec-Kit structure (templates, scripts, memory, specs)
- `.container-use/` - Container-use environment configuration
- `.claude/` - Claude Code/Cursor rules and commands

## References

- See `.claude/rules/` for detailed coding standards
- See `.specify/memory/constitution.md` for project constitution
- See `.boss/config.yaml` for BOSS configuration

