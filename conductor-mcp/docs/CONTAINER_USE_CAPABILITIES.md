# Container-Use Capabilities & Constraints

**Source:** https://container-use.com (Official Documentation)
**Date:** 2026-01-02
**Purpose:** Document verified capabilities and constraints of container-use for BOSS optimization

---

## Overview

This document captures findings from reviewing the official container-use documentation to determine what performance optimizations are feasible for BOSS worker orchestration.

## Official Capabilities

### ✅ Fully Supported Features

#### 1. Custom Base Images

**Documentation:** https://container-use.com/environment-configuration

```bash
# Set custom Docker image
container-use config base-image set custom-image:tag

# Get current base image
container-use config base-image get

# Reset to default (ubuntu:24.04)
container-use config base-image reset
```

**Configuration Storage:** `.container-use/environment.json`

**Best Practice:**

> "If you use custom base images with `latest` tags and update them frequently, consider using versioned tags (e.g., `myimage:v1.2.3`) for more predictable cache behavior."

**BOSS Application:** Pre-built `boss/worker-base:1.0.0` image with Node.js, pnpm, claude-code pre-installed.

---

#### 2. Setup Commands

**When:** Executes AFTER pulling base image, BEFORE copying project code

```bash
container-use config setup-command add "apt-get update && apt-get install -y python3"
container-use config setup-command list
container-use config setup-command remove "[command]"
container-use config setup-command clear
```

**Use Case:** System-level dependencies (apt packages, system configuration)

**BOSS Application:** Moved to Docker image build-time to eliminate runtime overhead.

---

#### 3. Install Commands

**When:** Executes AFTER copying project code

```bash
container-use config install-command add "pip install -r requirements.txt"
container-use config install-command list
container-use config install-command remove "[command]"
container-use config install-command clear
```

**Use Case:** Project dependencies (npm install, pip install, etc.)

**BOSS Application:** Moved global tools (pnpm, claude-code) to Docker image; project-specific installs remain in install commands.

---

#### 4. Environment Variables

```bash
container-use config env set NODE_ENV production
container-use config env list
container-use config env unset NODE_ENV
container-use config env clear
```

**Configuration:** Stored in `.container-use/environment.json`

**BOSS Application:** Base environment variables defined in `_base/container-config.json`.

---

#### 5. Environment Persistence & Resume

**Documentation:** https://container-use.com/environment-workflow

> "The agent will resume in the existing environment with all previous work intact when referencing an environment ID in new prompts."

**Commands:**

```bash
# List all environments
container-use list

# Continue in existing environment
container-use watch <env-id>  # Resume and monitor

# View environment status
container-use log <env-id>
```

**Use Cases:**

- Iterative development (add missing features)
- Bug fixes (resume where bug was introduced)
- Refinements (adjust styling/behavior)

**Performance Impact:** Eliminates full spawn time (180-360s) for follow-up tasks.

**BOSS Application:** Implement resume logic in conductor for iterative worker tasks.

---

#### 6. Configuration Layers & Import

**Two-Layer System:**

1. **Default Config:** `.container-use/environment.json` (project-wide baseline)
2. **Agent Adaptations:** Temporary modifications agents make during work

**Import Capability:**

```bash
# View agent's environment modifications
container-use config show <env-id>

# Import useful changes as new defaults
container-use config import <env-id>
```

**Important Note:**

> "Configuration changes only apply to **new environments**. Agent modifications remain in their environment until you import them."

**Use Case:** Self-improving system that learns from worker discoveries (e.g., better build caching, additional tools).

**BOSS Application:** Review successful worker configs, import beneficial optimizations.

---

#### 7. Environment Observation & Control

**Real-time Monitoring:**

```bash
# Watch agent activity
container-use watch <env-id>

# View commit history and commands
container-use log <env-id>
container-use log <env-id> --patch  # Include diffs

# See code changes
container-use diff <env-id>

# Access container terminal
container-use terminal <env-id>
```

**Recommendation:**

> "Most of the time, `diff` and `log` give you enough information to decide next steps without the overhead of checking out or entering containers."

**BOSS Application:** Use for debugging worker failures, observing progress.

---

#### 8. Work Integration

**Methods:**

```bash
# Merge with full commit history
container-use merge <env-id>
container-use merge <env-id> --delete  # Delete env after merge

# Apply as staged changes (custom commits)
container-use apply <env-id>
container-use apply <env-id> --delete

# Explore locally in IDE
container-use checkout <env-id>
```

**BOSS Application:** Automated merge after worker completion.

---

#### 9. Environment Deletion

```bash
# Delete single environment
container-use delete <env-id>

# Delete all environments
container-use delete --all
```

**Philosophy:**

> "Environments are **disposable by design**—if an agent encounters issues, deletion and restart often proves faster than attempting recovery."

**BOSS Application:** Clean up completed/failed workers to conserve resources.

---

#### 10. Secrets Management

**Documentation:** https://container-use.com/secrets-management

```bash
container-use config secret set API_KEY
container-use config secret list
container-use config secret unset API_KEY
container-use config secret clear
```

**BOSS Application:** 1Password CLI integration for secure secret access.

---

## Constraints & Limitations

### ❌ NOT Supported

#### 1. Container Pooling

**Finding:** No built-in warm pool or container reuse mechanism.

**Implication:** Cannot pre-warm containers for instant availability.

**Workaround:** Use custom base images to minimize startup time.

---

#### 2. Cross-Task Container Reuse

**Finding:** Environments are task-specific. While you can `resume` in an environment for iterative work on the same task, you cannot reuse a completed environment for a different task.

**Implication:** Each new worker spawn requires new environment creation.

**Workaround:**

- Use pre-built Docker images
- Leverage Docker layer caching
- Resume for iterative/related tasks only

---

#### 3. Image Pre-warming

**Finding:** No keep-alive mechanism to maintain running containers.

**Implication:** Cannot maintain ready-to-use containers waiting for tasks.

**Workaround:** Optimize Docker image size and startup time.

---

#### 4. Streaming During Setup

**Finding:** No documented streaming output during `setup_commands` or `install_commands`.

**Implication:** No real-time feedback during container initialization.

**Note:** Streaming IS supported during agent execution (after setup complete).

**Workaround:** Move slow operations to Docker build-time.

---

## Performance Optimization Strategy

Based on container-use capabilities:

### ✅ Feasible Optimizations

| Optimization                     | Method                                    | Expected Savings        |
| -------------------------------- | ----------------------------------------- | ----------------------- |
| **Pre-built Images**             | Custom `base_image` with all dependencies | 50-70s per spawn        |
| **Setup Command Optimization**   | Move to Docker build-time                 | 40s (apt-get)           |
| **Install Command Optimization** | Move globals to Docker build-time         | 30s (npm install -g)    |
| **Environment Resume**           | Use for iterative tasks                   | 180-360s for follow-ups |
| **Configuration Learning**       | Import successful worker configs          | Continuous improvement  |
| **Parallel Spawning**            | Orchestration-level (Promise.all)         | 240-360s for phases     |

### ❌ Infeasible Optimizations

| Optimization          | Why Not Possible            | Alternative                      |
| --------------------- | --------------------------- | -------------------------------- |
| Container Pooling     | Not a container-use feature | Pre-built images + layer caching |
| Persistent Workers    | Environments are ephemeral  | Resume for iterative work        |
| Pre-warmed Containers | No keep-alive mechanism     | Optimize Docker image            |

---

## Configuration Best Practices

### 1. Use Versioned Image Tags

❌ Bad:

```json
{
  "base_image": "boss/worker-base:latest"
}
```

✅ Good:

```json
{
  "base_image": "boss/worker-base:1.0.0"
}
```

**Reason:** Predictable cache behavior, reproducibility, rollback capability.

---

### 2. Layer Configuration Properly

**Project Defaults** (`.container-use/environment.json`):

```bash
container-use config base-image set boss/worker-base:1.0.0
container-use config env set NODE_ENV production
```

**Worker-Specific** (`container-config.json`):

```json
{
  "base_image": "boss/worker-base:1.0.0",
  "network": {
    "allowed_hosts": ["api.anthropic.com", "custom-api.com"]
  }
}
```

---

### 3. Minimize Setup Commands

❌ Bad (runtime):

```json
{
  "setup_commands": [
    "apt-get update",
    "apt-get install -y git curl build-essential",
    "npm install -g pnpm claude-code"
  ]
}
```

✅ Good (build-time):

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y git curl build-essential
RUN npm install -g pnpm claude-code
```

---

### 4. Use Environment Resume Strategically

**Good Use Cases:**

- Fixing bugs introduced by same worker
- Adding missing features to partial implementation
- Iterating on styling/behavior

**Bad Use Cases:**

- Completely different tasks
- Different worker types
- Tasks requiring clean state

---

## Testing Methodology

When implementing optimizations, measure these metrics:

1. **Container Startup Time** - From spawn to ready
2. **Setup Commands Duration** - Time in setup phase
3. **Install Commands Duration** - Time in install phase
4. **Total Spawn Time** - End-to-end worker creation
5. **Resume Time** - Time to resume existing environment

**Baseline (Current):**

- Container Startup: 60-90s
- Total Spawn: 180-360s

**Target (With Optimizations):**

- Container Startup: 5-10s
- Total Spawn: 60-90s
- Resume: <10s

---

## References

- **Official Docs:** https://container-use.com
- **Environment Config:** https://container-use.com/environment-configuration
- **Environment Workflow:** https://container-use.com/environment-workflow
- **CLI Reference:** https://container-use.com/cli-reference
- **Secrets Management:** https://container-use.com/secrets-management
- **BOSS Performance Analysis:** `/Users/joe/code-glx/boss/PERFORMANCE_ANALYSIS.md`
- **BOSS Optimization Plan:** `/Users/joe/code-glx/boss/OPTIMIZATION_PLAN.md`

---

## Revision History

| Date       | Version | Changes                                                      |
| ---------- | ------- | ------------------------------------------------------------ |
| 2026-01-02 | 1.0.0   | Initial documentation from official container-use.com review |
