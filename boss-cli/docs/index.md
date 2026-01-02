# BOSS CLI Documentation

Bootstrap CLI for scaffolding BOSS-enabled projects.

---

## Quick Links

- [../README.md](../README.md) - Package overview and usage
- [../../README.md](../../README.md) - Project root README
- [../../docs/README.md](../../docs/README.md) - Main documentation index

---

## Documentation

### Troubleshooting

- **[common-issues.md](./common-issues.md)** - Common problems and solutions
  - Build failures
  - Permission issues
  - Template errors
  - MCP configuration problems
  - Git hook issues

---

## Related Documentation

### Root Documentation

- [BOSS Vision](../../docs/BOSS-ENHANCED-VISION.md) - Complete system overview
- [Spec-Kit Integration](../../docs/BOSS-SPEC-KIT-INTEGRATION.md) - Specification workflow
- [Container-Use Integration](../../docs/BOSS-CONTAINER-USE-INTEGRATION.md) - Worker isolation
- [GitHub Integration](../../docs/BOSS-GITHUB-INTEGRATION.md) - Repository management
- [Host Setup](../../docs/BOSS-HOST-SETUP.md) - Local machine configuration
- [Docker Setup](../../docs/DOCKER-SETUP.md) - Infrastructure setup

### Conductor Documentation

- [Conductor MCP](../../conductor-mcp/INDEX.md) - Worker orchestration middleware
- [Conductor Installation](../../conductor-mcp/docs/guides/INSTALLATION.md) - Setup guide
- [Worker Architecture](../../conductor-mcp/docs/architecture/WORKER-CONFIG.md) - Worker configuration

---

## Development

### Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
pnpm dev

# Run tests
pnpm test
pnpm test:integration
pnpm test:local
```

### Testing

- **Integration Tests** - Full bootstrap flow testing
- **Local Testing Script** - `test-local.sh` for manual verification
- **Unit Tests** - Component-level testing

See [../README.md](../README.md#local-testing) for detailed testing instructions.

---

## Key Concepts

### What BOSS CLI Does

1. **Scaffolds Projects** - Creates complete project structure
2. **Configures MCP** - Sets up Container-Use, GitHub, Knowledge Base servers
3. **Generates Assets** - Creates .boss/, .specify/, .container-use/ folders
4. **Initializes Git** - Sets up repository with hooks and workflows
5. **Applies Quality Presets** - Configures startup/production/enterprise standards

### Templates Available

- **nextjs-app-turbo** - Next.js 15 + Turbo + Tailwind + Prisma + Vitest
- **api-service-fastify** - Fastify + TypeScript + Prisma + Vitest
- **blank** - Minimal TypeScript + Vitest setup

### Quality Presets

- **startup** - Fast iteration, minimal gates (coverage: 50%, mutation: 60%)
- **production** - Balanced (coverage: 80%, mutation: 80%)
- **enterprise** - Maximum quality (coverage: 90%, mutation: 90%)

---

## Architecture

### Files Generated

```
project/
├── .boss/                    # BOSS configuration
│   ├── workers/             # Worker-specific configs
│   └── worker-manifest-*.json
├── .specify/                # Spec-Kit structure
│   ├── memory/              # constitution.md
│   └── specs/               # Specifications
├── .container-use/          # Container-use config
├── .claude/                 # Claude Code config
│   ├── commands/            # BOSS commands
│   ├── rules/               # Workflow rules
│   └── skills/              # BOSS skills
├── CLAUDE.md                # Primary configuration
├── start-boss.sh            # MCP-restricted launcher
├── .github/workflows/       # CI/CD pipelines
├── .husky/                  # Git hooks
└── docker-compose.yml       # Local infrastructure
```

---

## Support

For issues or questions:

1. Check [common-issues.md](./common-issues.md)
2. Review main [README](../README.md)
3. See root [documentation](../../docs/README.md)
4. Open GitHub issue

---

**Ready to bootstrap a project?**

See the main [README](../README.md) for usage instructions!
