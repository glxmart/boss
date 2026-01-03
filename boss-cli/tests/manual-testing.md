# Manual Testing Guide

This document outlines manual testing procedures for the BOSS Bootstrap CLI.

## Prerequisites

Before running manual tests, ensure:

- Node.js 22+ installed
- pnpm installed
- Git configured
- Docker Desktop running (for infrastructure tests)

## Test Scenarios

### 1. Basic Bootstrap Test

```bash
cd boss-cli
pnpm install
pnpm build
node dist/index.js bootstrap --template blank --quality startup --name test-manual-1
```

**Verify:**

- ✅ Project directory created
- ✅ All required files present
- ✅ Git repository initialized
- ✅ Spec-Kit structure copied
- ✅ CLAUDE.md contains mandatory verbatim text

### 2. Interactive Mode Test

```bash
node dist/index.js bootstrap
```

**Follow prompts:**

- Enter project name
- Select template
- Select quality preset
- Optionally configure GitHub

**Verify:**

- ✅ Prompts work correctly
- ✅ Validation works
- ✅ Project created successfully

### 3. Template Tests

Test each template:

```bash
# Next.js template
node dist/index.js bootstrap --template nextjs-app-turbo --quality production --name test-nextjs

# API Service template
node dist/index.js bootstrap --template api-service-fastify --quality production --name test-api

# Blank template
node dist/index.js bootstrap --template blank --quality startup --name test-blank
```

**Verify for each:**

- ✅ package.json has correct dependencies
- ✅ Template-specific files created
- ✅ Project structure matches template

### 4. Quality Preset Tests

Test each quality preset:

```bash
node dist/index.js bootstrap --template blank --quality startup --name test-startup
node dist/index.js bootstrap --template blank --quality production --name test-production
node dist/index.js bootstrap --template blank --quality enterprise --name test-enterprise
```

**Verify:**

- ✅ Quality gates configured correctly in .boss/config.yaml
- ✅ Coverage thresholds match preset
- ✅ Git hooks configured appropriately

### 5. MCP Config Test

```bash
node dist/index.js bootstrap --template blank --quality startup --name test-mcp
```

**Verify:**

- ✅ MCP config created in ~/.config/claude-code/mcp-servers.json or ~/.cursor/mcp-servers.json
- ✅ All three MCP servers configured
- ✅ Secrets use op://boss/ format

### 6. Spec-Kit Integration Test

```bash
node dist/index.js bootstrap --template blank --quality startup --name test-spec-kit
cd test-spec-kit
```

**Verify:**

- ✅ .specify/templates/ exists with files
- ✅ .specify/scripts/ exists with executable scripts
- ✅ .specify/memory/constitution.md exists
- ✅ Scripts are executable: `ls -la .specify/scripts/bash/`

### 7. Worker Configs Test

```bash
node dist/index.js bootstrap --template blank --quality startup --name test-workers
```

**Verify:**

- ✅ All 9 workers have prompt.md and container-config.json
- ✅ Worker prompts contain Spec-Kit references
- ✅ Container configs have SPEC_KIT_MODE and PATH variables

### 8. Docker Compose Test

```bash
node dist/index.js bootstrap --template blank --quality startup --name test-docker
cd test-docker
docker-compose up -d
```

**Verify:**

- ✅ All services start successfully
- ✅ PostgreSQL accessible on port 5432
- ✅ Qdrant accessible on port 6333
- ✅ Embeddings service accessible on port 8080

### 9. Git Integration Test

```bash
node dist/index.js bootstrap --template blank --quality startup --name test-git
cd test-git
git log --oneline
```

**Verify:**

- ✅ Git repository initialized
- ✅ Spec-Kit committed first
- ✅ Bootstrap files committed second
- ✅ Two commits total

### 10. Doctor Command Test

```bash
node dist/index.js doctor
```

**Verify:**

- ✅ All checks run
- ✅ Pass/fail/warning statuses displayed correctly
- ✅ Helpful error messages for missing tools

## Cleanup

After testing, clean up test projects:

```bash
rm -rf test-*
```
