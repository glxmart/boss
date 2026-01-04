#!/bin/bash

# BOSS 1Password Setup Script
# This script helps you set up the 1Password vault and secrets required for BOSS
# Run this BEFORE executing ./start-boss.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

header() {
  echo ""
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
  echo ""
}

# Check if op CLI is installed
check_op_installed() {
  if ! command -v op &> /dev/null; then
    error "1Password CLI (op) is not installed"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install --cask 1password-cli"
    echo "  Linux:   https://1password.com/downloads/command-line/"
    echo "  Windows: winget install 1Password.CLI"
    echo ""
    exit 1
  fi
  success "1Password CLI (op) is installed"
}

# Check if signed in to 1Password
check_op_signin() {
  if ! op account list &> /dev/null; then
    error "Not signed in to 1Password"
    echo ""
    echo "Sign in with: op signin"
    echo ""
    exit 1
  fi
  success "Signed in to 1Password"
}

# Create vault if it doesn't exist
create_vault() {
  local vault_name="$1"

  info "Checking if vault '$vault_name' exists..."

  if op vault list | grep -q "$vault_name"; then
    success "Vault '$vault_name' already exists"
    return 0
  fi

  info "Creating vault '$vault_name'..."
  op vault create "$vault_name" || {
    error "Failed to create vault '$vault_name'"
    return 1
  }
  success "Created vault '$vault_name'"
}

# Create or update a secret item
create_or_update_secret() {
  local vault="$1"
  local item_title="$2"
  local field_name="$3"
  local field_value="$4"
  local category="${5:-Login}"

  info "Checking if item '$item_title' exists in vault '$vault'..."

  # Check if item exists
  if op item get "$item_title" --vault="$vault" &> /dev/null; then
    info "Item '$item_title' exists. Updating field '$field_name'..."
    op item edit "$item_title" --vault="$vault" "$field_name=$field_value" &> /dev/null || {
      error "Failed to update $item_title/$field_name"
      return 1
    }
    success "Updated $item_title/$field_name"
  else
    info "Creating item '$item_title' with field '$field_name'..."
    op item create \
      --category="$category" \
      --vault="$vault" \
      --title="$item_title" \
      "$field_name=$field_value" &> /dev/null || {
      error "Failed to create $item_title"
      return 1
    }
    success "Created $item_title with $field_name"
  fi
}

# Prompt for a secret value
prompt_secret() {
  local prompt_text="$1"
  local default_value="$2"
  local secret_value=""

  if [ -n "$default_value" ]; then
    read -sp "$prompt_text [$default_value]: " secret_value
  else
    read -sp "$prompt_text: " secret_value
  fi
  echo "" # New line after password input

  # Use default if empty
  if [ -z "$secret_value" ] && [ -n "$default_value" ]; then
    secret_value="$default_value"
  fi

  echo "$secret_value"
}

# Setup GitHub token
setup_github_token() {
  header "GitHub Personal Access Token Setup"

  echo "You need a GitHub Personal Access Token with these scopes:"
  echo "  ✓ repo (Full control of private repositories)"
  echo "  ✓ workflow (Update GitHub Action workflows)"
  echo "  ✓ write:packages (Upload packages to GitHub Package Registry)"
  echo ""
  echo "Generate one at: https://github.com/settings/tokens/new"
  echo ""

  # Check if token already exists
  if op item get "github" --vault="boss" &> /dev/null 2>&1; then
    warning "GitHub token already exists in 1Password"
    read -p "Do you want to update it? (y/N): " update_token
    if [[ ! "$update_token" =~ ^[Yy]$ ]]; then
      info "Skipping GitHub token setup"
      return 0
    fi
  fi

  local github_token
  github_token=$(prompt_secret "Enter your GitHub Personal Access Token")

  if [ -z "$github_token" ]; then
    error "GitHub token cannot be empty"
    return 1
  fi

  create_or_update_secret "boss" "github" "token" "$github_token" "Login"
}

# Setup Claude Code OAuth token
setup_claude_token() {
  header "Claude Code OAuth Token Setup"

  echo "You need a Claude Code OAuth token for worker authentication."
  echo ""
  echo "To get your token:"
  echo "  1. Run: claude auth login"
  echo "  2. Follow the prompts to authenticate"
  echo "  3. Extract token with:"
  echo "     cat ~/.config/claude-code/auth.json | jq -r '.oauth_token'"
  echo ""

  # Check if token already exists
  if op item get "claude-code" --vault="boss" &> /dev/null 2>&1; then
    warning "Claude Code token already exists in 1Password"
    read -p "Do you want to update it? (y/N): " update_token
    if [[ ! "$update_token" =~ ^[Yy]$ ]]; then
      info "Skipping Claude Code token setup"
      return 0
    fi
  fi

  local claude_token
  claude_token=$(prompt_secret "Enter your Claude Code OAuth token")

  if [ -z "$claude_token" ]; then
    error "Claude Code token cannot be empty"
    return 1
  fi

  create_or_update_secret "boss" "claude-code" "oauth-token" "$claude_token" "Login"
}

# Setup NPM token (optional)
setup_npm_token() {
  header "NPM Token Setup (Optional)"

  echo "An NPM token is required only if you plan to publish packages to npm."
  echo ""
  read -p "Do you want to set up an NPM token? (y/N): " setup_npm

  if [[ ! "$setup_npm" =~ ^[Yy]$ ]]; then
    info "Skipping NPM token setup"
    return 0
  fi

  echo ""
  echo "Generate an NPM token at: https://www.npmjs.com/settings/~/tokens"
  echo ""

  local npm_token
  npm_token=$(prompt_secret "Enter your NPM token")

  if [ -z "$npm_token" ]; then
    warning "NPM token is empty, skipping"
    return 0
  fi

  create_or_update_secret "boss" "npm" "token" "$npm_token" "Login"
}

# Verify all secrets are set
verify_secrets() {
  header "Verifying 1Password Secrets"

  local all_good=true

  # Check GitHub token
  if op item get "github" --vault="boss" --fields "token" &> /dev/null; then
    success "GitHub token is set"
  else
    error "GitHub token is NOT set"
    all_good=false
  fi

  # Check Claude Code token
  if op item get "claude-code" --vault="boss" --fields "oauth-token" &> /dev/null; then
    success "Claude Code OAuth token is set"
  else
    error "Claude Code OAuth token is NOT set"
    all_good=false
  fi

  # NPM token is optional
  if op item get "npm" --vault="boss" --fields "token" &> /dev/null 2>&1; then
    success "NPM token is set (optional)"
  else
    info "NPM token is NOT set (optional - only needed for publishing)"
  fi

  if [ "$all_good" = true ]; then
    echo ""
    success "All required secrets are configured!"
    return 0
  else
    echo ""
    error "Some required secrets are missing"
    return 1
  fi
}

# Show secret references
show_references() {
  header "1Password Secret References"

  echo "Your .env file will use these op:// references:"
  echo ""
  echo "  GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token"
  echo "  GITHUB_TOKEN=op://boss/github/token"
  echo "  CLAUDE_CODE_OAUTH_TOKEN=op://boss/claude-code/oauth-token"
  echo "  NPM_TOKEN=op://boss/npm/token  (optional)"
  echo ""
  echo "These will be automatically resolved when you run:"
  echo "  ./start-boss.sh"
  echo ""
}

# Test secret resolution
test_secret_resolution() {
  header "Testing Secret Resolution"

  info "Testing if op can resolve secrets..."

  # Create a temporary .env file for testing
  local temp_env=$(mktemp)
  cat > "$temp_env" <<EOF
GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token
GITHUB_TOKEN=op://boss/github/token
CLAUDE_CODE_OAUTH_TOKEN=op://boss/claude-code/oauth-token
EOF

  # Try to resolve secrets
  if op run --env-file="$temp_env" -- sh -c 'echo "Secrets resolved successfully"' &> /dev/null; then
    success "Secret resolution test passed"
    rm -f "$temp_env"
    return 0
  else
    error "Secret resolution test failed"
    rm -f "$temp_env"
    return 1
  fi
}

# Main execution
main() {
  clear
  header "BOSS 1Password Setup"

  echo "This script will help you set up 1Password secrets for BOSS."
  echo ""
  echo "You will need:"
  echo "  1. GitHub Personal Access Token"
  echo "  2. Claude Code OAuth Token"
  echo "  3. NPM Token (optional, for publishing)"
  echo ""
  read -p "Ready to continue? (y/N): " ready

  if [[ ! "$ready" =~ ^[Yy]$ ]]; then
    info "Setup cancelled"
    exit 0
  fi

  # Check prerequisites
  check_op_installed
  check_op_signin

  # Create vault
  create_vault "boss"

  # Setup secrets
  setup_github_token
  setup_claude_token
  setup_npm_token

  # Verify everything is set
  if verify_secrets; then
    show_references
    test_secret_resolution

    echo ""
    success "1Password setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npx @glxmart/boss-cli bootstrap"
    echo "  2. cd into your new project"
    echo "  3. Run: ./start-boss.sh"
    echo ""
  else
    echo ""
    error "Setup incomplete. Please run this script again."
    exit 1
  fi
}

# Run main function
main "$@"
