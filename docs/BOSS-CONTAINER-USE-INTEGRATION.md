# BOSS + Container-Use Integration

## How BOSS Leverages Container-Use for Isolated Agent Execution

This document details how BOSS (Business-Orchestrated Software System) uses **container-use** to execute AI workers in isolated, secure, and observable environments with proper secret management.

---

## Container-Use Overview

**Container-Use** is a system for running AI agents in isolated Docker containers with dedicated Git branches, enabling safe experimentation and clean separation of work.

### Core Concepts

```
┌─────────────────────────────────────────┐
│    Container-Use Environment            │
├─────────────────────────────────────────┤
│                                         │
│  Git Branch: container-use/env-abc123  │
│  Container: Isolated Docker runtime    │
│  History: Complete command log          │
│  Secrets: Injected via environment vars │
│                                         │
└─────────────────────────────────────────┘
```

**Key Properties:**
1. **Isolation** - Each environment has its own branch and container
2. **Observability** - Complete history of commands and changes
3. **Disposability** - Can be deleted and recreated easily
4. **Security** - Secrets injected, never exposed to AI models
5. **Reproducibility** - Full audit trail of all work

### Container-Use Workflow

```
1. Create Environment (with "Dangerous" Mode)
   └─► New Git branch + Docker container spawned
   └─► Worker has FULL permissions inside container
   └─► BOSS configures egress rules (network restrictions)

2. Execute Work
   └─► Agent runs commands in isolated container
   └─► Can execute any command, install any tool
   └─► Limited to configured external API access

3. Observe Results
   ├─► container-use log <env-id>      # Command history
   ├─► container-use diff <env-id>     # Code changes
   └─► container-use terminal <env-id> # Interactive inspection

4. Make Decision
   ├─► container-use merge <env-id>    # Accept work
   ├─► Resume with same env-id         # Iterate
   └─► container-use delete <env-id>   # Discard
```

### "Dangerous" Mode Explained

**Workers run with full permissions inside their isolated containers:**
- ✅ Can execute any shell command (`sudo`, `rm -rf`, etc.)
- ✅ Can install any package or tool
- ✅ Can modify any file in the workspace
- ✅ No filesystem restrictions within the container
- ✅ Full root access inside the sandboxed environment

**Security is provided by:**
1. **Container isolation** - Worker cannot affect host machine or other workers
2. **Egress control** - BOSS restricts which external services each worker can access
3. **Branch isolation** - Each worker has own Git branch, cannot modify main
4. **Observable execution** - Complete command history logged
5. **Disposable environments** - Failed workers deleted and recreated

**Example Egress Configuration:**
```json
{
  "egress_rules": {
    "allow": [
      "api.stripe.com",           // Payment API
      "api.sendgrid.com",         // Email API
      "registry.npmjs.org",       // NPM packages
      "github.com"                // Git operations
    ],
    "deny": [
      "*.amazonaws.com",          // Block AWS (frontend worker doesn't need)
      "*.s3.amazonaws.com"
    ]
  }
}
```

**Why "Dangerous" Mode:**
- Enables Claude to use full development capabilities
- No permission errors blocking legitimate operations
- Simpler worker configuration (no complex permission rules)
- Security through isolation, not restriction

---

## How BOSS Uses Container-Use

**BOSS = Claude Code/Cursor configured with MCP servers.**

Claude Code/Cursor runs on the **host machine** and orchestrates **workers in container-use environments** via the **Container-Use MCP server**.

### BOSS Orchestration via Container-Use MCP

```
┌─────────────────────────────────────────────────┐
│  Claude Code/Cursor (Host Machine)              │
│  = BOSS when configured with:                   │
│  • BOSS skills                                  │
│  • Container-Use MCP ← Uses this to spawn workers │
│  • GitHub MCP                                   │
│  • Knowledge Base MCP                           │
│  • 1Password CLI (op) - humans create secrets  │
└────────────┬────────────────────────────────────┘
             │
             │ Container-Use MCP Commands:
             │ • createEnvironment()
             │ • executeInEnvironment()
             │ • getEnvironmentStatus()
             │ • mergeEnvironment()
             │ • deleteEnvironment()
             │
             ▼
┌────────────────────────────────────────────────┐
│  Container-Use (manages Docker containers)     │
│                                                │
│  Environment 1: env-abc123                     │
│  ├─ Branch: container-use/env-abc123          │
│  ├─ Container: Docker (isolated)               │
│  └─ Worker: Claude Code + skills + secrets    │
│                                                │
│  Environment 2: env-def456                     │
│  ├─ Branch: container-use/env-def456          │
│  ├─ Container: Docker (isolated)               │
│  └─ Worker: Claude Code + skills + secrets    │
└────────────────────────────────────────────────┘
```

### Architecture

```
┌───────────────────────────────────────────────────────┐
│                 BOSS Controller                       │
│              (Host Machine - Local)                   │
│                                                       │
│  Runs on: Claude Code or Cursor                      │
│  Role: Orchestrator, not worker                      │
│  Access: Full system, GitHub, Knowledge Base         │
└────────────┬──────────────────────────────────────────┘
             │
             │ spawns workers via container-use
             │
    ┌────────┼────────┬─────────┬─────────┐
    │        │        │         │         │
    ▼        ▼        ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Worker 1││Worker 2││Worker 3││Worker 4││Worker 5│
│        ││        ││        ││        ││        │
│Clarify ││Spec    ││Plan    ││Dev     ││Review  │
│        ││        ││        ││        ││        │
│cu/env-1││cu/env-2││cu/env-3││cu/env-4││cu/env-5│
│        ││        ││        ││        ││        │
│Secrets ││Secrets ││Secrets ││Secrets ││Secrets │
│injected││injected││injected││injected││injected│
└────────┘└────────┘└────────┘└────────┘└────────┘
```

**Why This Architecture:**
- ✅ BOSS needs full system access (GitHub, Knowledge Base)
- ✅ Workers need isolation (can't break main branch)
- ✅ Workers run "dangerously" inside containers (full permissions)
- ✅ BOSS controls egress rules (network restrictions per container)
- ✅ Workers need secrets (API keys for integrations)
- ✅ Each worker has own branch (parallel work possible)
- ✅ BOSS can observe and coordinate all workers

**Container Security Model:**
- Workers have **full permissions** inside their isolated containers
- Claude can execute any command, install any tool, modify any file
- Security comes from **container isolation**, not permission restrictions
- BOSS controls **egress rules** (which external services workers can access)
- Example: Backend worker can access Stripe API but not AWS
- Humans create secrets in 1Password when BOSS requests via GitHub

---

## Container-Use Configuration for BOSS Workers

BOSS creates different container-use configurations for each worker type.

### Default Configuration (`.container-use/environment.json`)

```json
{
  "base_image": "node:22-slim",
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential",
    "curl -fsSL https://get.docker.com | sh"
  ],
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install"
  ],
  "environment_variables": {
    "NODE_ENV": "development",
    "CI": "true"
  },
  "secrets": {
    "GITHUB_TOKEN": "op://vault/github/token",
    "ANTHROPIC_API_KEY": "op://vault/anthropic/api-key",
    "DATABASE_URL": "op://vault/database/connection-url"
  }
}
```

### Worker-Specific Configurations

BOSS maintains different configurations for different worker types:

#### 1. Clarifier Worker

```json
{
  "base_image": "node:22-slim",
  "environment_variables": {
    "WORKER_ROLE": "clarifier",
    "INTERACTION_MODE": "conversational"
  },
  "secrets": {}  // No secrets needed for clarification
}
```

#### 2. Spec-Writer Worker

```json
{
  "base_image": "node:22-slim",
  "environment_variables": {
    "WORKER_ROLE": "spec-writer",
    "SPEC_KIT_MODE": "true"
  },
  "secrets": {}  // No secrets needed for writing specs
}
```

#### 3. Planner Worker

```json
{
  "base_image": "node:22-slim",
  "environment_variables": {
    "WORKER_ROLE": "planner",
    "SPEC_KIT_MODE": "true"
  },
  "secrets": {}  // No secrets needed for planning
}
```

#### 4. Developer Worker (Frontend)

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
  "secrets": {
    "GITHUB_TOKEN": "op://vault/github/token",
    "VERCEL_TOKEN": "op://vault/vercel/token"
  }
}
```

#### 5. Developer Worker (Backend)

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
    "NODE_ENV": "test",
    "DATABASE_URL": "postgresql://test:test@localhost:5432/testdb"
  },
  "secrets": {
    "GITHUB_TOKEN": "op://vault/github/token",
    "STRIPE_SECRET_KEY": "op://vault/stripe/test-secret-key",
    "STRIPE_WEBHOOK_SECRET": "op://vault/stripe/webhook-secret",
    "SENDGRID_API_KEY": "op://vault/sendgrid/api-key",
    "AWS_ACCESS_KEY_ID": "op://vault/aws/access-key",
    "AWS_SECRET_ACCESS_KEY": "op://vault/aws/secret-key"
  }
}
```

#### 6. Developer Worker (Fullstack)

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
  "secrets": {
    "GITHUB_TOKEN": "op://vault/github/token",
    "STRIPE_SECRET_KEY": "op://vault/stripe/test-secret-key",
    "STRIPE_WEBHOOK_SECRET": "op://vault/stripe/webhook-secret",
    "VERCEL_TOKEN": "op://vault/vercel/token",
    "DATABASE_URL": "op://vault/database/test-url",
    "SENDGRID_API_KEY": "op://vault/sendgrid/api-key"
  }
}
```

#### 7. Reviewer Worker

```json
{
  "base_image": "node:22-slim",
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install"
  ],
  "environment_variables": {
    "WORKER_ROLE": "reviewer",
    "REVIEW_MODE": "strict"
  },
  "secrets": {
    "GITHUB_TOKEN": "op://vault/github/token"
  }
}
```

#### 8. Consolidator Worker

```json
{
  "base_image": "node:22-slim",
  "install_commands": [
    "npm install -g pnpm",
    "pnpm install"
  ],
  "environment_variables": {
    "WORKER_ROLE": "consolidator",
    "NODE_ENV": "test"
  },
  "secrets": {
    "GITHUB_TOKEN": "op://vault/github/token",
    "VERCEL_TOKEN": "op://vault/vercel/token"
  }
}
```

---

## Secret Management with 1Password CLI

**IMPORTANT:** 1Password does NOT offer an MCP server. Instead:
1. BOSS requests secrets via GitHub (issues, PR comments)
2. Humans manually create secrets in 1Password
3. Humans configure container-use with `op://` references
4. Container-use workers resolve secrets via the op CLI at runtime

### How BOSS Requests Secrets

When planning detects required integrations (Stripe, SendGrid, AWS, etc.), BOSS:
1. Creates detailed setup instructions in `.specify/specs/.../secret-requirements.md`
2. Creates GitHub issue: "Configure [Service] API Secrets"
3. Waits for human to complete setup and comment "done" on the issue
4. Proceeds with implementation once secrets are available

### 1Password Secret References

Container-use supports `op://` references that point to secrets in 1Password vaults:

```
Format: op://vault-name/item-name/field-name

Examples:
op://vault/github/token
op://vault/stripe/test-secret-key
op://vault/stripe/webhook-secret
op://vault/database/connection-url
op://vault/sendgrid/api-key
op://vault/aws/access-key
```

### How Secrets Work in Container-Use

```
1. BOSS detects integration requirements (e.g., Stripe)
   └─► Creates GitHub issue with secret setup instructions
   └─► Example: "Issue #42: Configure Stripe API Secrets"

2. Human creates secrets in 1Password
   └─► Follows step-by-step instructions from BOSS
   └─► Stores in 1Password: op://glx/stripe/test-secret-key
   └─► Comments "done" on GitHub issue

3. Human configures container-use
   └─► Runs: container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key
   └─► Configuration file (.container-use/environment.json) contains op:// references (safe to commit)

4. BOSS spawns worker with secrets
   └─► container-use reads op:// references from config
   └─► 1Password CLI (op) resolves actual values at runtime
   └─► Injected as environment variables inside container

5. Worker Execution
   └─► Worker runs "dangerously" (full permissions inside container)
   └─► BOSS controls egress (network access to specific APIs only)
   └─► Worker accesses secrets via process.env
   └─► AI model NEVER sees actual secret values

6. Logging & Output
   └─► container-use strips secrets from logs
   └─► Safe to review command history
```

**Security Benefits:**
- ✅ Secrets stored securely in 1Password
- ✅ AI models never see actual secret values
- ✅ References (op://) safe to commit to git
- ✅ Automatic secret stripping from logs
- ✅ Centralized secret management
- ✅ Easy rotation (update in 1Password, workers get new values)

---

## Agent Secret Discovery & Planning

A critical BOSS capability: **agents identify required secrets during planning and create tasks for humans to set them up**.

### How It Works

#### Phase 4: Planning

When the Planner worker creates the technical plan, it also:

1. **Analyzes Integration Requirements**
   - Scans spec.md for mentioned services (Stripe, SendGrid, AWS, etc.)
   - Identifies API integrations needed
   - Determines authentication methods

2. **Creates Secret Requirements Document**
   - Lists all required secrets
   - Documents scope and permissions needed
   - Provides setup instructions for humans

3. **Adds Tasks to Plan**
   - Creates tasks for human to generate secrets
   - Includes op:// references that need to be created
   - Documents where to add secrets in 1Password

### Example: Stripe Integration

**Scenario:** User story requires Stripe payment integration

#### Planner Identifies Requirements

```yaml
# .specify/specs/001-payments/secret-requirements.md

# Secret Requirements for Payment Integration

This feature requires Stripe API integration. The following secrets must be configured before implementation can begin.

## Required Secrets

### 1. Stripe Test Secret Key

**Purpose:** Authenticate API requests to Stripe in test mode

**1Password Setup:**
- Vault: `glx` (your project vault)
- Item Name: `stripe`
- Field Name: `test-secret-key`
- Reference: `op://glx/stripe/test-secret-key`

**How to Generate:**
1. Log in to Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
2. Click "Developers" → "API keys"
3. Under "Standard keys", find "Secret key" (starts with `sk_test_`)
4. Click "Reveal test key" and copy the value
5. Store in 1Password at `glx/stripe/test-secret-key`

**Scopes Required:**
- Read/Write access to Customers
- Read/Write access to PaymentIntents
- Read/Write access to Subscriptions
- Webhook endpoint creation

**Configure in Container-Use:**
```bash
container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key
```

### 2. Stripe Webhook Secret

**Purpose:** Verify webhook signatures from Stripe

**1Password Setup:**
- Vault: `glx`
- Item Name: `stripe`
- Field Name: `webhook-secret`
- Reference: `op://glx/stripe/webhook-secret`

**How to Generate:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter endpoint URL (will be provided after deployment)
4. Select events to listen for:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
5. After creating endpoint, reveal webhook signing secret (starts with `whsec_`)
6. Store in 1Password at `glx/stripe/webhook-secret`

**Configure in Container-Use:**
```bash
container-use config secret set STRIPE_WEBHOOK_SECRET op://glx/stripe/webhook-secret
```

### 3. Stripe Publishable Key (Optional - Frontend)

**Purpose:** Initialize Stripe.js on the client side

**Note:** This is NOT a secret (safe to expose in client-side code), but documented for completeness.

**How to Get:**
- Same location as secret key
- Starts with `pk_test_`
- Can be committed directly to code (not via 1Password)

## Secret Verification

After configuring all secrets, verify they're available:

```bash
# List configured secrets (values will be masked)
container-use config secret list

# Expected output:
# STRIPE_SECRET_KEY: op://glx/stripe/test-secret-key
# STRIPE_WEBHOOK_SECRET: op://glx/stripe/webhook-secret
```

## Integration Tests

The developer worker will need these secrets to run integration tests:

```typescript
// tests/integration/stripe.test.ts
describe('Stripe Integration', () => {
  it('creates a payment intent', async () => {
    // STRIPE_SECRET_KEY available as process.env.STRIPE_SECRET_KEY
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd'
    });

    expect(paymentIntent.status).toBe('requires_payment_method');
  });
});
```

## Security Notes

- ✅ Never commit actual secret values to git
- ✅ Always use test keys for development
- ✅ Rotate keys if accidentally exposed
- ✅ Use restricted API keys when possible
- ✅ Monitor API key usage in Stripe Dashboard

## Timeline

**Human Action Required:** Before Phase 7 (Implementation)

The implementation phase cannot proceed until these secrets are configured. Please complete setup and close the GitHub issue.
```

#### Added to plan.md

```markdown
## Phase 6: Task Breakdown

### Prerequisites

Before implementation tasks can begin, the following secrets must be configured:

**Human Task [HT-001]: Configure Stripe API Secrets**

Status: 🔴 BLOCKED - Requires human action

Description: Set up Stripe test API keys in 1Password and configure container-use secret references.

Documentation: See `.specify/specs/001-payments/secret-requirements.md`

Required Actions:
1. Generate Stripe test secret key
2. Store in 1Password: `op://glx/stripe/test-secret-key`
3. Generate Stripe webhook secret
4. Store in 1Password: `op://glx/stripe/webhook-secret`
5. Run: `container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key`
6. Run: `container-use config secret set STRIPE_WEBHOOK_SECRET op://glx/stripe/webhook-secret`
7. Verify: `container-use config secret list`

Acceptance Criteria:
- [ ] Both secrets stored in 1Password vault `glx`
- [ ] Container-use configured with op:// references
- [ ] Secrets verified with `container-use config secret list`
- [ ] GitHub issue closed to confirm completion

Estimated Time: 15 minutes

**Implementation tasks cannot proceed until HT-001 is complete.**
```

#### BOSS Notification to User

```
BOSS: 🚦 GATE 1: Planning Approval Required

      I've created a complete plan, but I've identified that this feature
      requires Stripe API integration.

      📋 Secret Setup Required:

      Before implementation can begin, you need to configure Stripe secrets.

      I've created detailed instructions:
      👉 .specify/specs/001-payments/secret-requirements.md

      Human Task: Configure Stripe API Secrets
      👉 GitHub Issue: #12

      This includes:
      - How to generate Stripe test keys
      - Where to store them in 1Password (op://glx/stripe/...)
      - How to configure container-use
      - Verification steps

      ⏱️  Estimated time: 15 minutes

      Once you've completed the setup and closed issue #12,
      I can proceed with implementation!
```

---

## Common Secret Patterns

### GitHub Integration

```yaml
secrets:
  GITHUB_TOKEN:
    reference: op://glx/github/token
    purpose: Create PRs, push commits, manage issues
    scope: repo, workflow
    generate: Settings → Developer settings → Personal access tokens
```

### Database Access

```yaml
secrets:
  DATABASE_URL:
    reference: op://glx/database/test-url
    purpose: Connect to test database for integration tests
    format: postgresql://user:password@host:port/database
    generate: Create dedicated test database with limited permissions
```

### Email Services (SendGrid)

```yaml
secrets:
  SENDGRID_API_KEY:
    reference: op://glx/sendgrid/api-key
    purpose: Send transactional emails
    scope: Mail Send (full access)
    generate: Settings → API Keys → Create API Key
```

### Cloud Storage (AWS S3)

```yaml
secrets:
  AWS_ACCESS_KEY_ID:
    reference: op://glx/aws/access-key
  AWS_SECRET_ACCESS_KEY:
    reference: op://glx/aws/secret-key
  AWS_REGION:
    value: us-east-1  # Not a secret, can be in config

  purpose: Upload files to S3
  scope: s3:PutObject, s3:GetObject, s3:DeleteObject (bucket-specific)
  generate: IAM → Users → Create access key
```

### Authentication Services (Auth0)

```yaml
secrets:
  AUTH0_DOMAIN:
    value: your-tenant.auth0.com  # Not secret
  AUTH0_CLIENT_ID:
    value: your_client_id  # Not secret
  AUTH0_CLIENT_SECRET:
    reference: op://glx/auth0/client-secret

  purpose: Validate JWT tokens, manage users
  scope: read:users, update:users
  generate: Applications → Your App → Settings
```

---

## Worker Lifecycle with Container-Use

### 1. Worker Creation via Container-Use MCP

**BOSS (Claude Code/Cursor) uses Container-Use MCP to spawn workers:**

```typescript
// Example: BOSS spawning a Backend Developer worker

// 1. BOSS queries Knowledge Base MCP for relevant context
const context = await mcp.knowledgeBase.search({
  query: "Stripe integration patterns",
  filters: { tech_stack: ["nodejs", "typescript"] }
});

// 2. BOSS creates worker environment via Container-Use MCP
const env = await mcp.containerUse.createEnvironment({
  title: "developer-backend-US1",
  config: ".boss/workers/developer-backend/container-config.json"
});
// Returns: { env_id: "env-abc123", branch: "container-use/env-abc123" }

// 3. BOSS assembles worker prompt (includes knowledge base context)
const workerPrompt = `
# Backend Developer - User Story 1: Stripe Payment Integration

${context}  // Relevant patterns from knowledge base

## Your Task
Implement Stripe payment integration following TDD methodology.

## Quality Gates
- Tests written BEFORE implementation
- Coverage ≥ 80%
- All TypeScript checks pass
- Integration tests with real Stripe test API

## Available Secrets (injected via 1Password)
- STRIPE_SECRET_KEY (op://glx/stripe/test-secret-key)
- DATABASE_URL (op://glx/database/test-url)
`;

// 4. BOSS executes work in environment via Container-Use MCP
await mcp.containerUse.executeInEnvironment({
  env_id: env.env_id,
  prompt: workerPrompt,
  skills: ["nodejs", "stripe", "api-design", "testing"],
  max_iterations: 50
});
```

**What Happens Under the Hood:**

Container-Use MCP translates these calls into container-use CLI commands:

```bash
# Equivalent container-use CLI commands (abstracted by MCP)

# 1. Load config from .boss/workers/developer-backend/container-config.json
container-use config load .boss/workers/developer-backend/container-config.json

# 2. Create environment
container-use environment create --title "developer-backend-US1"
# Returns: env-abc123

# 3. Claude Code/Cursor runs inside the container
# With the worker prompt loaded
# With skills activated
# With secrets injected from 1Password
```

### 2. Worker Execution

```
Inside container-use environment: env-abc123
├── Git branch: container-use/env-abc123
├── Container: Isolated Docker runtime
├── Secrets: Injected from 1Password
│   ├── STRIPE_SECRET_KEY=sk_test_xxxxx (from op://glx/stripe/test-secret-key)
│   ├── DATABASE_URL=postgresql://... (from op://glx/database/test-url)
│   └── GITHUB_TOKEN=ghp_xxxxx (from op://glx/github/token)
│
└── Worker executes:
    1. Write failing tests (uses STRIPE_SECRET_KEY for test setup)
    2. Implement feature (uses STRIPE_SECRET_KEY for API calls)
    3. Run integration tests (secrets available in process.env)
    4. Commit changes to branch
```

### 3. Worker Observation via Container-Use MCP

**BOSS monitors worker progress via MCP:**

```typescript
// BOSS checking worker status

// 1. Get environment status
const status = await mcp.containerUse.getEnvironmentStatus({
  env_id: "env-abc123"
});
// Returns: { status: "running", last_activity: "2024-01-15T10:30:00Z" }

// 2. Retrieve logs
const logs = await mcp.containerUse.getEnvironmentLog({
  env_id: "env-abc123",
  lines: 50  // Last 50 lines
});

// 3. Check code changes
const diff = await mcp.containerUse.getEnvironmentDiff({
  env_id: "env-abc123"
});

// 4. Get test results
const artifacts = await mcp.containerUse.getEnvironmentArtifacts({
  env_id: "env-abc123",
  paths: ["coverage/", "test-results.json"]
});
```

**For Manual Inspection (if needed):**

```bash
# User can manually inspect using container-use CLI
container-use log env-abc123
container-use diff env-abc123
container-use terminal env-abc123  # Interactive shell
```

### 4. Worker Completion via Container-Use MCP

**BOSS completes worker via MCP after quality gates:**

```typescript
// Example: Worker completes successfully

// 1. BOSS retrieves quality gate results
const qualityGates = await mcp.containerUse.getQualityGateResults({
  env_id: "env-abc123"
});

if (qualityGates.allPassed) {
  // ✅ Quality gates PASSED

  // 2. Merge worker branch via Container-Use MCP
  await mcp.containerUse.mergeEnvironment({
    env_id: "env-abc123",
    target_branch: "main",
    delete_after_merge: true
  });

  // BOSS logs completion
  console.log(`Worker env-abc123 completed successfully!
    Coverage: ${qualityGates.coverage}%
    Tests: ${qualityGates.testsPass ? 'PASS' : 'FAIL'}
    Branch merged and cleaned up.`);

} else {
  // ❌ Quality gates FAILED

  // BOSS analyzes failure
  const failures = qualityGates.failures;
  // ["Coverage: 76% (need 80%)", "Missing tests for error cases"]

  // Delete failed environment
  await mcp.containerUse.deleteEnvironment({
    env_id: "env-abc123"
  });

  // Spawn new worker with improved prompt
  const improvedPrompt = `
    ${originalPrompt}

    PREVIOUS ATTEMPT FAILED:
    ${failures.join('\n')}

    THIS TIME:
    - Focus on test coverage for edge cases
    - Ensure TDD: tests before implementation
  `;

  const retryEnv = await mcp.containerUse.createEnvironment({
    title: "developer-backend-US1-retry",
    config: ".boss/workers/developer-backend/container-config.json"
  });

  await mcp.containerUse.executeInEnvironment({
    env_id: retryEnv.env_id,
    prompt: improvedPrompt,
    skills: ["nodejs", "stripe", "api-design", "testing"]
  });
}
```

**Equivalent Container-Use CLI Commands:**

```bash
# If quality gates pass:
container-use merge env-abc123 --delete

# If quality gates fail:
container-use delete env-abc123  # Remove failed attempt
container-use environment create --title "developer-backend-US1-retry"
# Retry with improved approach
```

---

## Parallel Worker Execution

BOSS launches multiple workers in parallel, each in their own container-use environment:

```
Phase 7: Implementation (Parallel Workers)

Worker 1: env-001 (developer-fullstack)
├── Branch: container-use/env-001
├── Task: [T010-T020] User Authentication
├── Secrets: GITHUB_TOKEN, STRIPE_SECRET_KEY, DATABASE_URL
└── Status: In Progress

Worker 2: env-002 (developer-backend)
├── Branch: container-use/env-002
├── Task: [T021-T028] User Registration
├── Secrets: GITHUB_TOKEN, SENDGRID_API_KEY, DATABASE_URL
└── Status: In Progress

Worker 3: env-003 (developer-backend)
├── Branch: container-use/env-003
├── Task: [T029-T035] Password Reset
├── Secrets: GITHUB_TOKEN, SENDGRID_API_KEY, DATABASE_URL
└── Status: Completed ✅

Worker 4: env-004 (developer-frontend)
├── Branch: container-use/env-004
├── Task: [T036-T042] Dashboard UI
├── Secrets: GITHUB_TOKEN, VERCEL_TOKEN
└── Status: In Progress

Worker 5: env-005 (reviewer)
├── Branch: container-use/env-005
├── Task: Review all implementations
├── Secrets: GITHUB_TOKEN
└── Status: Waiting
```

**Benefits:**
- ✅ Each worker isolated in own environment
- ✅ No conflicts between workers
- ✅ Each has required secrets for their tasks
- ✅ Can work on different files simultaneously
- ✅ Full observability of each worker's actions

---

## Secret Injection for Integration Tests

Workers use injected secrets to run integration tests against real services in test mode.

### Example: Stripe Integration Test

```typescript
// tests/integration/stripe-payment.test.ts

import Stripe from 'stripe';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Stripe Payment Integration', () => {
  let stripe: Stripe;

  beforeAll(() => {
    // Secret injected by container-use from op://glx/stripe/test-secret-key
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
  });

  it('creates a payment intent', async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      payment_method_types: ['card']
    });

    expect(paymentIntent.id).toMatch(/^pi_/);
    expect(paymentIntent.amount).toBe(1000);
    expect(paymentIntent.currency).toBe('usd');
    expect(paymentIntent.status).toBe('requires_payment_method');
  });

  it('creates a customer', async () => {
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      description: 'Test customer'
    });

    expect(customer.id).toMatch(/^cus_/);
    expect(customer.email).toBe('test@example.com');
  });

  it('attaches payment method to customer', async () => {
    // Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com'
    });

    // Create test payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: 'tok_visa'  // Stripe test token
      }
    });

    // Attach to customer
    const attached = await stripe.paymentMethods.attach(
      paymentMethod.id,
      { customer: customer.id }
    );

    expect(attached.customer).toBe(customer.id);
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
  ✅ creates a customer (156ms)
  ✅ attaches payment method to customer (289ms)
  ✅ verifies webhook signature (45ms)

Test Summary:
  4 passed, 0 failed
  Coverage: 94%

Integration tests use real Stripe API in test mode.
Secrets injected securely via container-use.
```

---

## Security Best Practices

### 1. Never Commit Secrets

```yaml
# ✅ GOOD - .container-use/environment.json
{
  "secrets": {
    "STRIPE_SECRET_KEY": "op://glx/stripe/test-secret-key",
    "DATABASE_URL": "op://glx/database/test-url"
  }
}

# ❌ BAD - Never do this
{
  "secrets": {
    "STRIPE_SECRET_KEY": "sk_test_51ABC123...",
    "DATABASE_URL": "postgresql://user:password@host/db"
  }
}
```

### 2. Use Test Keys for Development

```yaml
# ✅ GOOD - Separate test and production keys
test:
  STRIPE_SECRET_KEY: op://glx/stripe/test-secret-key  # sk_test_*

production:
  STRIPE_SECRET_KEY: op://glx/stripe/live-secret-key  # sk_live_*

# Workers always use test keys
# Production keys only in production environment
```

### 3. Minimal Permissions

```yaml
# ✅ GOOD - Restricted AWS IAM policy
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:PutObject",
      "s3:GetObject"
    ],
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
# When rotating secrets:
1. Generate new secret in service (Stripe, AWS, etc.)
2. Update in 1Password
3. Workers automatically get new value
4. Revoke old secret after verification

# No code changes needed!
```

### 5. Audit Secret Access

```bash
# Review which workers accessed which secrets
container-use log env-001 | grep "STRIPE"

# Monitor 1Password access logs
op signin
op item get stripe --vault glx --format json
```

---

## BOSS Commands for Container-Use Management

### Setup Commands

```bash
# Initialize container-use for project
boss init

# Configure default environment
boss config environment --base-image node:22-slim

# Add secrets
boss config secret add STRIPE_SECRET_KEY op://glx/stripe/test-secret-key
boss config secret add DATABASE_URL op://glx/database/test-url

# List secrets (values masked)
boss config secret list
```

### Worker Management Commands

```bash
# List all active workers
boss workers

# Example output:
# ID        Role                Task          Status      Branch
# env-001   developer-backend   US1-auth      running     container-use/env-001
# env-002   developer-frontend  US2-dashboard running     container-use/env-002
# env-003   reviewer            review-all    completed   container-use/env-003

# View worker logs
boss logs env-001

# Inspect worker changes
boss diff env-001

# Enter worker environment
boss terminal env-001

# Kill worker
boss kill env-001
```

### Workflow Commands

```bash
# Check overall status
boss status

# Example output:
# Workflow: run_2024_001
# Phase: Implementation (7/8)
# Workers: 3 running, 2 completed, 0 failed
#
# Active Workers:
#   env-001: User Authentication (80% complete)
#   env-002: User Registration (60% complete)
#   env-004: Dashboard UI (45% complete)

# Pause workflow (stops spawning new workers)
boss pause

# Resume workflow
boss resume
```

---

## Troubleshooting

### Secret Not Available

```bash
# Symptom: Worker fails with "STRIPE_SECRET_KEY is not defined"

# Check secret configuration
container-use config secret list

# Verify 1Password CLI is authenticated
op signin
op item get stripe --vault glx

# Verify secret reference is correct
container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key

# Test secret resolution
container-use terminal env-001
echo $STRIPE_SECRET_KEY  # Should show actual value
```

### Worker Branch Conflicts

```bash
# Symptom: Worker cannot merge branch

# Check for conflicts
container-use diff env-001

# Option 1: Resolve manually
container-use checkout env-001
# Fix conflicts in IDE
git add .
git commit -m "Resolve conflicts"

# Option 2: Restart worker
container-use delete env-001
# BOSS will spawn new worker with updated base
```

### Integration Tests Failing

```bash
# Symptom: Tests pass locally but fail in container

# Check environment parity
container-use terminal env-001

# Verify secrets available
env | grep STRIPE
env | grep DATABASE

# Check network access
curl https://api.stripe.com/v1/customers -u $STRIPE_SECRET_KEY:

# Inspect logs
container-use log env-001 | grep ERROR
```

---

## Benefits of Container-Use Integration

### 1. Security
- ✅ Secrets never exposed to AI models
- ✅ Automatic secret stripping from logs
- ✅ Isolated environments prevent credential leakage
- ✅ Centralized secret management in 1Password

### 2. Observability
- ✅ Complete command history for each worker
- ✅ Git branch per worker for code inspection
- ✅ Live monitoring with container-use terminal
- ✅ Full audit trail of all changes

### 3. Reproducibility
- ✅ Exact environment recreated for debugging
- ✅ Configuration committed to git
- ✅ Deterministic builds across workers
- ✅ Easy rollback to previous states

### 4. Parallelization
- ✅ Multiple workers in isolated environments
- ✅ No conflicts between parallel work
- ✅ Each worker has own branch
- ✅ Consolidation phase merges cleanly

### 5. Iteration
- ✅ Resume workers in same environment
- ✅ Iterate on failed work without losing progress
- ✅ Disposable environments for experimentation
- ✅ Clean main branch always maintained

---

## Integration with BOSS Workflow

### Phase 0: Bootstrap

```bash
boss bootstrap --template nextjs-app-turbo

# Creates:
# - .container-use/environment.json (default config)
# - Worker-specific configs in .boss/workers/*/container-config.json
```

### Phase 1-3: No Secrets Needed

Workers (Clarifier, Spec-Writer, Planner) don't need external API access.

```json
{
  "secrets": {}  // Empty - no secrets required
}
```

### Phase 4: Planning - Secret Discovery

Planner analyzes integrations and creates:
- `secret-requirements.md` with setup instructions
- Human tasks for secret generation
- op:// references to be created

### Phase 5-6: Validation & Task Breakdown

Reviewer validates plan includes secret setup tasks.
Task breakdown includes HT-* (Human Task) items for secrets.

### Phase 7: Implementation - Secrets Required

**BOSS checks for secrets before spawning workers:**

```typescript
async function beforeImplementation() {
  // 1. Check all required secrets are configured
  const requiredSecrets = await getRequiredSecrets();
  const configuredSecrets = await getConfiguredSecrets();

  const missing = requiredSecrets.filter(
    secret => !configuredSecrets.includes(secret)
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing secrets: ${missing.join(', ')}\n` +
      `Please complete secret setup tasks (HT-*) before proceeding.`
    );
  }

  // 2. Verify secrets can be resolved
  for (const secret of configuredSecrets) {
    const value = await resolveSecret(secret);
    if (!value) {
      throw new Error(`Secret ${secret} could not be resolved from 1Password`);
    }
  }

  // 3. Spawn workers
  await spawnWorkers();
}
```

### Phase 8: Consolidation

Consolidator merges all worker branches:

```bash
# Consolidator runs in its own container-use environment
container-use environment create --title "consolidator"

# Merges all worker branches
git merge container-use/env-001  # Worker 1
git merge container-use/env-002  # Worker 2
git merge container-use/env-003  # Worker 3

# Runs final integration tests (with secrets)
pnpm test:integration

# Creates PR
gh pr create --title "Complete Feature Implementation"
```

---

## Summary

**BOSS + Container-Use Integration provides:**

1. ✅ **Isolated Execution** - Each worker in own container + branch
2. ✅ **Secure Secrets** - 1Password integration, AI never sees values
3. ✅ **Agent Discovery** - Workers identify and document secret needs
4. ✅ **Human-in-Loop** - Secret setup tasks for humans with instructions
5. ✅ **Integration Testing** - Secrets available for real API tests
6. ✅ **Full Observability** - Complete audit trail of all work
7. ✅ **Parallel Execution** - Multiple workers without conflicts
8. ✅ **Clean Workflow** - Disposable environments, main branch protected

**Container-use is the foundation that makes BOSS's multi-agent orchestration secure, observable, and reproducible.**

---

## Next Steps

To implement BOSS with container-use:

1. **Container-Use Setup**
   - Install container-use CLI
   - Configure default environment
   - Set up 1Password CLI integration

2. **Worker Configurations**
   - Create configs for each worker type
   - Define required secrets per worker
   - Test secret injection

3. **Secret Management**
   - Establish 1Password vault structure
   - Document op:// reference conventions
   - Create secret setup templates

4. **Integration Testing**
   - Set up test accounts for services
   - Generate test API keys
   - Verify integration test patterns

5. **BOSS Implementation**
   - Implement worker spawning logic
   - Add secret requirement detection
   - Create human task generation
   - Build consolidation workflow

**Result:** A fully automated, secure, and observable multi-agent development system powered by container-use! 🚀
