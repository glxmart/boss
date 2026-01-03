# BOSS Host Setup & Requirements

Complete guide to setting up your local machine to run BOSS (Business-Orchestrated Software System).

> **📖 Documentation:** [Index](./README.md) | [Root README](../README.md) | [BOSS Vision](./BOSS-ENHANCED-VISION.md) | [Spec-Kit Integration](./BOSS-SPEC-KIT-INTEGRATION.md) | [Container-Use Integration](./BOSS-CONTAINER-USE-INTEGRATION.md) | [GitHub Integration](./BOSS-GITHUB-INTEGRATION.md) | [Docker Setup](./DOCKER-SETUP.md)

---

## Overview

**BOSS is Claude Code or Cursor configured with MCP servers and BOSS skills** - not a standalone application. This document covers everything you need to install on your local machine to transform your AI assistant into a BOSS orchestrator.

### What You're Setting Up

1. **Claude Code or Cursor** - Your AI assistant (becomes BOSS when configured)
2. **Local Infrastructure** - Docker containers (PostgreSQL, Qdrant, embeddings)
3. **MCP Servers** - Connections for BOSS to orchestrate (Container-Use, GitHub, Knowledge Base)
4. **Container-Use CLI** - Tool for spawning isolated worker environments
5. **1Password CLI** - Secret management (op CLI - humans create secrets when BOSS requests)
6. **BOSS Skills & Config** - Loaded into Claude Code/Cursor via bootstrap

### Architecture Recap

```
┌─────────────────────────────────────────────────────────┐
│              YOUR LOCAL MACHINE (Host)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │  Claude Code or Cursor                        │    │
│  │  (= BOSS when configured)                     │    │
│  │                                               │    │
│  │  • BOSS skills loaded                         │    │
│  │  • Connected to MCP servers below             │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
│  ┌──────────────┴────────────────────────────────┐    │
│  │  MCP Servers (all local)                      │    │
│  │  • Container-Use MCP                          │    │
│  │  • GitHub MCP                                 │    │
│  │  • Knowledge Base MCP                         │    │
│  │  • 1Password CLI (op) - manual secret setup   │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
│  ┌──────────────┴────────────────────────────────┐    │
│  │  Docker Daemon (local containers)             │    │
│  │  • postgres (knowledge base)                  │    │
│  │  • qdrant (vector DB)                         │    │
│  │  • text-embeddings-inference (local)          │    │
│  │  • worker containers (via container-use)      │    │
│  └──────────────┬────────────────────────────────┘    │
│                 │                                       │
└─────────────────┼───────────────────────────────────────┘
                  │
                  │ Container-Use spawns via MCP
                  │
      ┌───────────┼──────────┬──────────┐
      │           │          │          │
      ▼           ▼          ▼          ▼
  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
  │Worker1│  │Worker2│  │Worker3│  │Worker4│
  │cu/001 │  │cu/002 │  │cu/003 │  │cu/004 │
  │Claude │  │Claude │  │Claude │  │Claude │
  │+config│  │+config│  │+config│  │+config│
  └───────┘  └───────┘  └───────┘  └───────┘
```

---

## Prerequisites

### Required Software

| Software                      | Version | Purpose                              | Installation                                                                             |
| ----------------------------- | ------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Docker Desktop**            | Latest  | Container runtime for workers        | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)     |
| **Node.js**                   | 22 LTS  | Runtime for BOSS and workers         | [nodejs.org](https://nodejs.org)                                                         |
| **pnpm**                      | Latest  | Package manager                      | `npm install -g pnpm`                                                                    |
| **1Password CLI**             | 2.x     | Secret management                    | [1password.com/downloads/command-line](https://1password.com/downloads/command-line/)    |
| **Container-Use**             | Latest  | Worker isolation                     | [container-use.com](https://container-use.com)                                           |
| **Claude Code** or **Cursor** | Latest  | AI coding assistant (BOSS interface) | [claude.ai/claude-code](https://claude.ai/claude-code) or [cursor.sh](https://cursor.sh) |
| **Git**                       | 2.x+    | Version control                      | [git-scm.com](https://git-scm.com)                                                       |

### Optional but Recommended

| Software            | Purpose                              |
| ------------------- | ------------------------------------ |
| **GitHub CLI (gh)** | PR creation, repo management         |
| **PostgreSQL**      | Knowledge base (if running locally)  |
| **Qdrant**          | Vector database (if running locally) |

---

## Installation Steps

### 1. Install Docker Desktop

```bash
# macOS
brew install --cask docker

# Or download from:
# https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker ps

# Start Docker Desktop if not running
open -a Docker
```

**Post-Install:**

- Allocate at least 8GB RAM to Docker
- Enable "Use the WSL 2 based engine" (Windows)
- Go to Docker Desktop → Settings → Resources → Advanced
  - Memory: 8GB minimum (16GB recommended)
  - CPUs: 4 minimum (8 recommended)
  - Disk: 50GB minimum

### 2. Install Node.js 22 LTS

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version  # Should show v22.x.x
npm --version
```

### 3. Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Enable corepack (alternative)
corepack enable
corepack prepare pnpm@latest --activate

# Verify
pnpm --version
```

### 4. Install 1Password CLI

```bash
# macOS
brew install --cask 1password-cli

# Linux
curl -sSfO https://downloads.1password.com/linux/tar/stable/x86_64/1password-cli-latest.tar.gz
tar -xf 1password-cli-latest.tar.gz
sudo mv op /usr/local/bin/

# Windows
winget install 1Password.CLI

# Verify
op --version
```

**Configure 1Password CLI:**

```bash
# Sign in to your 1Password account
op signin

# Verify authentication
op whoami

# Enable biometric unlock (optional, recommended)
op signin --biometric
```

### 5. Install Container-Use

```bash
# macOS/Linux
curl -fsSL https://container-use.com/install.sh | bash

# Or using Homebrew
brew install container-use

# Windows
# Download from https://container-use.com/download

# Verify
container-use --version

# Initialize container-use
container-use init
```

### 6. Install Claude Code or Cursor

**Option A: Claude Code**

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Verify
claude --version

# Sign in
claude auth login
```

**Option B: Cursor**

```bash
# Download from https://cursor.sh
# Install the application

# Verify Cursor is running and authenticated
```

### 7. Install GitHub CLI (Optional)

```bash
# macOS
brew install gh

# Linux
type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# Windows
winget install GitHub.cli

# Verify
gh --version

# Authenticate
gh auth login
```

### 8. Start Local Infrastructure (Docker Compose)

**CRITICAL:** BOSS requires local services for knowledge base, vectors, embeddings, and project management.

```bash
# Navigate to BOSS repository (or your project using BOSS)
cd /path/to/boss

# Start all infrastructure services
docker-compose up -d

# Verify all services are running
docker-compose ps

# Expected output - all services should be "healthy" or "running":
# boss-postgres       Up (healthy)
# boss-qdrant         Up (healthy)
# boss-embeddings     Up (healthy)
```

**Services Started:**

| Service         | Port       | Purpose                                            |
| --------------- | ---------- | -------------------------------------------------- |
| PostgreSQL      | 5432       | Knowledge base (projects, artifacts, dependencies) |
| Qdrant          | 6333, 6334 | Vector database for embeddings                     |
| HuggingFace TEI | 8080       | Local embeddings (BAAI/bge-large-en-v1.5)          |

**First-Time Setup:**

```bash
# Wait for services to initialize (2-5 minutes)
# Check logs if needed:
docker-compose logs -f embeddings  # Model downloads ~1GB

# Initialize knowledge base (one-time)
docker-compose exec postgres psql -U boss -d boss_knowledge -f /docker-entrypoint-initdb.d/init.sql
```

**See [DOCKER-SETUP.md](./DOCKER-SETUP.md) for:**

- Complete setup guide
- Database initialization scripts
- Backup/restore procedures
- Troubleshooting
- Performance tuning

---

## 1Password Vault Setup

### Create BOSS Vault

```bash
# Create a dedicated vault for BOSS secrets
op vault create glx

# Verify
op vault list | grep glx
```

### Required Secrets Structure

Create the following structure in 1Password:

```
Vault: glx
├── claude-code
│   └── oauth-token
│
├── github
│   ├── token
│   └── app-private-key (optional)
│
├── anthropic
│   └── api-key
│
├── database
│   ├── connection-url
│   └── test-url
│
├── stripe (example integration)
│   ├── test-secret-key
│   ├── webhook-secret
│   └── publishable-key
│
├── sendgrid (example integration)
│   └── api-key
│
├── aws (example integration)
│   ├── access-key
│   └── secret-key
│
└── vercel (example deployment)
    └── token
```

---

## Secret Generation Guide

### 1. Claude Code OAuth Token

**Purpose:** Authenticate Claude Code workers in container-use environments

**How to Generate:**

```bash
# Option 1: Via Claude Code CLI
claude auth login
# Follow prompts, then extract token from config

# Token is stored in:
# macOS/Linux: ~/.config/claude-code/auth.json
# Windows: %APPDATA%\claude-code\auth.json

# Extract token
cat ~/.config/claude-code/auth.json | jq -r '.oauth_token'

# Example output: oauth_1234567890abcdef...
```

**Store in 1Password:**

```bash
# Create item in 1Password
op item create \
  --category=Login \
  --vault=glx \
  --title="claude-code" \
  --username="oauth-token" \
  password="oauth_1234567890abcdef..."

# Verify
op item get claude-code --vault glx --fields password
```

**Reference:** `op://glx/claude-code/oauth-token`

### 2. GitHub Personal Access Token

**Purpose:** Create PRs, manage repositories, push commits

**How to Generate:**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "BOSS Development"
4. Expiration: 90 days (or custom)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `delete_repo` (Delete repositories - optional)
   - ✅ `admin:org` (Full control of orgs - if needed)
6. Click "Generate token"
7. Copy token (starts with `ghp_`)

**Store in 1Password:**

```bash
op item create \
  --category=Login \
  --vault=glx \
  --title="github" \
  --username="token" \
  password="ghp_xxxxxxxxxxxxxxxxxxxx"
```

**Reference:** `op://glx/github/token`

### 3. Anthropic API Key (Optional)

**Purpose:** Direct API access (if not using Claude Code OAuth)

**How to Generate:**

1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name: "BOSS Development"
4. Copy key (starts with `sk-ant-`)

**Store in 1Password:**

```bash
op item create \
  --category=API \
  --vault=glx \
  --title="anthropic" \
  --username="api-key" \
  password="sk-ant-xxxxxxxxxxxxxxxxxxxx"
```

**Reference:** `op://glx/anthropic/api-key`

### 4. Database Connection URL

**Purpose:** PostgreSQL connection for knowledge base

**Format:**

```
postgresql://username:password@host:port/database
```

**For Local Development:**

```bash
# Start PostgreSQL with Docker
docker run -d \
  --name boss-postgres \
  -e POSTGRES_USER=boss \
  -e POSTGRES_PASSWORD=bosssecret \
  -e POSTGRES_DB=boss_dev \
  -p 5432:5432 \
  postgres:16

# Connection URL
postgresql://boss:bosssecret@localhost:5432/boss_dev
```

**Store in 1Password:**

```bash
op item create \
  --category=Database \
  --vault=glx \
  --title="database" \
  --username="connection-url" \
  password="postgresql://boss:bosssecret@localhost:5432/boss_dev"

# Also create test database URL
op item edit database \
  --vault=glx \
  test-url="postgresql://boss:bosssecret@localhost:5432/boss_test"
```

**References:**

- `op://glx/database/connection-url`
- `op://glx/database/test-url`

### 5. Integration Secrets (Examples)

#### Stripe (for payment integrations)

```bash
# Get from: https://dashboard.stripe.com/test/apikeys

op item create \
  --category=API \
  --vault=glx \
  --title="stripe" \
  test-secret-key="sk_test_xxxxxxxxxxxxxxxxxxxx" \
  webhook-secret="whsec_xxxxxxxxxxxxxxxxxxxx" \
  publishable-key="pk_test_xxxxxxxxxxxxxxxxxxxx"
```

**References:**

- `op://glx/stripe/test-secret-key`
- `op://glx/stripe/webhook-secret`
- `op://glx/stripe/publishable-key`

#### SendGrid (for email)

```bash
# Get from: https://app.sendgrid.com/settings/api_keys

op item create \
  --category=API \
  --vault=glx \
  --title="sendgrid" \
  api-key="SG.xxxxxxxxxxxxxxxxxxxx"
```

**Reference:** `op://glx/sendgrid/api-key`

#### AWS (for S3, etc.)

```bash
# Get from: AWS IAM → Users → Security credentials

op item create \
  --category=API \
  --vault=glx \
  --title="aws" \
  access-key="AKIA..." \
  secret-key="..."
```

**References:**

- `op://glx/aws/access-key`
- `op://glx/aws/secret-key`

#### Vercel (for deployments)

```bash
# Get from: https://vercel.com/account/tokens

op item create \
  --category=API \
  --vault=glx \
  --title="vercel" \
  token="xxxxxxxxxxxxxxxxxx"
```

**Reference:** `op://glx/vercel/token`

---

## Container-Use Configuration

### Default Environment Configuration

Create `.container-use/environment.json` in your project:

```json
{
  "version": "1.0",
  "description": "BOSS default container-use configuration with Claude Code agent support",

  "base_image": "node:22-slim",

  "setup_commands": [
    "apt-get update && apt-get install -y git curl jq ca-certificates gnupg",
    "npm install -g @anthropic-ai/claude-code",
    "corepack enable && corepack prepare pnpm@latest --activate",
    "git config --global commit.gpgsign false",
    "git config --global user.name 'BOSS Worker'",
    "git config --global user.email 'worker@boss.local'"
  ],

  "install_commands": ["pnpm install --frozen-lockfile"],

  "environment_variables": {
    "NODE_ENV": "development",
    "PNPM_HOME": "/root/.local/share/pnpm",
    "CONTAINER_USE_ENV": "true",
    "PATH": "/root/.local/share/pnpm:$PATH"
  },

  "secrets": [
    "CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token",
    "GITHUB_TOKEN=op://glx/github/token"
  ],

  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.voyageai.com",
      "api.anthropic.com",
      "claude.ai",
      "*.vercel.com",
      "*.railway.app"
    ]
  },

  "resources": {
    "memory": "4Gi",
    "cpu": "2"
  },

  "git": {
    "branch_prefix": "container-use",
    "auto_commit": true,
    "commit_on_file_write": true
  },

  "agent": {
    "description": "Default Claude Code worker agent configuration",
    "max_retries": 3,
    "timeout_minutes": 30,
    "quality_gates": ["pnpm typecheck", "pnpm lint", "pnpm test"]
  }
}
```

### Worker-Specific Configurations

#### Clarifier Worker (`.boss/workers/clarifier/container-config.json`)

```json
{
  "version": "1.0",
  "description": "Clarifier worker - gathers business requirements",

  "base_image": "node:22-slim",

  "setup_commands": [
    "apt-get update && apt-get install -y git curl jq",
    "npm install -g @anthropic-ai/claude-code",
    "git config --global commit.gpgsign false"
  ],

  "environment_variables": {
    "WORKER_ROLE": "clarifier",
    "NODE_ENV": "development"
  },

  "secrets": ["CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token"],

  "network": {
    "allowed_hosts": ["api.anthropic.com", "claude.ai"]
  },

  "resources": {
    "memory": "2Gi",
    "cpu": "1"
  },

  "agent": {
    "description": "Clarifier agent - conversational requirements gathering",
    "timeout_minutes": 15
  }
}
```

#### Developer Worker - Backend (`.boss/workers/developer-backend/container-config.json`)

```json
{
  "version": "1.0",
  "description": "Backend developer worker with full integration access",

  "base_image": "node:22-slim",

  "setup_commands": [
    "apt-get update && apt-get install -y git curl jq ca-certificates postgresql-client",
    "npm install -g @anthropic-ai/claude-code",
    "corepack enable && corepack prepare pnpm@latest --activate",
    "git config --global commit.gpgsign false",
    "git config --global user.name 'BOSS Developer'",
    "git config --global user.email 'dev@boss.local'"
  ],

  "install_commands": ["pnpm install --frozen-lockfile", "pnpm prisma generate"],

  "environment_variables": {
    "WORKER_ROLE": "developer-backend",
    "NODE_ENV": "test",
    "CI": "true"
  },

  "secrets": [
    "CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token",
    "GITHUB_TOKEN=op://glx/github/token",
    "DATABASE_URL=op://glx/database/test-url",
    "STRIPE_SECRET_KEY=op://glx/stripe/test-secret-key",
    "STRIPE_WEBHOOK_SECRET=op://glx/stripe/webhook-secret",
    "SENDGRID_API_KEY=op://glx/sendgrid/api-key",
    "AWS_ACCESS_KEY_ID=op://glx/aws/access-key",
    "AWS_SECRET_ACCESS_KEY=op://glx/aws/secret-key"
  ],

  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.anthropic.com",
      "claude.ai",
      "api.stripe.com",
      "api.sendgrid.com",
      "*.amazonaws.com"
    ]
  },

  "resources": {
    "memory": "4Gi",
    "cpu": "2"
  },

  "git": {
    "branch_prefix": "container-use",
    "auto_commit": true,
    "commit_on_file_write": true
  },

  "agent": {
    "description": "Backend developer with TDD and integration testing",
    "max_retries": 3,
    "timeout_minutes": 45,
    "quality_gates": ["pnpm typecheck", "pnpm lint", "pnpm test", "pnpm test:integration"]
  }
}
```

#### Developer Worker - Frontend (`.boss/workers/developer-frontend/container-config.json`)

```json
{
  "version": "1.0",
  "description": "Frontend developer worker with deployment access",

  "base_image": "node:22-slim",

  "setup_commands": [
    "apt-get update && apt-get install -y git curl jq ca-certificates",
    "npm install -g @anthropic-ai/claude-code",
    "corepack enable && corepack prepare pnpm@latest --activate",
    "git config --global commit.gpgsign false"
  ],

  "install_commands": ["pnpm install --frozen-lockfile"],

  "environment_variables": {
    "WORKER_ROLE": "developer-frontend",
    "NODE_ENV": "test",
    "NEXT_PUBLIC_API_URL": "http://localhost:3000"
  },

  "secrets": [
    "CLAUDE_CODE_OAUTH_TOKEN=op://glx/claude-code/oauth-token",
    "GITHUB_TOKEN=op://glx/github/token",
    "VERCEL_TOKEN=op://glx/vercel/token"
  ],

  "network": {
    "allowed_hosts": [
      "registry.npmjs.org",
      "github.com",
      "api.anthropic.com",
      "claude.ai",
      "api.vercel.com",
      "*.vercel.com"
    ]
  },

  "resources": {
    "memory": "4Gi",
    "cpu": "2"
  },

  "agent": {
    "description": "Frontend developer with component testing",
    "timeout_minutes": 45,
    "quality_gates": ["pnpm typecheck", "pnpm lint", "pnpm test", "pnpm build"]
  }
}
```

---

## MCP Server Configuration

### Host MCP Servers

BOSS uses MCP (Model Context Protocol) servers running on the host machine. Configure them in Claude Code or Cursor.

#### Claude Code MCP Configuration

Create/edit `~/.config/claude-code/mcp-servers.json`:

```json
{
  "mcpServers": {
    "aios-specs": {
      "command": "npx",
      "args": ["@glxmart/mcp-specs"],
      "env": {
        "SPECS_PATH": "${workspaceFolder}/.specify",
        "TEMPLATES_PATH": "${workspaceFolder}/.specify/templates"
      }
    },

    "aios-workflows": {
      "command": "npx",
      "args": ["@glxmart/mcp-workflows"],
      "env": {
        "WORKFLOWS_PATH": "${workspaceFolder}/.boss/workflows",
        "STATE_PATH": "${workspaceFolder}/.boss/state"
      }
    },

    "boss-knowledge": {
      "command": "npx",
      "args": ["@glxmart/mcp-knowledge"],
      "env": {
        "DATABASE_URL": "postgresql://boss:bosssecret@localhost:5432/boss_knowledge",
        "QDRANT_URL": "http://localhost:6333",
        "EMBEDDING_SERVICE_URL": "http://localhost:8080",
        "EMBEDDING_MODEL": "BAAI/bge-large-en-v1.5",
        "EMBEDDING_DIMENSIONS": "1024"
      }
    },

    "container-use": {
      "command": "container-use",
      "args": ["mcp"],
      "env": {
        "CONTAINER_USE_HOME": "${HOME}/.container-use"
      }
    },

    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "op://glx/github/token"
      }
    }
  }
}
```

**Important: 1Password CLI for Secret Management**

1Password CLI (`op`) is used for secret management - there is **NO 1Password MCP server**.

**Secret Management Workflow:**

1. Install 1Password CLI (`op`)
2. BOSS identifies secret needs during planning phase
3. BOSS creates GitHub issue with detailed setup instructions
4. Human creates secrets in 1Password vault manually using `op` CLI
5. Human configures container-use with `op://` references
6. Container-use workers resolve secrets at runtime via `op` CLI
7. Workers run with full permissions inside isolated containers
8. BOSS controls egress rules (network restrictions) per worker

#### Cursor MCP Configuration

Create/edit `~/.cursor/mcp-servers.json` (same structure as above).

### MCP Server Summary

**MCP Servers (Connected to Claude Code/Cursor):**

- `boss-knowledge` → PostgreSQL + Qdrant + HuggingFace TEI (all local)
- `github` → GitHub API for repo operations & project management
- `container-use` → Container-Use CLI for worker spawning

**Secret Management (Not an MCP Server):**

- **1Password CLI** (`op`) - Manual secret resolution
- BOSS identifies secret needs → creates GitHub issue with instructions
- Humans create secrets in 1Password vault using `op` CLI
- Container-use configs reference secrets via `op://` format
- Workers resolve secrets at runtime via `op` CLI
- Example `op://` references:
  - `GITHUB_PERSONAL_ACCESS_TOKEN`: op://glx/github/token
  - `STRIPE_SECRET_KEY`: op://glx/stripe/test-secret-key
  - `DATABASE_URL`: op://glx/database/test-url

---

## Verification & Testing

### 1. Verify Docker

```bash
docker run hello-world
docker ps
```

### 2. Verify 1Password CLI

```bash
# Authenticate
op signin

# Test secret retrieval
op item get claude-code --vault glx --fields password

# Should output: oauth_1234567890abcdef...
```

### 3. Verify Container-Use

```bash
# Check configuration
container-use config show

# Test environment creation
container-use environment create --title "test-env"

# List environments
container-use list

# Delete test environment
container-use delete <env-id>
```

### 4. Verify Claude Code

```bash
# Check authentication
claude auth status

# Test with simple prompt
claude "What is 2 + 2?"
```

### 5. Verify Secret Resolution in Container-Use

```bash
# Set a test secret
container-use config secret set TEST_SECRET op://glx/github/token

# List secrets (values masked)
container-use config secret list

# Should show:
# TEST_SECRET: op://glx/github/token

# Create test environment
container-use environment create --title "secret-test"

# Run command to verify secret is available
container-use environment run \
  --env-id <env-id> \
  --command "echo SECRET_LENGTH=\${#TEST_SECRET}"

# Should output: SECRET_LENGTH=40 (or actual length of your GitHub token)

# Cleanup
container-use delete <env-id>
container-use config secret unset TEST_SECRET
```

### 6. Test Complete Workflow

Create a test project:

```bash
# Create test directory
mkdir boss-test
cd boss-test

# Initialize container-use
cp /path/to/default/environment.json .container-use/environment.json

# Edit environment.json to add secrets
# ... (see configurations above)

# Configure secrets
container-use config secret set CLAUDE_CODE_OAUTH_TOKEN op://glx/claude-code/oauth-token
container-use config secret set GITHUB_TOKEN op://glx/github/token

# Create worker environment
container-use environment create --title "test-worker"

# Verify secrets are injected
container-use environment run \
  --env-id <env-id> \
  --command "env | grep -E '(CLAUDE|GITHUB)'"

# Should show (values masked in logs):
# CLAUDE_CODE_OAUTH_TOKEN=oauth_***
# GITHUB_TOKEN=ghp_***

# Cleanup
container-use delete <env-id>
cd ..
rm -rf boss-test
```

---

## Troubleshooting

### Issue: 1Password CLI not authenticated

```bash
# Symptom
op item get claude-code
# Error: You are not currently signed in

# Solution
op signin
# Or with biometric
op signin --biometric
```

### Issue: Secret not found

```bash
# Symptom
container-use environment run --command "echo $STRIPE_SECRET_KEY"
# Output: (empty)

# Check secret configuration
container-use config secret list

# Verify secret exists in 1Password
op item get stripe --vault glx

# Re-configure secret
container-use config secret set STRIPE_SECRET_KEY op://glx/stripe/test-secret-key
```

### Issue: Docker not running

```bash
# Symptom
docker ps
# Error: Cannot connect to the Docker daemon

# Solution (macOS)
open -a Docker

# Solution (Linux)
sudo systemctl start docker

# Verify
docker ps
```

### Issue: Container-use network restrictions

```bash
# Symptom
# Worker cannot access npm registry or APIs

# Check network configuration in environment.json
cat .container-use/environment.json | jq '.network.allowed_hosts'

# Add required hosts
# Edit environment.json and add to allowed_hosts array

# Example:
"allowed_hosts": [
  "registry.npmjs.org",
  "github.com",
  "api.stripe.com"  # Add this
]
```

### Issue: Claude Code OAuth token expired

```bash
# Symptom
# Workers fail to authenticate

# Solution
claude auth login
# Follow prompts

# Extract new token
cat ~/.config/claude-code/auth.json | jq -r '.oauth_token'

# Update in 1Password
op item edit claude-code --vault glx oauth-token="new_token_here"
```

### Issue: Worker out of memory

```bash
# Symptom
# Worker crashes with OOM error

# Solution
# Edit worker-specific container-config.json
{
  "resources": {
    "memory": "8Gi",  # Increase from 4Gi
    "cpu": "4"        # Increase from 2
  }
}

# Also increase Docker Desktop memory allocation
# Docker Desktop → Settings → Resources → Advanced
# Memory: 16GB
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# ❌ BAD - Never do this
{
  "secrets": {
    "STRIPE_SECRET_KEY": "sk_test_51ABC123..."
  }
}

# ✅ GOOD - Always use op:// references
{
  "secrets": {
    "STRIPE_SECRET_KEY": "op://glx/stripe/test-secret-key"
  }
}
```

### 2. Use Separate Test/Production Secrets

```bash
# Test secrets
op://glx/stripe/test-secret-key     # sk_test_*
op://glx/database/test-url          # localhost

# Production secrets
op://glx/stripe/live-secret-key     # sk_live_*
op://glx/database/production-url    # production DB
```

### 3. Rotate Secrets Regularly

```bash
# Generate new GitHub token every 90 days
# Update in 1Password
op item edit github --vault glx token="ghp_new_token"

# Workers automatically get new value on next run
```

### 4. Use Least Privilege

```bash
# GitHub token scopes - only what's needed
# ✅ repo (for private repos only if needed)
# ✅ workflow
# ❌ admin:org (avoid unless necessary)

# AWS IAM - minimal permissions
# ✅ s3:PutObject on specific bucket
# ❌ s3:* on all resources
```

### 5. Audit Secret Access

```bash
# View 1Password audit log
op events list --vault glx

# Check which items were accessed
op events list --vault glx --item stripe

# Monitor container-use logs for secret usage
container-use log <env-id> | grep -i secret
# (actual values are stripped from logs)
```

---

## Quick Reference

### Essential Commands

```bash
# 1Password
op signin                           # Authenticate
op item get <item> --vault glx     # Get secret
op item list --vault glx            # List all secrets

# Container-Use
container-use config show                          # Show config
container-use config secret set KEY op://path      # Add secret
container-use config secret list                   # List secrets
container-use environment create --title "name"    # Create env
container-use list                                 # List envs
container-use log <env-id>                        # View logs
container-use delete <env-id>                     # Delete env

# Docker
docker ps                           # List containers
docker stats                        # Resource usage
docker system prune                 # Cleanup

# Claude Code
claude auth status                  # Check auth
claude auth login                   # Login
claude --version                    # Version

# GitHub CLI
gh auth status                      # Check auth
gh pr list                          # List PRs
gh pr create                        # Create PR
```

### Configuration Files Checklist

- [ ] `.container-use/environment.json` - Default worker config
- [ ] `.boss/workers/*/container-config.json` - Worker-specific configs
- [ ] `~/.config/claude-code/mcp-servers.json` - MCP server config
- [ ] 1Password vault `glx` - All secrets stored

### Secrets Checklist

- [ ] `op://glx/claude-code/oauth-token` - Claude Code authentication
- [ ] `op://glx/github/token` - GitHub access
- [ ] `op://glx/database/test-url` - Test database
- [ ] `op://glx/anthropic/api-key` - Anthropic API (optional)
- [ ] Integration secrets (Stripe, SendGrid, etc.) - As needed

---

## Next Steps

After completing this setup:

1. ✅ All prerequisites installed
2. ✅ 1Password configured with secrets
3. ✅ Container-use configured with workers
4. ✅ MCP servers configured
5. ✅ Verification tests passing

**You're ready to use BOSS!**

Proceed to:

- **[README.md](./README.md)** - Overview and quick start
- **[BOSS-ENHANCED-VISION.md](./BOSS-ENHANCED-VISION.md)** - Complete system vision
- **[BOSS-CONTAINER-USE-INTEGRATION.md](./BOSS-CONTAINER-USE-INTEGRATION.md)** - Deep dive on workers

---

## Support

If you encounter issues:

1. Check this troubleshooting section
2. Verify all prerequisites are installed
3. Test each component individually
4. Check logs: `container-use log <env-id>`
5. Consult detailed docs:
   - Container-Use: https://container-use.com/docs
   - 1Password CLI: https://developer.1password.com/docs/cli
   - Claude Code: https://claude.ai/claude-code/docs

---

**Host setup complete! Ready to orchestrate autonomous development with BOSS.** 🚀🔐
