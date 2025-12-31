#!/bin/bash

# BOSS Launch Script
# Launches Claude Code/Cursor with MCP-only tool restrictions
# Uses 1Password CLI (op run) to securely inject secrets from .env file
# See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent

echo "🤖 Starting BOSS with MCP-only operations..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found. MCP servers may not have access to secrets."
  echo "   Create .env file with op:// references for 1Password secrets."
fi

# Check if op (1Password CLI) is available
if ! command -v op &> /dev/null; then
  echo "⚠️  Warning: 1Password CLI (op) not found in PATH."
  echo "   Install it from: https://developer.1password.com/docs/cli/get-started"
  echo "   MCP servers will start without secret resolution."
  USE_OP_RUN=false
else
  USE_OP_RUN=true
fi

# Check if claude command exists
if command -v claude &> /dev/null; then
  if [ "$USE_OP_RUN" = true ] && [ -f ".env" ]; then
    echo "🔐 Using 1Password to resolve secrets from .env file..."
    op run --env-file=.env -- claude --allowedTools \
      mcp__container-use__*,\
      mcp__github__*,\
      mcp__knowledge-base__* \
      "$@"
  else
    claude --allowedTools \
      mcp__container-use__*,\
      mcp__github__*,\
      mcp__knowledge-base__* \
      "$@"
  fi
elif command -v cursor &> /dev/null; then
  echo "⚠️  Cursor detected. MCP restrictions should be configured in Cursor settings."
  if [ "$USE_OP_RUN" = true ] && [ -f ".env" ]; then
    echo "🔐 Using 1Password to resolve secrets from .env file..."
    op run --env-file=.env -- cursor "$@"
  else
    cursor "$@"
  fi
else
  echo "❌ Error: Neither 'claude' nor 'cursor' command found in PATH"
  echo "Please install Claude Code or Cursor and ensure it's in your PATH"
  exit 1
fi

