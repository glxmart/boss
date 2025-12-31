# Template Documentation: Next.js App (Turbo)

This project was bootstrapped using the **Next.js App (Turbo)** template, which provides a modern full-stack web application setup.

## What Was Included

### Core Stack
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS (via T3 template)
- **Prisma** - Database ORM (via T3 template)
- **Vitest** - Testing framework
- **ESLint** - Code linting with React support (ESLint 9 flat config)
- **Prettier** - Code formatting

### Project Structure

\`\`\`
${config.name}/
├── src/
│   └── app/                # Next.js App Router pages
├── public/                 # Static assets
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
├── tsconfig.json           # TypeScript configuration
├── next.config.js          # Next.js configuration
├── vitest.config.ts        # Test configuration
├── eslint.config.js        # ESLint configuration (ESLint 9)
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

### Features

- **App Router** - Next.js 15 App Router for modern routing
- **Server Components** - React Server Components by default
- **Type Safety** - Full TypeScript support throughout
- **Fast Refresh** - Instant feedback during development
- **Optimized Builds** - Production-ready optimizations

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
   pnpm dev
   \`\`\`

2. **Add Pages**
   - Create pages in \`src/app/\` directory
   - Use Server Components by default
   - Add Client Components when needed with \`"use client"\`

3. **Add Styling**
   - Use Tailwind CSS classes
   - Configure in \`tailwind.config.js\`

4. **Use BOSS**
   - Run \`./start-boss.sh\` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

