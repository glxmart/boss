#!/usr/bin/env bash
# Debug script to test worker spawning via Conductor MCP
# Usage: debug-worker-spawn.sh [worker-type] [project-path]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"

# Change to project root for all operations
cd "$PROJECT_ROOT"

WORKER_TYPE="${1:-clarifier}"
PROJECT_PATH="${2:-/tmp/conductor-e2e-test}"

echo "🔍 Debug: Spawning $WORKER_TYPE worker"
echo "   Project: $PROJECT_PATH"
echo ""

# Ensure project exists
if [ ! -d "$PROJECT_PATH" ]; then
  echo "❌ Project not found: $PROJECT_PATH"
  echo "   Run bootstrap first or provide valid project path"
  exit 1
fi

# Call conductor MCP via op run (to inject CLAUDE_CODE_OAUTH_TOKEN)
echo "📦 Calling Conductor MCP with op run..."
node -e "
const { spawn } = require('child_process');

// Use op run to resolve secrets from .env
const mcp = spawn('op', ['run', '--env-file=$PROJECT_PATH/.env', '--', 'npx', '@glxmart/conductor-mcp', 'stdio'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'spawn_worker',
    arguments: {
      workerType: '$WORKER_TYPE',
      taskPrompt: 'List 3 key features needed for a TODO app. Be brief.',
      projectPath: '$PROJECT_PATH',
      targetBranch: 'feature/debug-test'
    }
  }
};

console.log('📤 Sending request:', JSON.stringify(request, null, 2));

mcp.stdin.write(JSON.stringify(request) + '\\n');

let buffer = '';
mcp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\\n');
  buffer = lines.pop();

  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('📥 Response:', JSON.stringify(response, null, 2));

        if (response.id === 1) {
          mcp.stdin.end();
        }
      } catch (e) {
        console.log('Raw:', line);
      }
    }
  });
});

mcp.on('close', (code) => {
  console.log('\\n✅ MCP process exited with code:', code);
  process.exit(code);
});

setTimeout(() => {
  console.log('\\n⏱️  Timeout after 3 minutes');
  mcp.kill();
  process.exit(1);
}, 180000); // 3 minute timeout
"
