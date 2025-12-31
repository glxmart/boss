#!/bin/bash

# BOSS Launch Script
# Launches Claude Code/Cursor with MCP-only tool restrictions
# MCP servers are configured to use op run automatically (see .mcp.json)
# See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent

echo "🤖 Starting BOSS with MCP-only operations..."

# CRITICAL: Install dependencies before launching Claude
# This prevents git hook failures due to missing dependencies (e.g., tsc not found)
if [ -f "package.json" ]; then
  if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📦 Installing dependencies (required for git hooks)..."
    if command -v pnpm &> /dev/null; then
      pnpm install
    elif command -v npm &> /dev/null; then
      npm install
    else
      echo "⚠️  Warning: Neither pnpm nor npm found. Dependencies may not be installed."
      echo "   Git hooks may fail if dependencies are missing."
    fi
  fi
fi

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

# Check initialization status and create instruction files if needed
INIT_NEEDED=false
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
    
    # Create instruction file that CLAUDE.md references
    mkdir -p .boss
    cat > .boss/init-instruction.txt << 'EOF'
CRITICAL: Check .boss/project-config.json initialization status. If initialization.stage is not 'ready', automatically complete the initial setup:

1. Create feature/boss-initial-setup branch if needed (check if it exists first)
2. Check if GitHub remote exists
3. If no remote exists:
   - Ask user for repository preferences (private/public, organization)
   - Create repository using GitHub MCP
   - Add remote and push initial commit
4. Mark initialization.stage as 'ready' in project-config.json

Do this automatically without asking for confirmation to proceed. Start immediately when BOSS launches.
EOF
    
    # Also inject into CLAUDE.md for visibility
    if [ -f "CLAUDE.md" ]; then
      # Check if instruction is already injected (avoid duplicate injection)
      if ! grep -q "🚨 STARTUP INSTRUCTION" CLAUDE.md 2>/dev/null; then
        # Create backup
        cp CLAUDE.md CLAUDE.md.bak 2>/dev/null || true
        # Prepend instruction to CLAUDE.md
        {
          echo "# 🚨 STARTUP INSTRUCTION - READ THIS FIRST"
          echo ""
          echo "**CRITICAL:** Read \`.boss/init-instruction.txt\` immediately and follow the instructions. The initialization stage is: \`$INIT_STAGE\`. Complete the initial setup automatically without asking for confirmation."
          echo ""
          echo "---"
          echo ""
          cat CLAUDE.md.bak
        } > CLAUDE.md
      fi
    fi
    
    # Create a .claude rule file that gets read automatically (more reliable)
    if [ -d ".claude" ] || [ -d ".cursor" ]; then
      CLAUDE_DIR=".claude"
      [ -d ".cursor" ] && [ ! -d ".claude" ] && CLAUDE_DIR=".cursor"
      mkdir -p "$CLAUDE_DIR/rules"
      cat > "$CLAUDE_DIR/rules/startup-init.md" << EOF
# 🚨 CRITICAL STARTUP INSTRUCTION

**READ THIS FIRST BEFORE DOING ANYTHING ELSE**

The project initialization is not complete. Check \`.boss/project-config.json\` - the \`initialization.stage\` is currently: **\`$INIT_STAGE\`**

**YOU MUST:**
1. Read \`.boss/init-instruction.txt\` for detailed instructions
2. Automatically complete the initial setup without asking the user
3. Create \`feature/boss-initial-setup\` branch if needed
4. Check if GitHub remote exists
5. Create repository if needed (ask user only for preferences: private/public, organization)
6. Add remote, push initial commit
7. Mark \`initialization.stage\` as 'ready' in \`.boss/project-config.json\`

**DO NOT wait for user input - do this automatically now.**
EOF
    fi
  else
    # Clean up instruction files if initialization is complete
    [ -f ".boss/init-instruction.txt" ] && rm -f .boss/init-instruction.txt
    [ -f ".claude/rules/startup-init.md" ] && rm -f .claude/rules/startup-init.md
    [ -f ".cursor/rules/startup-init.md" ] && rm -f .cursor/rules/startup-init.md
    
    # Restore original CLAUDE.md if backup exists and initialization is complete
    if [ -f "CLAUDE.md.bak" ]; then
      # Remove the startup instruction section if it exists
      if grep -q "🚨 STARTUP INSTRUCTION" CLAUDE.md 2>/dev/null; then
        # Remove everything from "# 🚨 STARTUP INSTRUCTION" to the first "---" separator
        sed '/^# 🚨 STARTUP INSTRUCTION/,/^---$/d' CLAUDE.md > CLAUDE.md.tmp && mv CLAUDE.md.tmp CLAUDE.md
        # Remove any leading blank lines (macOS and Linux compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
          sed -i '' '/./,$!d' CLAUDE.md 2>/dev/null || true
        else
          sed -i '/./,$!d' CLAUDE.md 2>/dev/null || true
        fi
      fi
      # Restore from backup if file seems corrupted
      if [ ! -s "CLAUDE.md" ] || ! grep -q "BOSS" CLAUDE.md 2>/dev/null; then
        mv CLAUDE.md.bak CLAUDE.md
      else
        rm -f CLAUDE.md.bak
      fi
    fi
  fi
fi

# Check if claude command exists
if command -v claude &> /dev/null; then
  # Launch Claude with MCP-only restrictions
  # Initial instruction is injected into CLAUDE.md if initialization is needed
  claude --allowedTools \
    mcp__container-use__*,\
    mcp__github__*,\
    mcp__knowledge-base__* \
    "$@"
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

