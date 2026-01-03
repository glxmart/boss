#!/bin/bash
# Security check script
# Runs basic security checks before push

set -e

# Check for common security issues in staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM || true)

if [ -z "$staged_files" ]; then
  # If no staged files, check all tracked files
  staged_files=$(git ls-files || true)
fi

# Check for hardcoded secrets (basic check)
if echo "$staged_files" | xargs grep -lE '(password|secret|api_key|private_key|access_token)\s*[:=]\s*["'\''][^"'\'']+["'\'']' 2>/dev/null; then
  echo "⚠️  Warning: Potential hardcoded secrets detected"
  echo "   Review the files above for sensitive information"
  echo "   (This is a basic check, review manually)"
fi

# Check for TODO/FIXME comments that might indicate security issues
if echo "$staged_files" | xargs grep -lE 'TODO.*(security|auth|password|secret|vulnerability)' 2>/dev/null; then
  echo "⚠️  Warning: Security-related TODOs found"
  echo "   Review and address before pushing"
fi

# If npm audit is available, run it (non-blocking)
if command -v pnpm &> /dev/null; then
  if pnpm audit --audit-level=moderate 2>/dev/null | grep -qE '(moderate|high|critical)'; then
    echo "⚠️  Warning: Security vulnerabilities found in dependencies"
    echo "   Run 'pnpm audit' for details"
    echo "   Run 'pnpm audit fix' to attempt automatic fixes"
    # Don't block, just warn
  fi
fi

echo "✅ Security checks passed"
exit 0

