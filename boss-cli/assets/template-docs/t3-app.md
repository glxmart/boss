# Template Documentation: T3 Stack

This project was bootstrapped using the **T3 Stack** template, which provides a full-stack TypeScript application with best practices.

## What Was Included

### Core Stack
- **Next.js** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Next-generation ORM
- **NextAuth.js** - Authentication
- **Vitest** - Testing framework
- **ESLint** - Code linting (ESLint 9 flat config)
- **Prettier** - Code formatting

### Project Structure

\`\`\`
${config.name}/
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── server/             # Server-side code (tRPC, Prisma)
│   └── components/         # React components
├── public/                 # Static assets
├── prisma/                 # Prisma schema and migrations
├── tests/                  # Test files
├── docs/                   # Documentation
├── .boss/                  # BOSS configuration
├── .specify/               # Spec-Kit structure
├── .container-use/         # Container-use config
├── .claude/                # Claude Code rules
├── .github/                # GitHub workflows
├── .husky/                 # Git hooks
├── scripts/                # Utility scripts
├── package.json            # Dependencies and scripts
└── docker-compose.yml      # Local infrastructure
\`\`\`

### Available Scripts

- \`pnpm dev\` - Start development server
- \`pnpm build\` - Build for production
- \`pnpm start\` - Start production server
- \`pnpm typecheck\` - Type check without emitting files
- \`pnpm lint\` - Lint code with ESLint
- \`pnpm test\` - Run tests in watch mode
- \`pnpm test:unit\` - Run unit tests (excludes e2e/integration)
- \`pnpm test:coverage\` - Run tests with coverage
- \`pnpm db:push\` - Push Prisma schema to database
- \`pnpm db:studio\` - Open Prisma Studio

### Features

- **End-to-End Type Safety** - tRPC provides type-safe APIs from server to client
- **Database ORM** - Prisma for type-safe database access
- **Authentication** - NextAuth.js for secure authentication
- **Styling** - Tailwind CSS for utility-first styling
- **Full-Stack** - Server and client code in one TypeScript project

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

### Next Steps

1. **Start Development**
   \`\`\`bash
   pnpm install
   pnpm db:push
   pnpm dev
   \`\`\`

2. **Configure Database**
   - Update \`prisma/schema.prisma\` with your database schema
   - Run \`pnpm db:push\` to sync schema
   - Use Prisma Client in your server code

3. **Add tRPC Procedures**
   - Define procedures in \`src/server/api/routers/\`
   - Use type-safe procedures in your React components

4. **Use BOSS**
   - Run \`./start-boss.sh\` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### Documentation

- [T3 Stack Documentation](https://create.t3.gg)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

