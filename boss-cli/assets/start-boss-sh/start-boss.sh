#!/bin/bash

# BOSS Launch Script
# Launches Claude Code/Cursor with MCP-only tool restrictions
# MCP servers are configured to use op run automatically (see .mcp.json)
# See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent

echo "🤖 Starting BOSS with MCP-only operations..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found. MCP servers may not have access to secrets."
  echo "   Create .env file with op:// references for 1Password secrets."
fi

# Check if op (1Password CLI) is available and signed in (for MCP servers)
if command -v op &> /dev/null; then
  if ! op account list &> /dev/null; then
    echo "⚠️  Warning: 1Password CLI (op) is not signed in."
    echo "   Run: eval \$(op signin) to sign in"
    echo "   MCP servers configured with op:// references will fail without authentication."
  fi
fi

# Check if claude command exists
if command -v claude &> /dev/null; then
  claude --allowedTools \
    mcp__container-use__*,\
    mcp__github__*,\
    mcp__knowledge-base__* \
    "$@"
elif command -v cursor &> /dev/null; then
  echo "⚠️  Cursor detected. MCP restrictions should be configured in Cursor settings."
  cursor "$@"
else
  echo "❌ Error: Neither 'claude' nor 'cursor' command found in PATH"
  echo "Please install Claude Code or Cursor and ensure it's in your PATH"
  exit 1
fi

