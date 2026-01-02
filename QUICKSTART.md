# BOSS Quick Start

Get up and running with BOSS in 5 minutes.

## Prerequisites
- Node.js >= 18.0.0
- Docker Desktop running
- 1Password CLI (optional, for secret management)

## Installation

```bash
npm install -g @glxmart/boss-cli
```

Or with pnpm:
```bash
pnpm add -g @glxmart/boss-cli
```

## Bootstrap Your First Project

```bash
boss bootstrap my-project --template nextjs-app-turbo
cd my-project
```

## Start Development

```bash
# Start local infrastructure (PostgreSQL, Qdrant, Embeddings)
docker-compose up -d

# Open in Claude Code or Cursor
code .
```

## Verify Installation

```bash
# Check BOSS CLI version
boss --version

# Check Conductor MCP is available
npx @glxmart/conductor-mcp --help
```

## Next Steps

- Read the [full documentation](docs/README.md)
- Explore [BOSS Enhanced Vision](docs/BOSS-ENHANCED-VISION.md)
- Learn about [Spec-Kit Integration](docs/BOSS-SPEC-KIT-INTEGRATION.md)
- Join the [community discussions](https://github.com/glxmart/boss/discussions)

## Common Commands

```bash
# Bootstrap a new project
boss bootstrap <project-name> [options]

# List available templates
boss templates

# Run doctor diagnostics
boss doctor

# Get help
boss --help
```

## Troubleshooting

If you encounter issues:

1. **Docker not running**: Ensure Docker Desktop is started
2. **Permission errors**: Run with appropriate permissions or use `npx` prefix
3. **MCP not found**: Ensure `@glxmart/conductor-mcp` is installed

For more help, see:
- [Common Issues](boss-cli/docs/common-issues.md)
- [GitHub Issues](https://github.com/glxmart/boss/issues)
- [Discussions](https://github.com/glxmart/boss/discussions)
