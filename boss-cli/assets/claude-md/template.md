# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

**Name**: {{config.name}}
**Template**: {{templateInfo.name}}
**Quality Preset**: {{qualityInfo.name}}
**Stack**: {{templateInfo.stack}}

## Development Commands

Standard development commands for this project:

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm typecheck    # Type check
```

## Quality Gates

**Coverage**: Minimum {{qualityInfo.gates.coverage}}%{{#if qualityInfo.gates.mutation}}
**Mutation Score**: Minimum {{qualityInfo.gates.mutation}}%{{/if}}

Pre-commit hooks enforce quality gates automatically. Ensure all checks pass before committing.

## BOSS Integration

This project uses BOSS (Business-Orchestrated Software System) workflow:

- **Constitutional Governance**: Immutable principles in `.specify/constitution.md`
- **Spec-Kit Integration**: Executable specifications drive development
- **Quality Automation**: Pre-commit hooks enforce quality gates
- **Worker Orchestration**: Conductor MCP manages isolated worker execution

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `.boss/` | BOSS configuration and worker manifests |
| `.specify/` | Spec-Kit specifications and constitution |
| `.claude/` | Claude Code commands and settings |
| `.container-use/` | Container-Use MCP configuration |

### Worker-Specific Instructions

Worker configurations are in `.boss/workers/` directories. Each worker type has its own configuration and instructions.

## Documentation

Additional BOSS documentation is available in the `docs/` directory:

- **[Conductor MCP](docs/conductor.md)** - How BOSS uses Conductor to orchestrate workers
- **[Workflow](docs/workflow.md)** - Branch management and workflow processes
- **[Workers](docs/workers.md)** - Available workers and their roles
- **[GitHub Operations](docs/github-operations.md)** - Repository management and PR creation
- **[Spec-Kit](docs/spec-kit.md)** - Specification-driven development commands
- **[Quality Standards](docs/quality-standards.md)** - Testing and quality requirements
- **[Initialization](docs/initialization.md)** - Initial project setup workflow

## Best Practices

### Testing

- Write tests before implementation (TDD)
- Use BDD style (describe/it blocks)
- Aim for meaningful test coverage, not just numbers

### Code Quality

- Run linting: `pnpm lint`
- Type-check: `pnpm typecheck`
- Fix issues before committing

### Git Workflow

- Use conventional commits (feat, fix, docs, etc.)
- Keep commits atomic and focused
- Pre-commit hooks will run quality checks

## Deployment

### Docker

Build and run containers:

```bash
# Build Docker image
docker build -t {{config.name}} .

# Or use docker-compose
docker-compose up
```

### Environment Variables

See `.env.example` for the complete list of environment variables required by this project.

## Troubleshooting

### Common Issues

- **Build failures**: Ensure dependencies are installed with `pnpm install`
- **Type errors**: Run `pnpm typecheck` and fix reported issues
- **Test failures**: Run `pnpm test` to see failing tests
- **Docker issues**: Ensure Docker Desktop is running

For additional help, check the template documentation or BOSS documentation in `docs/`.
