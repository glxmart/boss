# BOSS Documentation

Complete documentation for the Business-Orchestrated Software System (BOSS).

---

## 📖 Documentation Guide

### Getting Started

**New to BOSS?** Start here:

1. **[../README.md](../README.md)** - Project overview and quick start
2. **[BOSS-ENHANCED-VISION.md](./BOSS-ENHANCED-VISION.md)** - The big picture
3. **[BOSS-HOST-SETUP.md](./BOSS-HOST-SETUP.md)** - Set up your local machine

### Core Documentation

| Document | Purpose | Reading Time |
|----------|---------|--------------|
| **[BOSS-ENHANCED-VISION.md](./BOSS-ENHANCED-VISION.md)** | Complete system overview, architecture, and examples | 1 hour |
| **[BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md)** | Spec-driven development methodology (8 phases) | 1.5 hours |
| **[BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md)** | Worker isolation, security, and secret management | 1.5 hours |
| **[BOSS-GITHUB-INTEGRATION.md](./BOSS-GITHUB-INTEGRATION.md)** | GitHub workflows, PRs, and repository management | 45 min |

### Setup Guides

| Document | Purpose |
|----------|---------|
| **[BOSS-HOST-SETUP.md](./BOSS-HOST-SETUP.md)** | Complete host machine setup (Docker, 1Password, Container-Use, MCP servers) |
| **[DOCKER-SETUP.md](./DOCKER-SETUP.md)** | Local infrastructure setup (PostgreSQL, Qdrant, embeddings) |

---

## 🎯 Learning Path

### For New Users (4.5 hours total)

**Goal:** Understand BOSS from concept to implementation

1. **Quick Start** (30 min)
   - Read [../README.md](../README.md)
   - Understand what BOSS is and why it exists

2. **The Vision** (1 hour)
   - Read [BOSS-ENHANCED-VISION.md](./BOSS-ENHANCED-VISION.md)
   - Learn about architecture, workers, and coordination
   - See end-to-end examples

3. **Specification Methodology** (1.5 hours)
   - Read [BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md)
   - Understand the 8-phase workflow
   - Learn about constitutional governance
   - See worker prompts and artifacts

4. **Security & Execution** (1.5 hours)
   - Read [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md)
   - Learn about worker isolation
   - Understand secret management
   - See integration patterns

### For Implementers

**Goal:** Set up and run BOSS locally

1. **Host Setup**
   - Follow [BOSS-HOST-SETUP.md](./BOSS-HOST-SETUP.md)
   - Install all prerequisites
   - Configure MCP servers
   - Set up 1Password secrets

2. **Infrastructure Setup**
   - Follow [DOCKER-SETUP.md](./DOCKER-SETUP.md)
   - Start local services
   - Initialize databases
   - Verify everything works

3. **GitHub Integration**
   - Read [BOSS-GITHUB-INTEGRATION.md](./BOSS-GITHUB-INTEGRATION.md)
   - Configure GitHub MCP
   - Set up repository
   - Create first project

---

## 🏗️ Architecture Quick Reference

### What is BOSS?

**BOSS is NOT a standalone application.**

BOSS is **Claude Code or Cursor** configured to act as an orchestrator through:
- **MCP Servers** - Container-Use, GitHub, Knowledge Base
- **1Password CLI** - Secret management
- **BOSS Skills** - Orchestration capabilities
- **Worker Templates** - Container configurations
- **Local Infrastructure** - All services run locally (Docker)

### The 8-Phase Workflow

1. **Clarification** - Business requirements gathering
2. **Specification** - User stories and acceptance criteria
3. **Planning** - Technical design and task breakdown
4. **Secret Setup** - Human configures required integrations
5. **Implementation** - TDD with parallel workers
6. **Review** - Quality gates and validation
7. **Consolidation** - Merge and documentation
8. **Deployment** - Production release

### Worker Types

- **Clarifier** - Requirements gathering (conversational)
- **Spec-Writer** - Specification creation (spec.md)
- **Planner** - Architecture and task planning
- **Developer (Frontend)** - UI/UX implementation
- **Developer (Backend)** - API/database work
- **Integrator** - Third-party service integration
- **Tester** - Quality assurance and validation
- **Consolidator** - Merge and documentation

---

## 🔐 Security Model

### Secret Management

- **All secrets** stored in 1Password
- **All references** use `op://` format
- **AI models** never see actual values
- **Workers** access via environment variables
- **Agents discover** and document secret needs

### Worker Isolation

- **Each worker** runs in own Docker container
- **Each worker** has dedicated Git branch
- **Network restrictions** control egress
- **Complete audit trail** for all commands
- **Disposable environments** for easy retry

---

## 📊 Key Features

| Feature | Benefit |
|---------|---------|
| **5-minute bootstrap** | Complete project setup with all configs |
| **Spec-driven workflow** | Executable specifications, not documentation |
| **Secure execution** | Workers isolated, secrets from 1Password |
| **Agent discovery** | Workers identify secret needs automatically |
| **Parallel execution** | 5 workers simultaneously without conflicts |
| **Quality gates** | TDD, 80%+ coverage, mutation testing enforced |
| **Knowledge base** | Organizational memory compounds over time |
| **Human governance** | Approve at strategic gates, not micro-manage |

---

## 🚀 Quick Reference Commands

### Bootstrap a Project

```bash
boss bootstrap --template nextjs-app-turbo --quality production
```

### Start Local Infrastructure

```bash
docker-compose up -d
```

### Verify Setup

```bash
# Check Docker
docker ps

# Check 1Password CLI
op signin

# Check Container-Use
container-use config show

# Check Claude Code
claude auth status
```

### Worker Management

```bash
# List active workers
container-use list

# View worker logs
container-use log <env-id>

# Delete worker
container-use delete <env-id>
```

---

## 📚 External Resources

### Core Technologies

- [Spec-Kit](https://github.com/github/spec-kit) - Executable specifications
- [Container-Use](https://container-use.com) - Worker isolation
- [1Password CLI](https://developer.1password.com/docs/cli) - Secret management
- [Claude Code](https://claude.ai/claude-code) - AI orchestrator
- [Cursor](https://cursor.sh) - Alternative AI orchestrator

### Local Infrastructure

- [Qdrant](https://qdrant.tech) - Vector database (Docker)
- [PostgreSQL](https://postgresql.org) - Knowledge base (Docker)
- [HuggingFace TEI](https://huggingface.co/docs/text-embeddings-inference) - Embeddings (Docker)

### Project Management

- [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects) - Native project boards (cloud)

---

## 🎯 Document Quick Links

### By Topic

**Architecture & Design:**
- [BOSS-ENHANCED-VISION.md](./BOSS-ENHANCED-VISION.md) - Complete architecture
- [BOSS-SPEC-KIT-INTEGRATION.md](./BOSS-SPEC-KIT-INTEGRATION.md) - Workflow design

**Setup & Configuration:**
- [BOSS-HOST-SETUP.md](./BOSS-HOST-SETUP.md) - Host machine setup
- [DOCKER-SETUP.md](./DOCKER-SETUP.md) - Infrastructure setup

**Security & Execution:**
- [BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md) - Worker isolation

**Integration:**
- [BOSS-GITHUB-INTEGRATION.md](./BOSS-GITHUB-INTEGRATION.md) - GitHub workflows

---

## 🤝 Contributing

See the main [README.md](../README.md#contributing) for contribution guidelines.

---

## 💬 Support

- **GitHub Issues** - Report bugs, request features
- **Discussions** - Ask questions, share ideas
- **Wiki** - Community-contributed guides and tutorials

---

**Ready to get started?**

👉 Begin with [BOSS-HOST-SETUP.md](./BOSS-HOST-SETUP.md) to set up your local machine!
