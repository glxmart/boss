# OAuth Token Implementation for Workers

## Summary

This document describes the complete implementation of OAuth token injection for Conductor workers, ensuring Claude Code can authenticate inside worker containers.

## Problem

Workers running in isolated Docker containers need `CLAUDE_CODE_OAUTH_TOKEN` to authenticate with Claude's API. The token must be securely passed from the host through Conductor to worker containers.

## Solution Architecture

```
1Password Vault (op://glx/claude-code/oauth-token)
          ↓ (op run resolves)
     .env file (CLAUDE_CODE_OAUTH_TOKEN=op://...)
          ↓ (op run --env-file=.env)
   Conductor MCP (process.env.CLAUDE_CODE_OAUTH_TOKEN = actual-token)
          ↓ (resolveSecrets() function)
  Worker Container (CLAUDE_CODE_OAUTH_TOKEN=actual-token)
          ↓ (claude command uses)
    Claude Code ✅
```

## Changes Made

### 1. boss-cli (Bootstrap Generator)

**File: `boss-cli/src/generators/mcp-config.ts`**

#### a. Updated `.env` file generation (line 162-163)
```typescript
# Claude Code OAuth Token (used by Conductor MCP for workers)
CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token
```

#### b. Updated Conductor MCP config (line 116-122)
```typescript
'conductor': {
  // Use op run to wrap conductor and resolve CLAUDE_CODE_OAUTH_TOKEN from .env
  command: useOpRun ? 'op' : 'npx',
  args: useOpRun
    ? ['run', `--env-file=${envFile}`, '--', 'npx', '@boss/conductor-mcp', 'stdio']
    : ['@boss/conductor-mcp', 'stdio'],
}
```

**File: `boss-cli/scripts/debug-worker-spawn.sh`**

#### c. Updated debug script (line 26-27)
```javascript
// Use op run to resolve secrets from .env
const mcp = spawn('op', ['run', '--env-file=$PROJECT_PATH/.env', '--', 'npx', '@boss/conductor-mcp', 'stdio'], {
```

### 2. conductor-mcp (Worker Orchestrator)

**File: `conductor-mcp/src/config/container-mapper.ts`**

#### a. Added `resolveSecrets()` function (line 57-74)
```typescript
/**
 * Resolve secrets from conductor's environment
 *
 * When conductor is started with `op run --env-file=.env -- npx @boss/conductor-mcp stdio`,
 * 1Password CLI resolves op:// references from .env and injects them as environment variables.
 *
 * This function adds CLAUDE_CODE_OAUTH_TOKEN from conductor's environment to worker secrets.
 */
export function resolveSecrets(secrets: string[]): string[] {
  const resolvedSecrets = [...secrets];

  // Add CLAUDE_CODE_OAUTH_TOKEN from conductor's environment if available
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    resolvedSecrets.push(`CLAUDE_CODE_OAUTH_TOKEN=${process.env.CLAUDE_CODE_OAUTH_TOKEN}`);
  }

  return resolvedSecrets;
}
```

#### b. Updated `mapToContainerUseConfig()` to use `resolveSecrets()` (line 24)
```typescript
secrets: resolveSecrets(workerConfig.secrets),
```

**File: `conductor-mcp/worker-configs/*/container-config.json`** (15 files)

#### c. Removed `op://` references from all worker configs
```json
{
  "secrets": []  // Empty - Conductor injects CLAUDE_CODE_OAUTH_TOKEN automatically
}
```

## How It Works

### Bootstrap Phase (boss-cli)

1. User runs `boss bootstrap`
2. boss-cli generates `.env` file with `CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token`
3. boss-cli generates `.mcp.json` with Conductor wrapped in `op run --env-file=.env`
4. User starts IDE with `op run --env-file=.env -- code .` (or similar)

### Worker Spawn Phase (Conductor)

1. IDE starts Conductor MCP: `op run --env-file=.env -- npx @boss/conductor-mcp stdio`
2. 1Password CLI resolves `op://glx/claude-code/oauth-token` → actual token value
3. Conductor receives `process.env.CLAUDE_CODE_OAUTH_TOKEN = "actual-token-value"`
4. Conductor calls `mapToContainerUseConfig()` → calls `resolveSecrets()`
5. `resolveSecrets()` reads `process.env.CLAUDE_CODE_OAUTH_TOKEN` and adds to worker secrets
6. Worker container receives `CLAUDE_CODE_OAUTH_TOKEN=actual-token-value`
7. Claude Code inside container uses token for API authentication ✅

## Testing

### Verify OAuth Token Flow

```bash
# 1. Check .env file has token reference
cat .env | grep CLAUDE_CODE_OAUTH_TOKEN
# Should show: CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token

# 2. Test op run resolves token
op run --env-file=.env -- bash -c 'echo "Token length: ${#CLAUDE_CODE_OAUTH_TOKEN}"'
# Should show: Token length: 108 (or similar)

# 3. Spawn worker and check logs
pnpm debug:spawn clarifier /path/to/project
container-use list  # Get environment ID
container-use log <env-id>  # Should see Claude executing successfully
```

### Debugging Worker Containers

When conductor spawns a worker, you can debug the container using these commands:

```bash
# List all active and recent containers
container-use list

# View worker logs (shows command execution and output)
container-use log <worker-id>
# Example: container-use log normal-owl

# Open interactive terminal inside worker container
container-use terminal <worker-id>
# Example: container-use terminal model-polliwog

# Delete worker container (cleanup)
container-use delete <worker-id>
# Example: container-use delete normal-owl
```

**Common debugging workflow**:
```bash
# 1. Spawn a worker via conductor
# 2. Get worker ID from spawn response or conductor logs
# 3. Check logs for execution details
container-use log <worker-id>

# 4. If needed, open terminal to inspect environment
container-use terminal <worker-id>

# 5. Inside container, verify token and environment
echo $CLAUDE_CODE_OAUTH_TOKEN  # Should show actual token
claude --version               # Should work without auth errors
ls -la .boss/                  # Check worker files

# 6. Exit terminal and cleanup
exit
container-use delete <worker-id>
```

### Verify Worker Container Receives Token

Inside a worker container, the environment should have:
```bash
echo $CLAUDE_CODE_OAUTH_TOKEN  # Should output actual token (not op:// reference)
claude --version  # Should work without authentication errors
```

## Security Notes

1. **Never commit actual tokens** - Only `op://` references in .env
2. **Always use `op run`** - This resolves secrets at runtime
3. **Token stays in memory** - Never written to disk by Conductor
4. **Container isolation** - Each worker gets its own isolated environment

## Files Modified

### boss-cli
- ✅ `src/generators/mcp-config.ts` - Added CLAUDE_CODE_OAUTH_TOKEN to .env, wrapped Conductor with op run
- ✅ `scripts/debug-worker-spawn.sh` - Use op run to start Conductor

### conductor-mcp
- ✅ `src/config/container-mapper.ts` - Added `resolveSecrets()` function
- ✅ `src/orchestration/task-executor.ts` - Removed `--print` flag, extract `structured_output` from result
- ✅ `worker-configs/*/container-config.json` (15 files) - Removed op:// references

## Future Projects

All future projects bootstrapped with `boss bootstrap` will automatically:
1. ✅ Have `.env` file with `CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token`
2. ✅ Have `.mcp.json` with Conductor wrapped in `op run`
3. ✅ Worker containers will receive actual OAuth token
4. ✅ Claude Code will authenticate successfully in workers

## Troubleshooting

### Worker fails with "Maximum call stack size exceeded"
- **Cause**: OAuth token is `op://` reference instead of actual token
- **Fix**: Ensure Conductor is started with `op run --env-file=.env`

### Worker fails with authentication error
- **Cause**: `CLAUDE_CODE_OAUTH_TOKEN` not set in Conductor environment
- **Fix**: Verify `.env` file exists and has correct `op://` reference

### Debug script doesn't work
- **Cause**: Script not using `op run`
- **Fix**: Use updated `scripts/debug-worker-spawn.sh` that includes `op run`

### Worker spawn returns "success: false" with JSON parsing error
- **Cause**: Claude Code `--output-format json` wraps output in `{type: "result", structured_output: {...}}` format
- **Fix**: Updated `task-executor.ts` to extract `structured_output` field from result (fixed in v0.1.0+)

## References

- [1Password Secret References](https://developer.1password.com/docs/cli/secret-references/)
- [Securing MCP Servers with 1Password](https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent)
- [Claude Code Documentation](https://code.claude.com/docs)
