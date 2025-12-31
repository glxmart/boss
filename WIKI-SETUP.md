# GitHub Wiki Setup Guide

This guide explains how to set up the GitHub wiki for the BOSS repository using a hybrid approach.

## 📖 Strategy: Hybrid Documentation

**Single source of truth:** Documentation lives in `/docs` folder in the main repository
**User-friendly navigation:** Wiki provides organized entry points and guides

### Benefits

✅ **Version controlled** - Docs evolve with code
✅ **PR reviews** - Doc changes reviewed like code
✅ **Always in sync** - Wiki links to latest docs
✅ **Easy navigation** - Wiki provides structured learning paths
✅ **Community friendly** - Users can contribute via PRs

---

## 🚀 Quick Setup

### 1. Enable Wiki on GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Features**
3. Check **Wikis**

### 2. Clone the Wiki Repository

```bash
# Clone the wiki repo (separate from main repo)
git clone https://github.com/yourusername/boss.wiki.git

cd boss.wiki
```

### 3. Create Wiki Pages

Copy the templates below to create wiki pages.

---

## 📄 Wiki Page Templates

### Home.md (Wiki Home Page)

```markdown
# BOSS Documentation

**Business-Orchestrated Software System** - Transform ideas into production-ready code through autonomous, spec-driven development.

## 🚀 Quick Start

New to BOSS? Start here:

1. **[What is BOSS?](https://github.com/yourusername/boss#readme)** - Overview and key concepts
2. **[Host Setup](./Host-Setup)** - Set up your local machine
3. **[Your First Project](./Quick-Start)** - Bootstrap and build

## 📚 Documentation

### Core Concepts

- **[Architecture Overview](./Architecture)** - How BOSS works
- **[8-Phase Workflow](./Workflow)** - From idea to deployment
- **[Worker System](./Workers)** - Isolated execution model
- **[Security Model](./Security)** - Secrets and isolation

### Setup Guides

- **[Host Setup](./Host-Setup)** - Install prerequisites
- **[Docker Setup](./Docker-Setup)** - Local infrastructure
- **[GitHub Integration](./GitHub-Integration)** - Repository configuration
- **[Secret Management](./Secret-Management)** - 1Password setup

### Development

- **[Spec-Kit Methodology](./Spec-Kit)** - Specification-driven development
- **[Constitutional Governance](./Constitution)** - NON-NEGOTIABLE rules
- **[Quality Gates](./Quality-Gates)** - TDD, coverage, mutation testing
- **[Parallel Execution](./Parallel-Execution)** - Worker coordination

## 🔗 Full Documentation

📖 **[Complete Documentation](https://github.com/yourusername/boss/tree/main/docs)** - All guides in the main repository

---

**Ready to get started?** → [Host Setup](./Host-Setup)
```

### Quick-Start.md

```markdown
# Quick Start Guide

Get up and running with BOSS in under 30 minutes.

## Prerequisites

Before you begin, complete the [Host Setup](./Host-Setup) guide.

## 1. Bootstrap a Project

```bash
boss bootstrap --template nextjs-app-turbo --quality production
```

This creates:
- `.boss/` - Worker configurations
- `.specify/` - Spec-Kit templates
- `.container-use/` - Environment configs
- Complete project structure

## 2. Start Local Infrastructure

```bash
docker-compose up -d
```

Starts:
- PostgreSQL (knowledge base)
- Qdrant (vector DB)
- Plane (project management)
- Embeddings service

## 3. Open in Claude Code/Cursor

```bash
# Open project
claude code .

# Or with Cursor
cursor .
```

Your AI assistant is now configured as BOSS orchestrator!

## 4. Tell BOSS What to Build

```
You: "Build a task management app for remote teams"
```

BOSS will:
1. Ask clarifying questions (business, not tech)
2. Create specifications (spec.md)
3. Plan architecture (plan.md, data-model.md)
4. Identify secret needs (secret-requirements.md)
5. Wait for you to configure secrets
6. Spawn parallel workers
7. Implement with TDD
8. Create PR with tests & docs

## 5. Review & Deploy

Gate 1: Approve specifications
Gate 2: Review implementation PR
Merge → Deploy to production

---

**Next Steps:**
- [Understand the Workflow](./Workflow)
- [Learn About Workers](./Workers)
- [Configure Secrets](./Secret-Management)

📖 **[Full Documentation](https://github.com/yourusername/boss/tree/main/docs)**
```

### Host-Setup.md

```markdown
# Host Setup Guide

Complete guide to setting up your local machine for BOSS.

> 📖 **[Full Setup Documentation](https://github.com/yourusername/boss/blob/main/docs/BOSS-HOST-SETUP.md)**
>
> This page provides a quick reference. For detailed instructions, troubleshooting, and advanced configuration, see the full documentation.

## Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop) |
| Node.js | 22 LTS | [nodejs.org](https://nodejs.org) |
| pnpm | Latest | `npm install -g pnpm` |
| 1Password CLI | 2.x | [1password.com/downloads](https://1password.com/downloads/command-line/) |
| Container-Use | Latest | `npm install -g container-use` |
| Claude Code or Cursor | Latest | [claude.ai/claude-code](https://claude.ai/claude-code) or [cursor.sh](https://cursor.sh) |

## Quick Install (macOS)

```bash
# Homebrew packages
brew install --cask docker
brew install --cask 1password-cli
brew install node@22

# Global packages
npm install -g pnpm
npm install -g container-use
npm install -g @anthropic-ai/claude-code

# Authenticate
op signin
claude auth login
```

## Configuration Checklist

- [ ] Docker Desktop installed and running
- [ ] Docker allocated ≥8GB RAM
- [ ] Node.js 22 installed
- [ ] pnpm installed globally
- [ ] 1Password CLI authenticated
- [ ] Container-Use initialized
- [ ] Claude Code/Cursor authenticated
- [ ] GitHub CLI (optional) authenticated

## Next Steps

1. **[Docker Setup](./Docker-Setup)** - Start local infrastructure
2. **[Secret Management](./Secret-Management)** - Configure 1Password
3. **[Quick Start](./Quick-Start)** - Bootstrap your first project

---

📖 **[Full Host Setup Guide](https://github.com/yourusername/boss/blob/main/docs/BOSS-HOST-SETUP.md)** - Complete instructions with troubleshooting
```

### Architecture.md

```markdown
# BOSS Architecture

Understanding how BOSS orchestrates development.

> 📖 **[Full Architecture Documentation](https://github.com/yourusername/boss/blob/main/docs/BOSS-ENHANCED-VISION.md)**
>
> This page provides an overview. For comprehensive details, examples, and advanced features, see the full documentation.

## What is BOSS?

**BOSS is NOT a standalone application.**

BOSS is your **Claude Code or Cursor instance** configured to act as an orchestrator through:

- **MCP Servers** - Container-Use, Plane, GitHub, Knowledge Base
- **1Password CLI** - Secret management (op CLI)
- **BOSS Skills** - Loaded orchestration capabilities
- **Worker Templates** - Container configurations
- **Local Infrastructure** - All services run locally via Docker

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│         YOUR LOCAL MACHINE (Host)           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Claude Code or Cursor (BOSS)        │  │
│  │  • BOSS skills loaded                │  │
│  │  • Connected to MCP servers          │  │
│  │  • Orchestrates workflow             │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────┴───────────────────────┐  │
│  │  MCP Servers (local)                 │  │
│  │  • Container-Use → spawn workers     │  │
│  │  • Plane → project management        │  │
│  │  • GitHub → repository ops           │  │
│  │  • Knowledge → PostgreSQL + Qdrant   │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────┴───────────────────────┐  │
│  │  Docker (local containers)           │  │
│  │  • Worker containers (via CU)        │  │
│  │  • PostgreSQL, Qdrant, Plane         │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Key Components

### BOSS Controller (Claude Code/Cursor)
- Orchestrates the 8-phase workflow
- Spawns workers via Container-Use MCP
- Manages quality gates
- Coordinates parallel execution

### MCP Servers
- **Container-Use** - Worker creation and management
- **Knowledge Base** - Cross-project learning
- **Plane** - Project tracking
- **GitHub** - Repository operations

### Workers (Container-Use Environments)
- Isolated Docker containers
- Dedicated Git branches
- Secret injection via 1Password
- Complete audit trail

### Local Infrastructure (Docker)
- PostgreSQL - Knowledge base
- Qdrant - Vector search
- Plane - Project management
- Embeddings service - Local AI

---

**Learn More:**
- [8-Phase Workflow](./Workflow)
- [Worker System](./Workers)
- [Security Model](./Security)

📖 **[Full Architecture Guide](https://github.com/yourusername/boss/blob/main/docs/BOSS-ENHANCED-VISION.md)**
```

### Workflow.md

```markdown
# The 8-Phase Workflow

How BOSS transforms ideas into production code.

> 📖 **[Full Workflow Documentation](https://github.com/yourusername/boss/blob/main/docs/BOSS-SPEC-KIT-INTEGRATION.md)**
>
> This page provides an overview. For detailed worker prompts, artifacts, and examples, see the full documentation.

## Overview

BOSS follows an 8-phase spec-driven workflow based on GitHub's Spec-Kit methodology.

## The Phases

### 1. Clarification
**Worker:** Clarifier
**Output:** Business requirements

- Asks business questions (not technical)
- Clarifies workflows and user needs
- Identifies stakeholders

### 2. Specification
**Worker:** Spec-Writer
**Output:** `spec.md`

- Creates user stories (Given/When/Then)
- Defines acceptance criteria
- Gate: Human approval required

### 3. Planning
**Worker:** Planner
**Output:** `plan.md`, `data-model.md`, `contracts/`, `secret-requirements.md`

- Designs architecture
- Creates data models
- Identifies integrations
- Documents secret needs with setup instructions

### 4. Secret Setup
**Actor:** Human
**Output:** Configured 1Password secrets

- Follow instructions in `secret-requirements.md`
- Store secrets in 1Password
- Configure container-use
- Mark task complete in Plane

### 5. Implementation
**Workers:** Developers (Frontend, Backend, Integrator)
**Output:** Working code with tests

- TDD: Tests before implementation
- Parallel execution (up to 5 workers)
- Each worker in isolated container
- Secrets available via environment variables

### 6. Review
**Worker:** Tester
**Output:** Quality validation

- Run quality gates
- Coverage ≥80%
- Mutation score ≥80%
- Security scan
- If fail: iterate and retry

### 7. Consolidation
**Worker:** Consolidator
**Output:** `quickstart.md`, `checklist.md`, PR

- Merge all worker branches
- Create documentation
- Run integration tests with real APIs
- Create PR

### 8. Deployment
**Actor:** Human
**Output:** Production release

- Review PR (Gate 2)
- Merge to main
- Deploy to production
- Knowledge base updated

---

**Learn More:**
- [Worker Types](./Workers)
- [Quality Gates](./Quality-Gates)
- [Constitutional Governance](./Constitution)

📖 **[Full Workflow Guide](https://github.com/yourusername/boss/blob/main/docs/BOSS-SPEC-KIT-INTEGRATION.md)**
```

### Secret-Management.md

```markdown
# Secret Management

How BOSS handles secrets securely through 1Password.

> 📖 **[Full Secret Management Documentation](https://github.com/yourusername/boss/blob/main/docs/BOSS-CONTAINER-USE-INTEGRATION.md)**
>
> This page provides an overview. For complete setup guides, troubleshooting, and examples, see the full documentation.

## Security Principles

✅ **All secrets** in 1Password
✅ **All references** use `op://` format
✅ **AI models** never see actual values
✅ **Safe to commit** configs with op:// references
✅ **Easy rotation** - update in 1Password

## Agent Secret Discovery

**Revolutionary capability:** Agents identify and document secret needs.

When the Planner worker analyzes specifications, it:
1. Identifies required integrations (Stripe, SendGrid, etc.)
2. Creates `secret-requirements.md` with:
   - How to generate the secret
   - Where to store it (1Password path)
   - What scopes/permissions needed
   - Container-use configuration commands
3. Creates human task in Plane
4. Blocks implementation until secrets configured

**No more guessing what credentials are needed!**

## Setup Process

### 1. Create 1Password Vault

```bash
op vault create glx
```

### 2. Follow Agent Instructions

When BOSS creates `secret-requirements.md`, follow the detailed setup instructions.

Example:

```markdown
## Required Secret: Stripe Test API Key

**How to Generate:**
1. Log in to Stripe Dashboard
2. Navigate to Developers → API keys
3. Copy "Secret key" (starts with sk_test_)

**Store in 1Password:**
op item create --vault=glx --title="stripe" \
  test-secret-key="sk_test_xxxx"

**Configure Container-Use:**
container-use config secret set STRIPE_SECRET_KEY \
  op://glx/stripe/test-secret-key
```

### 3. Mark Task Complete

In Plane, mark the secret setup task complete. BOSS will continue with implementation.

## Common Secrets

| Integration | Secret | Reference |
|-------------|--------|-----------|
| GitHub | Personal Access Token | `op://glx/github/token` |
| Stripe | Test Secret Key | `op://glx/stripe/test-secret-key` |
| SendGrid | API Key | `op://glx/sendgrid/api-key` |
| Database | Connection URL | `op://glx/database/test-url` |
| Claude Code | OAuth Token | `op://glx/claude-code/oauth-token` |

## Verification

```bash
# Test secret retrieval
op item get stripe --vault glx

# Test in container-use
container-use config secret list
```

---

**Learn More:**
- [Worker Isolation](./Workers)
- [Security Model](./Security)

📖 **[Full Secret Management Guide](https://github.com/yourusername/boss/blob/main/docs/BOSS-CONTAINER-USE-INTEGRATION.md)**
```

---

## 🚀 Publishing to Wiki

### 1. Add Files to Wiki Repo

```bash
cd boss.wiki

# Copy templates above into files
# Home.md
# Quick-Start.md
# Host-Setup.md
# Architecture.md
# Workflow.md
# Secret-Management.md

# Commit and push
git add .
git commit -m "Add wiki pages with links to main documentation"
git push origin master
```

### 2. Update Links

Replace `yourusername/boss` with your actual GitHub username and repository name in all wiki pages.

### 3. Verify

1. Visit `https://github.com/yourusername/boss/wiki`
2. Check all links work
3. Verify navigation is clear

---

## 📝 Maintenance

### When to Update Wiki

**Update wiki pages when:**
- Documentation structure changes
- New major features added
- Setup process changes significantly

**Don't update wiki for:**
- Minor doc tweaks (those stay in main repo)
- Code changes (docs auto-update via links)
- Typos (fix in main repo docs)

### Update Process

1. Update docs in main repo (`/docs` folder)
2. Create PR, get reviewed
3. Merge to main
4. Wiki automatically reflects changes (links to latest)
5. Only update wiki if structure/navigation changed

---

## ✅ Benefits of This Approach

| Aspect | Benefit |
|--------|---------|
| **Single Source of Truth** | Docs live with code in `/docs` |
| **Version Control** | All changes tracked in git |
| **PR Reviews** | Doc changes reviewed like code |
| **Always Current** | Wiki links to latest docs |
| **User Friendly** | Wiki provides organized entry points |
| **Easy Contributions** | Contributors use familiar PR process |
| **Search** | GitHub search indexes both wiki and docs |

---

## 🎯 Next Steps

1. **Enable wiki** on your GitHub repository
2. **Clone wiki repo** locally
3. **Copy templates** from this guide
4. **Update links** with your repo details
5. **Push to wiki** repo
6. **Share!** Direct users to the wiki for navigation

---

**Questions?** See the [Full Documentation](https://github.com/yourusername/boss/tree/main/docs) or open an issue.
