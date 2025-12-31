import path from 'path';
import { writeFile, makeExecutable } from '../utils/file-system.js';

export async function generateStartBossScript(projectPath: string): Promise<void> {
  const script = `#!/bin/bash

# BOSS Launch Script
# Launches Claude Code/Cursor with MCP-only tool restrictions

echo "🤖 Starting BOSS with MCP-only operations..."

# Check if claude command exists
if command -v claude &> /dev/null; then
  claude --allowedTools \\
    mcp__container-use__*,\\
    mcp__github__*,\\
    mcp__knowledge-base__* \\
    "$@"
elif command -v cursor &> /dev/null; then
  echo "⚠️  Cursor detected. MCP restrictions should be configured in Cursor settings."
  cursor "$@"
else
  echo "❌ Error: Neither 'claude' nor 'cursor' command found in PATH"
  echo "Please install Claude Code or Cursor and ensure it's in your PATH"
  exit 1
fi
`;

  const scriptPath = path.join(projectPath, 'start-boss.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}

