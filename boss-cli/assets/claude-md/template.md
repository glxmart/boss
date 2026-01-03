# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

**Name**: {{config.name}}
**Template**: {{templateInfo.name}}
**Quality Preset**: {{qualityInfo.name}}
**Stack**: {{templateInfo.stack}}

{{#if templateInfo.isMonorepo}}
## Monorepo Structure

This is a **Turborepo monorepo** with multiple applications and shared packages.

### Applications

- **apps/web** - Main Next.js application (port 3000)
- **apps/admin** - Admin dashboard (port 3001)

### Shared Packages

- **packages/ui** - Component library with shadcn/ui + Storybook
- **packages/database** - Prisma schema and client
- **packages/trpc** - tRPC routers and type-safe API
- **packages/auth** - NextAuth.js authentication
- **packages/config** - Shared ESLint, TypeScript, Tailwind configs
- **packages/utils** - Shared utility functions

### Workspace Commands

```bash
# Development
pnpm dev                    # Run all apps in dev mode
pnpm dev --filter web       # Run only web app
pnpm dev --filter admin     # Run only admin app

# Building
pnpm build                  # Build all apps and packages
pnpm build --filter web     # Build only web app

# Testing
pnpm test                   # Run all tests
pnpm test --filter ui       # Test specific package

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run database migrations
pnpm db:push                # Push schema changes
pnpm db:studio              # Open Prisma Studio

# Storybook
pnpm storybook              # Run Storybook for UI package
```

### Adding New Components (shadcn/ui)

```bash
# Install component in packages/ui
cd packages/ui
npx shadcn@latest add <component-name>

# Use in apps
import { Button } from "@repo/ui/components/button";
```

### Worker-Friendly Patterns

When working as a BOSS worker in this monorepo:

1. **Package-scoped changes**: Use `pnpm --filter <package>` commands
2. **Minimal context**: Only read files in relevant packages
3. **Clear dependencies**: Update package.json when adding workspace deps
4. **Batch commits**: Group related changes across packages into single commits

### Common Workflows

#### Add a new UI component
1. Create component in `packages/ui/src/components/ui/`
2. Export from `packages/ui/src/components/index.ts`
3. Add Storybook story in `packages/ui/src/components/ui/<component>.stories.tsx`
4. Use in app: `import { Component } from "@repo/ui/components"`

#### Add a new tRPC procedure
1. Create/update router in `packages/trpc/src/routers/<router>.ts`
2. Add to root router in `packages/trpc/src/routers/_app.ts`
3. Use in app via tRPC client

#### Update database schema
1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:generate` to update Prisma client
3. Create migration: `pnpm --filter database prisma migrate dev`
4. Test in apps using `@repo/database`

{{/if}}

## Development Commands

{{#if templateInfo.isMonorepo}}
All commands should be run from the project root using pnpm workspace commands.
{{else}}
Standard npm/pnpm commands apply.
{{/if}}

## Quality Gates

**Coverage**: Minimum {{qualityInfo.gates.coverage}}%{{#if qualityInfo.gates.mutation}}
**Mutation Score**: Minimum {{qualityInfo.gates.mutation}}%{{/if}}

## BOSS Integration

This project is configured for BOSS (Business-Orchestrated Software System) workflow:

- **Constitutional Governance**: Immutable principles in `.specify/constitution.md`
- **Spec-Kit Integration**: Executable specifications drive development
- **Worker Isolation**: Development happens in isolated container environments
- **Quality Automation**: Pre-commit hooks enforce quality gates

### BOSS Workflow Phases

1. **Constitution** - Establish non-negotiable principles
2. **Clarification** - Gather requirements and constraints
3. **Specification** - Write executable specifications
4. **Planning** - Create implementation roadmap
5. **Validation** - Review specs against constitution
6. **Task Breakdown** - Parallel task distribution
7. **Implementation** - Parallel development with quality gates
8. **Consolidation** - Merge and finalize

### Working with BOSS

- Main branch is protected - all work in feature branches
- BOSS orchestrator cannot edit files directly
- Workers execute tasks in isolated containers
- Use GitHub MCP for all repository operations
- Quality gates run automatically on pre-commit

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
- Scope commits to packages: `feat(ui): add new button variant`
{{/if}}
- Pre-commit hooks will run quality checks

{{#if templateInfo.hasDocker}}
## Deployment

### Docker

Build images:
```bash
# Web app
docker build -f docker/Dockerfile.web -t {{config.name}}-web .

# Admin app
docker build -f docker/Dockerfile.admin -t {{config.name}}-admin .
```

### Kamal

Deploy to production:
```bash
# Setup environment
cp extras/config/kamal/_env .env
# Edit .env with your values

# Deploy
kamal setup           # First-time setup
./scripts/deploy.sh   # Deploy all apps
```

{{/if}}

## Environment Variables

{{#if templateInfo.hasNextAuth}}
### Authentication (NextAuth.js)

- `NEXTAUTH_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (e.g., `http://localhost:3000`)

{{/if}}
{{#if templateInfo.hasDatabase}}
### Database (Prisma + PostgreSQL)

- `DATABASE_URL` - PostgreSQL connection string

{{/if}}

See `.env.example` for complete list of environment variables.

## Troubleshooting

{{#if templateInfo.isMonorepo}}
### Turborepo Issues

- **Build cache issues**: Clear with `pnpm clean` or `rm -rf .turbo`
- **Type errors after updating packages**: Run `pnpm build` from root
- **Workspace dependency issues**: Delete `node_modules` and run `pnpm install`

### Prisma Issues

- **Client not found**: Run `pnpm db:generate` from root
- **Schema drift**: Run `pnpm db:push` for development or `pnpm db:migrate` for production

{{/if}}

## Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
{{#if templateInfo.hasShadcn}}
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [shadcn/ui Monorepo Guide](https://ui.shadcn.com/docs/monorepo)
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
- [Kamal Documentation](https://kamal-deploy.org)
