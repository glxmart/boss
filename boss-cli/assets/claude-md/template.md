# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

**Name**: {{config.name}}
**Template**: {{templateInfo.name}}
**Quality Preset**: {{qualityInfo.name}}
**Stack**: {{templateInfo.stack}}

{{#if templateInfo.isMonorepo}}
## Monorepo Structure

This is a{{#if templateInfo.monorepoType}} **{{templateInfo.monorepoType}}**{{/if}} monorepo with multiple applications and shared packages.

### Workspace Commands

```bash
# Development
pnpm dev                    # Run all apps in dev mode
pnpm dev --filter <app>     # Run specific app

# Building
pnpm build                  # Build all apps and packages
pnpm build --filter <app>   # Build specific app

# Testing
pnpm test                   # Run all tests
pnpm test --filter <package> # Test specific package
```

{{#if templateInfo.hasDatabase}}
```bash
# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run database migrations
pnpm db:push                # Push schema changes
pnpm db:studio              # Open Prisma Studio
```
{{/if}}

{{#if templateInfo.hasStorybook}}
```bash
# Storybook
pnpm storybook              # Run Storybook
```
{{/if}}

{{#if templateInfo.hasShadcn}}
### Adding Components (shadcn/ui)

```bash
# Install component (adjust path based on your structure)
npx shadcn@latest add <component-name>

# Use in your app
import { Button } from "@/components/ui/button";
```
{{/if}}

{{#if templateInfo.hasTRPC}}
### Working with tRPC

- Create/update routers in your tRPC router files
- Add procedures to the root router
- Use tRPC client in your application
{{/if}}

{{#if templateInfo.hasDatabase}}
### Database Schema

- Edit Prisma schema file (location depends on your structure)
- Run `pnpm db:generate` to update Prisma client
- Create migrations: `pnpm db:migrate dev`
{{/if}}

{{/if}}

## Development Commands

{{#if templateInfo.isMonorepo}}
All commands should be run from the project root using pnpm workspace commands.
{{else}}
Standard npm/pnpm commands apply. Common commands:

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm typecheck    # Type check
```
{{/if}}

{{#if templateInfo.hasDatabase}}
{{#unless templateInfo.isMonorepo}}
### Database Commands

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm db:push      # Push schema changes (development)
pnpm db:studio    # Open Prisma Studio
```
{{/unless}}
{{/if}}

## Quality Gates

**Coverage**: Minimum {{qualityInfo.gates.coverage}}%{{#if qualityInfo.gates.mutation}}
**Mutation Score**: Minimum {{qualityInfo.gates.mutation}}%{{/if}}

## BOSS Integration

This project uses BOSS (Business-Orchestrated Software System) workflow:

- **Constitutional Governance**: Immutable principles in `.specify/constitution.md`
- **Spec-Kit Integration**: Executable specifications drive development
- **Quality Automation**: Pre-commit hooks enforce quality gates

For BOSS orchestration details, see the BOSS documentation. Worker-specific instructions are configured in `.boss/workers/` directories.

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
{{#if templateInfo.isMonorepo}}
- Run package-specific tests: `pnpm --filter <package> test`
{{/if}}

### Code Quality

- Run linting: `pnpm lint`
- Type-check: `pnpm typecheck`
{{#if templateInfo.hasDatabase}}
- Ensure Prisma client is generated before type-checking
{{/if}}

### Git Workflow

- Use conventional commits (feat, fix, docs, etc.)
- Keep commits atomic and focused
{{#if templateInfo.isMonorepo}}
- Scope commits to packages: `feat(package-name): description`
{{/if}}
- Pre-commit hooks will run quality checks

{{#if templateInfo.hasDocker}}
## Deployment

### Docker

Build and run containers:

```bash
# Build Docker image
docker build -t {{config.name}} .

# Or use docker-compose
docker-compose up
```

{{#if templateInfo.isMonorepo}}
For monorepo projects, check for multiple Dockerfiles in the `docker/` directory.
{{/if}}

### Kamal

{{#if templateInfo.isMonorepo}}
Deploy to production using Kamal. Check `extras/config/kamal/` for configuration files.
{{else}}
Deploy to production using Kamal. See Kamal documentation for setup.
{{/if}}

```bash
kamal setup           # First-time setup
kamal deploy          # Deploy application
```
{{/if}}

## Environment Variables

{{#if templateInfo.hasNextAuth}}
### Authentication (NextAuth.js)

- `NEXTAUTH_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (e.g., `http://localhost:3000`)

{{/if}}
{{#if templateInfo.hasDatabase}}
### Database (Prisma)

- `DATABASE_URL` - Database connection string (format depends on your database)

{{/if}}
See `.env.example` for complete list of environment variables.

## Troubleshooting

{{#if templateInfo.isMonorepo}}
### Turborepo Issues

- **Build cache issues**: Clear with `pnpm clean` or `rm -rf .turbo`
- **Type errors after updating packages**: Run `pnpm build` from root
- **Workspace dependency issues**: Delete `node_modules` and run `pnpm install`

{{/if}}
{{#if templateInfo.hasDatabase}}
### Prisma Issues

- **Client not found**: Run `pnpm db:generate`{{#if templateInfo.isMonorepo}} from root{{/if}}
- **Schema drift**: Run `pnpm db:push` for development or `pnpm db:migrate` for production

{{/if}}
## Additional Resources

{{#if templateInfo.isMonorepo}}
- [Turborepo Documentation](https://turbo.build/repo/docs)
{{/if}}
{{#if templateInfo.hasShadcn}}
- [shadcn/ui Documentation](https://ui.shadcn.com)
{{#if templateInfo.isMonorepo}}
- [shadcn/ui Monorepo Guide](https://ui.shadcn.com/docs/monorepo)
{{/if}}
{{/if}}
{{#if templateInfo.hasTRPC}}
- [tRPC Documentation](https://trpc.io)
{{/if}}
{{#if templateInfo.hasNextAuth}}
- [NextAuth.js Documentation](https://next-auth.js.org)
{{/if}}
{{#if templateInfo.hasStorybook}}
- [Storybook Documentation](https://storybook.js.org)
{{/if}}
{{#if templateInfo.hasDocker}}
- [Kamal Documentation](https://kamal-deploy.org)
{{/if}}
