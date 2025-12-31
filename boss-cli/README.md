# BOSS Bootstrap CLI

Command-line tool for scaffolding new BOSS projects with complete configuration.

## Installation

```bash
npm install -g @boss/cli
# or
pnpm add -g @boss/cli
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

