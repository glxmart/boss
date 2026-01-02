# BOSS Bootstrap CLI

Command-line tool for scaffolding new BOSS projects with complete configuration.

## Installation

```bash
pnpm add -g @glxmart/boss-cli
```

## Usage

### Interactive Mode

```bash
boss bootstrap
```

### Command Line Options

```bash
boss bootstrap --template nextjs-app-turbo --quality production --name my-project
```

### Available Commands

- `boss bootstrap` - Bootstrap a new BOSS project
- `boss doctor` - Check prerequisites and system health
- `boss templates` - List available templates

## Templates

- `nextjs-app-turbo` - Next.js 15 + Turbo + Tailwind + Prisma + Vitest + shadcn/ui
- `api-service-fastify` - Fastify + TypeScript + Prisma + Vitest
- `blank` - Minimal TypeScript + Vitest setup

## Quality Presets

- `startup` - Fast iteration, minimal gates
- `production` - Balanced quality & speed
- `enterprise` - Maximum quality, comprehensive checks

## What Gets Created

- `.boss/` - BOSS orchestration configuration
- `.specify/` - Spec-Kit structure (templates, scripts, memory)
- `.container-use/` - Container-use environment configuration
- `.claude/` - Claude Code/Cursor rules and commands
- `CLAUDE.md` - Primary Claude Code configuration
- `start-boss.sh` - Launch script with MCP restrictions
- `.github/workflows/` - CI/CD pipelines
- `.husky/` - Git hooks
- `docker-compose.yml` - Local infrastructure
- Template-specific code structure

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
pnpm dev

# Run tests
pnpm test
```

## Local Testing

### Easiest Way: Integration Tests

The easiest way to test the CLI locally is using the existing integration tests:

```bash
# Run all integration tests
pnpm test:integration

# This will automatically:
# - Build the CLI
# - Create test projects
# - Verify the structure
# - Clean up afterwards
```

### Automated Testing Script

For manual testing with more control, use the `test-local.sh` script. Test projects are created in your home directory by default:

```bash
# Basic test (builds, creates test project in $HOME, verifies)
pnpm test:local
# or
./test-local.sh

# Test with specific template and quality
pnpm test:local -- --template nextjs-app-turbo --quality production

# Create test project in a different directory
pnpm test:local -- --dir ~/test-projects

# Link CLI globally and test
pnpm test:local -- --link

# Verify existing test project
pnpm test:local -- --verify-only

# Clean up test project
pnpm test:local -- --cleanup-only
```

See `pnpm test:local -- --help` or `./test-local.sh --help` for all options.

### Manual Testing

For manual testing without the script:

```bash
# Build the CLI
pnpm install && pnpm build

# Link globally (optional)
pnpm link --global

# Create a test project
boss bootstrap --template blank --quality startup --name test-project --non-interactive

# Or use tsx directly (no build needed)
pnpm exec tsx src/index.ts bootstrap --template blank --quality startup --name test-project --non-interactive
```

