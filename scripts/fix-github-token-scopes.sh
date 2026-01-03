#!/usr/bin/env bash
# Fix GitHub Token Scopes
# Adds required scopes (read:org, read:discussion) to existing token

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 GitHub Token Scope Fix${NC}"
echo ""

# Check if 1Password CLI is available
if ! command -v op &> /dev/null; then
  echo -e "${RED}❌ 1Password CLI (op) is not installed${NC}"
  echo ""
  echo "Install with: brew install --cask 1password-cli"
  exit 1
fi

# Check current token scopes
echo -e "${BLUE}📋 Checking current token scopes...${NC}"
cd "$PROJECT_ROOT"

if ! op run --env-file=.env -- gh auth status 2>&1 | grep -q "read:org"; then
  echo -e "${YELLOW}⚠️  Token is missing required scopes${NC}"
  echo ""

  # Show current scopes
  echo -e "${BLUE}Current scopes:${NC}"
  op run --env-file=.env -- gh auth status 2>&1 | grep "Token scopes" || true
  echo ""

  echo -e "${BLUE}Required additional scopes:${NC}"
  echo "  - read:org (read organization and team membership)"
  echo "  - read:discussion (read discussions in PRs)"
  echo ""

  read -p "Refresh token to add missing scopes? (y/n) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}🔄 Refreshing GitHub token...${NC}"
    echo -e "${YELLOW}This will open a browser for authorization${NC}"
    echo ""

    # Refresh with additional scopes
    if op run --env-file=.env -- gh auth refresh -h github.com -s read:org,read:discussion; then
      echo ""
      echo -e "${GREEN}✅ Token scopes updated successfully!${NC}"
      echo ""

      # Get the new token
      echo -e "${BLUE}📝 Retrieving new token...${NC}"
      NEW_TOKEN=$(op run --env-file=.env -- gh auth token)

      if [[ -n "$NEW_TOKEN" ]]; then
        echo -e "${BLUE}🔐 Updating 1Password...${NC}"

        # Update 1Password
        if op item edit boss/github --field token="$NEW_TOKEN" 2>/dev/null; then
          echo -e "${GREEN}✅ 1Password updated successfully!${NC}"
        else
          echo -e "${YELLOW}⚠️  Could not update 1Password automatically${NC}"
          echo ""
          echo "Please update manually:"
          echo "1. Copy this token (it will only be shown once):"
          echo ""
          echo -e "${YELLOW}$NEW_TOKEN${NC}"
          echo ""
          echo "2. Run: op item edit boss/github --field token=\"<paste-token>\""
          echo ""
          read -p "Press Enter after updating 1Password..."
        fi
      else
        echo -e "${RED}❌ Could not retrieve new token${NC}"
        exit 1
      fi

      echo ""
      echo -e "${BLUE}🧪 Verifying updated scopes...${NC}"
      op run --env-file=.env -- gh auth status 2>&1 | grep -A 5 "Token scopes"

      echo ""
      echo -e "${GREEN}✅ GitHub token is now fully configured!${NC}"
      echo ""
      echo -e "${BLUE}You can now use:${NC}"
      echo "  - op run --env-file=.env -- gh pr view <pr-number>"
      echo "  - pnpm run gh pr view <pr-number>"
      echo "  - pnpm run workflow:4-pr (create PRs)"

    else
      echo ""
      echo -e "${RED}❌ Token refresh failed${NC}"
      echo ""
      echo "Manual steps:"
      echo "1. Go to https://github.com/settings/tokens"
      echo "2. Generate new token with these scopes:"
      echo "   - repo, workflow, write:packages (existing)"
      echo "   - read:org, read:discussion (new)"
      echo "3. Update 1Password: op item edit boss/github --field token=\"<new-token>\""
      echo ""
      echo "See docs/GITHUB_TOKEN_SETUP.md for detailed instructions"
      exit 1
    fi
  else
    echo ""
    echo -e "${YELLOW}⚠️  Token scopes not updated${NC}"
    echo ""
    echo "To fix manually, see: docs/GITHUB_TOKEN_SETUP.md"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Token already has all required scopes!${NC}"
  echo ""
  op run --env-file=.env -- gh auth status 2>&1 | grep -A 5 "Token scopes"
  echo ""
  echo -e "${GREEN}✅ No action needed${NC}"
fi
