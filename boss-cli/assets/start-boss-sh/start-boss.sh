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

# Check initialization status and auto-trigger setup if needed
INIT_NEEDED=false
INIT_MESSAGE=""
if [ -f ".boss/project-config.json" ]; then
  # Check if initialization stage is not "ready"
  INIT_STAGE=$(grep -o '"stage":\s*"[^"]*"' .boss/project-config.json | grep -o '"stage":\s*"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "")
  if [ -z "$INIT_STAGE" ]; then
    # Try alternative parsing method
    INIT_STAGE=$(grep '"stage"' .boss/project-config.json | head -1 | sed 's/.*"stage"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' 2>/dev/null || echo "")
  fi
  if [ "$INIT_STAGE" != "ready" ] && [ -n "$INIT_STAGE" ]; then
    INIT_NEEDED=true
    echo "📋 Initial setup needed (stage: $INIT_STAGE)"
    echo "🚀 BOSS will automatically complete initial setup when it starts."
    INIT_MESSAGE="Check .boss/project-config.json initialization status. If initialization.stage is not 'ready', automatically complete the initial setup: create feature/boss-initial-setup branch if needed, check if GitHub remote exists, create repository if needed (ask user for preferences: private/public, organization), add remote, push initial commit, and mark initialization.stage as 'ready'. Do this automatically without asking for confirmation to proceed."
  fi
fi

# Check if claude command exists
if command -v claude &> /dev/null; then
  if [ "$INIT_NEEDED" = true ] && [ -n "$INIT_MESSAGE" ]; then
    # Pass initial instruction via stdin to complete setup automatically
    echo "$INIT_MESSAGE" | claude --allowedTools \
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
  if [ "$INIT_NEEDED" = true ]; then
    echo "📋 Initial setup needed. BOSS will automatically check and complete setup when Cursor opens."
  fi
  cursor "$@"
else
  echo "❌ Error: Neither 'claude' nor 'cursor' command found in PATH"
  echo "Please install Claude Code or Cursor and ensure it's in your PATH"
  exit 1
fi

