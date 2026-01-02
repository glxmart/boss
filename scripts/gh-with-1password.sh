#!/usr/bin/env zsh
# gh-with-1password.sh
# Helper script to run gh CLI commands with 1Password environment variables
#
# Usage:
#   ./scripts/gh-with-1password.sh <gh-command> [args...]
#
# Examples:
#   ./scripts/gh-with-1password.sh run list
#   ./scripts/gh-with-1password.sh pr list
#   ./scripts/gh-with-1password.sh api repos/glxmart/boss/actions/workflows

# Get the script directory and project root
SCRIPT_DIR="${0:a:h}"
PROJECT_ROOT="${SCRIPT_DIR:h}"

# Check if .env exists
if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
    echo "Error: .env file not found at ${PROJECT_ROOT}/.env"
    echo "Please copy .env.example to .env and configure 1Password references"
    exit 1
fi

# Run gh command with 1Password environment injection
exec op run --env-file="${PROJECT_ROOT}/.env" -- gh "$@"
