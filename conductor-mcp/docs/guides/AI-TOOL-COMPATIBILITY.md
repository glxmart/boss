# AI Tool Compatibility Guide

## Key Learnings and Gotchas

### 1. Cursor is Compatible with Claude Code Configuration ✅

**GOTCHA**: You might think Cursor needs its own separate `.cursor/` folder.

**REALITY**: Cursor accepts Claude Code configuration format:

- ✅ Reads `CLAUDE.md`
- ✅ Uses `.claude/commands/`
- ✅ Uses `.claude/skills/`
- ✅ Respects `CLAUDE_CONFIG_DIR` environment variable

**Implication**: We only need ONE `.claude/` folder that works for both tools.

### 2. Workers ARE Agents (No Agents Folder Needed) ✅

**GOTCHA**: You might think workers need an `.claude/agents/` folder.

**REALITY**: Workers are already isolated agents running in dedicated containers:

- Each worker runs in its own container
- Each worker has a specific role (architect, developer-frontend, etc.)
- The worker itself IS the agent
- Agent-specific configuration would be redundant

**Implication**: We only generate `.claude/commands/` and `.claude/skills/` folders.

### 3. Simplified Configuration ✅

**GOTCHA**: You might think you need different configs for Claude Code vs Cursor.

**REALITY**: Both tools use the same configuration:

```
.boss/workers/<worker-type>/
  ├── CLAUDE.md           # Used by BOTH tools
  └── .claude/            # Used by BOTH tools
      ├── commands/       # Spec-Kit commands
      └── skills/         # Worker-specific skills
```

## Architecture Understanding

### What Boss-CLI Generates (Project-Level)

Boss-CLI creates worker-specific configuration in the bootstrapped project:

```bash
.boss/workers/architect/
  ├── CLAUDE.md          # Worker-specific instructions
  └── .claude/
      ├── commands/      # Shared + worker-specific commands
      │   ├── boss-commands.md      # Shared Spec-Kit commands (copied to ALL workers)
      │   └── <worker-commands>.md  # Worker-specific commands (if any)
      └── skills/        # Worker-specific skills
```

**Command Copying Logic:**

1. **Relevant Spec-Kit commands** from `boss-cli/templates/spec-kit/templates/commands/` are copied based on worker's `primaryCommand` field
   - Example: `architect` with `primaryCommand: "/speckit.constitution"` gets only `constitution.md`
   - Example: `planner` with `primaryCommand: ["/speckit.plan", "/speckit.tasks"]` gets `plan.md` and `tasks.md`
   - Workers without `primaryCommand` get no spec-kit commands
2. **Worker-specific commands** from `boss-cli/assets/worker-configs/<worker>/.claude/commands/` are copied to that worker only (if they exist)
3. **BOSS-specific commands** (like `boss-commands.md`) stay in `assets/claude-folder/commands/` and are NOT copied to workers

### What Conductor Owns (Package-Level)

Conductor-MCP maintains worker specifications in its own package:

```bash
conductor-mcp/worker-configs/architect/
  ├── metadata.json           # Worker capabilities, inputs, outputs
  └── container-config.json   # Container setup, tool installation

# NOTE: No .claude/ folder here - boss-cli generates that in the project
```

### How They Connect

The `container-config.json` sets the environment variable that tells the AI tool where to find its configuration:

```json
{
  "environment_variables": {
    "CLAUDE_CONFIG_DIR": "/workdir/.boss/workers/${workerName}/.claude"
  }
}
```

**Both Claude Code and Cursor** respect this environment variable and load configuration from the specified `.claude/` directory.

## Switching Between Claude Code and Cursor

### Default Configuration (Claude Code)

```json
{
  "install_commands": [
    "npm install -g pnpm",
    "npm install -g @anthropic-ai/claude-code",
    "pnpm install"
  ],
  "environment_variables": {
    "CLAUDE_CONFIG_DIR": "/workdir/.boss/workers/${workerName}/.claude"
  },
  "secrets": ["CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token"]
}
```

### Switching to Cursor

Edit `conductor-mcp/worker-configs/<worker-type>/container-config.json`:

**Change 1**: Install Cursor instead of Claude Code

```json
{
  "install_commands": [
    "npm install -g pnpm",
    "npm install -g cursor", // ← Changed from @anthropic-ai/claude-code
    "pnpm install"
  ]
}
```

**Change 2**: Update authentication (if different)

```json
{
  "secrets": [
    "CURSOR_AUTH_TOKEN=op://glx/cursor/auth-token" // ← Update based on Cursor's auth
  ]
}
```

**Important**: Keep `CLAUDE_CONFIG_DIR` pointing to `.claude` - Cursor will use it!

```json
{
  "environment_variables": {
    "CLAUDE_CONFIG_DIR": "/workdir/.boss/workers/${workerName}/.claude" // ← Keep as-is!
  }
}
```

## Why This Design Works

### 1. Configuration Compatibility

Both tools follow Claude's configuration conventions:

- `CLAUDE.md` for instructions
- `.claude/` folder structure
- `CLAUDE_CONFIG_DIR` environment variable

### 2. Container Isolation

Workers run in isolated containers:

- Tool installation is per-container
- Configuration is per-worker
- No conflicts between workers using different tools

### 3. Flexibility

You can configure workers independently:

- `architect` → Claude Code
- `developer-frontend` → Cursor
- `developer-backend` → Claude Code

Just edit each worker's `container-config.json` separately.

## Common Misconceptions (Gotchas)

### ❌ Misconception: Need separate .cursor folder

**✅ Reality**: Cursor uses .claude configuration

### ❌ Misconception: Need .claude/agents/ folder

**✅ Reality**: Workers are already agents, folder is redundant

### ❌ Misconception: CLAUDE_CONFIG_DIR must change for Cursor

**✅ Reality**: Cursor respects CLAUDE_CONFIG_DIR pointing to .claude

### ❌ Misconception: CLAUDE.md only works with Claude Code

**✅ Reality**: Both tools read CLAUDE.md

### ❌ Misconception: Need different configs for different tools

**✅ Reality**: Same config works for both tools

## Summary

**What you need to know**:

1. Only `.claude/` folder is generated (no `.cursor/`)
2. Both Claude Code and Cursor use the same `.claude/` configuration
3. Only `commands/` and `skills/` subfolders (no `agents/`)
4. To switch tools, just change the install command in `container-config.json`
5. Keep `CLAUDE_CONFIG_DIR` pointing to `.claude` regardless of tool

**Architectural Separation**:

- **Conductor owns**: `worker-configs/*/metadata.json` and `worker-configs/*/container-config.json` (NO .claude folders)
- **Boss-cli generates**: `.boss/workers/*/CLAUDE.md` and `.boss/workers/*/.claude/` in bootstrapped projects
- **Spec-Kit commands**: `boss-cli/templates/spec-kit/templates/commands/` (copied ONLY to workers with `primaryCommand` field)
- **Worker-specific commands**: `boss-cli/assets/worker-configs/<worker>/.claude/commands/` (copied to specific worker)
- **BOSS-specific commands**: `boss-cli/assets/claude-folder/commands/` (for BOSS only, NOT copied to workers)

**What makes this work**:

- Cursor is compatible with Claude configuration format
- Both tools respect `CLAUDE_CONFIG_DIR` environment variable
- Workers are isolated agents, so no agent-specific config needed
- Clear separation: conductor defines specs, boss-cli generates project configs
