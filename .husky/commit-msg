# Commit message validation hook
# Strictly enforces Conventional Commits v1.0.0 specification
# See: https://www.conventionalcommits.org/en/v1.0.0/

commit_msg=$(cat "$1")

# Extract the first line (subject line)
first_line=$(echo "$commit_msg" | head -n1)

# Validate format: <type>[optional scope][optional !]: <description>
# According to spec: "Commits MUST be prefixed with a type, which consists of a noun,
# feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space."

# Pattern breakdown:
# - Type: lowercase word (feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert, etc.)
# - Optional scope: (word) - noun in parentheses
# - Optional !: for breaking changes
# - Required: : (colon) followed by space
# - Description: rest of the line (at least one character)
if ! echo "$first_line" | grep -qE "^[a-z]+(\([a-z0-9-]+\))?(!)?: .+"; then
  echo "❌ Invalid commit message format!"
  echo ""
  echo "Commit messages MUST follow Conventional Commits v1.0.0 specification:"
  echo "  <type>[optional scope][optional !]: <description>"
  echo ""
  echo "Required format:"
  echo "  type(scope): description"
  echo "  type!: description        (breaking change)"
  echo "  type(scope)!: description (breaking change with scope)"
  echo ""
  echo "Common types:"
  echo "  feat:     A new feature"
  echo "  fix:      A bug fix"
  echo "  docs:     Documentation only changes"
  echo "  style:    Changes that do not affect code meaning (formatting, etc.)"
  echo "  refactor: Code change that neither fixes a bug nor adds a feature"
  echo "  perf:     Performance improvement"
  echo "  test:     Adding or updating tests"
  echo "  chore:    Changes to build process or auxiliary tools"
  echo "  ci:       Changes to CI configuration"
  echo "  build:    Changes to build system or dependencies"
  echo "  revert:   Reverts a previous commit"
  echo ""
  echo "Examples:"
  echo "  ✅ feat(orchestrator): add retry logic"
  echo "  ✅ fix(agents): handle container errors"
  echo "  ✅ docs: update architecture guide"
  echo "  ✅ feat!: change API signature"
  echo "  ✅ fix(api)!: remove deprecated endpoint"
  echo "  ❌ update code                    (missing type)"
  echo "  ❌ feat:fix bug                    (missing space after colon)"
  echo "  ❌ FEAT: add feature               (type should be lowercase)"
  echo ""
  echo "Your message:"
  echo "  $first_line"
  echo ""
  echo "Full specification: https://www.conventionalcommits.org/en/v1.0.0/"
  exit 1
fi

# Validate minimum description length (at least 3 characters after colon and space)
description=$(echo "$first_line" | sed -E 's/^[a-z]+(\([a-z0-9-]+\))?(!)?: //')
if [ ${#description} -lt 3 ]; then
  echo "❌ Commit description too short (minimum 3 characters)"
  echo ""
  echo "Your description: '$description'"
  exit 1
fi

# Validate maximum length for first line (recommended 72 characters per spec)
# Note: Spec doesn't require this, but it's a best practice
if [ ${#first_line} -gt 100 ]; then
  echo "⚠️  Warning: First line of commit message exceeds 100 characters"
  echo "   Recommended: Keep first line under 72 characters for better readability"
  echo "   Your first line: ${#first_line} characters"
  echo ""
  echo "   Consider breaking into multiple lines:"
  echo "   type(scope): short summary"
  echo ""
  echo "   Longer description can go in the body."
  echo ""
fi

# Validate that type is lowercase (spec says case insensitive, but lowercase is conventional)
type=$(echo "$first_line" | sed -E 's/^([a-z]+).*/\1/')
if ! echo "$type" | grep -qE '^[a-z]+$'; then
  echo "⚠️  Warning: Commit type should be lowercase"
  echo "   Found: '$type'"
  echo ""
fi

# Check for BREAKING CHANGE footer (if body exists)
if echo "$commit_msg" | grep -qiE "^BREAKING CHANGE:"; then
  echo "ℹ️  Breaking change detected in footer"
  echo "   Consider using '!' in type prefix for consistency"
fi

echo "✅ Commit message follows Conventional Commits specification"
