# Template Documentation: Next.js Turbo Monorepo

This project was bootstrapped using the **Next.js Turbo Monorepo** template, which provides a production-ready, full-stack monorepo with modern tooling and best practices.

## What Was Included

### Core Technologies

#### Monorepo & Build Tools
- **Turborepo** - High-performance build system with smart caching
- **pnpm Workspaces** - Fast, disk-efficient package manager
- **TypeScript 5.x** - Type-safe development across all packages

#### Applications (2)
- **apps/web** - Main Next.js 15 application (port 3000)
  - App Router with Server Components
  - Standalone output for Docker deployment
  - shadcn/ui components
  - tRPC client integration
  - NextAuth.js authentication

- **apps/admin** - Admin dashboard (port 3001)
  - Separate admin interface
  - Shared UI components
  - Independent deployment capability

#### Shared Packages (6)

**@repo/ui** - Component Library
- shadcn/ui v4 components (Button, Card, Input, etc.)
- Tailwind CSS styling
- Storybook documentation
- Fully typed component props

**@repo/database** - Database Layer
- Prisma ORM schema
- User, Account, Session models
- Type-safe database client
- Migration scripts

**@repo/trpc** - API Layer
- tRPC routers and procedures
- Type-safe API contracts
- Protected procedures with auth
- Shared between apps

**@repo/auth** - Authentication
- NextAuth.js v5 integration
- Prisma adapter
- Credentials provider
- Session management

**@repo/config** - Shared Configurations
- ESLint config (React, Next.js presets)
- TypeScript config (base, React, Next.js)
- Tailwind config
- Vitest config

**@repo/utils** - Utility Functions
- String utilities (capitalize, slugify, truncate)
- Date utilities (formatDate, formatRelative)
- Fully tested with Vitest
- Shared across all packages

### Project Structure

\`\`\`
${config.name}/
├── apps/
│   ├── web/                    # Main Next.js app (port 3000)
│   │   ├── src/
│   │   │   └── app/           # App Router pages
│   │   ├── public/            # Static assets
│   │   └── package.json
│   └── admin/                  # Admin dashboard (port 3001)
│       ├── src/
│       │   └── app/
│       └── package.json
│
├── packages/
│   ├── ui/                     # Component library + Storybook
│   │   ├── src/
│   │   │   └── components/
│   │   ├── .storybook/
│   │   └── package.json
│   ├── database/               # Prisma schema
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   ├── trpc/                   # tRPC routers
│   │   ├── src/
│   │   │   ├── router.ts
│   │   │   └── routers/
│   │   └── package.json
│   ├── auth/                   # NextAuth.js config
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── config/                 # Shared configs
│   │   ├── eslint/
│   │   ├── typescript/
│   │   ├── tailwind/
│   │   └── vitest/
│   └── utils/                  # Utility functions
│       ├── src/
│       │   ├── string.ts
│       │   └── date.ts
│       └── tests/
│
├── docker/                     # Docker configurations
│   ├── Dockerfile.web         # Web app image
│   ├── Dockerfile.admin       # Admin app image
│   └── docker-compose.yml     # Local PostgreSQL + Redis
│
├── extras/                     # Deployment & scripts
│   ├── config/
│   │   └── kamal/
│   │       └── deploy.yml     # Kamal deployment config
│   └── scripts/
│       ├── deploy.sh          # Deployment automation
│       └── setup-db.sh        # Database setup
│
├── .boss/                      # BOSS configuration
├── .specify/                   # Spec-Kit structure
├── .container-use/             # Container-use config
├── .claude/                    # Claude Code rules
├── .github/                    # GitHub workflows
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definitions
├── turbo.json                  # Turborepo pipeline
└── tsconfig.json               # Base TypeScript config
\`\`\`

### Available Scripts

#### Root-Level (Workspace)
- \`pnpm dev\` - Start all apps in development mode
- \`pnpm build\` - Build all apps and packages
- \`pnpm test\` - Run tests across all packages
- \`pnpm lint\` - Lint all packages
- \`pnpm typecheck\` - Type check all packages
- \`pnpm clean\` - Clean all build artifacts

#### Application-Specific
- \`pnpm --filter web dev\` - Start web app only (port 3000)
- \`pnpm --filter admin dev\` - Start admin app only (port 3001)
- \`pnpm --filter web build\` - Build web app
- \`pnpm --filter admin build\` - Build admin app

#### Package-Specific
- \`pnpm --filter @repo/ui storybook\` - Run Storybook (port 6006)
- \`pnpm --filter @repo/ui build-storybook\` - Build Storybook static site
- \`pnpm --filter @repo/database db:generate\` - Generate Prisma client
- \`pnpm --filter @repo/database db:push\` - Push schema to database
- \`pnpm --filter @repo/database db:studio\` - Open Prisma Studio
- \`pnpm --filter @repo/utils test\` - Test utils package

#### Deployment
- \`./extras/scripts/deploy.sh\` - Deploy to production via Kamal
- \`./extras/scripts/setup-db.sh\` - Initialize production database

### Features

#### Monorepo Architecture
- **Turborepo Pipeline** - Optimized task execution with caching
- **Workspace Dependencies** - Shared packages across apps
- **Independent Deployment** - Each app can be deployed separately
- **Fast Builds** - Only rebuild what changed

#### Component Library
- **shadcn/ui v4** - Accessible, customizable components
- **Storybook** - Interactive component documentation
- **Tailwind CSS** - Utility-first styling
- **Type-Safe Props** - Full TypeScript support

#### Database & API
- **Prisma ORM** - Type-safe database access
- **tRPC** - End-to-end type safety for APIs
- **Protected Procedures** - Authentication-aware API routes
- **PostgreSQL** - Production-ready relational database

#### Authentication
- **NextAuth.js v5** - Modern authentication
- **Prisma Adapter** - Database-backed sessions
- **Credentials Provider** - Email/password authentication
- **Protected Routes** - Server-side session validation

#### Testing & Quality
- **Vitest** - Fast unit testing framework
- **Component Tests** - Test utilities in isolation
- **Integration Tests** - Test tRPC procedures
- **Coverage Reports** - Track test coverage

#### Deployment
- **Docker** - Multi-stage builds for production
- **Kamal** - Docker-based deployment (NOT Vercel)
- **Standalone Output** - Optimized Next.js builds
- **PostgreSQL + Redis** - Local development stack

### Quality Preset: ${config.quality}

This project uses the **${config.quality}** quality preset, which defines:
- Code coverage thresholds
- Quality gate requirements
- Testing requirements
- Linting and type checking rules

### Git Hooks

The following git hooks are configured:

- **pre-commit** - Runs lint-staged (ESLint + Prettier) and tests for changed files
- **commit-msg** - Validates commit messages follow Conventional Commits v1.0.0
- **pre-push** - Runs comprehensive validation (typecheck, lint, tests, security checks)

### Turborepo Pipeline

The \`turbo.json\` defines the task execution pipeline:

\`\`\`json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "storybook-static/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "typecheck": {}
  }
}
\`\`\`

**Key features:**
- **Dependency Graph** - Builds packages before apps
- **Smart Caching** - Skip unchanged tasks
- **Parallel Execution** - Run tasks concurrently
- **Persistent Tasks** - Keep dev servers running

### Next Steps

#### 1. Install Dependencies & Start Development

\`\`\`bash
# Install all dependencies
pnpm install

# Start local infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Setup database
pnpm --filter @repo/database db:push

# Start all apps in development
pnpm dev

# Or start apps individually:
pnpm --filter web dev       # Web app on port 3000
pnpm --filter admin dev     # Admin on port 3001
\`\`\`

#### 2. Explore the Component Library

\`\`\`bash
# Start Storybook
pnpm --filter @repo/ui storybook

# Visit http://localhost:6006
# Browse shadcn/ui components
# See component documentation and examples
\`\`\`

#### 3. Add New Features

**Add a new page to web app:**
\`\`\`bash
# Create new page in apps/web/src/app/
# Example: apps/web/src/app/dashboard/page.tsx
\`\`\`

**Add a new tRPC procedure:**
\`\`\`typescript
// packages/trpc/src/routers/user.ts
export const userRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.user.findUnique({
        where: { id: input.userId }
      });
    })
});
\`\`\`

**Add a new UI component:**
\`\`\`bash
# Add to packages/ui/src/components/
# Create Storybook story in packages/ui/src/components/*.stories.tsx
\`\`\`

**Add a new utility function:**
\`\`\`bash
# Add to packages/utils/src/
# Add tests to packages/utils/tests/
pnpm --filter @repo/utils test
\`\`\`

#### 4. Update Database Schema

\`\`\`bash
# Edit schema
vim packages/database/prisma/schema.prisma

# Generate Prisma client
pnpm --filter @repo/database db:generate

# Push to database
pnpm --filter @repo/database db:push

# Or create migration
pnpm --filter @repo/database db:migrate dev --name add_new_table
\`\`\`

#### 5. Deploy to Production

\`\`\`bash
# Configure deployment (edit extras/config/kamal/deploy.yml)
# Update:
# - domain: your-domain.com
# - servers: [your-production-ip]
# - registry credentials

# Setup database
./extras/scripts/setup-db.sh

# Deploy
./extras/scripts/deploy.sh
\`\`\`

#### 6. Use BOSS for Feature Development

\`\`\`bash
# Start BOSS orchestration
./start-boss.sh

# BOSS will:
# - Guide you through Spec-Kit workflow
# - Spawn specialized workers
# - Coordinate development across packages
# - Ensure quality gates are met
\`\`\`

### Package Dependencies

The monorepo uses internal workspace dependencies:

\`\`\`
apps/web
  ├── @repo/ui
  ├── @repo/database
  ├── @repo/trpc
  ├── @repo/auth
  └── @repo/utils

apps/admin
  ├── @repo/ui
  ├── @repo/database
  ├── @repo/trpc
  └── @repo/auth

packages/ui
  └── @repo/utils

packages/trpc
  ├── @repo/database
  └── @repo/auth

packages/auth
  └── @repo/database
\`\`\`

Turborepo automatically builds packages in the correct order based on these dependencies.

### Local Development URLs

After running \`pnpm dev\`:

- **Web App**: http://localhost:3000
- **Admin App**: http://localhost:3001
- **Storybook**: http://localhost:6006 (run separately: \`pnpm --filter @repo/ui storybook\`)
- **Prisma Studio**: http://localhost:5555 (run separately: \`pnpm --filter @repo/database db:studio\`)

### Documentation & Resources

#### Official Documentation
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [NextAuth.js Documentation](https://authjs.dev)
- [Storybook Documentation](https://storybook.js.org/docs)
- [Kamal Deployment](https://kamal-deploy.org)

#### Monorepo-Specific Guides
- [Managing Dependencies in Monorepos](https://turbo.build/repo/docs/handbook/package-installation)
- [Sharing Code](https://turbo.build/repo/docs/handbook/sharing-code)
- [Deploying Turborepo Apps](https://turbo.build/repo/docs/handbook/deploying-with-docker)

### Troubleshooting

**Issue: Build errors after adding new package**
\`\`\`bash
# Clean all node_modules and reinstall
pnpm clean
pnpm install
\`\`\`

**Issue: TypeScript can't find @repo/* packages**
\`\`\`bash
# Rebuild all packages
pnpm build
\`\`\`

**Issue: Database connection errors**
\`\`\`bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Check DATABASE_URL in .env files
# Should be: postgresql://postgres:postgres@localhost:5432/mydb
\`\`\`

**Issue: Turborepo cache issues**
\`\`\`bash
# Clear Turborepo cache
pnpm turbo run build --force
\`\`\`

**Issue: Port already in use**
\`\`\`bash
# Change port in package.json dev script
# Or kill the process using the port
lsof -ti:3000 | xargs kill -9
\`\`\`
