# BOSS: Business-Orchestrated Software System

**The Complete Vision**

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [Spec-Kit Integration](./BOSS-SPEC-KIT-INTEGRATION.md) | [Container-Use Integration](./BOSS-CONTAINER-USE-INTEGRATION.md) | [GitHub Integration](./BOSS-GITHUB-INTEGRATION.md) | [Host Setup](./BOSS-HOST-SETUP.md) | [Docker Setup](./DOCKER-SETUP.md)

---

## Table of Contents

1. [Quick Start](#quick-start)
   - [30-Second Overview](#30-second-overview)
   - [System Architecture Diagram](#system-architecture-diagram)
   - [Traditional vs BOSS](#traditional-vs-boss)

2. [Core Concepts](#core-concepts)
   - [What BOSS Is](#what-boss-is)
   - [The Problem We're Solving](#the-problem-were-solving)
   - [The BOSS Solution](#the-boss-solution)

3. [Foundation Technologies](#foundation-technologies)
   - [Spec-Kit: Executable Specifications](#spec-kit-executable-specifications)
   - [Container-Use: Isolated Worker Execution](#container-use-isolated-worker-execution)

4. [Bootstrap System](#bootstrap-system)
   - [What Bootstrap Does](#what-bootstrap-does)
   - [Bootstrap Command](#bootstrap-command)
   - [What Gets Created](#what-gets-created)
   - [Bootstrap Templates](#bootstrap-templates)

5. [BOSS Orchestration](#boss-orchestration)
   - [What BOSS Actually Is](#what-boss-actually-is)
   - [Why BOSS Runs on Host](#why-boss-runs-on-host)
   - [BOSS Architecture](#boss-architecture)
   - [BOSS Capabilities](#boss-capabilities)

6. [Knowledge & Coordination](#knowledge--coordination)
   - [Cross-Project Intelligence](#cross-project-intelligence)
   - [Knowledge Engine Gatekeeper Pattern](#knowledge-engine-gatekeeper-pattern)
   - [Cross-Project Coordination](#cross-project-coordination)

7. [GitHub Integration](#github-integration)
   - [Native Project Management](#native-project-management)
   - [Human Gates via GitHub](#human-gates-via-github)

8. [Complete Workflow](#complete-workflow)
   - [End-to-End Example](#end-to-end-example)

9. [Architecture](#architecture)
   - [System Architecture](#system-architecture)
   - [BOSS Components](#boss-components)
   - [Worker Container](#worker-container)
   - [Data Model](#data-model)

10. [CLI & Commands](#cli--commands)
    - [Bootstrap CLI Commands](#bootstrap-cli-commands)

11. [Configuration & Customization](#configuration--customization)
    - [Custom Worker Prompts](#custom-worker-prompts)
    - [Custom Quality Gates](#custom-quality-gates)
    - [Custom Commands](#custom-commands)

12. [Advanced Features](#advanced-features)
    - [Cross-BOSS Coordination Example](#cross-boss-coordination-example)
    - [Knowledge Base Query Example](#knowledge-base-query-example)
    - [Dependency Management Example](#dependency-management-example)

13. [Design Principles & Success Metrics](#design-principles--success-metrics)
    - [Key Design Principles](#key-design-principles)
    - [Success Metrics](#success-metrics)

14. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [First Project](#first-project)

15. [Roadmap & Evolution](#roadmap--evolution)
    - [Development Phases](#development-phases)
    - [Ecosystem Growth](#ecosystem-growth)
    - [Why BOSS Will Succeed](#why-boss-will-succeed)

16. [Reference](#reference)
    - [Technical Deep Dives](#technical-deep-dives)

---

## Quick Start

### 30-Second Overview

**BOSS transforms Claude Code or Cursor into an autonomous development orchestrator** that takes you from business idea to production-ready code through coordinated, isolated container workers - with human governance and cross-project intelligence.

```
┌──────────────────────────────────────────────────────────────┐
│ BOSS = Claude Code/Cursor + Skills + MCP Servers             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Bootstrap (5 min)  → Fully configured project           │
│  2. Describe Idea      → BOSS creates specs (Spec-Kit)      │
│  3. Approve Specs      → Human gate via GitHub PR           │
│  4. Auto-Implementation → Parallel workers in containers     │
│  5. Quality Enforcement → TDD + 80% coverage + mutation      │
│  6. Review & Deploy    → Production-ready with full docs    │
│                                                              │
│  🔐 Secrets: 1Password (op://) - AI never sees values       │
│  🧠 Knowledge: Compounds across all your projects            │
│  ⚡ Speed: Idea to PR in ~4 hours for typical CRUD apps     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Innovation:**
- **Spec-Kit** (GitHub) provides executable specifications & constitutional governance
- **Container-Use** provides isolated worker execution with secure secret management
- **BOSS** orchestrates everything with multi-agent coordination

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              YOUR LOCAL MACHINE (Host)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │  Claude Code or Cursor (= BOSS)              │    │
│  │  • BOSS Skills (orchestration)                │    │
│  │  • Spec-Kit workflow (8 phases)               │    │
│  │  • Quality gate enforcement                   │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
│  ┌──────────────┴────────────────────────────────┐    │
│  │  MCP Servers (all local)                      │    │
│  │  • Container-Use MCP → spawn/manage workers   │    │
│  │  • GitHub MCP → repo & project mgmt           │    │
│  │  • Knowledge Base MCP → PostgreSQL + Qdrant   │    │
│  │  • 1Password CLI → secret setup (op)          │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
│  ┌──────────────┴────────────────────────────────┐    │
│  │  Docker Daemon (local containers)             │    │
│  │  • postgres, qdrant, embeddings               │    │
│  │  • worker containers (via container-use)      │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
└─────────────────┼───────────────────────────────────────┘
                  │
      ┌───────────┼──────────┬──────────┬──────────┐
      │           │          │          │          │
      ▼           ▼          ▼          ▼          ▼
  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
  │Worker1│  │Worker2│  │Worker3│  │Worker4│  │Worker5│
  │Clarify│  │ Spec  │  │ Plan  │  │  Dev  │  │Review │
  │Claude │  │Claude │  │Claude │  │Claude │  │Claude │
  │+skills│  │+skills│  │+skills│  │+skills│  │+skills│
  │branch │  │branch │  │branch │  │branch │  │branch │
  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘
```

### Traditional vs BOSS

| Aspect | Traditional Development | BOSS Development |
|--------|------------------------|------------------|
| **Project Setup** | Hours of manual configuration | 5 minutes with `boss bootstrap` |
| **Requirements** | Meetings, documents, back-and-forth | Conversational clarification with BOSS |
| **Specifications** | Manual PRDs, often outdated | Spec-Kit artifacts (executable, versioned) |
| **Architecture** | Manual design, inconsistent patterns | Constitutional governance + knowledge base |
| **Implementation** | Manual coding, context switching | Parallel workers in isolated containers |
| **Testing** | Often afterthought, low coverage | TDD enforced, ≥80% coverage + mutation |
| **Code Review** | Manual, inconsistent standards | Automated quality gates + human approval |
| **Integration** | Manual, error-prone | Automated consolidation with tests |
| **Security** | Secrets in .env files, often committed | 1Password integration, AI never sees values |
| **Knowledge** | Tribal, forgotten, siloed | Shared knowledge base, compounds over time |
| **Cross-Project** | Manual coordination, duplicate work | Automatic dependency detection & reuse |
| **Quality** | Varies by developer/team | Enforced by quality gates, consistent |
| **Time to PR** | Days to weeks | Hours with BOSS orchestration |

---

## Core Concepts

### What BOSS Is

**BOSS** is a framework and methodology that transforms **Claude Code or Cursor** into an autonomous development orchestrator.

**IMPORTANT: BOSS is NOT a standalone application.**

**BOSS IS:**
- Your **Claude Code or Cursor instance** configured to act as an orchestrator
- A set of **BOSS skills** loaded into Claude Code/Cursor for orchestration capabilities
- **MCP server connections** (Container-Use, GitHub, Knowledge Base)
- **1Password CLI** for secure secret management (op CLI, not MCP)
- **Worker templates** defining configurations for spawning specialized container-use agents
- A **methodology** for spec-driven, autonomous development

When you bootstrap a BOSS project and open it in Claude Code/Cursor, your AI assistant loads the BOSS configuration and becomes the orchestrator.

### The Problem We're Solving

Modern software development faces critical challenges:

| Problem | Impact |
|---------|--------|
| **Manual project setup** | Hours spent configuring tools, linting, testing, git hooks |
| **Context switching overload** | Multiple projects, multiple tech stacks, forgotten decisions |
| **Inconsistent quality** | Different standards across projects, team members |
| **AI assistants that forget** | No organizational memory between conversations |
| **No cross-project coordination** | Dependencies discovered too late, duplicate work |
| **Manual orchestration** | Humans coordinating what should be automated |
| **Insecure secret management** | .env files committed, credentials exposed to AI |
| **No testing discipline** | Low coverage, tests written after (or never) |

### The BOSS Solution

A **two-tier system** that addresses all these challenges:

**1. Bootstrap CLI** - Sets up new projects with everything configured
- .boss/ directory with worker configurations
- .specify/ directory for Spec-Kit artifacts
- MCP servers configured
- Quality gates established
- Tech stack policy enforced

**2. BOSS-Configured Claude Code/Cursor** - Your AI assistant becomes the orchestrator
- Loaded with BOSS skills and MCP connections
- Runs Spec-Kit's 8 phases automatically
- Spawns workers in isolated containers
- Enforces quality gates (TDD, coverage, mutation)
- Manages secrets via 1Password
- Builds organizational knowledge

**Result:** From "I have an idea" to "I have production-ready code" - fully automated, fully secure, fully under your control.

---

## Foundation Technologies

BOSS is built on two powerful foundations:

### Spec-Kit: Executable Specifications

**GitHub's Spec-Kit** - An open-source toolkit for "Spec-Driven Development" that treats specifications as executable, foundational artifacts.

#### What Spec-Kit Provides

| Component | Description |
|-----------|-------------|
| **Eight Sequential Phases** | Bootstrap → Constitution → Clarification → Specification → Planning → Validation → Task Breakdown → Implementation → Consolidation |
| **Structured Artifacts** | constitution.md, spec.md, plan.md, tasks.md, data-model.md, contracts/, quickstart.md, checklist.md |
| **Test-First Methodology** | TDD is NON-NEGOTIABLE (red → green → refactor) |
| **Parallelization Markers** | Tasks marked with `[P]` can run in parallel |
| **Constitutional Governance** | All work validated against project principles |

#### How BOSS Transforms Spec-Kit

BOSS automates and enhances every phase of Spec-Kit:

```
Manual Spec-Kit (GitHub)          BOSS + Spec-Kit
─────────────────────────────     ──────────────────────────────
Human writes constitution    →    Architect worker generates
Human gathers requirements   →    Clarifier worker interviews you
Human writes specifications  →    Spec-Writer creates artifacts
Human reviews manually       →    Auto-validation with retry logic
Human creates tasks          →    Planner generates tasks with [P]
Human implements             →    Parallel workers in containers
Human coordinates workers    →    BOSS orchestrates automatically
Manual quality checks        →    Automated gates (≥80% coverage)
Manual knowledge sharing     →    Knowledge base compounds
```

**Enhanced Capabilities:**
- ✅ Automates all eight phases with specialized workers
- ✅ Parallel execution based on `[P]` markers
- ✅ Constitutional auto-validation with retry logic
- ✅ Knowledge base integration (learns from similar projects)
- ✅ Quality gates (coverage ≥80%, mutation ≥80%)
- ✅ Human governance at strategic decision points

> 📚 **Deep Dive:** See [BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md) for complete phase-by-phase automation details, worker prompts, and constitutional principles.

### Container-Use: Isolated Worker Execution

**Container-Use** - A system for running AI agents in isolated Docker containers with dedicated Git branches and secure secret management.

#### What Container-Use Provides

| Feature | Benefit |
|---------|---------|
| **Isolated Environments** | Each worker in own container + Git branch |
| **Secure Secrets** | 1Password integration (op:// references), AI never sees values |
| **Full Observability** | Complete command history and audit trail |
| **Disposable Execution** | Clean environments, easy rollback |
| **Parallel Workers** | Multiple agents without conflicts |

#### How BOSS Leverages Container-Use

```
BOSS Architecture with Container-Use
────────────────────────────────────────────────────────
┌─────────────────────────────────────┐
│ BOSS (Host - Claude Code/Cursor)   │
│ • Orchestrates via Container-Use MCP │
│ • Creates workers, monitors progress │
│ • CANNOT touch files/git directly    │
└──────────────┬──────────────────────┘
               │
               ├─► Container 1 (Clarifier)
               │   • Full file/git/shell access
               │   • Isolated branch
               │   • No secrets needed
               │
               ├─► Container 2 (Developer)
               │   • Full file/git/shell access
               │   • Isolated branch
               │   • Secrets: STRIPE_KEY, DB_URL
               │   • Secrets from 1Password (op://)
               │
               └─► Container 3 (Reviewer)
                   • Full file/git/shell access
                   • Isolated branch
                   • No secrets needed
```

**Integration Benefits:**
- ✅ BOSS runs locally (Claude Code/Cursor), workers in containers
- ✅ Each worker gets isolated environment (container-use/env-*)
- ✅ Secrets injected from 1Password (never exposed to AI)
- ✅ Agents auto-discover secret requirements during planning
- ✅ Integration tests run with real API credentials (test mode)
- ✅ Complete audit trail of all worker actions

> 🔐 **Deep Dive:** See [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md) for worker configurations, secret management, and 1Password integration patterns.

---

## Bootstrap System

### What Bootstrap Does

The bootstrap tool initializes new projects with **complete, opinionated configuration** based on project type and quality requirements.

**In 5 minutes you get:**
- Fully configured project structure
- All tooling set up (TypeScript, linting, testing, git hooks)
- BOSS configuration with worker templates
- Spec-Kit directory structure
- GitHub workflows
- Quality gates configured
- Tech stack policy enforced

### Bootstrap Command

```bash
# Interactive mode
boss bootstrap

# Opinionated web app
boss bootstrap --template nextjs-app-turbo --quality enterprise

# Blank canvas (minimal opinions)
boss bootstrap --template blank --quality startup

# Custom template from your org
boss bootstrap --template @myorg/api-service --quality production
```

### What Gets Created

#### 1. Project Structure

```
my-project/
├── CLAUDE.md                       # CRITICAL: Worker instructions (environment-only operations)
├── start-boss.sh                   # CRITICAL: Launch BOSS with --allowedTools flag (MCP-only)
├── .boss/                          # BOSS configuration
│   ├── config.yaml                 # BOSS settings
│   ├── CLAUDE.md                   # Perfected instructions for BOSS
│   ├── commands/                   # Custom BOSS commands
│   ├── skills/                     # BOSS skills
│   ├── agents/                     # BOSS agent definitions
│   ├── workers/                    # Container-use worker configs
│   │   ├── clarifier/             # Business requirements agent
│   │   │   ├── prompt.md          # Worker role prompt
│   │   │   └── container-config.json  # Container-use config
│   │   ├── spec-writer/           # Specification agent
│   │   ├── planner/               # Planning agent
│   │   ├── architect/             # Architecture agent
│   │   ├── developer-frontend/    # Frontend developer agent
│   │   ├── developer-backend/     # Backend developer agent
│   │   ├── developer-fullstack/   # Fullstack developer agent
│   │   ├── reviewer/              # Code review agent
│   │   └── consolidator/          # Integration agent
│   ├── quality-gates/             # Quality gate configurations
│   ├── templates/                 # Worker prompt templates
│   └── mcp-config.json            # MCP servers for BOSS
│
├── .container-use/                # Container-use configuration
│   └── environment.json           # Default container environment
│
├── .github/
│   ├── workflows/                 # CI/CD pipelines
│   │   ├── quality-gates.yml     # Automated quality checks
│   │   ├── test.yml              # Test runner
│   │   └── deploy.yml            # Deployment pipeline
│   └── PULL_REQUEST_TEMPLATE.md  # PR template
│
├── .husky/                        # Git hooks
│   ├── pre-commit                # Lint, typecheck, test
│   └── commit-msg                # Conventional commits
│
├── src/                           # Application code
├── tests/                         # Test directory
├── .specify/                      # Spec-Kit artifacts
│   ├── memory/
│   │   └── constitution.md       # Project governing principles (NON-NEGOTIABLE)
│   ├── specs/                    # Feature specifications
│   │   └── 001-feature-name/
│   │       ├── spec.md           # User stories & acceptance criteria
│   │       ├── plan.md           # Technical implementation strategy
│   │       ├── tasks.md          # Granular tasks with [P] parallel markers
│   │       ├── data-model.md     # Database schema & entities
│   │       ├── contracts/        # API specs (OpenAPI)
│   │       ├── quickstart.md     # Setup & running instructions
│   │       └── checklist.md      # Quality validation criteria
│   ├── scripts/                  # Automation helpers
│   └── templates/                # Spec-Kit templates
│
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── vitest.config.ts              # Test config
├── .eslintrc.js                  # Linting rules
├── .prettierrc                   # Formatting rules
└── README.md                     # Project README
```

#### 2. Git Repository Initialization

```bash
git init
git branch -M main
git add .
git commit -m "chore: bootstrap project with BOSS

🤖 Generated with BOSS v1.0.0
Template: nextjs-app-turbo
Quality: enterprise"
```

#### 3. Project CLAUDE.md (Worker Instructions)

**CRITICAL:** Bootstrap creates a `CLAUDE.md` file in the project root containing mandatory operational constraints for workers.

**Why This Exists:**
- Workers run in isolated container-use environments
- Workers MUST use environment tools for ALL operations
- Workers MUST NOT use raw git CLI (breaks environment integrity)
- Workers MUST inform users how to view their work

**What It Contains:**

```markdown
# Project: [Project Name]

## CRITICAL: Environment-Only Operations

**ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.**

### What This Means
- ✅ DO: Use environment tools for ALL operations
- ❌ DO NOT: Use raw git CLI with environment_run_cmd
- ❌ DO NOT: Execute file operations outside environment tools

### User Visibility
You MUST inform the user how to view your work:
- `container-use log <env_id>` - View command history
- `container-use checkout <env_id>` - Checkout branch to inspect code

## [Template-Specific Guidelines]
[Next.js patterns, API design patterns, etc. based on template]
```

**Template-Specific Content:**
- `nextjs-app-turbo`: Next.js App Router, Server Components, Tailwind, Prisma
- `api-service-fastify`: Fastify patterns, OpenAPI, REST design
- `blank`: Generic TypeScript patterns

See [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md) for complete CLAUDE.md templates.

#### 4. start-boss.sh Helper Script

**CRITICAL:** Bootstrap creates a `start-boss.sh` script that enforces BOSS can ONLY use MCP tools.

**Why This Is Essential:**
- **Security**: Prevents BOSS from accessing host file system, shell, or git
- **Enforcement**: Uses `--allowedTools` flag to whitelist only MCP tools
- **Isolation**: Guarantees BOSS operates exclusively via Container-Use, GitHub, and Knowledge Base MCPs

**The Script:**

```bash
#!/usr/bin/env bash
# start-boss.sh - Launch BOSS with MCP-only access
# Generated by BOSS bootstrap

echo "🤖 Starting BOSS with restricted tool access..."
echo "  ✅ Container-Use MCP (spawn/manage workers)"
echo "  ✅ GitHub MCP (ALL GitHub operations)"
echo "  ✅ Knowledge Base MCP (query context)"
echo "  ❌ NO host-level tools"

claude --allowedTools \
mcp__container-use__*,\
mcp__github__*,\
mcp__knowledge-base__*
```

**Usage:**

```bash
# Launch BOSS (always use this script!)
./start-boss.sh
```

**What Gets Blocked:**
- ❌ Read, Write, Edit, Glob, Grep (host file operations)
- ❌ Bash (host shell execution)
- ❌ Direct git commands

**What's Allowed:**
- ✅ All Container-Use MCP operations (spawn workers, manage environments)
- ✅ All GitHub MCP operations (PRs, issues, projects, labels, etc.)
- ✅ All Knowledge Base MCP operations (search, query, insert)

See [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md) for complete tool whitelist.

#### 5. BOSS Configuration (.boss/config.yaml)

```yaml
boss:
  version: 1.0.0
  template: nextjs-app-turbo
  quality: enterprise

project:
  name: my-project
  type: web-app
  stack:
    - nextjs
    - typescript
    - tailwind
    - prisma
    - vitest

workers:
  max_concurrent: 5
  timeout: 3600

  environments:
    clarifier:
      image: boss/worker:latest
      prompt: .boss/workers/clarifier/prompt.md
      commands: [ask, refine, validate]

    spec-writer:
      image: boss/worker:latest
      prompt: .boss/workers/spec-writer/prompt.md
      commands: [write-spec, validate-spec]

    planner:
      image: boss/worker:latest
      prompt: .boss/workers/planner/prompt.md
      commands: [create-plan, breakdown-tasks]

    architect:
      image: boss/worker:latest
      prompt: .boss/workers/architect/prompt.md
      commands: [design-architecture, create-adr]

    developer-frontend:
      image: boss/worker:latest
      prompt: .boss/workers/developer-frontend/prompt.md
      skills: [react, nextjs, tailwind, typescript]
      commands: [implement, test, document]

    developer-backend:
      image: boss/worker:latest
      prompt: .boss/workers/developer-backend/prompt.md
      skills: [nodejs, prisma, api-design, postgres]
      commands: [implement, test, document]

    developer-fullstack:
      image: boss/worker:latest
      prompt: .boss/workers/developer-fullstack/prompt.md
      skills: [react, nodejs, typescript, api-design]
      commands: [implement, test, document]

    reviewer:
      image: boss/worker:latest
      prompt: .boss/workers/reviewer/prompt.md
      commands: [review-code, validate-tests, check-quality]

    consolidator:
      image: boss/worker:latest
      prompt: .boss/workers/consolidator/prompt.md
      commands: [merge-branches, resolve-conflicts, run-integration-tests]

quality:
  preset: enterprise

  gates:
    planning:
      enabled: true
      type: human
      reviewers: [user]

    architecture:
      enabled: true
      type: automated
      checks: [design-patterns, security, scalability]

    implementation:
      enabled: true
      type: automated
      checks:
        - typecheck
        - lint
        - test
        - coverage: 80
        - security-scan

    pr:
      enabled: true
      type: human
      reviewers: [user]

  rules:
    test_first: true                # Tests before implementation (NON-NEGOTIABLE)
    mutation_coverage: 80           # Mutation testing threshold
    no_console_logs: true           # No console.logs in production
    strict_typescript: true         # Strict TS mode

tech_stack_policy:
  allowed:
    frontend: [nextjs, react, tailwind]
    backend: [nodejs, typescript, fastify]
    database: [postgresql, prisma]
    testing: [vitest, playwright]
    deployment: [kamal, railway]

  prohibited:
    - webpack  # Use Next.js built-in
    - create-react-app  # Deprecated
    - jest  # Use Vitest

  reasoning: "See tech-stack-decisions.md"

integrations:
  github:
    enabled: true
    repo: user/my-project
    projects: true  # Use GitHub Projects for task management

  knowledge_base:
    enabled: true
    share_embeddings: true

  mcp_servers:
    - boss-specs
    - boss-workflows
    - boss-knowledge
    - container-use
    - github
```

### Bootstrap Templates

Templates are versioned and stored in GitHub to evolve continuously.

#### Available Templates

```yaml
templates:
  # Web Applications
  - name: nextjs-app-turbo
    description: Next.js 15 + Turbo + Tailwind + Prisma + Vitest
    stack: [nextjs, typescript, tailwind, prisma, vitest, playwright]
    quality_presets: [startup, production, enterprise]

  - name: nextjs-app-basic
    description: Next.js 15 + Tailwind + Vitest (minimal)
    stack: [nextjs, typescript, tailwind, vitest]
    quality_presets: [startup, production]

  # API Services
  - name: api-service-fastify
    description: Fastify + TypeScript + Prisma + Vitest
    stack: [fastify, typescript, prisma, vitest]
    quality_presets: [production, enterprise]

  - name: api-service-express
    description: Express + TypeScript + Prisma + Jest
    stack: [express, typescript, prisma, jest]
    quality_presets: [startup, production]

  # Blank Canvas
  - name: blank
    description: Minimal setup (git + husky + basic linting)
    stack: [typescript, vitest, eslint, prettier]
    quality_presets: [startup]

  # Custom (from your organization)
  - name: @myorg/microservice
    description: Your org's microservice template
    source: github.com/myorg/boss-templates
```

#### Quality Presets

Different quality levels affect hooks, workflows, and gates:

| Preset | Description | Hooks | Gates | CI |
|--------|-------------|-------|-------|-----|
| **startup** | Fast iteration, minimal gates | lint-staged, typecheck | planning: optional, implementation: [typecheck, test] | basic-tests |
| **production** | Balanced quality and speed | lint-staged, typecheck, test-affected, conventional-commits | planning: required, architecture: automated, implementation: [typecheck, lint, test, coverage:80] | typecheck, lint, test, security-scan |
| **enterprise** | Maximum quality, comprehensive checks | lint-staged, typecheck, test-affected, test-all, build, conventional-commits, ticket-reference | planning: required, architecture: automated + manual-review, implementation: [typecheck, lint, test, coverage:90, mutation:80, security-scan], pr: required + 2-approvers | typecheck, lint, test, mutation-test, security-scan, dependency-check, build, e2e-tests |

### Bootstrap Evolution

The bootstrap system itself lives in GitHub and evolves:

```
boss-bootstrap/
├── templates/                  # All templates
│   ├── nextjs-app-turbo/
│   ├── api-service-fastify/
│   └── blank/
│
├── workers/                   # Worker definitions
│   ├── clarifier/
│   ├── spec-writer/
│   ├── planner/
│   ├── architect/
│   ├── developer-*/
│   ├── reviewer/
│   └── consolidator/
│
├── quality-presets/          # Quality configurations
│   ├── startup.yaml
│   ├── production.yaml
│   └── enterprise.yaml
│
└── cli/                      # Bootstrap CLI
    └── src/
```

**Community contributions welcome:**
- New templates for different stacks
- New quality presets
- New worker types
- Improved prompts

---

## BOSS Orchestration

### What BOSS Actually Is

**BOSS is NOT a standalone application.**

**BOSS IS:**
- Your **Claude Code or Cursor instance** configured to act as an orchestrator
- A set of **BOSS skills** loaded into Claude Code/Cursor for orchestration capabilities
- **MCP server connections** (Container-Use, GitHub, Knowledge Base)
- **1Password CLI** for secure secret management (op CLI, not MCP)
- **Worker templates** defining configurations for spawning specialized container-use agents
- A **methodology** for spec-driven, autonomous development

When you bootstrap a BOSS project and open it in Claude Code/Cursor, your AI assistant loads the BOSS configuration and becomes the orchestrator.

### Why BOSS Runs on Host (Not in Container)

Claude Code/Cursor must run on the host machine to orchestrate via MCP servers.

**What BOSS CAN Do (MCP-Only Operations):**

| Capability | How It Works |
|------------|--------------|
| **Orchestrate worker containers** | Via Container-Use MCP |
| **Create PRs, manage issues** | Via GitHub MCP (ALL GitHub operations) |
| **Query patterns and context** | Via Knowledge Base MCP |
| **Manage workflow state** | Coordinate workers |
| **Interact with you** | When needed |
| **Request secrets** | Via GitHub issues (humans create in 1Password using op CLI) |

**What BOSS CANNOT Do (Host-Level Restrictions):**

| Restriction | Reason |
|-------------|--------|
| ❌ **NO direct file operations** | Cannot read, write, or edit files on host |
| ❌ **NO direct code execution** | Cannot run shell commands, scripts, or build tools |
| ❌ **NO direct git operations** | Cannot commit, push, or manage git directly |

**BOSS orchestrates ONLY via well-defined MCP interfaces. All actual code/file/git operations happen inside worker containers.**

**Why Workers Use Container-Use:**
- ✅ **Full execution capabilities** - Workers CAN execute ALL file/code/shell/git operations
- ✅ **Isolation** - Can't break main branch or affect host
- ✅ **Security** - Secrets injected, never exposed to AI models
- ✅ **Observability** - Complete command history via container-use logs
- ✅ **Disposability** - Easy to delete and retry
- ✅ **Parallelization** - Own branch per worker, no conflicts

> 🔐 **Secret Management:** Workers access API credentials via 1Password integration (op:// references). See [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md) for details.

### BOSS Architecture

```
┌─────────────────────────────────────────────────────────┐
│              YOUR LOCAL MACHINE (Host)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │  Claude Code or Cursor                        │    │
│  │  (= BOSS when loaded with skills & MCPs)      │    │
│  │                                               │    │
│  │  • BOSS Skills (orchestration logic)          │    │
│  │  • Spec-Kit workflow (8 phases)               │    │
│  │  • Quality gate enforcement                   │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
│  ┌──────────────┴────────────────────────────────┐    │
│  │  MCP Servers (all local)                      │    │
│  │                                               │    │
│  │  • Container-Use MCP → spawn/manage workers   │    │
│  │  • GitHub MCP → repo ops & project mgmt       │    │
│  │  • Knowledge Base MCP → PostgreSQL + Qdrant   │    │
│  │  • 1Password CLI → manual secret setup (op)   │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
│  ┌──────────────┴────────────────────────────────┐    │
│  │  Docker Daemon (local containers)             │    │
│  │                                               │    │
│  │  • postgres (knowledge base)                  │    │
│  │  • qdrant (vectors)                           │    │
│  │  • text-embeddings-inference (embeddings)     │    │
│  │  • worker containers (via container-use)      │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
└─────────────────┼───────────────────────────────────────┘
                  │
                  │ Container-Use spawns via MCP
                  │
      ┌───────────┼──────────┬──────────┬──────────┐
      │           │          │          │          │
      ▼           ▼          ▼          ▼          ▼
  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
  │Worker1│  │Worker2│  │Worker3│  │Worker4│  │Worker5│
  │Clarify│  │ Spec  │  │ Plan  │  │  Dev  │  │Review │
  │cu/001 │  │cu/002 │  │cu/003 │  │cu/004 │  │cu/005 │
  │Claude │  │Claude │  │Claude │  │Claude │  │Claude │
  │+skills│  │+skills│  │+skills│  │+skills│  │+skills│
  │branch │  │branch │  │branch │  │branch │  │branch │
  │       │  │       │  │       │  │Stripe │  │GitHub │
  │       │  │       │  │       │  │DB     │  │secrets│
  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘
```

**Key:**
- `cu/###` = Container-use environment ID
- Secrets injected from 1Password (op:// references) - never visible to AI
- Each worker = isolated container + Git branch + Claude Code + role-specific skills
- BOSS orchestrates via Container-Use MCP commands

### BOSS Capabilities

#### 1. Business Conversation

BOSS talks to you to understand your business idea:

```
BOSS: Hi! I'm BOSS. Let's build something amazing together.
      What would you like to build?

You:  A task management app for remote teams

BOSS: Great! Let me ask some questions to understand your vision.

      1. Who are the primary users?
      2. What's the main problem they face today?
      3. What makes this different from existing tools?
      4. Any specific workflows you want to support?

      (BOSS asks BUSINESS questions, not tech questions)
```

**BOSS is opinionated about tech** - it uses the tech stack policy from bootstrap config.

#### 2. Workflow Orchestration

BOSS runs the complete development lifecycle following GitHub's Spec-Kit methodology:

```
Phase 0: Bootstrap
    ↓
Phase 1: Constitution (Worker: Architect)
    └─► Creates .specify/memory/constitution.md
    ↓
Phase 2: Clarification (Worker: Clarifier)
    └─► Gathers business requirements
    ↓
Phase 3: Specification (Worker: Spec-Writer)
    └─► Creates .specify/specs/001-feature/spec.md
    ↓
[GATE 1: Human Approval] ← You review spec.md with user stories
    ↓
Phase 4: Planning (Worker: Planner)
    └─► Creates plan.md, data-model.md, contracts/
    ↓
Phase 5: Validation (Worker: Reviewer)
    └─► Validates against constitution.md
    ↓
[AUTO-GATE: Constitution Compliance] ← Automated (up to 3 retries)
    ↓
Phase 6: Task Breakdown (Worker: Planner)
    └─► Creates tasks.md with [P] parallelization markers
    ↓
Phase 7: Implementation (Parallel Workers)
    │   └─► Follows Test-First (TDD) - NON-NEGOTIABLE
    ├─► Frontend Developer (User Story 1)
    ├─► Backend Developer (User Story 2)
    ├─► Fullstack Developer (User Story 3)
    └─► ... (5 workers max in parallel, based on [P] markers)
    ↓
Phase 8: Consolidation (Worker: Consolidator)
    └─► Creates quickstart.md, checklist.md
    ↓
PR Creation
    ↓
[GATE 2: Human Review] ← You review PR with all artifacts
    ↓
Merge & Deploy
```

> 📚 **Detailed Integration:** See [BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md) for phase-by-phase details, worker prompts, and artifact specifications.

#### 3. Worker Management

BOSS assigns the right workers to the right tasks:

**Example: Task Selection Logic**

```yaml
# Example: Task requires frontend + API work
task:
  id: user-authentication
  skills_required: [react, nextjs, api-design, security]

# BOSS selects:
worker: developer-fullstack
# Because: Has all required skills

# Example: Task is frontend-only
task:
  id: dashboard-ui
  skills_required: [react, tailwind]

# BOSS selects:
worker: developer-frontend
# Because: Specialized for frontend work
```

#### 4. Quality Enforcement

BOSS enforces quality gates configured during bootstrap:

**Passing Gate:**
```
Quality Gate: Implementation
├── TypeCheck: ✅ Passed
├── Lint: ✅ Passed
├── Tests: ✅ All 47 tests passing
├── Coverage: ✅ 87% (required: 80%)
├── Mutation: ✅ 82% (required: 80%)
└── Security: ⚠️  1 warning (non-blocking)

✅ Quality gate PASSED - Creating PR
```

**Failing Gate (with Retry):**
```
Quality Gate: Implementation
├── TypeCheck: ❌ 3 errors
└── Tests: ❌ 2 failing tests

❌ Quality gate FAILED

BOSS: I found issues that need fixing:
      1. Type errors in src/auth.ts
      2. Failing tests in auth.test.ts

      Spawning reviewer to analyze and fix...
```

#### 5. State Management

BOSS maintains state across the entire workflow:

```yaml
workflow_state:
  run_id: run_2024_001
  project: my-app
  status: implementing

  phases:
    clarification: completed
    specification: completed
    planning: completed
    gate1: approved
    architecture: completed
    auto_gate: passed
    tasks: completed
    implementation: in_progress

  workers:
    - id: worker_001
      role: developer-frontend
      task: user-story-1
      status: completed
      container_use_env: env-abc123
      branch: container-use/env-abc123
      secrets: [GITHUB_TOKEN, VERCEL_TOKEN]

    - id: worker_002
      role: developer-backend
      task: user-story-2
      status: in_progress
      container_use_env: env-def456
      branch: container-use/env-def456
      secrets: [GITHUB_TOKEN, STRIPE_SECRET_KEY, DATABASE_URL]

  artifacts:
    constitution: .specify/memory/constitution.md
    spec: .specify/specs/001-user-authentication/spec.md
    plan: .specify/specs/001-user-authentication/plan.md
    tasks: .specify/specs/001-user-authentication/tasks.md
    data_model: .specify/specs/001-user-authentication/data-model.md
```

**Resume capability**: If workflow is interrupted, BOSS can resume from any phase.

---

## Knowledge & Coordination

### Cross-Project Intelligence

Multiple BOSS-configured projects (Claude Code/Cursor instances) share knowledge through a **local** knowledge base:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Project 1   │  │  Project 2   │  │  Project 3   │
│  (auth-svc)  │  │  (dashboard) │  │  (api-gw)    │
│              │  │              │  │              │
│ Claude Code  │  │ Claude Code  │  │ Claude Code  │
│ + BOSS cfg   │  │ + BOSS cfg   │  │ + BOSS cfg   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         │ All query same local DB
                         ▼
              ┌──────────────────────┐
              │  Local Knowledge Base │
              ├──────────────────────┤
              │ PostgreSQL (Docker)   │ ← Structured data
              │ Qdrant (Docker)       │ ← Vector embeddings
              │ HuggingFace TEI       │ ← Local embeddings
              │   (Docker)            │    (BAAI/bge-large)
              └──────────────────────┘
```

**No real-time BOSS-to-BOSS communication.** Each project's Claude Code/Cursor queries the shared local knowledge base independently via Knowledge Base MCP.

#### What BOSSES Share

| Category | Examples |
|----------|----------|
| **Project Specs & Decisions** | All specifications, Architecture Decision Records (ADRs), API contracts, Data models |
| **Code Patterns** | Component patterns, API patterns, Testing patterns, Error handling patterns |
| **Organizational Knowledge** | Tech stack decisions, Security patterns, Performance patterns, Deployment patterns |
| **Dependency Information** | Shared libraries, API dependencies, Database schemas, Service contracts |

### Knowledge Engine Gatekeeper Pattern

**Claude Code/Cursor (BOSS-configured) is the sole accessor to the knowledge base** - workers never query directly:

```
┌───────────────────────────────────────────────────────────┐
│ Knowledge Engine Gatekeeper Pattern                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ 1. BOSS receives task                                    │
│     ↓                                                     │
│ 2. BOSS queries Knowledge Base MCP ONCE                  │
│    └─► mcp.knowledgeBase.search({                        │
│          query: "OAuth implementation patterns",          │
│          filters: { tech_stack: ["nodejs", "typescript"] }│
│        })                                                 │
│     ↓                                                     │
│ 3. BOSS assembles Task Context Package:                  │
│    • Relevant specs from similar projects                │
│    • Code patterns that worked before                    │
│    • Related architectural decisions                     │
│    • Dependency information                              │
│     ↓                                                     │
│ 4. BOSS includes context in worker prompt when spawning  │
│    via Container-Use MCP                                 │
│     ↓                                                     │
│ 5. Worker executes with full context                     │
│    (no knowledge base access needed)                     │
│                                                           │
│ Benefits:                                                 │
│ • 1 query instead of 5+ queries (cheaper, faster)        │
│ • Consistent context across all workers                  │
│ • Workers remain simple (no KB dependency)               │
│ • Lower embedding/vector search costs                    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Cross-Project Coordination

**No real-time communication protocol.** Projects coordinate by querying the shared local knowledge base:

**Example: Dashboard Project Discovers Auth Service**

```
Dashboard Project (Claude Code/Cursor + BOSS):
  "I need to implement OAuth integration for the dashboard.
   Let me check the knowledge base..."

  Query via Knowledge Base MCP:
    └─► mcp.knowledgeBase.search({
          query: "OAuth implementation",
          filters: { artifact_type: "api", status: "deployed" }
        })

  Result from PostgreSQL:
    └─► Project: auth-service
        Artifact: src/oauth/authorize.ts
        Status: deployed
        Endpoints: /oauth/authorize, /oauth/token
        Created: 2024-01-10
        Docs: API contract available

BOSS (Dashboard):
  "Found existing OAuth implementation in auth-service!

   Should I:
   A) Use existing auth-service OAuth API (recommended)
   B) Implement new OAuth from scratch

   If A, I'll add auth-service as dependency and use the
   existing API patterns from the knowledge base."
```

**Key: No BOSS-to-BOSS messages. Only database queries.**

#### Dependency Management via Knowledge Base

Projects record dependencies in shared PostgreSQL database:

```sql
-- PostgreSQL schema
CREATE TABLE project_dependencies (
  id SERIAL PRIMARY KEY,
  from_project VARCHAR(255),      -- 'dashboard-app'
  to_project VARCHAR(255),         -- 'auth-service'
  dependency_type VARCHAR(50),     -- 'api', 'library', 'data'
  endpoint VARCHAR(255),           -- '/oauth/authorize'
  status VARCHAR(50),              -- 'available', 'in_progress', 'planned'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard queries dependencies
SELECT * FROM project_dependencies
WHERE from_project = 'dashboard-app';

-- Result:
-- to_project: auth-service
-- endpoint: /oauth/authorize
-- status: available  (auth-service completed and updated KB)
```

**How Updates Happen:**

```
Auth Service Project (Claude Code/Cursor):
  "OAuth API implementation complete!"

  └─► Updates knowledge base via Knowledge Base MCP:
      mcp.knowledgeBase.updateArtifact({
        project: "auth-service",
        artifact: "oauth-api",
        status: "deployed",
        endpoints: ["/oauth/authorize", "/oauth/token"],
        contract: openapi_spec,
        examples: code_examples
      })

Dashboard Project (later, when user opens it):
  └─► Queries knowledge base
      └─► Finds auth-service OAuth API is now available
          └─► Suggests: "Use existing OAuth API from auth-service"
```

**No notifications. Projects discover changes when they query the knowledge base.**

---

## GitHub Integration

### Native Project Management

BOSS uses GitHub's native project management features:

```
GitHub Repository: my-app
├── Pull Requests → Approval gates & code review
├── Issues → Human tasks & secret setup requests
├── Projects (Beta) → Visual task tracking
│   ├── Epic: User Authentication
│   │   ├── Issue: Password Reset Flow
│   │   └── Issue: 2FA Implementation
│   └── Epic: Dashboard

BOSS creates:
- PRs for specifications and implementations
- Issues for human tasks (secret setup, approvals)
- Project board items automatically
- Links between PRs, issues, and commits
- Status updates via PR/issue comments
```

### Human Gates via GitHub

BOSS uses GitHub PRs and Issues for approval workflow:

```
1. BOSS creates Planning PR
2. BOSS creates GitHub Issue: "Review Planning PR #1"
3. Issue links to PR and includes review checklist
4. You review the PR on GitHub
5. You approve/reject via PR review
6. BOSS detects approval event via GitHub webhook/polling
7. BOSS continues workflow
```

**Why GitHub?**
- ✅ No additional infrastructure (already using GitHub for code)
- ✅ Native developer workflow (no context switching)
- ✅ Built-in approval gates (PR reviews)
- ✅ Audit trail via commits, PRs, and issues
- ✅ Integration with CI/CD and status checks

---

## Complete Workflow

### End-to-End Example

#### Step 1: Bootstrap

```bash
$ boss bootstrap --template nextjs-app-turbo --quality production

🤖 BOSS Bootstrap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Creating project structure
✓ Installing dependencies (pnpm)
✓ Configuring TypeScript
✓ Setting up ESLint + Prettier
✓ Setting up Vitest
✓ Setting up Playwright
✓ Configuring Husky hooks
✓ Setting up GitHub workflows
✓ Creating BOSS configuration
✓ Setting up worker environments
✓ Configuring quality gates
✓ Initializing git repository

✅ Project bootstrapped successfully!

Next steps:
1. cd my-app
2. boss start
```

#### Step 2: Start BOSS

```bash
$ cd my-app
$ boss start

🎯 BOSS Controller v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Loading configuration
✓ Connecting to knowledge base
✓ Connecting to GitHub via MCP
✓ Registering with BOSS network

✅ BOSS is ready!

Hi! I'm BOSS, your Business-Orchestrated Software System.
I'm here to help you build amazing software.

What would you like to build today?
```

#### Step 3: Business Conversation

```
You: A task management app for remote teams

BOSS: Excellent! Let me understand your vision better.

1. Who are the primary users of this app?

You: Remote team leads and their team members

BOSS: Got it. What's the main problem they're facing today?

You: Existing tools are too complex and don't integrate with our workflow

BOSS: I see. What specific workflows do you want to support?

You: Daily standups, sprint planning, task assignment, progress tracking

BOSS: Perfect! Based on our tech stack policy, I'll use:
      - Next.js 15 for the frontend
      - TypeScript for type safety
      - Tailwind for styling
      - Prisma + PostgreSQL for data
      - Vitest for testing

      Sound good?

You: Yes!

BOSS: Great! Let me create a PRD and break this down into user stories.
      Spawning clarifier worker...

      ⏳ Worker: Clarifying requirements... (30s)
      ✅ Worker: Clarification complete

      ⏳ Worker: Writing specification... (45s)
      ✅ Worker: Specification complete

      ⏳ Worker: Creating implementation plan... (60s)
      ✅ Worker: Plan complete

      📋 I've created a plan with 6 user stories:

      1. User Authentication (Login, Signup, Password Reset)
      2. Team Management (Create teams, invite members)
      3. Task Management (Create, assign, update tasks)
      4. Daily Standups (Post updates, view team updates)
      5. Sprint Planning (Create sprints, plan tasks)
      6. Progress Tracking (Dashboard, charts, reports)

      I've also created (following Spec-Kit):
      - Constitution: .specify/memory/constitution.md
      - Specification: .specify/specs/001-task-management/spec.md
      - Implementation Plan: .specify/specs/001-task-management/plan.md
      - Data Model: .specify/specs/001-task-management/data-model.md
      - API Contracts: .specify/specs/001-task-management/contracts/

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      🚦 GATE 1: Specification Approval Required

      I've created a PR with the complete specification:
      👉 https://github.com/user/my-app/pull/1

      You can review:
      - spec.md: User stories with Given/When/Then scenarios
      - plan.md: Technical approach with tech stack
      - data-model.md: Database schema
      - contracts/: OpenAPI specs

      Please review and approve when ready!
```

#### Step 4: You Review the Plan

You review the PR on GitHub and approve it via PR review.

#### Step 5: BOSS Continues

```
BOSS: 🎉 Planning approved! Let me continue.

      ⏳ Worker: Creating architecture... (90s)
      ✅ Worker: Architecture complete

      ⏳ Worker: Reviewing architecture... (30s)
      ✅ Worker: Auto-gate PASSED

      🔐 Analyzing integration requirements...
      ⚠️  Stripe payment integration detected
      ⚠️  SendGrid email integration detected

      📋 Created secret-requirements.md
      📋 Created human tasks for secret setup:
          - HT-001: Configure Stripe API secrets
          - HT-002: Configure SendGrid API key

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      🔐 PREREQUISITE: Secret Setup Required

      Before implementation can begin, please configure:

      1. Stripe Test API Keys
         - Reference: op://glx/stripe/test-secret-key
         - Instructions: .specify/specs/001-task-mgmt/secret-requirements.md

      2. SendGrid API Key
         - Reference: op://glx/sendgrid/api-key
         - Instructions: .specify/specs/001-task-mgmt/secret-requirements.md

      GitHub Issues created for tracking:
      👉 Issue #2: Configure Stripe API secrets
      👉 Issue #3: Configure SendGrid API key

      Once complete, close the GitHub issues and I'll proceed!

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You: [Completes secret setup and closes GitHub issues]

BOSS: ✅ Secret setup confirmed!

      Verifying secrets...
      ✅ STRIPE_SECRET_KEY configured
      ✅ STRIPE_WEBHOOK_SECRET configured
      ✅ SENDGRID_API_KEY configured

      ⏳ Worker: Breaking down into tasks... (60s)
      ✅ Worker: Task breakdown complete

      📋 I've created tasks.md with 24 tasks across 6 user stories:
      - Phase 1: Setup [P] (5 tasks - all parallel)
      - Phase 2: Foundation (4 tasks - sequential)
      - Phase 3-7: User Stories (15 tasks with [P] markers)

      Task format: [T001] [P] [US1] Description with file paths

      Checking dependencies... ✅ No blocking dependencies

      Launching 5 parallel workers (based on [P] markers):

      🔨 Worker 1 (env-abc123) - Fullstack: User Authentication
         Secrets: GITHUB_TOKEN, DATABASE_URL
         Branch: container-use/env-abc123

      🔨 Worker 2 (env-def456) - Fullstack: Team Management
         Secrets: GITHUB_TOKEN, DATABASE_URL
         Branch: container-use/env-def456

      🔨 Worker 3 (env-ghi789) - Backend: Task Management API
         Secrets: GITHUB_TOKEN, DATABASE_URL
         Branch: container-use/env-ghi789

      🔨 Worker 4 (env-jkl012) - Frontend: Task Management UI
         Secrets: GITHUB_TOKEN, VERCEL_TOKEN
         Branch: container-use/env-jkl012

      🔨 Worker 5 (env-mno345) - Fullstack: Daily Standups
         Secrets: GITHUB_TOKEN, DATABASE_URL, SENDGRID_API_KEY
         Branch: container-use/env-mno345

      ⏳ Workers in progress...

      You can monitor progress:
      $ boss status
      $ boss logs env-abc123
      $ container-use log env-abc123  # Direct container-use access
```

#### Step 6: Implementation

Workers implement in parallel. BOSS monitors and enforces quality:

```
[Worker 1] ✅ Implemented auth API
[Worker 1] ✅ Implemented auth UI
[Worker 1] ✅ All tests passing (coverage: 89%)
[Worker 1] ✅ Quality gate PASSED
[Worker 1] ⏳ Creating PR...

[Worker 2] ✅ Implemented team API
[Worker 2] ⚠️  Test coverage: 76% (required: 80%)
[Worker 2] ⏳ Adding more tests...
[Worker 2] ✅ Test coverage: 84%
[Worker 2] ✅ Quality gate PASSED
[Worker 2] ⏳ Creating PR...

...
```

#### Step 7: Consolidation

```
BOSS: ✅ All 5 workers completed!

      ⏳ Worker: Consolidating branches... (90s)
      ✅ Worker: Consolidation complete

      ⏳ Running integration tests... (120s)
      ✅ All integration tests passing

      ⏳ Creating final Spec-Kit artifacts...
      ✅ Created quickstart.md (setup & running instructions)
      ✅ Created checklist.md (quality validation)

      📊 Summary:
      - 6 user stories implemented
      - 24 tasks completed
      - 147 tests written (all passing)
      - Coverage: 87%
      - Mutation score: 83%
      - All Spec-Kit artifacts complete

      Created PRs:
      1. User Authentication - PR #2
      2. Team Management - PR #3
      3. Task Management - PR #4
      4. Daily Standups - PR #5
      5. Sprint Planning - PR #6

      Main PR with all features:
      👉 PR #7: Complete Task Management App

      Preview deployment:
      👉 https://my-app-preview-pr7.vercel.app

      Spec-Kit artifacts included:
      📄 quickstart.md - How to run the app
      ✅ checklist.md - Quality validation checklist
      📋 All tests, coverage, and mutation reports

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      🚦 GATE 2: Code Review Required

      Please review PR #7:
      - Test the preview deployment
      - Review quickstart.md
      - Check checklist.md (all items ✅)
```

#### Step 8: You Review and Merge

```
You: Looks great! Merging PR #7

BOSS: 🎉 PR merged!

      ⏳ Deploying to production... (180s)
      ✅ Deployed successfully!

      Production URL:
      👉 https://my-app.vercel.app

      📈 Updated knowledge base with:
      - Constitution (project principles)
      - All Spec-Kit artifacts (spec.md, plan.md, tasks.md)
      - Data models and API contracts
      - Code patterns and implementations
      - Test patterns (TDD cycles)
      - Architecture decisions

      Other BOSSES can now learn from this project!
      Future projects can query similar patterns and reuse solutions.

      🎊 Project complete! Anything else you'd like to add?
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           MULTIPLE BOSS-CONFIGURED PROJECTS                 │
│           (Claude Code/Cursor instances)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Project 1   │  │  Project 2   │  │  Project 3   │     │
│  │ (auth-svc)   │  │ (dashboard)  │  │ (api-gw)     │     │
│  │              │  │              │  │              │     │
│  │ Claude Code  │  │ Claude Code  │  │ Claude Code  │     │
│  │ + BOSS cfg   │  │ + BOSS cfg   │  │ + BOSS cfg   │     │
│  │ + MCPs       │  │ + MCPs       │  │ + MCPs       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
└───────────────────────────┼──────────────────────────────────┘
                            │
            ┌───────────────┼───────────────────┐
            │               │                   │
            ▼               ▼                   ▼
  ┌──────────────────┐             ┌──────────────┐
  │ Local Knowledge  │             │   GitHub     │
  │     Base         │             │   (Cloud)    │
  ├──────────────────┤             └──────────────┘
  │ PostgreSQL (🐳)  │                  │
  │ Qdrant (🐳)      │             Project boards
  │ HF TEI (🐳)      │             Issues & PRs
  └──────────────────┘
   ↑ Local embeddings
   (all Docker containers)
```

### BOSS Components

**BOSS = Claude Code/Cursor + Skills + MCP Servers**

```
Claude Code/Cursor (configured as BOSS)
├── BOSS Skills (loaded capabilities)
│   ├── Spec-Kit workflow orchestration (8 phases)
│   ├── Quality gate enforcement logic
│   ├── Task breakdown & parallelization
│   ├── Worker prompt generation
│   └── State management & resume capability
│
└── MCP Server Connections (all local)
    │
    ├── Container-Use MCP
    │   ├── Environment creation/deletion
    │   ├── Worker spawn & management
    │   ├── Command execution in containers
    │   ├── Log retrieval & monitoring
    │   └── Branch merge operations
    │
    ├── Knowledge Base MCP (Node.js server)
    │   ├── PostgreSQL client (structured data)
    │   ├── Qdrant client (vector search)
    │   ├── HuggingFace TEI client (embeddings)
    │   ├── Context assembly (gatekeeper pattern)
    │   └── Cross-project search
    │
    └── GitHub MCP
        ├── PR creation & management
        ├── Issue creation & tracking (for human tasks)
        ├── Project board automation
        ├── Branch operations
        ├── Status checks & approval workflows
        ├── Roadmap queries via Projects API
        └── Deployment triggers

**1Password CLI (Not MCP):**
    - Humans create secrets when BOSS requests via GitHub
    - Secrets injected into container-use workers
    - Workers run "dangerously" (full permissions inside isolated containers)
    - BOSS controls egress rules (network restrictions per container)
```

**No standalone BOSS application. It's Claude Code/Cursor configured with above components.**

### Worker Container

```
container-use Environment
├── Base Image: node:22-slim
├── Git: Isolated branch
├── Claude Code: Pre-configured
├── Prompt: Role-specific
├── Skills: Based on worker type
├── Commands: Restricted set
├── Secrets: From 1Password (minimal)
└── Timeout: 60 minutes
```

### Data Model

#### PostgreSQL Schema

```yaml
organizations:
  - id
  - name
  - settings

projects:
  - id
  - organization_id
  - name
  - template
  - quality_preset
  - tech_stack_policy
  - boss_id

bosses:
  - id
  - project_id
  - status
  - config
  - state

workflows:
  - id
  - boss_id
  - status
  - current_phase
  - state_snapshot

workers:
  - id
  - workflow_id
  - role
  - task_id
  - status
  - branch
  - container_id

artifacts:
  - id
  - project_id
  - type  # prd, spec, plan, task, adr, contract
  - path
  - content
  - embedding_id

dependencies:
  - id
  - from_project_id
  - to_project_id
  - type  # api, library, data, deployment
  - status
```

#### Qdrant Collections

```yaml
specs:
  - vector: [embedding]
  - metadata:
      project_id
      type
      path
      created_at

patterns:
  - vector: [embedding]
  - metadata:
      pattern_type  # component, api, test, deployment
      project_id
      language
      framework

decisions:
  - vector: [embedding]
  - metadata:
      adr_id
      project_id
      decision_type
      status
```

---

## CLI & Commands

### Bootstrap CLI Commands

```bash
# Bootstrap new project
boss bootstrap [options]

Options:
  --template <name>       Template to use (default: interactive)
  --quality <preset>      Quality preset (startup|production|enterprise)
  --name <name>           Project name
  --org <org>             Organization name
  --github-repo <repo>    GitHub repository
  --github-org <org>      GitHub organization

# Examples:
boss bootstrap
boss bootstrap --template nextjs-app-turbo --quality production
boss bootstrap --template blank --quality startup --name my-api

# Start BOSS controller
boss start [options]

Options:
  --resume <run-id>       Resume previous workflow
  --debug                 Enable debug logging

# Check BOSS status
boss status

# View worker logs
boss logs <worker-id>

# List all workers
boss workers

# Kill worker
boss kill <worker-id>

# Pause workflow
boss pause

# Resume workflow
boss resume [run-id]

# View configuration
boss config

# Edit configuration
boss config edit

# View roadmap
boss roadmap

# View dependencies
boss deps

# Query knowledge base
boss query "<search-query>"

# List templates
boss templates

# Create custom template
boss template create <name>

# Version
boss version
```

---

## Configuration & Customization

### Custom Worker Prompts

You can customize worker prompts in `.boss/workers/*/prompt.md`:

```markdown
# Developer (Frontend) Worker

You are a frontend developer specialized in React and Next.js.

## Your Role

- Implement frontend features following the specification
- Write tests BEFORE implementation (TDD)
- Use TypeScript strictly
- Follow component patterns from the knowledge base

## Available Skills

- React components
- Next.js App Router
- Tailwind CSS
- Vitest testing
- TypeScript

## Quality Standards

- Test coverage: ≥80%
- Mutation score: ≥80%
- No console.logs in production
- Accessibility (WCAG 2.1 AA)

## Commands Available

- implement <feature>
- test <feature>
- document <component>

## Knowledge Base Access

You have access to:
- Component patterns from previous projects
- Design system guidelines
- Accessibility patterns

## Output Format

1. Write failing tests first
2. Implement to make tests pass
3. Refactor if needed
4. Document in Storybook
5. Create PR with preview
```

### Custom Quality Gates

You can add custom quality gates in `.boss/quality-gates/`:

```yaml
# custom-security-gate.yaml
name: Security Audit
type: automated
phase: implementation

checks:
  - name: Dependency vulnerabilities
    command: pnpm audit
    fail_on: high

  - name: Secret detection
    command: gitleaks detect
    fail_on: any

  - name: OWASP checks
    command: npm run security:owasp
    fail_on: high

  - name: License compliance
    command: license-checker
    allowed_licenses:
      - MIT
      - Apache-2.0
      - BSD-3-Clause
```

### Custom Commands

Add custom commands in `.boss/commands/`:

```typescript
// .boss/commands/deploy-preview.ts

import { Command } from '@glxmart/boss-sdk';

export default class DeployPreviewCommand extends Command {
  name = 'deploy:preview';
  description = 'Deploy preview environment';

  async execute() {
    const branch = await this.getCurrentBranch();

    // Deploy to Vercel
    const deployment = await this.vercel.deploy({
      branch,
      env: 'preview'
    });

    // Comment on PR
    await this.github.commentOnPR({
      message: `Preview deployed: ${deployment.url}`
    });

    return deployment.url;
  }
}
```

---

## Advanced Features

### Cross-BOSS Coordination Example

```
BOSS 1 (Auth Service):
  Working on: OAuth implementation
  Status: 60% complete

BOSS 2 (Dashboard):
  Planning: OAuth login integration

  ⚠️  Detected: BOSS 1 is implementing OAuth

BOSS 2 to User:
  "Hey! I noticed BOSS 1 is working on OAuth for the auth service,
   which is exactly what I need for the dashboard OAuth login.

   Current status: 60% complete

   Should I:
   A) Wait for BOSS 1 to finish (recommended)
   B) Implement with mock OAuth for now
   C) Ask BOSS 1 to prioritize the endpoints I need

   If you choose C, I can coordinate with BOSS 1 to ensure
   my required endpoints are implemented first."

You: Option C

BOSS 2:
  "Great! Let me coordinate with BOSS 1..."

  [To BOSS 1] "Hey BOSS 1! I need these OAuth endpoints for
               the dashboard:
               - POST /oauth/authorize
               - POST /oauth/token

               Can you prioritize these?"

BOSS 1:
  [To BOSS 2] "Acknowledged! I'll implement those first."

  [To User] "FYI: BOSS 2 needs OAuth endpoints for the dashboard.
             I've reprioritized to implement those first."
```

### Knowledge Base Query Example

```
BOSS 3 (New Project):
  "I need to implement user authentication..."

  Query knowledge base: "user authentication patterns"

  Results:
  - Auth Service (BOSS 1): Complete OAuth implementation
  - Dashboard (BOSS 2): OAuth client integration
  - API Gateway: JWT validation middleware

BOSS 3 to User:
  "I found existing authentication patterns in your org!

   BOSS 1 already implemented a complete OAuth service.

   Should I:
   A) Use BOSS 1's auth service (recommended)
   B) Implement new auth system

   If A, I'll integrate with the existing OAuth API
   and follow the same patterns BOSS 1 established."
```

### Dependency Management Example

```
You: "BOSS 3, implement the analytics dashboard"

BOSS 3:
  "Analyzing requirements...

   Dependencies detected:
   - Needs: User data from Auth Service (BOSS 1)
   - Needs: Task data from Task Management API (BOSS 2)

   Checking status:
   ✅ BOSS 1: Auth Service is deployed
   ⚠️  BOSS 2: Task API is in progress

   I can:
   A) Wait for BOSS 2 to complete Task API
   B) Start with user analytics only
   C) Implement with mock task data for now

   What would you prefer?"

You: Option A

BOSS 3:
  "Got it! I've added this to my roadmap.

   BOSS 2 will notify me when Task API is ready.

   In the meantime, should I work on anything else?"
```

---

## Design Principles & Success Metrics

### Key Design Principles

| Principle | Description |
|-----------|-------------|
| **1. Local Controller, Remote Workers** | BOSS runs locally (your machine), Workers run in containers (isolated, observable). Cannot have container-use spawn container-use (architectural constraint). |
| **2. Bootstrap Once, Evolve Forever** | Bootstrap creates perfect initial setup. Templates evolve in GitHub. Pull latest templates anytime. Customize everything. |
| **3. Opinionated About Tech, Flexible About Business** | Tech stack defined by policy. Business requirements drive features. Quality enforced, not suggested. |
| **4. Knowledge Compounds** | Every project teaches BOSS. Patterns emerge organically. Future projects benefit from past projects. Organizational intelligence grows. |
| **5. Human Governance, AI Execution** | Humans decide WHAT and approve QUALITY. AI figures out HOW and executes. Strategic gates, not constant interruptions. |
| **6. Cross-BOSS Coordination** | BOSSES see each other's work. Dependencies managed proactively. Duplicate work avoided. Optimal scheduling suggested. |

### Success Metrics

BOSS succeeds when:

| Metric | Target | Impact |
|--------|--------|--------|
| **Bootstrap time** | < 5 minutes | From empty folder to fully configured project |
| **Idea to PR** | < 4 hours | For typical CRUD apps |
| **Quality gate failures** | Zero | Workers produce production-ready code |
| **Test coverage** | 90%+ | Automatically achieved |
| **Duplicate work** | Zero | BOSSES coordinate effectively |
| **Knowledge compounds** | Yes | Each project makes future projects faster |
| **Consistent quality** | Yes | Same standards across all projects |
| **You stay strategic** | Yes | BOSS handles execution details |

---

## Getting Started

### Prerequisites

```bash
# Required
- Node.js 22+
- Docker Desktop
- Git
- Claude Code or Cursor

# Optional
- 1Password CLI (for secrets management)
```

### Installation

```bash
# Install BOSS CLI globally
npm install -g @glxmart/boss-cli

# Verify installation
boss version

# Login (connects to knowledge base)
boss login

# List available templates
boss templates
```

### First Project

```bash
# Bootstrap your first project
boss bootstrap --template nextjs-app-turbo --quality production

# Start BOSS
cd my-app
boss start

# Follow the interactive conversation
# BOSS will guide you through the entire process!
```

---

## Roadmap & Evolution

### Development Phases

| Phase | Status | Components |
|-------|--------|------------|
| **Phase 1: Core (MVP)** | ✅ | Bootstrap CLI, Template system, BOSS controller, Worker spawning, Basic quality gates, GitHub integration |
| **Phase 2: Intelligence** | 🚧 | Knowledge base (PostgreSQL + Qdrant), Voyage AI embeddings, Context assembly, Pattern recognition |
| **Phase 3: Coordination** | 📋 | BOSS network, Cross-BOSS messaging, Dependency graph, Roadmap sharing |
| **Phase 4: GitHub Integration** | 📋 | GitHub Projects automation, Human approval gates via PR reviews, Issue-based task tracking, Status updates via GitHub API |
| **Phase 5: Ecosystem** | 📋 | Template marketplace, Plugin system, Custom worker types, Community contributions |

### Ecosystem Growth

#### Bootstrap Template Ecosystem

```
GitHub: boss-framework/templates
├── official/
│   ├── nextjs-app-turbo/
│   ├── nextjs-app-basic/
│   ├── api-service-fastify/
│   ├── api-service-express/
│   ├── mobile-app-expo/
│   ├── cli-tool-typescript/
│   └── blank/
│
├── community/
│   ├── @user1/django-api/
│   ├── @user2/flutter-app/
│   ├── @user3/go-microservice/
│   └── @user4/rust-wasm/
│
└── enterprise/
    ├── @company1/internal-service/
    └── @company2/cloud-native-app/
```

**Anyone can contribute templates!**

#### BOSS Plugin System (Future)

```typescript
// .boss/plugins/custom-reviewer.ts

import { Plugin } from '@glxmart/boss-sdk';

export default class CustomReviewerPlugin extends Plugin {
  name = 'custom-reviewer';

  async beforeReview(code: Code) {
    // Custom pre-review logic
  }

  async review(code: Code) {
    // Custom review logic
    return {
      score: 95,
      issues: [],
      suggestions: ['Consider using React.memo here']
    };
  }

  async afterReview(result: ReviewResult) {
    // Custom post-review logic
  }
}
```

#### BOSS Marketplace (Future)

```
boss marketplace search "ai code review"
boss marketplace install @vendor/ai-reviewer
boss marketplace list
boss marketplace update @vendor/ai-reviewer
```

### Why BOSS Will Succeed

#### 1. Solves Real Pain

| Pain Point | Solution |
|------------|----------|
| Project setup takes hours | Now takes 5 minutes |
| Quality inconsistent | Now enforced automatically |
| AI forgets context | Now has organizational memory |
| Manual coordination | Now automated |

#### 2. Technical Innovation

- Bootstrap + orchestration in one system
- Cross-BOSS coordination (unique!)
- Knowledge compounds over time
- Container isolation for safety

#### 3. Developer Experience

- One command to bootstrap
- Conversational interface
- Strategic approvals only
- Full observability

#### 4. Extensibility

- Custom templates
- Custom workers
- Custom quality gates
- Plugin system

---

## Reference

### Technical Deep Dives

For detailed implementation information, see:

#### 📚 [BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md)

Complete phase-by-phase automation of GitHub's Spec-Kit:
- Constitution creation and governance
- All 8 phases with worker prompts
- Spec-Kit artifact specifications (spec.md, plan.md, tasks.md, etc.)
- Test-First methodology enforcement
- Parallelization with [P] markers
- Quality gate automation

#### 🔐 [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md)

Worker isolation and secret management with container-use:
- Container-use environment configurations
- 1Password integration (op:// references)
- Secret discovery by agents
- Worker lifecycle management
- Integration testing with real APIs
- Security best practices
- Troubleshooting guide

---

## Bottom Line

**BOSS** is a complete system for modern software development that combines three powerful technologies:

### Core Components

1. **Spec-Kit (GitHub)** - Executable specifications & constitutional governance
2. **Container-Use** - Isolated worker execution with secure secret management
3. **BOSS Orchestration** - Multi-agent coordination & workflow automation

### What BOSS Delivers

- **Bootstrap** - Set up new projects in 5 minutes with .specify/ + container-use configured
- **Orchestrate** - Run all 8 Spec-Kit phases with workers in isolated containers
- **Secure** - 1Password integration (op:// references), secrets never exposed to AI
- **Enforce** - Constitutional governance + quality gates (TDD, coverage ≥80%, mutation ≥80%)
- **Discover** - Agents automatically identify and document required API credentials
- **Test** - Integration tests run with real APIs (test mode) in isolated environments
- **Learn** - Build organizational knowledge that compounds across projects
- **Coordinate** - Multiple BOSSES work together intelligently
- **Parallelize** - Workers execute based on `[P]` markers in tasks.md
- **Observe** - Complete audit trail via container-use logs

From **"I have an idea"** to **"I have production-ready code with complete Spec-Kit documentation and passing integration tests"** - fully automated, fully secure, fully observable, fully under your control.

**Spec-Kit + Container-Use + BOSS = Secure, Autonomous, Spec-Driven Development at Scale** 🚀🔐

---

**Ready to build something amazing? Let's get started!**

```bash
npm install -g @glxmart/boss-cli
boss bootstrap
boss start
```
