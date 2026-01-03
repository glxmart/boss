# {{PROJECT_NAME}}

Next.js 15 Turborepo monorepo with shadcn/ui, Prisma, tRPC, NextAuth, Vitest, Storybook, and Kamal deployment.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers for all apps
pnpm dev

# Start specific app
pnpm --filter web dev
pnpm --filter admin dev

# Run Storybook
pnpm storybook
```

## What's Inside?

This monorepo includes the following:

### Apps

- **`apps/web`** - Main Next.js application
- **`apps/admin`** - Admin dashboard application

### Packages

- **`packages/ui`** - Shared component library with shadcn/ui and Storybook
- **`packages/database`** - Prisma schema and database client
- **`packages/trpc`** - tRPC API routers and procedures
- **`packages/auth`** - NextAuth.js authentication configuration
- **`packages/config`** - Shared ESLint, TypeScript, and Tailwind configurations
- **`packages/utils`** - Shared utility functions

### Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Monorepo**: [Turborepo](https://turbo.build/repo)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)
- **API**: [tRPC](https://trpc.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Component Documentation**: [Storybook](https://storybook.js.org/)
- **Deployment**: [Kamal](https://kamal-deploy.org/) (Docker-based)

## Development

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Create and run migrations (production)
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

### Building for Production

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm --filter web build
```

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run tests with coverage
pnpm test:coverage
```

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check types
pnpm typecheck

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Deployment

This project uses Kamal for Docker-based deployment. See `config/kamal/deploy.yml` for configuration.

```bash
# Build Docker image
docker build -f docker/Dockerfile.web -t {{PROJECT_NAME}}/web .

# Deploy with Kamal
kamal deploy -c config/kamal/deploy.yml
```

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete deployment instructions.

## Adding New Packages

To add a new shared package:

```bash
# Create package directory
mkdir -p packages/my-package/src

# Create package.json
cd packages/my-package
pnpm init

# Add to workspace by installing it in an app
cd ../../apps/web
pnpm add @repo/my-package@workspace:*
```

## Adding shadcn/ui Components

```bash
# Add components to the shared UI package
cd packages/ui
npx shadcn@latest add button card input
```

Components will be available in all apps via `@repo/ui/components`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [NextAuth.js Documentation](https://authjs.dev/)
- [Kamal Documentation](https://kamal-deploy.org/)

## License

MIT
