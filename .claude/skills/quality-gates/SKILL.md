---
name: quality-gates
description: Validates code quality with security checks, linting, tests, and git hooks. Use when setting up hooks, running security scans, or validating code before commits/pushes.
allowed-tools: Bash, Read, Grep
---

# Quality Gates

## Overview

This skill manages code quality validation through automated checks, security scans, and git hooks. It ensures code meets quality standards before commits, pushes, and releases.

**IMPORTANT**: Quality gate scripts are located in `scripts/` folder (used by husky git hooks).

## Quick Start

### Run Security Check

```bash
scripts/security-check.sh
```

Or ask Claude:

- "Run security check"
- "Check for hardcoded secrets"
- "Scan for vulnerabilities"

### Run Pre-Commit Checks

```bash
scripts/pre-commit-check.sh
```

Or ask Claude:

- "Run pre-commit checks"
- "Format staged files"

### Run Pre-Push Validation

```bash
scripts/pre-push.sh
```

Or ask Claude:

- "Run pre-push checks"
- "Validate before push"

### Test Changed Files

```bash
scripts/test-changed.sh
```

Or ask Claude:

- "Test my changes"
- "Run tests for changed files"

## Quality Gates Explained

### Security Check

**Location**: `scripts/security-check.sh`

**What it validates:**

- ✅ Hardcoded secrets detection (passwords, API keys, tokens)
- ✅ Security-related TODOs
- ✅ Dependency vulnerabilities (pnpm audit)

**When to run:**

- Before committing sensitive changes
- Before pushing to remote
- As part of pre-push hook

**Output**: Warning-based (non-blocking)

### Pre-Commit Check

**Location**: `scripts/pre-commit-check.sh`

**What it does:**

- Runs lint-staged (Prettier formatting)
- Fast (~5-10 seconds)
- Only touches staged files

### Pre-Push Hook

**Location**: `scripts/pre-push.sh`

**What it validates:**

- ✅ Build passes
- ✅ Lint passes
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Security checks pass
- ✅ TDD requirement (test files present)

**Time**: ~60-120 seconds

### Test Changed Files

**Location**: `scripts/test-changed.sh`

**What it does:**

- Identifies changed files since last commit
- Runs only relevant tests
- Faster than full test suite

## Git Hooks

Quality gates integrate with husky git hooks:

**Pre-Commit** (`.husky/pre-commit`):

```bash
#!/bin/bash
bash scripts/pre-commit-check.sh
```

**Pre-Push** (`.husky/pre-push`):

```bash
#!/bin/bash
bash scripts/pre-push.sh
```

## Hook Management

### Install Hooks

Hooks are installed automatically during `pnpm install` via husky.

### Skip Hooks (Emergency Only)

```bash
# Skip pre-commit
git commit --no-verify

# Skip pre-push
git push --no-verify
```

**⚠️ WARNING**: Only skip hooks for emergency hotfixes!

## Quality Standards

See [REFERENCE.md](REFERENCE.md) for complete quality requirements.

## Related Skills

- **[workflow-management](.claude/skills/workflow-management/SKILL.md)** - Uses quality checks in step 2
- **[workflow-debugging](.claude/skills/workflow-debugging/SKILL.md)** - Debug failed CI checks

## Documentation

- [REFERENCE.md](REFERENCE.md) - Complete quality standards
- [scripts/pre-push.sh](../../../scripts/pre-push.sh) - Pre-push hook implementation
- [scripts/security-check.sh](../../../scripts/security-check.sh) - Security check implementation
