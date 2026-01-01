# Container-Use MCP Operations

**CRITICAL:** All file, code, and shell operations MUST use Container-Use MCP environments.

## Git Hooks Enforcement

**MANDATORY:** All git commits MUST respect Husky git hooks:
- **commit-msg hook** enforces Conventional Commits format (e.g., `feat: description`, `fix: description`)
- **pre-commit hook** runs lint-staged, typecheck, and tests
- **pre-push hook** runs additional quality checks
- **Container-Use environments automatically run git hooks** - hooks are active in containers
- **Commit messages MUST follow format:** `<type>(<scope>): <description>`
  - Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`
  - Examples: `feat: add user authentication`, `fix(api): handle null response`, `chore: update dependencies`
- **Hooks are installed during bootstrap** - Husky is initialized automatically
- **package.json includes `prepare` script** - Runs `husky install` automatically when dependencies are installed

**NEVER:**
- NOT OK Use `--no-verify` flag to skip hooks (Container-Use commits will fail if hooks fail)
- NOT OK Bypass commit message validation
- NOT OK Skip pre-commit checks
- NOT OK Commit with invalid message format

**ALWAYS:**
- OK Let git hooks run automatically (Container-Use respects hooks - they cannot be bypassed)
- OK Use proper Conventional Commits format: `<type>(<scope>): <description>`
- OK Ensure hooks pass before committing (commits will be rejected if hooks fail)
- OK Run `pnpm install` after bootstrap to ensure Husky is fully set up

## How Container-Use Works

1. **Environment Creation**
   - Use `mcp_container-use_create_environment` to create a new environment
   - Container-Use automatically creates a branch: `container-use/<env-id>`
   - Each environment is an isolated container with its own git branch
   - Branch naming convention: `container-use/<env-id>` (e.g., `container-use/env-abc123`)
   - **Git hooks are active in Container-Use environments** - commits will be validated

2. **Container Configuration (MANDATORY - BEFORE Worker Spawning)**
   - **CRITICAL:** This is the ONLY exception where BOSS uses `environment_file_write`
   - **Purpose:** Configure container with worker-specific context, not BOSS's orchestration context
   - **Overwrite `.claude/CLAUDE.md` in container:**
     - Read `.boss/workers/[worker-name]/CLAUDE.md`
     - Use `mcp_container-use_environment_file_write` to write to `.claude/CLAUDE.md` in container
     - Container needs worker's instructions, not BOSS's orchestration instructions
   - **Copy worker-specific `.claude` files to container:**
     - Check if `.boss/workers/[worker-name]/.claude/` exists
     - If exists, copy all files maintaining directory structure:
       - `.claude/commands/` - Worker-specific commands
       - `.claude/skills/` - Worker-specific skills
       - `.claude/agents/` - Worker-specific agent configs
       - `.claude/settings*.json` - Worker-specific settings (if any)
     - Use `mcp_container-use_environment_file_write` for each file
   - **Why:** Container's Claude Code needs worker role context, not BOSS orchestrator context

3. **Worker Spawning (MANDATORY for BOSS)**
   - **CRITICAL:** BOSS must use `mcp_container-use_execute_in_environment` to spawn workers
   - **BOSS must NEVER write deliverables directly** using `environment_file_write` or `environment_run_cmd`
   - **Workers write all deliverables** (constitution.md, spec.md, plan.md, code, tests, etc.)
   - Each worker runs in its own isolated environment/container with worker-specific `.claude` config
   - Workers can access secrets from 1Password (configured in container-config.json)
   - All git operations happen automatically within the environment
   - **BOSS's role:** Orchestrate (create environment, configure container, spawn worker, review, merge)
   - **Worker's role:** Execute (write files, run commands, create code)

4. **Environment Management**
   - `mcp_container-use_list_environments` - List all active environments
   - `mcp_container-use_get_environment` - Get environment details
   - `mcp_container-use_delete_environment` - Delete environment (discards work)
   - `mcp_container-use_merge_environment` - Merge environment branch into target branch

5. **Work Review**
   - Use `container-use log <env_id>` (CLI) to view command history
   - Use `container-use diff <env_id>` (CLI) to view code changes
   - Use `container-use checkout <env_id>` (CLI) to test locally
   - Inform user: `container-use log <env_id>` AND `container-use checkout <env_id>`

**Key Rules:**
- **[DO]** ALWAYS create environments for any file/code/shell operation
- **[DO]** ALWAYS use Container-Use MCP tools (never git CLI)
- **[DO]** ALWAYS inform user how to view work via container-use CLI
- **[DO]** Configure container environment BEFORE spawning worker:
  - Overwrite `.claude/CLAUDE.md` with worker's CLAUDE.md
  - Copy worker-specific `.claude/` files to container
  - This is the ONLY exception where BOSS uses `environment_file_write`
- **[DO]** For large files, use shell commands (heredoc/cat) instead of `environment_file_write` with large content
- **[DON'T]** NEVER use git CLI directly
- **[DON'T]** NEVER modify .git directory manually
- **[DON'T]** NEVER execute operations outside environments
- **[DON'T]** NEVER use `environment_file_write` to create deliverables - workers write deliverables
- **[DON'T]** NEVER use `environment_file_write` with very large content (>1000 lines) - use shell commands instead

## Efficient File Operations

**CRITICAL:** For large files (README.md, long documentation, large config files, constitution.md, spec.md), use shell commands with heredoc syntax instead of `environment_file_write` with large content fields. This reduces MCP payload size, improves performance, and reduces token usage.

**Decision Tree:**
- **Files >100 lines or >5KB:** Use `environment_run_cmd` with heredoc/cat
- **Files <100 lines and <5KB:** Can use `environment_file_write` (but heredoc still preferred)

**Preferred Method (Large Files - README, docs, specs):**
```typescript
// Use environment_run_cmd with heredoc for large files
await mcp.containerUse.environment_run_cmd({
  environment_id: "env-123",
  command: `cat > README.md << 'EOF'
# Project Title

Long content here...
Multiple lines...
EOF`
});
```

**Alternative for Very Large Files (Multi-step):**
```typescript
// For extremely large files, write in chunks or use echo with >> append
await mcp.containerUse.environment_run_cmd({
  environment_id: "env-123",
  command: `cat > large-file.md << 'EOF'
[content part 1]
EOF
cat >> large-file.md << 'EOF'
[content part 2]
EOF`
});
```

**Small Files Only (<50 lines):**
```typescript
// Only use environment_file_write for very small files
await mcp.containerUse.environment_file_write({
  environment_id: "env-123",
  target_file: "src/utils.ts",
  contents: "export function helper() { return true; }"  // Small content only
});
```

**Why:** Large content in MCP calls increases payload size, latency, and token usage. Shell commands with heredoc are more efficient for files >100 lines. Container-Use executes shell commands efficiently inside the container.

