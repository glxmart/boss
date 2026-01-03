# Conductor MCP - Documentation Index

**MCP middleware for BOSS worker orchestration**

## Quick Navigation

### Getting Started

- [README](README.md) - Overview and quick start
- [Installation Guide](docs/guides/INSTALLATION.md) - Complete setup instructions
- [BOSS Integration Guide](docs/guides/BOSS-GUIDE.md) - How BOSS uses Conductor

### Core Documentation

- [Architecture Overview](docs/architecture/OVERVIEW.md) - System architecture and design
- [Worker Configuration](docs/architecture/WORKER-CONFIG.md) - Worker config structure
- [Manifest Protocol](docs/architecture/MANIFEST-PROTOCOL.md) - Manifest communication protocol
- [Container-Use Capabilities](docs/CONTAINER_USE_CAPABILITIES.md) - Container-use MCP integration details
- [API Reference](docs/api/TOOLS.md) - MCP tools documentation
- [Error Handling](docs/api/ERRORS.md) - Error categories and handling

### Development

- [Contributing](docs/development/CONTRIBUTING.md) - Development guidelines
- [Changelog](CHANGELOG.md) - Version history and changes
- [Worker Configs Review](docs/development/WORKER-CONFIGS-REVIEW.md) - Config analysis

### Design Documents

- [Conductor in Workers](docs/design/CONDUCTOR-IN-WORKERS.md) - Schema-based manifest management
- [Worker Architecture Proposal](docs/design/WORKER-CONFIG-ARCHITECTURE.md) - Future improvements

---

## Documentation Structure

```
conductor-mcp/
├── README.md                  # Main entrypoint - overview and quick start
├── INDEX.md                   # This file - complete documentation index
├── CHANGELOG.md               # Version history
├── package.json
├── src/                       # Source code
├── worker-configs/            # Worker configurations
└── docs/
    ├── CONTAINER_USE_CAPABILITIES.md # Container-use MCP integration
    ├── guides/
    │   ├── INSTALLATION.md    # Installation and verification
    │   ├── BOSS-GUIDE.md      # BOSS integration guide
    │   └── AI-TOOL-COMPATIBILITY.md # AI tool compatibility
    ├── architecture/
    │   ├── OVERVIEW.md        # Architecture overview
    │   ├── WORKER-CONFIG.md   # Worker config structure
    │   └── MANIFEST-PROTOCOL.md # Manifest communication
    ├── api/
    │   ├── TOOLS.md           # MCP tools reference
    │   └── ERRORS.md          # Error handling
    ├── design/
    │   ├── CONDUCTOR-IN-WORKERS.md # Schema-based approach
    │   └── WORKER-CONFIG-ARCHITECTURE.md # Config improvements
    └── development/
        ├── CONTRIBUTING.md    # Development guide
        ├── SESSION-SUMMARY.md # Development session notes
        └── WORKER-CONFIGS-REVIEW.md # Config review
```

---

## By Role

### For Users/Integrators

1. Start with [README](README.md)
2. Follow [Installation Guide](docs/guides/INSTALLATION.md)
3. Read [BOSS Integration Guide](docs/guides/BOSS-GUIDE.md)
4. Reference [API Tools](docs/api/TOOLS.md) as needed

### For BOSS (Claude Code)

1. [BOSS Integration Guide](docs/guides/BOSS-GUIDE.md) - Complete usage guide
2. [API Tools](docs/api/TOOLS.md) - Tool reference
3. [Error Handling](docs/api/ERRORS.md) - Error categories

### For Contributors

1. [Architecture Overview](docs/architecture/OVERVIEW.md) - Understand the system
2. [Contributing Guide](docs/development/CONTRIBUTING.md) - Development workflow
3. [Worker Configs Review](docs/development/WORKER-CONFIGS-REVIEW.md) - Current state
4. [Design Documents](docs/design/) - Future direction

### For Architects

1. [Architecture Overview](docs/architecture/OVERVIEW.md) - System design
2. [Conductor in Workers](docs/design/CONDUCTOR-IN-WORKERS.md) - Schema-based approach
3. [Worker Config Architecture](docs/design/WORKER-CONFIG-ARCHITECTURE.md) - Config design
4. [Manifest Protocol](docs/architecture/MANIFEST-PROTOCOL.md) - Communication protocol

---

## Key Concepts

### What is Conductor MCP?

Conductor is an MCP middleware layer that simplifies BOSS's worker orchestration by providing a clean, unified API for spawning, configuring, and managing container-use workers.

**Before Conductor**: BOSS manually managed 6+ steps for each worker
**With Conductor**: BOSS makes 1 simple API call

### Core Features

- 8 unified MCP tools for 15 worker types
- Configuration-driven worker management
- Stateful worker tracking
- Schema-based manifest communication
- Rich error handling with retry guidance

### Architecture

```
BOSS → Conductor MCP → Container-Use MCP → Docker Workers
      (simple API)     (complex details)
```

---

## Latest Updates

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

### v0.3.0 - Schema-Based Manifest Management

Revolutionary change: Conductor controls manifest via JSON schema instead of hoping workers update it correctly.

### v0.2.0 - Critical Architecture Fixes

- Fixed CLAUDE.md file path (project-level context)
- Per-worker manifest files (parallel execution support)
- Worker configs moved to Conductor package

---

## Support

For questions or issues, see:

- [Architecture Overview](docs/architecture/OVERVIEW.md) - System design
- [BOSS Guide](docs/guides/BOSS-GUIDE.md) - Integration help
- [API Tools](docs/api/TOOLS.md) - Tool reference
- [Changelog](CHANGELOG.md) - Recent changes
