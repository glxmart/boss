#!/usr/bin/env bash
set -euo pipefail

# Create changeset non-interactively
# Usage: ./scripts/create-changeset.sh <bump-type> <packages> <message>
#
# Examples:
#   ./scripts/create-changeset.sh patch "boss-cli,conductor-mcp" "Fix linting errors"
#   ./scripts/create-changeset.sh minor "conductor-mcp" "Add new MCP tool"
#   ./scripts/create-changeset.sh major "boss-cli" "BREAKING: Remove deprecated API"

if [ $# -lt 3 ]; then
  echo "Usage: $0 <bump-type> <packages> <message>"
  echo ""
  echo "Arguments:"
  echo "  bump-type: patch, minor, or major"
  echo "  packages:  Comma-separated list (boss-cli,conductor-mcp)"
  echo "  message:   Changeset summary (multiline via stdin or single line)"
  echo ""
  echo "Examples:"
  echo "  $0 patch 'boss-cli,conductor-mcp' 'Fix linting errors'"
  echo "  $0 minor 'conductor-mcp' 'Add parallel worker spawning'"
  exit 1
fi

BUMP_TYPE="$1"
PACKAGES="$2"
MESSAGE="$3"

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: bump-type must be patch, minor, or major"
  exit 1
fi

# Generate random changeset filename (similar to changesets CLI)
ADJECTIVE=(happy sad brave calm cool warm)
NOUN=(dogs cats birds fish lions bears)
VERB=(run jump swim fly dance sing)
RANDOM_NAME="${ADJECTIVE[$RANDOM % ${#ADJECTIVE[@]}]}-${NOUN[$RANDOM % ${#NOUN[@]}]}-${VERB[$RANDOM % ${#VERB[@]}]}"
CHANGESET_FILE=".changeset/${RANDOM_NAME}.md"

# Build frontmatter
FRONTMATTER="---"

# Split packages and add to frontmatter
IFS=',' read -ra PKG_ARRAY <<< "$PACKAGES"
for pkg in "${PKG_ARRAY[@]}"; do
  # Trim whitespace
  pkg=$(echo "$pkg" | xargs)

  # Add @glxmart/ prefix if not present
  if [[ ! "$pkg" =~ ^@ ]]; then
    pkg="@glxmart/$pkg"
  fi

  FRONTMATTER+="\n'$pkg': $BUMP_TYPE"
done

FRONTMATTER+="\n---"

# Create changeset file
echo -e "$FRONTMATTER\n\n$MESSAGE" > "$CHANGESET_FILE"

echo "✅ Changeset created: $CHANGESET_FILE"
echo ""
echo "Preview:"
cat "$CHANGESET_FILE"
