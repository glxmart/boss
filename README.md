# BOSS: Business-Orchestrated Software System

[![CI](https://github.com/glxmart/boss/actions/workflows/ci.yml/badge.svg)](https://github.com/glxmart/boss/actions/workflows/ci.yml)
[![npm version - cli](https://img.shields.io/npm/v/@glxmart/boss-cli.svg)](https://www.npmjs.com/package/@glxmart/boss-cli)
[![npm version - conductor](https://img.shields.io/npm/v/@glxmart/conductor-mcp.svg)](https://www.npmjs.com/package/@glxmart/conductor-mcp)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fglxmart%2Fboss--worker--base-blue)](https://ghcr.io/glxmart/boss-worker-base)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Transform business ideas into production-ready code through autonomous, spec-driven development with AI agents.

**BOSS** is a framework and methodology that transforms Claude Code or Cursor into an autonomous development orchestrator. By configuring your AI assistant with MCP servers, BOSS skills, and worker templates, you get spec-driven development from idea to deployment - combining **GitHub's Spec-Kit**, **Container-Use isolation**, and **local-first infrastructure**.

---

## 🎯 What Problem Does BOSS Solve?

Modern software development is plagued by:

- ❌ **Hours of manual setup** - Project scaffolding, linting, testing, git hooks
- ❌ **Inconsistent quality** - Different standards across projects
- ❌ **Context switching overhead** - Multiple projects, tech stacks, forgotten decisions
- ❌ **AI assistants that forget** - No organizational memory
- ❌ **Manual coordination** - Developers orchestrating what should be automated
- ❌ **Unsafe secret handling** - API keys exposed or hard-coded
- ❌ **No cross-project learning** - Solutions don't compound

## ✅ The BOSS Solution

BOSS provides:

- ✅ **5-minute project bootstrap** - Complete setup with all configurations
- ✅ **Spec-driven automation** - 8-phase workflow from PRD to production
- ✅ **Secure execution** - Workers in isolated containers, secrets from 1Password
- ✅ **Quality enforcement** - Constitutional governance, TDD, 80%+ coverage
- ✅ **Agent discovery** - Workers identify and document secret needs
- ✅ **Parallel execution** - Multiple workers without conflicts
- ✅ **Organizational memory** - Knowledge compounds across projects
- ✅ **Full observability** - Complete audit trail of all work

---

## 🏗️ Architecture Overview

### What BOSS Actually Is

**BOSS is NOT a standalone application.**

BOSS is your **Claude Code or Cursor instance** configured to act as an orchestrator through:
- **MCP Servers** - Container-Use, GitHub, Knowledge Base
- **1Password CLI** - Secret management (op CLI for manual secret setup)
- **BOSS Skills** - Loaded into Claude Code/Cursor for orchestration capabilities
- **Worker Templates** - Configurations for spawning specialized container-use agents
- **Local Infrastructure** - All services run locally via Docker (PostgreSQL, Qdrant, embeddings)

```
┌─────────────────────────────────────────────────────────────┐
│              YOUR LOCAL MACHINE (Host)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Claude Code or Cursor                             │   │
│  │  (= BOSS Controller when configured)               │   │
│  │                                                    │   │
│  │  • Loaded with BOSS skills                         │   │
│  │  • Connected to MCP servers                        │   │
│  │  • Orchestrates Spec-Kit workflow (8 phases)       │   │
│  │  • Spawns workers via Container-Use MCP            │   │
│  └──────────────┬─────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────┴─────────────────────────────────────┐   │
│  │  MCP Servers (all running locally)                 │   │
│  │  • Container-Use MCP → spawn/manage workers        │   │
│  │  • GitHub MCP → repo operations & project mgmt     │   │
│  │  • Knowledge Base MCP → PostgreSQL + Qdrant        │   │
│  │  • 1Password CLI (op) → manual secret setup        │   │
│  └──────────────┬─────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────┴─────────────────────────────────────┐   │
│  │  Docker Daemon (local containers)                  │   │
│  │  • postgres (knowledge base)                       │   │
│  │  • qdrant (vector database)                        │   │
│  │  • text-embeddings-inference (local embeddings)    │   │
│  │  • worker containers (managed by container-use)    │   │
│  └──────────────┬─────────────────────────────────────┘   │
│                 │                                           │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  │ Container-Use spawns workers via MCP
                  │
      ┌───────────┼──────────┬──────────┬──────────┐
      │           │          │          │          │
      ▼           ▼          ▼          ▼          ▼
  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
  │Worker1│  │Worker2│  │Worker3│  │Worker4│  │Worker5│
  │cu/001 │  │cu/002 │  │cu/003 │  │cu/004 │  │cu/005 │
  │Claude │  │Claude │  │Claude │  │Claude │  │Claude │
  │+skills│  │+skills│  │+skills│  │+skills│  │+skills│
  │branch │  │branch │  │branch │  │branch │  │branch │
  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘
```

### CRITICAL: BOSS Operational Constraints

**What BOSS CAN Do (MCP-Only Operations):**
- ✅ **Container-Use MCP** - Spawn workers, execute in containers, manage environments
- ✅ **GitHub MCP** - Create/manage PRs, issues, projects, labels, milestones, comments, reviews (ALL GitHub operations)
- ✅ **Knowledge Base MCP** - Query patterns, search artifacts, retrieve context
- ✅ **Orchestration Logic** - Coordinate workers, enforce quality gates, manage workflow state

**What BOSS CANNOT Do (Host-Level Restrictions):**
- ❌ **NO direct file operations** - Cannot read, write, or edit files on host
- ❌ **NO direct code execution** - Cannot run shell commands, scripts, or build tools
- ❌ **NO direct git operations** - Cannot commit, push, or manage git directly

**What Workers CAN Do (Full Execution Inside Containers):**
- ✅ **ALL file operations** - Read, write, edit any files in their workspace
- ✅ **ALL code execution** - Run shell commands, build tools, tests, scripts
- ✅ **ALL git operations** - Commit, push, manage branches (via environment tools)
- ✅ **Full development capabilities** - Everything a human developer can do

**Why This Architecture:**
- **Security** - Workers isolated in containers, BOSS cannot accidentally modify host
- **Control** - BOSS orchestrates via well-defined MCP interfaces
- **Observability** - All worker actions logged via container-use
- **Flexibility** - GitHub MCP gives BOSS full project management capabilities

### How BOSS Orchestrates Work

**Via Container-Use MCP commands** (following [container-use.com/environment-workflow](https://container-use.com/environment-workflow)):

1. **Create** - BOSS spawns worker via `containerUse.createEnvironment()`
2. **Execute** - Worker runs in isolated container with dedicated Git branch
3. **Observe** - BOSS monitors via `containerUse.getEnvironmentLog()`
4. **Validate** - BOSS checks quality gates after worker completes
5. **Iterate** - If quality gates fail, delete environment and retry with improved prompt
6. **Merge** - If gates pass, merge branch via `containerUse.mergeEnvironment()`

### Starting BOSS Securely

Bootstrap creates a `start-boss.sh` script that launches BOSS with restricted tool access:

```bash
# Launch BOSS with MCP-only access
./start-boss.sh
```

This script uses the `--allowedTools` flag to ensure BOSS can ONLY use:
- ✅ Container-Use MCP (spawn/manage workers)
- ✅ GitHub MCP (ALL GitHub operations)
- ✅ Knowledge Base MCP (query context)

And CANNOT use:
- ❌ Host file system tools (Read, Write, Edit, Glob, Grep)
- ❌ Host shell execution (Bash)
- ❌ Direct git operations

**Always use `start-boss.sh` to ensure BOSS operates exclusively via MCPs.**

---

## 📚 Documentation Structure

### 📖 Complete Documentation Index

- **[docs/README.md](./docs/README.md)** - Complete documentation index with learning paths
- **[boss-cli/docs/index.md](./boss-cli/docs/index.md)** - Bootstrap CLI documentation
- **[conductor-mcp/INDEX.md](./conductor-mcp/INDEX.md)** - Conductor MCP documentation index

### Core Documentation

This repository contains comprehensive documentation that defines the complete BOSS system:

#### 1. 🎨 [BOSS-ENHANCED-VISION.md](./docs/BOSS-ENHANCED-VISION.md)

**The Big Picture** - Read this first!

Comprehensive overview of the BOSS system covering:
- ✅ Two-tier architecture (Bootstrap + Orchestration)
- ✅ Foundation technologies (Spec-Kit + Container-Use)
- ✅ Complete workflow (8 phases)
- ✅ Worker management & coordination
- ✅ Knowledge engine & cross-BOSS communication
- ✅ GitHub integration for project management
- ✅ End-to-end examples with real scenarios
- ✅ Advanced features (cross-BOSS coordination, dependency management)

**Start here to understand what BOSS is and what it can do.**

#### 2. 📋 [BOSS-SPEC-KIT-INTEGRATION.md](./docs/BOSS-SPEC-KIT-INTEGRATION.md)

**Spec-Driven Development** - Implementation methodology

Deep dive into how BOSS automates GitHub's Spec-Kit:
- ✅ Seven sequential phases (Principles → Implementation)
- ✅ Structured artifacts (constitution.md, spec.md, plan.md, tasks.md)
- ✅ Worker prompts for each phase
- ✅ Constitutional governance (NON-NEGOTIABLE rules)
- ✅ Test-First methodology (TDD enforced)
- ✅ Parallelization with [P] markers
- ✅ Quality gate automation
- ✅ Complete artifact specifications

**Read this to understand the specification-driven workflow.**

#### 3. 🔐 [BOSS-CONTAINER-USE-INTEGRATION.md](./docs/BOSS-CONTAINER-USE-INTEGRATION.md)

**Secure Worker Execution** - Isolation & secret management

Complete guide to worker isolation and security:
- ✅ Container-use environment configurations
- ✅ Worker-specific setups (8 worker types)
- ✅ 1Password integration (op:// references)
- ✅ Secret discovery by agents (automatic requirement detection)
- ✅ Secret setup templates (Stripe, SendGrid, AWS, etc.)
- ✅ Integration testing with real APIs
- ✅ Worker lifecycle management
- ✅ Security best practices & troubleshooting

**Read this to understand how workers execute securely.**

#### 4. 🐙 [BOSS-GITHUB-INTEGRATION.md](./docs/BOSS-GITHUB-INTEGRATION.md)

**GitHub Workflows** - Repository and project management

Complete guide to GitHub integration and workflows

#### 5. 🖥️ [BOSS-HOST-SETUP.md](./docs/BOSS-HOST-SETUP.md)

**Host Setup** - Local machine configuration

Complete host machine setup guide (Docker, 1Password, Container-Use, MCP servers)

#### 6. 🐳 [DOCKER-SETUP.md](./docs/DOCKER-SETUP.md)

**Infrastructure Setup** - Local services and databases

Local infrastructure setup (PostgreSQL, Qdrant, embeddings)

### Package Documentation

#### BOSS CLI (Bootstrap)

- **[boss-cli/README.md](./boss-cli/README.md)** - CLI usage and commands
- **[boss-cli/docs/index.md](./boss-cli/docs/index.md)** - Complete CLI documentation index
- **[boss-cli/docs/common-issues.md](./boss-cli/docs/common-issues.md)** - Troubleshooting guide

#### Conductor MCP (Orchestration)

- **[conductor-mcp/README.md](./conductor-mcp/README.md)** - MCP server overview
- **[conductor-mcp/INDEX.md](./conductor-mcp/INDEX.md)** - Complete documentation index
- **[conductor-mcp/CHANGELOG.md](./conductor-mcp/CHANGELOG.md)** - Version history
- **[conductor-mcp/docs/guides/INSTALLATION.md](./conductor-mcp/docs/guides/INSTALLATION.md)** - Installation guide
- **[conductor-mcp/docs/guides/BOSS-GUIDE.md](./conductor-mcp/docs/guides/BOSS-GUIDE.md)** - BOSS integration
- **[conductor-mcp/docs/architecture/OVERVIEW.md](./conductor-mcp/docs/architecture/OVERVIEW.md)** - Architecture
- **[conductor-mcp/docs/api/TOOLS.md](./conductor-mcp/docs/api/TOOLS.md)** - API reference

### Development & Planning

- **[docs/CONTRIBUTING_DOCS.md](./docs/CONTRIBUTING_DOCS.md)** - **📝 Documentation guidelines (when/where to add docs)**
- **[docs/PHASE_1_COMPLETE.md](./docs/PHASE_1_COMPLETE.md)** - Phase 1 completion summary
- **[docs/PHASE_2_COMPLETE.md](./docs/PHASE_2_COMPLETE.md)** - Phase 2 completion summary
- **[docs/OPTIMIZATION_PLAN.md](./docs/OPTIMIZATION_PLAN.md)** - Performance optimization strategy
- **[docs/PERFORMANCE_ANALYSIS.md](./docs/PERFORMANCE_ANALYSIS.md)** - System performance analysis
- **[docs/OAUTH_TOKEN_IMPLEMENTATION.md](./docs/OAUTH_TOKEN_IMPLEMENTATION.md)** - OAuth implementation details

---

## 🚀 Quick Start

### Installation

```bash
# Install BOSS CLI globally (beta)
npm install -g @glxmart/boss-cli@beta

# Or with pnpm
pnpm add -g @glxmart/boss-cli@beta
```

### Prerequisites

1. **Claude Code or Cursor** on your local machine
2. **Docker Desktop** (for local infrastructure and workers)
3. **Container-Use CLI** (`npm install -g container-use`)
4. **1Password CLI** (optional, for secret management)

### The 30-Second Overview

```bash
# 1. Bootstrap a new project with BOSS
boss bootstrap --template nextjs-app-turbo --quality production
# Creates: .boss/, .specify/, .container-use/, MCP configs, skills

# 2. Start local infrastructure
docker-compose up -d
# Starts: PostgreSQL, Qdrant, embeddings service

# 3. Open project in Claude Code/Cursor
# Your AI assistant is now configured as BOSS orchestrator!

# 4. Tell BOSS what to build
You: "Build a task management app for remote teams"

# 5. BOSS (your Claude Code/Cursor) handles everything:
# - Creates constitution & specifications
# - Plans architecture & breaks into tasks
# - Spawns parallel workers via Container-Use MCP
# - Manages secrets via 1Password CLI (op)
# - Enforces quality gates through iteration
# - Creates PRs with full documentation

# 6. Review and approve
# - Gate 1: Approve specifications
# - Gate 2: Review implementation PR

# 7. Deploy to production
# ✅ Production-ready code with tests & docs
```

### The Complete Flow

```
1. Bootstrap (5-15 minutes)
   └─► Run: boss bootstrap --template nextjs-app-turbo
   └─► Creates: .specify/, .boss/, .container-use/, MCP configs
   └─► Configures: Claude Code/Cursor with BOSS skills & MCP servers
   └─► Initializes: git, quality gates, templates

2. Start Infrastructure (1 minute)
   └─► Run: docker-compose up -d
   └─► Starts: PostgreSQL, Qdrant, embeddings (all local)

3. Open in Claude Code/Cursor
   └─► Your AI assistant loads BOSS configuration
   └─► BOSS: "What would you like to build?"

4. Business Conversation (Clarification Phase)
   └─► BOSS asks business questions (not tech)
   └─► Clarifies user needs & workflows
   └─► Spawns Clarifier worker via Container-Use MCP

5. Specification Phase (Spec-Writer Worker)
   └─► Creates spec.md with user stories
   └─► Gate 1: You review & approve via GitHub PR

6. Planning Phase (Planner Worker)
   └─► Creates plan.md, data-model.md, contracts/
   └─► Identifies integration needs (Stripe, etc.)
   └─► Creates secret-requirements.md with setup instructions

7. Secret Setup (Human Task)
   └─► Follow detailed instructions in secret-requirements.md
   └─► Store in 1Password with op:// references
   └─► Configure container-use
   └─► Mark complete via GitHub issue comment

7. Implementation Phase
   └─► Spawns parallel workers (5 max)
   └─► Each in own container with secrets
   └─► TDD: Tests before implementation
   └─► Quality gates: coverage ≥80%, mutation ≥80%

8. Consolidation Phase
   └─► Merges all worker branches
   └─► Creates quickstart.md, checklist.md
   └─► Runs integration tests with real APIs

9. Review & Deploy
   └─► Gate 2: You review PR
   └─► Merge → Deploy to production
   └─► Knowledge base updated

10. Done!
    └─► Production app with tests & docs
    └─► Other BOSSES learn from this project
```

---

## 🎯 Key Concepts

### 1. Spec-Kit: Executable Specifications

**From GitHub** - Treat specifications as source of truth, not documentation.

```
.specify/
├── memory/constitution.md          # NON-NEGOTIABLE governing principles
├── specs/001-feature/
│   ├── spec.md                     # User stories (Given/When/Then)
│   ├── plan.md                     # Technical implementation
│   ├── tasks.md                    # Granular tasks with [P] markers
│   ├── data-model.md              # Database schema
│   ├── contracts/                  # OpenAPI specs
│   ├── quickstart.md              # Setup guide
│   └── checklist.md               # Quality validation
```

**Key Principles:**
- 📋 Specifications drive implementation (not document it)
- 🔴 Test-First is NON-NEGOTIABLE (red → green → refactor)
- 🔀 [P] markers enable parallel execution
- 📜 Constitution governs all decisions

### 2. Container-Use: Isolated Execution

**Secure worker environments** - Each worker in own container + Git branch.

```
Worker 4 (Developer - Backend)
├── Container: env-ghi789
├── Branch: container-use/env-ghi789
├── Secrets (from 1Password):
│   ├── STRIPE_SECRET_KEY (op://glx/stripe/test-secret-key)
│   ├── DATABASE_URL (op://glx/database/test-url)
│   └── GITHUB_TOKEN (op://glx/github/token)
└── Execution:
    ├── Write failing tests (using STRIPE_SECRET_KEY)
    ├── Implement feature (API integration)
    ├── Run integration tests (real Stripe API)
    └── Quality gates (coverage, mutation, security)
```

**Key Benefits:**
- 🔒 Secrets never exposed to AI models
- 🔍 Complete command history & audit trail
- 🗑️ Disposable environments (easy retry)
- ⚡ Parallel workers without conflicts

### 3. Agent Secret Discovery

**Revolutionary capability** - Agents identify and document secret needs.

```
Planner Worker analyzes spec.md:
  └─► "Stripe payment integration required"
      └─► Creates secret-requirements.md
          ├─► How to generate Stripe keys
          ├─► Where to store (1Password path)
          ├─► What scopes/permissions needed
          └─► op:// references to create

      └─► Creates GitHub Issue: "Configure Stripe API Secrets"
          └─► Label: needs-human-action
          └─► Estimated: 15 minutes

BOSS notifies you with detailed instructions
  └─► You complete setup (follow step-by-step guide)
      └─► Close GitHub issue or add comment: "Secrets configured"
          └─► Workers now have secrets available
```

**No more guessing what credentials are needed!**

### 4. Cross-Project Intelligence

**Shared knowledge base** - Multiple BOSS instances (Claude Code/Cursor projects) learn from each other.

```
Local Knowledge Base (PostgreSQL + Qdrant)
├── Project 1: auth-service (OAuth implementation)
├── Project 2: dashboard-app (needs OAuth)
└── Project 3: api-gateway (needs JWT validation)

BOSS 2 (Dashboard) queries knowledge base:
  └─► Query: "OAuth integration patterns"
      └─► Finds: auth-service has OAuth implementation
          └─► Status: deployed
          └─► Endpoints: /oauth/authorize, /oauth/token
          └─► Code patterns available in knowledge base

BOSS 2 suggests:
  └─► "Found existing OAuth service in auth-service!

       Options:
       A) Use existing auth-service OAuth API (recommended)
       B) Implement new OAuth from scratch

       If A, I'll add dependency and use established patterns."
```

**No real-time BOSS-to-BOSS communication.** Coordination happens through shared knowledge base queries. Each BOSS (Claude Code/Cursor instance) reads/writes to local PostgreSQL + Qdrant.

---

## 💡 Key Features

### Bootstrap System

```bash
boss bootstrap --template nextjs-app-turbo --quality enterprise
```

**Creates:**
- ✅ Complete project structure
- ✅ `.specify/` with Spec-Kit templates
- ✅ `.boss/` with worker configurations
- ✅ `.container-use/` with environment configs
- ✅ `.github/workflows/` with CI/CD pipelines
- ✅ `.husky/` with git hooks (pre-commit, commit-msg)
- ✅ All dependencies installed
- ✅ Git repository initialized

**Templates Available:**
- `nextjs-app-turbo` - Next.js 15 + Tailwind + Prisma + Vitest
- `api-service-fastify` - Fastify + TypeScript + Prisma
- `blank` - Minimal setup (TypeScript + Vitest)
- `@myorg/custom` - Your organization's templates

**Quality Presets:**
- `startup` - Fast iteration, minimal gates
- `production` - Balanced quality & speed
- `enterprise` - Maximum quality, comprehensive checks

### Constitutional Governance

Every project has a constitution that defines NON-NEGOTIABLE rules:

```yaml
# memory/constitution.md

Architectural Principles:
  - Library-first, modular, independently testable

Development Methodology:
  - Test-First (NON-NEGOTIABLE)
  - TDD cycle: red → green → refactor
  - Human approval between test definition and implementation

Testing Standards:
  - Unit tests: ≥80% coverage
  - Integration tests: Contract validation
  - Mutation testing: ≥80% score

Technology Stack:
  Allowed: [nextjs, typescript, prisma, vitest]
  Prohibited: [jest, webpack, create-react-app]
```

**Auto-Gate Validates:**
- All plans against constitution
- Up to 3 retries with feedback
- Escalates to human if still failing

### Quality Gates

**Automated checks before PRs:**

```
Implementation Quality Gate:
├── TypeCheck: ✅ 0 errors
├── Lint: ✅ 0 warnings
├── Tests: ✅ 47/47 passing
├── Coverage: ✅ 89% (required: 80%)
├── Mutation: ✅ 84% (required: 80%)
├── Security: ✅ 0 vulnerabilities
└── Build: ✅ Successful

✅ PASSED - Creating PR
```

**If failed:**
- Worker analyzes issues
- Fixes automatically (if possible)
- Reports to BOSS for guidance

### Parallel Execution

**Based on [P] markers in tasks.md:**

```yaml
# tasks.md

Phase 1: Setup [P] (All parallel)
[T001] [P] [SETUP] Initialize database
[T002] [P] [SETUP] Configure Prisma
[T003] [P] [SETUP] Setup JWT utilities

Phase 3: User Stories (Independent parallel)
[T010] [US1] Login feature
[T020] [P] [US2] Registration feature  # Can run parallel with US1
[T030] [P] [US3] Password reset        # Can run parallel with US1 & US2
```

**BOSS spawns workers:**
- ✅ T001-T003: 3 workers in parallel
- ✅ T010: 1 worker (sequential TDD)
- ✅ T020-T030: 2 workers in parallel
- ✅ Each in own container with required secrets

### Knowledge Base

**Organizational memory that compounds:**

```
PostgreSQL + Qdrant Vector Database

Indexed Content:
├── All Spec-Kit artifacts (spec.md, plan.md, tasks.md)
├── Constitution files (project principles)
├── Code patterns (components, APIs, tests)
├── Architecture decisions (ADRs)
├── API contracts (OpenAPI specs)
└── Data models (schemas)

Workers query before starting:
  └─► "Similar authentication patterns?"
      └─► Returns: 3 projects with OAuth implementations
          └─► Worker uses as reference
              └─► Faster, more consistent implementation
```

---

## 🔐 Security Model

### 1Password Integration

**All secrets via op:// references:**

```bash
# Configuration (.container-use/environment.json)
{
  "secrets": {
    "STRIPE_SECRET_KEY": "op://glx/stripe/test-secret-key",
    "DATABASE_URL": "op://glx/database/test-url"
  }
}

# Resolution (inside container)
1. container-use reads op:// references
2. 1Password CLI resolves actual values
3. Injected as environment variables
4. Worker accesses via process.env.STRIPE_SECRET_KEY

# AI Model NEVER sees actual secret values
# Logs automatically strip secret values
```

**Security Benefits:**
- ✅ Centralized management (1Password)
- ✅ Safe to commit (op:// references)
- ✅ Easy rotation (update in 1Password)
- ✅ Audit trail (who accessed what)
- ✅ AI-safe (models never see values)

### Agent Secret Discovery

**Agents create detailed setup instructions:**

```markdown
# secret-requirements.md

## Required Secret: Stripe Test API Key

**Purpose:** Authenticate Stripe API requests in test mode

**How to Generate:**
1. Log in to Stripe Dashboard
2. Navigate to Developers → API keys
3. Copy "Secret key" (starts with sk_test_)
4. Store in 1Password: glx/stripe/test-secret-key

**Required Scopes:**
- Customers: Read/Write
- PaymentIntents: Read/Write
- Subscriptions: Read/Write

**Configure Container-Use:**
```bash
container-use config secret set STRIPE_SECRET_KEY \
  op://glx/stripe/test-secret-key
```

**Estimated Time:** 10 minutes
```

**No ambiguity, no guessing - complete instructions!**

---

## 📊 Success Metrics

BOSS succeeds when:

| Metric | Target | How BOSS Achieves It |
|--------|--------|---------------------|
| **Bootstrap Time** | < 5 minutes | Automated project setup with all configs |
| **Idea to PR** | < 4 hours | Multi-agent parallel execution |
| **Test Coverage** | ≥ 80% | Constitutional requirement, auto-enforced |
| **Mutation Score** | ≥ 80% | Quality gate blocks merge if failing |
| **Security Vulnerabilities** | 0 high/critical | Automated scanning before PR |
| **Quality Gate Failures** | < 5% | Workers produce production-ready code |
| **Cross-Project Reuse** | 50%+ patterns | Knowledge base compounds over time |
| **Secret Exposure** | 0 incidents | 1Password + container-use isolation |

---

## 🎓 Learning Path

**Recommended reading order:**

### 1️⃣ Start Here (30 minutes)
- **README.md** (this file) - Understand the big picture

### 2️⃣ The Vision (1 hour)
- **BOSS-ENHANCED-VISION.md** - Complete system overview
  - What BOSS is and why it exists
  - Bootstrap + Orchestration architecture
  - Worker capabilities & coordination
  - End-to-end examples

### 3️⃣ Specification Methodology (1.5 hours)
- **BOSS-SPEC-KIT-INTEGRATION.md** - Spec-driven development
  - 8-phase workflow (Constitution → Consolidation)
  - Spec-Kit artifacts (spec.md, plan.md, tasks.md)
  - Worker prompts for each phase
  - Constitutional governance
  - Test-First methodology

### 4️⃣ Security & Isolation (1.5 hours)
- **BOSS-CONTAINER-USE-INTEGRATION.md** - Worker execution
  - Container-use configurations
  - 1Password secret management
  - Agent secret discovery
  - Integration testing patterns
  - Security best practices

### Total Time: ~4.5 hours to complete understanding

---

## 🛠️ Implementation Roadmap

### Phase 1: Foundation ✅ (Conceptual)
- ✅ Architecture design
- ✅ Technology selection (Spec-Kit + Container-Use)
- ✅ Documentation (3 comprehensive documents)
- ✅ Workflow design (8 phases)

### Phase 2: Bootstrap CLI 📋 (Next)
- [ ] CLI framework (Commander.js)
- [ ] Template system
- [ ] Project initialization (.boss/, .specify/, .container-use/)
- [ ] MCP server configuration generation
- [ ] BOSS skills & commands packaging
- [ ] Git repository setup
- [ ] docker-compose.yml generation for local infra
- [ ] `boss doctor` - Health check command for prerequisites

### Phase 3: BOSS Skills & MCP Servers 📋
- [ ] BOSS orchestration skills (for Claude Code/Cursor)
- [ ] Container-Use MCP server integration
- [ ] Knowledge Base MCP server (PostgreSQL + Qdrant) or unified BOSS MCP
- [ ] Quality gate enforcement logic
- [ ] Workflow state management

### Phase 4: Spec-Kit Automation 📋
- [ ] 8-phase implementation
- [ ] Worker prompts
- [ ] Artifact templates
- [ ] Constitutional validator
- [ ] Auto-gate retry logic

### Phase 5: Container-Use Integration 📋
- [ ] Environment configurations
- [ ] 1Password integration
- [ ] Secret discovery engine
- [ ] Worker lifecycle management
- [ ] Observability tools

### Phase 6: Knowledge Base 📋
- [ ] PostgreSQL schema (projects, artifacts, dependencies)
- [ ] Qdrant vector store (patterns, specs, decisions)
- [ ] Local embeddings (HuggingFace text-embeddings-inference)
- [ ] Context assembly (gatekeeper pattern)
- [ ] Cross-project search & learning

### Phase 7: Integrations 📋
- [ ] GitHub API (PRs, issues, project boards)
- [ ] 1Password CLI (secret resolution)
- [ ] Vercel/Railway (deployments)

### Phase 8: Polish & Launch 📋
- [ ] CLI UX improvements
- [ ] Error handling & recovery
- [ ] Documentation site
- [ ] Example projects
- [ ] Community templates

---

## 🤝 Contributing

BOSS is an open-source project. We welcome contributions!

### How to Contribute

1. **Improve Documentation**
   - Fix typos, clarify concepts
   - Add examples and use cases
   - Create tutorials

2. **Create Templates**
   - New project templates
   - Quality presets
   - Worker configurations

3. **Share Patterns**
   - Secret setup guides
   - Integration patterns
   - Best practices

4. **Build BOSS**
   - Implement phases
   - Create workers
   - Add integrations

### Getting Started

```bash
# Fork the repository
git clone https://github.com/your-username/boss

# Read all documentation
- README.md (this file)
- BOSS-ENHANCED-VISION.md
- BOSS-SPEC-KIT-INTEGRATION.md
- BOSS-CONTAINER-USE-INTEGRATION.md

# Pick a phase to implement
# See roadmap above

# Submit PR with tests & docs
```

---

## 📖 Additional Resources

### Core Technologies

- **Spec-Kit:** https://github.com/github/spec-kit
- **Container-Use:** https://container-use.com
- **1Password CLI:** https://developer.1password.com/docs/cli
- **Claude Code:** https://claude.ai/claude-code
- **Cursor:** https://cursor.sh

### Local Infrastructure

- **Qdrant:** https://qdrant.tech (Local vector database via Docker)
- **PostgreSQL:** https://postgresql.org (Local knowledge base via Docker)
- **HuggingFace TEI:** https://huggingface.co/docs/text-embeddings-inference (Local embeddings)

### Deployment Options

- **Vercel:** https://vercel.com (Frontend deployments)
- **Railway:** https://railway.app (Backend deployments)
- **Kamal:** https://kamal-deploy.org (Self-hosted deployments)

---

## 💬 Community & Support

- **GitHub Issues:** Report bugs, request features
- **Discussions:** Ask questions, share ideas
- **Discord:** Join the community (coming soon)
- **Twitter:** Follow [@boss-framework](https://twitter.com/boss-framework)

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🎉 The Bottom Line

**BOSS is a complete system for modern software development:**

```
Spec-Kit (Executable Specifications)
    +
Container-Use (Secure Isolated Execution)
    +
BOSS Orchestration (Multi-Agent Coordination)
    =
Autonomous, Spec-Driven Development at Scale
```

**From idea to production-ready code:**
- ✅ 5-minute bootstrap with complete configuration
- ✅ 8-phase Spec-Kit workflow (fully automated)
- ✅ Workers in isolated containers (secure & observable)
- ✅ Secrets from 1Password (never exposed to AI)
- ✅ Agents discover secret needs (detailed instructions)
- ✅ Parallel execution (5 workers simultaneously)
- ✅ Quality gates (TDD, 80%+ coverage, mutation testing)
- ✅ Knowledge compounds (organizational memory)
- ✅ Human governance (approve at strategic points)

**Ready to build the future of software development?**

Start by reading **[BOSS-ENHANCED-VISION.md](./docs/BOSS-ENHANCED-VISION.md)** to see the complete vision! 🚀

📖 **[Complete Documentation](./docs/)** - All guides and detailed documentation

---

**Built by developers, for developers.**
**Spec-driven. Test-first. Human-governed. AI-executed.**
**Secure. Observable. Reproducible.**

🤖 **BOSS** - Because your business deserves better than manual orchestration.
