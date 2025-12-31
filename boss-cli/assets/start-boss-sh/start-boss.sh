#!/bin/bash

# BOSS Launch Script
# Launches Claude Code/Cursor with MCP-only tool restrictions
# MCP servers are configured to use op run automatically (see .mcp.json)
# See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent

# Configuration
DEBUG=false
INIT_PROMPT="Check .boss/project-config.json initialization status. If initialization.stage is not 'ready', automatically complete the initial setup in this EXACT order: 1) Check if GitHub remote exists using 'git remote -v', 2) If no remote exists: create repository if needed using GitHub MCP (GitHub MCP is already authenticated using GITHUB_PERSONAL_ACCESS_TOKEN - use it directly), ask user for preferences (private/public, organization), add remote using HTTPS URL format 'git remote add origin https://github.com/<owner>/<repo>.git' (NEVER use SSH git@github.com format - always use HTTPS), 3) CRITICAL - BEFORE pushing: Verify all validation checks pass by running 'pnpm typecheck', 'pnpm lint', 'bash scripts/security-check.sh', and 'pnpm test:unit' (or npm equivalents). The pre-push hook allows the first push to main, but validation checks still run and will block the push if they fail. Fix any failures before pushing. 4) FIRST push main branch: 'git push -u origin main' (this contains all bootstrap files - git will use GITHUB_TOKEN from environment automatically, which is set to same value as GITHUB_PERSONAL_ACCESS_TOKEN). If push fails due to validation errors, fix the issues and try again. 5) THEN create feature/boss-initial-setup branch if it doesn't exist: 'git checkout -b feature/boss-initial-setup', 6) Push feature branch: 'git push -u origin feature/boss-initial-setup', 7) Mark initialization.stage as 'ready' in project-config.json, 8) Commit and push project-config.json changes: 'git add .boss/project-config.json && git commit -m \"chore: update project-config.json\" && git push'. Do this automatically without asking for confirmation to proceed."

# Parse command-line arguments
for arg in "$@"; do
  case $arg in
    --debug)
      DEBUG=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

# Debug logging function
debug_log() {
  if [ "$DEBUG" = true ]; then
    echo "🔍 [DEBUG] $1" >&2
  fi
}

# Error logging function
error_log() {
  echo "❌ Error: $1" >&2
}

# Warning logging function
warning_log() {
  echo "⚠️  Warning: $1" >&2
}

# Info logging function
info_log() {
  echo "$1"
}

# Detect which IDE is available (Claude Code vs Cursor)
detect_ide() {
  local ide_dir=""
  
  # Check for .claude directory first (Claude Code)
  if [ -d ".claude" ]; then
    ide_dir=".claude"
    debug_log "Detected .claude directory (Claude Code)"
  # Check for .cursor directory
  elif [ -d ".cursor" ]; then
    ide_dir=".cursor"
    debug_log "Detected .cursor directory (Cursor)"
  # Check for CLI commands
  elif command -v claude &> /dev/null || command -v claude-code &> /dev/null; then
    ide_dir=".claude"
    debug_log "Detected Claude Code CLI command"
  elif command -v cursor &> /dev/null; then
    ide_dir=".cursor"
    debug_log "Detected Cursor CLI command"
  else
    # Default to .claude if neither detected
    ide_dir=".claude"
    debug_log "No IDE detected, defaulting to .claude"
  fi
  
  echo "$ide_dir"
}

# Ensure all necessary directories exist
ensure_directories() {
  local ide_dir="$1"
  
  debug_log "Ensuring directories exist: .boss, $ide_dir, $ide_dir/rules"
  
  mkdir -p .boss || {
    error_log "Failed to create .boss directory"
    return 1
  }
  
  mkdir -p "$ide_dir" || {
    error_log "Failed to create $ide_dir directory"
    return 1
  }
  
  mkdir -p "$ide_dir/rules" || {
    error_log "Failed to create $ide_dir/rules directory"
    return 1
  }
  
  debug_log "All directories created successfully"
  return 0
}

# Get initialization stage from project-config.json
get_init_stage() {
  local config_file=".boss/project-config.json"
  local stage=""
  
  if [ ! -f "$config_file" ]; then
    debug_log "Project config file not found: $config_file"
    echo ""
    return 0
  fi
  
  # Try using jq if available (most reliable)
  if command -v jq &> /dev/null; then
    debug_log "Using jq to parse JSON"
    stage=$(jq -r '.initialization.stage // empty' "$config_file" 2>/dev/null)
    if [ -n "$stage" ] && [ "$stage" != "null" ]; then
      debug_log "Parsed stage with jq: $stage"
      echo "$stage"
      return 0
    fi
  fi
  
  # Fallback to grep/sed parsing
  debug_log "Using grep/sed to parse JSON (jq not available or failed)"
  
  # Try first method: grep with regex
  stage=$(grep -o '"stage":\s*"[^"]*"' "$config_file" 2>/dev/null | head -1 | grep -o '"[^"]*"' | head -1 | tr -d '"' || echo "")
  
  if [ -z "$stage" ]; then
    # Try alternative method: sed extraction
    stage=$(grep '"stage"' "$config_file" 2>/dev/null | head -1 | sed 's/.*"stage"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
  fi
  
  # Also try nested path: initialization.stage
  if [ -z "$stage" ]; then
    stage=$(grep -A 5 '"initialization"' "$config_file" 2>/dev/null | grep '"stage"' | head -1 | sed 's/.*"stage"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
  fi
  
  if [ -n "$stage" ]; then
    debug_log "Parsed stage with grep/sed: $stage"
  else
    debug_log "Could not parse initialization stage from $config_file"
  fi
  
  echo "$stage"
}

# Create initialization instruction files
create_init_files() {
  local stage="$1"
  local ide_dir="$2"
  
  if [ -z "$stage" ]; then
    debug_log "No initialization stage provided, skipping file creation"
    return 0
  fi
  
  info_log "📋 Initial setup needed (stage: $stage)"
  info_log "🚀 BOSS will automatically complete initial setup when it starts."
  
  # Ensure directories exist
  if ! ensure_directories "$ide_dir"; then
    error_log "Failed to create directories for init files"
    return 1
  fi
  
  # 1. Create .boss/init-instruction.txt
  debug_log "Creating .boss/init-instruction.txt"
  echo "$INIT_PROMPT" > .boss/init-instruction.txt || {
    error_log "Failed to create .boss/init-instruction.txt"
    return 1
  }
  info_log "✅ Created .boss/init-instruction.txt"
  
  # 2. Create .claude/rules/startup-init.md or .cursor/rules/startup-init.md
  local rules_file="$ide_dir/rules/startup-init.md"
  debug_log "Creating $rules_file"
  cat > "$rules_file" << EOF
# 🚨🚨🚨 CRITICAL STARTUP INSTRUCTION - EXECUTE IMMEDIATELY 🚨🚨🚨

## ⚠️ AUTOMATIC ACTION REQUIRED - DO NOT WAIT FOR USER INPUT ⚠️

**The project initialization is NOT complete.**

**Current initialization stage:** \`$stage\`

**YOU MUST IMMEDIATELY (right now, without waiting):**

$INIT_PROMPT

**This is a RULE - you MUST execute this automatically when you start.**
**DO NOT wait for the user to ask you to do this.**
**DO NOT wait for any confirmation.**
**START WORKING ON THIS IMMEDIATELY.**

**Reference files:**
- \`.boss/project-config.json\` - Check initialization status here
- \`.boss/init-instruction.txt\` - Full instruction details
- \`CLAUDE.md\` - Also contains this instruction at the top
EOF
  if [ $? -eq 0 ]; then
    info_log "✅ Created $rules_file"
  else
    error_log "Failed to create $rules_file"
    return 1
  fi
  
  # 3. Inject into CLAUDE.md if it exists
  if [ -f "CLAUDE.md" ]; then
    inject_claude_md "$stage"
  else
    debug_log "CLAUDE.md not found, skipping injection"
  fi
  
  return 0
}

# Inject initialization instruction into CLAUDE.md
inject_claude_md() {
  local stage="$1"
  
  if [ ! -f "CLAUDE.md" ]; then
    debug_log "CLAUDE.md not found, skipping injection"
    return 0
  fi
  
  # Check if instruction is already injected (avoid duplicate injection)
  if grep -q "🚨 STARTUP INSTRUCTION" CLAUDE.md 2>/dev/null; then
    debug_log "Startup instruction already exists in CLAUDE.md, skipping injection"
    return 0
  fi
  
  debug_log "Injecting startup instruction into CLAUDE.md"
  
  # Create backup
  if ! cp CLAUDE.md CLAUDE.md.bak 2>/dev/null; then
    warning_log "Failed to create backup of CLAUDE.md, proceeding anyway"
  else
    debug_log "Created backup: CLAUDE.md.bak"
  fi
  
  # Prepend instruction to CLAUDE.md with very prominent formatting
  {
    echo "# 🚨🚨🚨 CRITICAL STARTUP INSTRUCTION - READ THIS FIRST 🚨🚨🚨"
    echo ""
    echo "## ⚠️ AUTOMATIC ACTION REQUIRED - DO NOT WAIT FOR USER INPUT ⚠️"
    echo ""
    echo "**The initialization stage is currently: \`$stage\`**"
    echo ""
    echo "**YOU MUST IMMEDIATELY (without waiting for user input):**"
    echo ""
    echo "$INIT_PROMPT"
    echo ""
    echo "---"
    echo ""
    echo "**This instruction is also available in:**"
    echo "- \`.boss/init-instruction.txt\`"
    echo "- \`.claude/rules/startup-init.md\` (or \`.cursor/rules/startup-init.md\`)"
    echo ""
    echo "---"
    echo ""
    cat CLAUDE.md.bak
  } > CLAUDE.md || {
    error_log "Failed to inject instruction into CLAUDE.md"
    # Restore backup on failure
    if [ -f "CLAUDE.md.bak" ]; then
      mv CLAUDE.md.bak CLAUDE.md
    fi
    return 1
  }
  
  info_log "✅ Injected startup instruction into CLAUDE.md"
  return 0
}

# Cleanup initialization files when initialization is complete
cleanup_init_files() {
  local ide_dir="$1"
  
  debug_log "Cleaning up initialization files"
  
  # Remove .boss/init-instruction.txt
  if [ -f ".boss/init-instruction.txt" ]; then
    rm -f .boss/init-instruction.txt && info_log "✅ Removed .boss/init-instruction.txt"
  fi
  
  # Remove .claude/rules/startup-init.md or .cursor/rules/startup-init.md
  local rules_file="$ide_dir/rules/startup-init.md"
  if [ -f "$rules_file" ]; then
    rm -f "$rules_file" && info_log "✅ Removed $rules_file"
  fi
  
  # Also check the other IDE directory
  local other_ide_dir=".claude"
  [ "$ide_dir" = ".claude" ] && other_ide_dir=".cursor"
  local other_rules_file="$other_ide_dir/rules/startup-init.md"
  if [ -f "$other_rules_file" ]; then
    rm -f "$other_rules_file" && info_log "✅ Removed $other_rules_file"
  fi
  
  # Restore CLAUDE.md from backup if it exists
  if [ -f "CLAUDE.md.bak" ]; then
    debug_log "Restoring CLAUDE.md from backup"
    
    # Remove the startup instruction section if it exists
    if grep -q "🚨 STARTUP INSTRUCTION" CLAUDE.md 2>/dev/null; then
      debug_log "Removing startup instruction section from CLAUDE.md"
      
      # Remove everything from "# 🚨 STARTUP INSTRUCTION" to the first "---" separator
      local temp_file=$(mktemp)
      sed '/^# 🚨 STARTUP INSTRUCTION/,/^---$/d' CLAUDE.md > "$temp_file" 2>/dev/null
      
      if [ $? -eq 0 ] && [ -s "$temp_file" ]; then
        mv "$temp_file" CLAUDE.md
        
        # Remove any leading blank lines (macOS and Linux compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
          sed -i '' '/./,$!d' CLAUDE.md 2>/dev/null || true
        else
          sed -i '/./,$!d' CLAUDE.md 2>/dev/null || true
        fi
        
        info_log "✅ Removed startup instruction from CLAUDE.md"
      else
        debug_log "Failed to remove instruction section, will restore from backup"
        rm -f "$temp_file"
      fi
    fi
    
    # Verify CLAUDE.md is valid before removing backup
    if [ ! -s "CLAUDE.md" ] || ! grep -q "BOSS" CLAUDE.md 2>/dev/null; then
      warning_log "CLAUDE.md appears corrupted, restoring from backup"
      mv CLAUDE.md.bak CLAUDE.md
      info_log "✅ Restored CLAUDE.md from backup"
    else
      rm -f CLAUDE.md.bak
      debug_log "CLAUDE.md restored successfully, backup removed"
    fi
  fi
  
  debug_log "Cleanup completed"
  return 0
}

# Launch the appropriate IDE with MCP restrictions
launch_ide() {
  local ide_type="$1"
  local init_needed="$2"
  shift 2
  local extra_args=("$@")
  
  debug_log "Launching IDE: $ide_type, init_needed: $init_needed"
  
  # Try Claude Code first
  if command -v claude &> /dev/null || command -v claude-code &> /dev/null; then
    local claude_cmd="claude"
    command -v claude-code &> /dev/null && claude_cmd="claude-code"
    
    if [ "$init_needed" = true ]; then
      info_log "🚀 Launching Claude Code with MCP-only restrictions..."
      info_log "📋 Piping initialization instruction to Claude Code as first message..."
      info_log ""
      info_log "📋 Initial setup instruction has also been placed in:"
      info_log "   - .boss/init-instruction.txt"
      info_log "   - $ide_type/rules/startup-init.md"
      info_log "   - CLAUDE.md (at the very top with prominent formatting)"
      
      debug_log "Command: printf '%s\n' '$INIT_PROMPT' | $claude_cmd --allowedTools mcp__container-use__*,mcp__github__*,mcp__knowledge-base__* ${extra_args[*]}"
      
      # Pipe the instruction to Claude Code via stdin (don't use exec when piping)
      printf '%s\n' "$INIT_PROMPT" | "$claude_cmd" --allowedTools \
        mcp__container-use__*,\
        mcp__github__*,\
        mcp__knowledge-base__* \
        "${extra_args[@]}"
    else
      info_log "🚀 Launching Claude Code with MCP-only restrictions..."
      debug_log "Command: $claude_cmd --allowedTools mcp__container-use__*,mcp__github__*,mcp__knowledge-base__* ${extra_args[*]}"
      
      exec "$claude_cmd" --allowedTools \
        mcp__container-use__*,\
        mcp__github__*,\
        mcp__knowledge-base__* \
        "${extra_args[@]}"
    fi
  # Try Cursor
  elif command -v cursor &> /dev/null; then
    warning_log "Cursor detected. MCP restrictions should be configured in Cursor settings."
    if [ "$init_needed" = true ]; then
      info_log "📋 Initial setup needed. BOSS will automatically check and complete setup when Cursor opens."
    fi
    
    info_log "🚀 Launching Cursor..."
    debug_log "Command: cursor ${extra_args[*]}"
    
    exec cursor "${extra_args[@]}"
  else
    error_log "Neither 'claude' nor 'cursor' command found in PATH"
    echo "Please install Claude Code or Cursor and ensure it's in your PATH" >&2
    exit 1
  fi
}

# Main execution
main() {
  info_log "🤖 Starting BOSS with MCP-only operations..."
  
  # CRITICAL: Install dependencies before launching Claude
  # This prevents git hook failures due to missing dependencies (e.g., tsc not found)
  if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
      info_log "📦 Installing dependencies (required for git hooks)..."
      if command -v pnpm &> /dev/null; then
        pnpm install
      elif command -v npm &> /dev/null; then
        npm install
      else
        warning_log "Neither pnpm nor npm found. Dependencies may not be installed."
        echo "   Git hooks may fail if dependencies are missing."
      fi
    fi
  fi
  
  # Check if .env file exists
  if [ ! -f ".env" ]; then
    warning_log ".env file not found. MCP servers may not have access to secrets."
    echo "   Create .env file with op:// references for 1Password secrets."
  fi
  
  # Check if op (1Password CLI) is available and signed in (for MCP servers)
  if command -v op &> /dev/null; then
    if ! op account list &> /dev/null; then
      warning_log "1Password CLI (op) is not signed in."
      echo "   Run: eval \$(op signin) to sign in"
      echo "   MCP servers configured with op:// references will fail without authentication."
    fi
  fi
  
  # Detect IDE
  local ide_dir
  ide_dir=$(detect_ide)
  debug_log "Detected IDE directory: $ide_dir"
  
  # Check initialization status
  local init_stage
  init_stage=$(get_init_stage)
  debug_log "Initialization stage: '$init_stage'"
  
  local init_needed=false
  
  if [ -n "$init_stage" ] && [ "$init_stage" != "ready" ]; then
    init_needed=true
    debug_log "Initialization needed (stage: $init_stage)"
    
    # Create initialization files
    if ! create_init_files "$init_stage" "$ide_dir"; then
      error_log "Failed to create initialization files"
      exit 1
    fi
  else
    debug_log "Initialization complete or not needed (stage: '$init_stage')"
    
    # Cleanup initialization files if they exist
    cleanup_init_files "$ide_dir"
  fi
  
  # Launch IDE
  launch_ide "$ide_dir" "$init_needed" "$@"
}

# Run main function
main "$@"
