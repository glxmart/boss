# BOSS + Container-Use Integration

**How BOSS executes AI workers in secure, isolated environments**

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [BOSS Vision](./BOSS-ENHANCED-VISION.md) | [Spec-Kit Integration](./BOSS-SPEC-KIT-INTEGRATION.md) | [GitHub Integration](./BOSS-GITHUB-INTEGRATION.md) | [Host Setup](./BOSS-HOST-SETUP.md) | [Docker Setup](./DOCKER-SETUP.md)

This document explains how BOSS uses **container-use** to run AI workers safely with complete isolation, secure secret management, and full observability.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Architecture](#architecture)
4. [Secret Management](#secret-management)
5. [Worker Configuration](#worker-configuration)
6. [Worker Lifecycle](#worker-lifecycle)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Reference](#reference)

---

## Quick Start

### The 30-Second Overview

**BOSS runs on your host. Workers run in containers.**

```
┌─────────────────────────────────────────┐
│  BOSS (Host Machine)                    │
│  Claude Code/Cursor + MCP Servers       │
│                                         │
│  ✅ Orchestrates via MCPs               │
│  ❌ NO direct file/code/git execution   │
└──────────────┬──────────────────────────┘
               │
               │ Spawns Workers
               ▼
┌─────────────────────────────────────────┐
│  Workers (Docker Containers)            │
│                                         │
│  ✅ ALL file/code/shell/git operations  │
│  ✅ Isolated branch per worker          │
│  ✅ Secrets from 1Password              │
│  ✅ Complete command history logged     │
└─────────────────────────────────────────┘
```

### Key Benefits

- ✅ **Isolated execution** - Each worker in own container + Git branch
- ✅ **Secure secrets** - 1Password integration, AI never sees values
- ✅ **Full observability** - Complete command history
- ✅ **Agent discovery** - Workers identify and document credential needs
- ✅ **Parallel execution** - Multiple workers without conflicts

### Essential Files (Created by Bootstrap)

When you run `boss bootstrap`, these files are created:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | BOSS operational constraints (MUST follow) |
| `start-boss.sh` | Launches BOSS with MCP-only access |
| `.container-use/environment.json` | Default worker configuration |

---

## Core Concepts

### 1. BOSS vs Workers

#### BOSS (Orchestrator)

**Where:** Runs on host machine (Claude Code/Cursor)

**Can Do:**
- ✅ Spawn workers via Container-Use MCP
- ✅ Manage GitHub (PRs, issues, projects) via GitHub MCP
- ✅ Query knowledge base via Knowledge Base MCP
- ✅ Request secrets via GitHub issues

**Cannot Do:**
- ❌ Execute code/files/git directly on host
- ❌ Access secrets directly

**Why:** Security & isolation

#### Workers (Executors)

**Where:** Run in isolated Docker containers

**Can Do:**
- ✅ ALL file/code/shell/git operations
- ✅ Install packages, run commands
- ✅ Access secrets from 1Password
- ✅ Run tests with real API credentials

**Cannot Do:**
- ❌ Affect host machine
- ❌ Access other workers
- ❌ Modify main branch (each has own branch)

**Why:** Full development capabilities in safe environment

### 2. "Dangerous" Mode

Workers run with **full permissions** inside their isolated containers.

**What This Means:**
- ✅ Can execute ANY shell command (`sudo`, `rm -rf`, etc.)
- ✅ Can install ANY package or tool
- ✅ Can modify ANY file in workspace
- ✅ Full root access inside container

**Security Layers:**

1. **Container Isolation** - Cannot affect host or other workers
2. **Branch Isolation** - Each worker has own Git branch
3. **Egress Control** - BOSS restricts network access per worker
4. **Observable** - Complete command history logged
5. **Disposable** - Failed workers deleted and recreated

**Example Egress Configuration:**

```json
{
  "network": {
    "allowed_hosts": [
      "api.stripe.com",
      "api.sendgrid.com",
      "registry.npmjs.org",
      "github.com"
    ]
  }
}
```

> **Note:** Wildcards supported (e.g., `*.amazonaws.com`)

### 3. Container-Use Workflow

```
1. Create Environment
   └─► BOSS spawns container via Container-Use MCP
   └─► New Git branch created: container-use/env-abc123
   └─► Secrets injected from 1Password

2. Execute Work
   └─► Worker runs with full permissions inside container
   └─► Can execute any development operation
   └─► Network access controlled by egress rules

3. Observe
   └─► container-use log <env-id>      # Command history
   └─► container-use diff <env-id>     # Code changes
   └─► container-use terminal <env-id> # Interactive shell

4. Complete
   └─► container-use merge <env-id>    # Accept work
   └─► container-use delete <env-id>   # Discard work
```

### 4. Critical: CLAUDE.md

Every BOSS project has a `CLAUDE.md` file with **mandatory constraints**.

**Key Rules:**
- ✅ **ALWAYS** use environment tools for ALL operations
- ❌ **NEVER** use raw git CLI commands
- ❌ **NEVER** execute operations outside environment
- ✅ **ALWAYS** inform user how to view your work

**Why:** Environment tools handle git automatically. Manual git operations break isolation.

### 5. Critical: start-boss.sh

Bootstrap creates a script that launches BOSS with **MCP-only access**.

**Purpose:** Enforce that BOSS can ONLY use MCP tools

**What It Does:**
```bash
claude --allowedTools \
  mcp__container-use__*,\
  mcp__github__*,\
  mcp__knowledge-base__*
```

**What Gets Blocked:**
- ❌ Read, Write, Edit, Glob, Grep (host file operations)
- ❌ Bash (host shell execution)
- ❌ Direct git commands

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────┐
│            BOSS (Host Machine)                       │
│                                                      │
│  Claude Code/Cursor configured with:                │
│  • Container-Use MCP  ← Spawn/manage workers       │
│  • GitHub MCP         ← ALL GitHub operations      │
│  • Knowledge Base MCP ← Query context              │
│  • 1Password CLI (op) ← Manual secret setup        │
│                                                      │
│  Capabilities:                                       │
│  ✅ Orchestrate workers                             │
│  ✅ Manage GitHub (PRs, issues, projects)           │
│  ✅ Query knowledge base                            │
│  ✅ Request secrets via issues                      │
│  ❌ NO host-level code/file/git execution           │
└────────────┬─────────────────────────────────────────┘
             │
             │ Container-Use MCP Commands
             │
    ┌────────┼────────┬─────────┬─────────┐
    │        │        │         │         │
    ▼        ▼        ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Worker 1││Worker 2││Worker 3││Worker 4││Worker 5│
│env-001 ││env-002 ││env-003 ││env-004 ││env-005 │
│        ││        ││        ││        ││        │
│Backend ││Frontend││Planner ││Review  ││Consol. │
│        ││        ││        ││        ││        │
│Branch: ││Branch: ││Branch: ││Branch: ││Branch: │
│cu/001  ││cu/002  ││cu/003  ││cu/004  ││cu/005  │
│        ││        ││        ││        ││        │
│Secrets:││Secrets:││Secrets:││Secrets:││Secrets:│
│Stripe  ││Vercel  ││None    ││GitHub  ││Vercel  │
│DB      ││GitHub  ││        ││        ││GitHub  │
└────────┘└────────┘└────────┘└────────┘└────────┘
```

### Container-Use Environment Structure

```
container-use/env-abc123/
├── Git Branch: container-use/env-abc123
├── Container: Isolated Docker runtime
├── Secrets: Injected from 1Password (op://)
├── History: Complete command log
└── Capabilities:
    ✅ Full file/code/shell/git operations
    ✅ Install packages, run tests
    ✅ Access external APIs (controlled egress)
    ✅ Everything a human developer can do
```

---

## Secret Management

### Overview

**CRITICAL:** 1Password does NOT offer an MCP server. Secret management is manual.

**The Flow:**

```
1. Planning Phase
   └─► BOSS detects integration needs (Stripe, SendGrid, etc.)
   └─► BOSS creates secret-requirements.md
   └─► BOSS creates GitHub issue with setup instructions

2. Human Action Required
   └─► Generate secrets in service (Stripe Dashboard, AWS IAM, etc.)
   └─► Store in 1Password vault
   └─► Configure container-use with op:// references
   └─► Comment "done" on GitHub issue

3. Implementation Phase
   └─► BOSS verifies secrets configured
   └─► Container-use resolves secrets via op CLI
   └─► Workers receive secrets as environment variables
   └─► AI models NEVER see actual values

4. Execution
   └─► Workers access secrets via process.env
   └─► Container-use strips secrets from logs
   └─► Safe to review command history
```

### 1Password Reference Format

```
Format: op://vault-name/item-name/field-name

Examples:
op://glx/github/token
op://glx/stripe/test-secret-key
op://glx/database/connection-url
op://glx/sendgrid/api-key
op://glx/aws/access-key
```

### Agent Secret Discovery

**A critical BOSS capability:** Agents automatically identify required secrets during planning.

#### How It Works

**Phase 4: Planning**

1. **Planner Analyzes Spec**
   - Scans spec.md for mentioned services
   - Identifies API integrations
   - Determines authentication methods

2. **Creates Secret Requirements Document**
   - `.specify/specs/001-feature/secret-requirements.md`
   - Lists all required secrets with op:// references
   - Provides step-by-step setup instructions
   - Documents scopes and permissions needed

3. **Creates Human Tasks**
   - GitHub issue: "Configure [Service] API Secrets"
   - Includes estimated time (usually 10-20 minutes)
   - Links to secret-requirements.md
   - Blocks implementation until completed

#### Example: Stripe Integration

**Scenario:** User story requires payment processing

**secret-requirements.md (Generated by Planner):**

```markdown
# Secret Requirements for Payment Integration

This feature requires Stripe API integration.

## Required Secrets

### 1. Stripe Test Secret Key

**Purpose:** Authenticate API requests to Stripe in test mode

**1Password Setup:**
- Vault: `glx`
- Item: `stripe`
- Field: `test-secret-key`
- Reference: `op://glx/stripe/test-secret-key`

**How to Generate:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Developers" → "API keys"
3. Copy "Secret key" (starts with `sk_test_`)
4. Store in 1Password at `glx/stripe/test-secret-key`

**Scopes Required:**
- Read/Write: Customers, PaymentIntents, Subscriptions
- Webhook endpoint creation

**Configure Container-Use:**
```bash
container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key
```

### 2. Stripe Webhook Secret

**Purpose:** Verify webhook signatures

**1Password Setup:**
- Vault: `glx`
- Item: `stripe`
- Field: `webhook-secret`
- Reference: `op://glx/stripe/webhook-secret`

**How to Generate:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Select events: payment_intent.succeeded, customer.subscription.*
4. Copy webhook signing secret (starts with `whsec_`)
5. Store in 1Password at `glx/stripe/webhook-secret`

**Configure Container-Use:**
```bash
container-use config secret set STRIPE_WEBHOOK_SECRET op://glx/stripe/webhook-secret
```

## Verification

After setup:
```bash
container-use config secret list
# Expected output (values masked):
# STRIPE_SECRET_KEY: op://glx/stripe/test-secret-key
# STRIPE_WEBHOOK_SECRET: op://glx/stripe/webhook-secret
```

## Integration Tests

Workers will use these secrets for integration tests:
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const paymentIntent = await stripe.paymentIntents.create({...});
```

## Timeline

**Human action required before Phase 7 (Implementation)**

Estimated time: 15 minutes
```

**plan.md (Human Task Added):**

```markdown
## Prerequisites

**Human Task [HT-001]: Configure Stripe API Secrets**

Status: 🔴 BLOCKED - Requires human action

Documentation: `.specify/specs/001-payments/secret-requirements.md`

Steps:
1. Generate Stripe test secret key
2. Store in 1Password: `op://glx/stripe/test-secret-key`
3. Generate Stripe webhook secret
4. Store in 1Password: `op://glx/stripe/webhook-secret`
5. Run: `container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key`
6. Run: `container-use config secret set STRIPE_WEBHOOK_SECRET op://glx/stripe/webhook-secret`
7. Verify: `container-use config secret list`
8. Close GitHub issue #12

Estimated Time: 15 minutes

**Implementation cannot proceed until HT-001 is complete.**
```

**GitHub Issue (Created by BOSS):**

```
Title: Configure Stripe API Secrets

This feature requires Stripe integration. Please set up the required secrets.

📋 Documentation: .specify/specs/001-payments/secret-requirements.md

⏱️ Estimated time: 15 minutes

✅ Checklist:
- [ ] Generate Stripe test secret key
- [ ] Store in 1Password (op://glx/stripe/test-secret-key)
- [ ] Generate Stripe webhook secret
- [ ] Store in 1Password (op://glx/stripe/webhook-secret)
- [ ] Configure container-use secrets
- [ ] Verify with `container-use config secret list`

Once complete, comment "done" and close this issue.
```

### Common Secret Patterns

#### GitHub

```yaml
GITHUB_TOKEN:
  reference: op://glx/github/token
  purpose: Create PRs, push commits, manage issues
  scope: repo, workflow
  generate: Settings → Developer settings → Personal access tokens
```

#### Database

```yaml
DATABASE_URL:
  reference: op://glx/database/test-url
  purpose: Integration tests with real database
  format: postgresql://user:password@host:port/database
  generate: Create dedicated test database with limited permissions
```

#### Email (SendGrid)

```yaml
SENDGRID_API_KEY:
  reference: op://glx/sendgrid/api-key
  purpose: Send transactional emails
  scope: Mail Send (full access)
  generate: Settings → API Keys → Create API Key
```

#### Cloud Storage (AWS S3)

```yaml
AWS_ACCESS_KEY_ID:
  reference: op://glx/aws/access-key
AWS_SECRET_ACCESS_KEY:
  reference: op://glx/aws/secret-key

purpose: Upload files to S3
scope: s3:PutObject, s3:GetObject (bucket-specific)
generate: IAM → Users → Create access key
```

### Security Benefits

- ✅ Secrets stored securely in 1Password
- ✅ AI models never see actual values
- ✅ op:// references safe to commit
- ✅ Automatic secret stripping from logs
- ✅ Centralized management
- ✅ Easy rotation (update in 1Password, workers get new values)

---

## Worker Configuration

### Default Configuration

**File:** `.container-use/environment.json`

```json
{
  "base_image": "node:22-slim",
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential"
  ],
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install"
  ],
  "environment_variables": {
    "NODE_ENV": "development",
    "CI": "true"
  },
  "secrets": [
    "GITHUB_TOKEN=op://glx/github/token",
    "ANTHROPIC_API_KEY=op://glx/anthropic/api-key",
    "DATABASE_URL=op://glx/database/connection-url"
  ],
  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.anthropic.com"
    ]
  }
}
```

### Worker-Specific Configurations

BOSS maintains different configs for different worker types in `.boss/workers/*/container-config.json`.

#### Clarifier / Spec-Writer / Planner

```json
{
  "base_image": "node:22-slim",
  "environment_variables": {
    "WORKER_ROLE": "clarifier",
    "SPEC_KIT_MODE": "true"
  },
  "secrets": []  // No external API access needed
}
```

#### Developer (Frontend)

```json
{
  "base_image": "node:22-slim",
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential"
  ],
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install"
  ],
  "environment_variables": {
    "WORKER_ROLE": "developer-frontend",
    "NODE_ENV": "test"
  },
  "secrets": [
    "GITHUB_TOKEN=op://glx/github/token",
    "VERCEL_TOKEN=op://glx/vercel/token"
  ],
  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.vercel.com"
    ]
  }
}
```

#### Developer (Backend)

```json
{
  "base_image": "node:22-slim",
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential postgresql-client"
  ],
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install",
    "pnpm prisma generate"
  ],
  "environment_variables": {
    "WORKER_ROLE": "developer-backend",
    "NODE_ENV": "test"
  },
  "secrets": [
    "GITHUB_TOKEN=op://glx/github/token",
    "STRIPE_SECRET_KEY=op://glx/stripe/test-secret-key",
    "STRIPE_WEBHOOK_SECRET=op://glx/stripe/webhook-secret",
    "SENDGRID_API_KEY=op://glx/sendgrid/api-key",
    "DATABASE_URL=op://glx/database/test-url"
  ],
  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.stripe.com",
      "api.sendgrid.com",
      "*.postgres.database.azure.com"
    ]
  }
}
```

#### Developer (Fullstack)

```json
{
  "base_image": "node:22-slim",
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential postgresql-client"
  ],
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install",
    "pnpm prisma generate"
  ],
  "environment_variables": {
    "WORKER_ROLE": "developer-fullstack",
    "NODE_ENV": "test"
  },
  "secrets": [
    "GITHUB_TOKEN=op://glx/github/token",
    "STRIPE_SECRET_KEY=op://glx/stripe/test-secret-key",
    "VERCEL_TOKEN=op://glx/vercel/token",
    "DATABASE_URL=op://glx/database/test-url",
    "SENDGRID_API_KEY=op://glx/sendgrid/api-key"
  ],
  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.stripe.com",
      "api.vercel.com",
      "api.sendgrid.com",
      "*.postgres.database.azure.com"
    ]
  }
}
```

#### Reviewer / Consolidator

```json
{
  "base_image": "node:22-slim",
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install"
  ],
  "environment_variables": {
    "WORKER_ROLE": "reviewer",
    "NODE_ENV": "test"
  },
  "secrets": [
    "GITHUB_TOKEN=op://glx/github/token"
  ],
  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com"
    ]
  }
}
```

---

## Worker Lifecycle

### 1. Creation (BOSS Spawns Worker)

**BOSS uses Container-Use MCP:**

```typescript
// 1. BOSS queries Knowledge Base for context
const context = await mcp.knowledgeBase.search({
  query: "Stripe integration patterns",
  filters: { tech_stack: ["nodejs", "typescript"] }
});

// 2. BOSS creates worker environment
const env = await mcp.containerUse.createEnvironment({
  title: "developer-backend-US1",
  config: ".boss/workers/developer-backend/container-config.json"
});
// Returns: { env_id: "env-abc123", branch: "container-use/env-abc123" }

// 3. BOSS assembles prompt with context
const workerPrompt = `
# Backend Developer - User Story 1: Stripe Payment Integration

${context}  // Patterns from knowledge base

## Your Task
Implement Stripe payment integration following TDD.

## Quality Gates
- Tests written BEFORE implementation
- Coverage ≥ 80%
- Integration tests with real Stripe test API

## Available Secrets
- STRIPE_SECRET_KEY (injected from 1Password)
- DATABASE_URL (injected from 1Password)
`;

// 4. BOSS executes work via Container-Use MCP
await mcp.containerUse.executeInEnvironment({
  env_id: env.env_id,
  prompt: workerPrompt,
  skills: ["nodejs", "stripe", "api-design", "testing"]
});
```

**Equivalent Container-Use CLI:**

```bash
container-use config load .boss/workers/developer-backend/container-config.json
container-use environment create --title "developer-backend-US1"
# Returns: env-abc123
# Worker executes inside container with prompt + skills + secrets
```

### 2. Execution (Worker Runs)

```
Container: env-abc123
Branch: container-use/env-abc123

Secrets Injected:
├── STRIPE_SECRET_KEY=sk_test_xxxxx (from op://glx/stripe/test-secret-key)
├── DATABASE_URL=postgresql://... (from op://glx/database/test-url)
└── GITHUB_TOKEN=ghp_xxxxx (from op://glx/github/token)

Worker Executes:
1. Write failing tests (uses STRIPE_SECRET_KEY)
2. Implement feature (calls Stripe API)
3. Run integration tests (secrets in process.env)
4. Commit changes to branch
```

### 3. Observation (BOSS Monitors)

**Via Container-Use MCP:**

```typescript
// Check status
const status = await mcp.containerUse.getEnvironmentStatus({
  env_id: "env-abc123"
});

// Get logs
const logs = await mcp.containerUse.getEnvironmentLog({
  env_id: "env-abc123",
  lines: 50
});

// Check diff
const diff = await mcp.containerUse.getEnvironmentDiff({
  env_id: "env-abc123"
});

// Get artifacts (test results, coverage)
const artifacts = await mcp.containerUse.getEnvironmentArtifacts({
  env_id: "env-abc123",
  paths: ["coverage/", "test-results.json"]
});
```

**Manual (Container-Use CLI):**

```bash
container-use log env-abc123          # Command history
container-use diff env-abc123         # Code changes
container-use terminal env-abc123     # Interactive shell
```

### 4. Completion (Quality Gates)

**BOSS evaluates quality gates:**

```typescript
const qualityGates = await mcp.containerUse.getQualityGateResults({
  env_id: "env-abc123"
});

if (qualityGates.allPassed) {
  // ✅ Quality gates PASSED

  await mcp.containerUse.mergeEnvironment({
    env_id: "env-abc123",
    target_branch: "main",
    delete_after_merge: true
  });

  console.log(`✅ Worker completed successfully!
    Coverage: ${qualityGates.coverage}%
    Tests: PASS
    Branch merged and cleaned up`);

} else {
  // ❌ Quality gates FAILED

  const failures = qualityGates.failures;

  // Delete failed environment
  await mcp.containerUse.deleteEnvironment({
    env_id: "env-abc123"
  });

  // Retry with improved prompt
  const retryEnv = await mcp.containerUse.createEnvironment({
    title: "developer-backend-US1-retry",
    config: ".boss/workers/developer-backend/container-config.json"
  });

  const improvedPrompt = `
    ${originalPrompt}

    PREVIOUS ATTEMPT FAILED:
    ${failures.join('\n')}

    THIS TIME:
    - Focus on test coverage for edge cases
    - Ensure TDD: tests before implementation
  `;

  await mcp.containerUse.executeInEnvironment({
    env_id: retryEnv.env_id,
    prompt: improvedPrompt
  });
}
```

**Container-Use CLI:**

```bash
# Success
container-use merge env-abc123 --delete

# Failure
container-use delete env-abc123
container-use environment create --title "developer-backend-US1-retry"
```

### 5. Parallel Workers

BOSS launches multiple workers simultaneously:

```
Phase 7: Implementation

Worker 1: env-001 (developer-fullstack)
├── Branch: container-use/env-001
├── Task: [T010-T020] User Authentication
├── Secrets: GITHUB_TOKEN, STRIPE_SECRET_KEY, DATABASE_URL
└── Status: ⏳ Running

Worker 2: env-002 (developer-backend)
├── Branch: container-use/env-002
├── Task: [T021-T028] User Registration
├── Secrets: GITHUB_TOKEN, SENDGRID_API_KEY, DATABASE_URL
└── Status: ⏳ Running

Worker 3: env-003 (developer-frontend)
├── Branch: container-use/env-003
├── Task: [T029-T035] Dashboard UI
├── Secrets: GITHUB_TOKEN, VERCEL_TOKEN
└── Status: ✅ Completed

Worker 4: env-004 (reviewer)
├── Branch: container-use/env-004
├── Task: Review implementations
├── Secrets: GITHUB_TOKEN
└── Status: ⏸️ Waiting

Benefits:
✅ Each worker isolated (own branch + container)
✅ No conflicts between parallel work
✅ Each has required secrets for their tasks
✅ Full observability of all actions
```

### 6. Integration Tests with Real APIs

Workers use injected secrets for integration tests:

```typescript
// tests/integration/stripe-payment.test.ts

import Stripe from 'stripe';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Stripe Payment Integration', () => {
  let stripe: Stripe;

  beforeAll(() => {
    // Secret injected from op://glx/stripe/test-secret-key
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
  });

  it('creates a payment intent', async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      payment_method_types: ['card']
    });

    expect(paymentIntent.id).toMatch(/^pi_/);
    expect(paymentIntent.amount).toBe(1000);
    expect(paymentIntent.status).toBe('requires_payment_method');
  });

  it('verifies webhook signature', async () => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const payload = JSON.stringify({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test' } }
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret
    });

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    expect(event.type).toBe('payment_intent.succeeded');
  });
});
```

**Worker Output:**

```
Running integration tests...

✅ Stripe Payment Integration
  ✅ creates a payment intent (342ms)
  ✅ verifies webhook signature (45ms)

Test Summary: 2 passed, 0 failed
Coverage: 94%

Integration tests use real Stripe API in test mode.
Secrets injected securely via container-use.
```

---

## Security Best Practices

### 1. Never Commit Secrets

```yaml
# ✅ GOOD - References only
{
  "secrets": [
    "STRIPE_SECRET_KEY=op://glx/stripe/test-secret-key",
    "DATABASE_URL=op://glx/database/test-url"
  ]
}

# ❌ BAD - Actual values
{
  "secrets": [
    "STRIPE_SECRET_KEY=sk_test_51ABC123...",
    "DATABASE_URL=postgresql://user:password@host/db"
  ]
}
```

### 2. Use Test Keys

```yaml
# ✅ GOOD - Separate environments
test:
  STRIPE_SECRET_KEY: op://glx/stripe/test-secret-key  # sk_test_*

production:
  STRIPE_SECRET_KEY: op://glx/stripe/live-secret-key  # sk_live_*

# Workers always use test keys
# Production keys only in production environment
```

### 3. Minimal Permissions

```json
# ✅ GOOD - Restricted AWS policy
{
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::my-bucket/uploads/*"
  }]
}

# ❌ BAD - Overly permissive
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}
```

### 4. Secret Rotation

```yaml
When rotating secrets:
1. Generate new secret in service (Stripe, AWS, etc.)
2. Update in 1Password
3. Workers automatically get new value (no code changes!)
4. Revoke old secret after verification
```

### 5. Audit Access

```bash
# Review secret access in logs
container-use log env-001 | grep "STRIPE"

# Monitor 1Password access
op signin
op item get stripe --vault glx --format json
```

### 6. Network Restrictions

```json
{
  "network": {
    "allowed_hosts": [
      "api.stripe.com",              // Specific service
      "*.sendgrid.com",              // Wildcard for service
      "registry.npmjs.org"           // Package registry
    ]
  }
}
```

**Deny by default:** Only whitelist required services.

---

## Troubleshooting

### Secret Not Available

**Symptom:** Worker fails with "STRIPE_SECRET_KEY is not defined"

**Solution:**

```bash
# 1. Check secret configuration
container-use config secret list

# 2. Verify 1Password CLI authenticated
op signin
op item get stripe --vault glx

# 3. Verify reference correct
container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key

# 4. Test resolution in container
container-use terminal env-001
echo $STRIPE_SECRET_KEY  # Should show actual value
```

### Worker Branch Conflicts

**Symptom:** Worker cannot merge branch

**Solution:**

```bash
# Option 1: Resolve manually
container-use checkout env-001
# Fix conflicts in IDE
git add .
git commit -m "Resolve conflicts"

# Option 2: Restart worker (BOSS will spawn new worker)
container-use delete env-001
```

### Integration Tests Failing

**Symptom:** Tests pass locally but fail in container

**Solution:**

```bash
# 1. Enter container
container-use terminal env-001

# 2. Verify secrets available
env | grep STRIPE
env | grep DATABASE

# 3. Check network access
curl https://api.stripe.com/v1/customers -u $STRIPE_SECRET_KEY:

# 4. Inspect logs
container-use log env-001 | grep ERROR
```

### Permission Denied Errors

**Symptom:** Worker cannot execute commands

**Solution:**

Workers run in "dangerous" mode with full permissions. If you see permission errors:

```bash
# This should NOT happen in container-use
# Workers have root access inside containers

# If it does happen, check:
1. Verify "dangerous" mode enabled in config
2. Check container-use version (ensure latest)
3. Restart Docker daemon
```

### Worker Hangs

**Symptom:** Worker stuck, no progress

**Solution:**

```bash
# 1. Check logs
container-use log env-001

# 2. Enter container
container-use terminal env-001

# 3. Kill stuck processes
ps aux | grep node
kill -9 <pid>

# 4. If unrecoverable, delete and retry
container-use delete env-001
```

---

## Reference

### BOSS Workflow Integration

#### Phase 0: Bootstrap

```bash
boss bootstrap --template nextjs-app-turbo

Creates:
├── CLAUDE.md (worker instructions)
├── start-boss.sh (launches BOSS with --allowedTools)
├── .container-use/environment.json (default config)
└── .boss/workers/*/container-config.json (worker configs)
```

#### Phase 1-3: No Secrets Needed

Clarifier, Spec-Writer, Planner workers don't need external APIs.

```json
{
  "secrets": []
}
```

#### Phase 4: Planning - Secret Discovery

Planner analyzes integrations and creates:
- `secret-requirements.md` with setup instructions
- Human tasks (HT-*) for secret generation
- GitHub issues to track completion

#### Phase 5-6: Validation & Task Breakdown

Reviewer validates plan includes secret setup.
Tasks include HT-* prerequisites.

#### Phase 7: Implementation - Secrets Required

BOSS verifies all secrets configured before spawning workers.

```typescript
async function beforeImplementation() {
  const requiredSecrets = await getRequiredSecrets();
  const configuredSecrets = await getConfiguredSecrets();

  const missing = requiredSecrets.filter(
    secret => !configuredSecrets.includes(secret)
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing secrets: ${missing.join(', ')}\n` +
      `Please complete HT-* tasks before proceeding.`
    );
  }

  await spawnWorkers();
}
```

#### Phase 8: Consolidation

Consolidator merges all worker branches:

```bash
container-use environment create --title "consolidator"

git merge container-use/env-001
git merge container-use/env-002
git merge container-use/env-003

pnpm test:integration  # With secrets

gh pr create --title "Complete Implementation"
```

### CLAUDE.md Templates

#### Next.js App Template

```markdown
# Project: [Name]

## CRITICAL: Environment-Only Operations

**ALWAYS use ONLY Environments for ALL operations—NO EXCEPTIONS.**

- ✅ DO: Use environment tools
- ❌ DO NOT: Use raw git CLI
- ❌ DO NOT: Execute outside environment

### User Visibility

You MUST inform user how to view work:
- `container-use log <env_id>`
- `container-use checkout <env_id>`

## Next.js Guidelines

- App Router (app/ directory)
- Server Components by default
- Tailwind CSS for styling
- Prisma for database
- Vitest for testing

## Quality Standards

- TDD: Tests BEFORE implementation
- Coverage ≥ 80%
- No console.logs in production
```

#### API Service Template

```markdown
# Project: [Name]

## CRITICAL: Environment-Only Operations

[Same as Next.js template]

## Fastify Guidelines

- RESTful endpoints (OpenAPI 3.0)
- Plugin-based architecture
- Prisma for data access
- JSON Schema validation
- Repository pattern

## Quality Standards

- TDD: Tests BEFORE implementation
- Coverage ≥ 80%
- OpenAPI spec up-to-date
```

#### Blank Template

```markdown
# Project: [Name]

## CRITICAL: Environment-Only Operations

[Same as other templates]

## TypeScript Guidelines

- Strict mode enabled
- Vitest for testing
- ESLint + Prettier
- Conventional commits

## Quality Standards

- TDD: Tests BEFORE implementation
- Coverage ≥ 80%
```

### start-boss.sh Script

```bash
#!/usr/bin/env bash
# start-boss.sh - Launch BOSS with restricted tool access

set -e

echo "🤖 Starting BOSS with restricted tool access..."
echo "  ✅ Container-Use MCP"
echo "  ✅ GitHub MCP"
echo "  ✅ Knowledge Base MCP"
echo "  ❌ NO host-level tools"

claude --allowedTools \
mcp__container-use__environment_add_service,\
mcp__container-use__environment_checkpoint,\
mcp__container-use__environment_config,\
mcp__container-use__environment_create,\
mcp__container-use__environment_file_delete,\
mcp__container-use__environment_file_edit,\
mcp__container-use__environment_file_list,\
mcp__container-use__environment_file_read,\
mcp__container-use__environment_file_write,\
mcp__container-use__environment_open,\
mcp__container-use__environment_run_cmd,\
mcp__container-use__environment_update_metadata,\
mcp__github__*,\
mcp__knowledge-base__*
```

### BOSS Commands

```bash
# Worker Management
boss workers              # List active workers
boss logs <env-id>        # View worker logs
boss diff <env-id>        # View worker changes
boss terminal <env-id>    # Enter worker container
boss kill <env-id>        # Kill worker

# Secret Management
boss config secret add <name> <op-ref>
boss config secret list   # Values masked
boss config secret remove <name>

# Workflow
boss status               # Overall status
boss pause                # Pause workflow
boss resume               # Resume workflow
```

### Benefits Summary

1. **Security**
   - ✅ Secrets never exposed to AI
   - ✅ Automatic log stripping
   - ✅ Isolated environments
   - ✅ Centralized 1Password management

2. **Observability**
   - ✅ Complete command history
   - ✅ Git branch per worker
   - ✅ Live monitoring
   - ✅ Full audit trail

3. **Reproducibility**
   - ✅ Exact environment recreation
   - ✅ Configuration in git
   - ✅ Deterministic builds
   - ✅ Easy rollback

4. **Parallelization**
   - ✅ Multiple isolated workers
   - ✅ No conflicts
   - ✅ Own branch per worker
   - ✅ Clean consolidation

5. **Iteration**
   - ✅ Resume in same environment
   - ✅ Iterate on failures
   - ✅ Disposable experiments
   - ✅ Main branch protected

---

## Summary

**BOSS + Container-Use provides secure, observable, multi-agent development:**

1. ✅ **Isolated Execution** - Workers in containers with dedicated branches
2. ✅ **Secure Secrets** - 1Password integration, AI never sees values
3. ✅ **Agent Discovery** - Workers identify and document secret needs
4. ✅ **Human-in-Loop** - Secret setup via GitHub issues with instructions
5. ✅ **Integration Testing** - Secrets available for real API tests
6. ✅ **Full Observability** - Complete audit trail
7. ✅ **Parallel Execution** - Multiple workers without conflicts
8. ✅ **Clean Workflow** - Disposable environments, protected main branch

**Container-use is the foundation that makes BOSS's multi-agent orchestration secure, observable, and reproducible.** 🚀

---

**Next:** See [BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md) for how BOSS orchestrates the complete Spec-Kit workflow with these workers.
