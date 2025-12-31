import path from 'path';
import { writeFile } from '../utils/file-system.js';
import type { ProjectConfig, Template } from '../types/index.js';

export async function generateTemplateDocs(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const docContent = getTemplateDocContent(config.template, config);
  const docPath = path.join(projectPath, 'docs', 'TEMPLATE.md');
  await writeFile(docPath, docContent);
}

function getTemplateDocContent(template: Template, config: ProjectConfig): string {
  switch (template) {
    case 'blank':
      return getBlankTemplateDoc(config);
    case 'nextjs-app-turbo':
      return getNextJSTemplateDoc(config);
    case 'api-service-fastify':
      return getFastifyTemplateDoc(config);
    case 't3-app':
      return getT3TemplateDoc(config);
    default:
      return getBlankTemplateDoc(config);
  }
}

function getBlankTemplateDoc(config: ProjectConfig): string {
  return `# Template Documentation: Blank

This project was bootstrapped using the **Blank** template, which provides a minimal TypeScript setup with essential tooling.

## What Was Included

### Core Setup
- **TypeScript** - Type-safe JavaScript with modern ES2022 features
- **Vitest** - Fast unit testing framework with coverage support
- **ESLint** - Code linting with TypeScript support (ESLint 9 flat config)
- **Prettier** - Code formatting for consistent style
- **tsx** - TypeScript execution for development

### Project Structure

\`\`\`
${config.name}/
├── src/                    # Source code
│   └── index.ts           # Entry point
├── tests/                  # Test files
│   └── index.test.ts      # Example test
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
├── vitest.config.ts        # Test configuration
├── eslint.config.js        # ESLint configuration (ESLint 9)
├── .prettierrc.json        # Prettier configuration
└── docker-compose.yml      # Local infrastructure
\`\`\`

### Available Scripts

- \`pnpm typecheck\` - Type check without emitting files
- \`pnpm lint\` - Lint code with ESLint
- \`pnpm lint:fix\` - Auto-fix ESLint issues
- \`pnpm format\` - Format code with Prettier
- \`pnpm test\` - Run tests in watch mode
- \`pnpm test:unit\` - Run unit tests (excludes e2e/integration)
- \`pnpm test:coverage\` - Run tests with coverage
- \`pnpm test:gates\` - Run all quality gates

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
   pnpm test
   \`\`\`

2. **Add Your Code**
   - Edit \`src/index.ts\` to add your application logic
   - Add tests in \`tests/\` directory
   - Follow the TDD Constitution in \`.specify/memory/constitution.md\`

3. **Use BOSS**
   - Run \`./start-boss.sh\` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### Customization

This is a blank template - you have full control to:
- Add your preferred framework or library
- Configure additional tooling
- Set up your own project structure
- Customize BOSS worker configurations

The template provides a solid foundation with modern tooling, but doesn't impose any specific framework choices.
`;
}

function getNextJSTemplateDoc(config: ProjectConfig): string {
  return `# Template Documentation: Next.js App (Turbo)

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
`;
}

function getFastifyTemplateDoc(config: ProjectConfig): string {
  return `# Template Documentation: Fastify API Service

This project was bootstrapped using the **Fastify API Service** template, which provides a high-performance API server setup.

## What Was Included

### Core Stack
- **Fastify** - Fast and low overhead web framework
- **TypeScript** - Type-safe development
- **Vitest** - Testing framework
- **ESLint** - Code linting (ESLint 9 flat config)
- **Prettier** - Code formatting
- **tsx** - TypeScript execution for development

### Project Structure

\`\`\`
${config.name}/
├── src/
│   └── index.ts           # API server entry point
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
├── vitest.config.ts        # Test configuration
├── eslint.config.js        # ESLint configuration (ESLint 9)
└── docker-compose.yml      # Local infrastructure
\`\`\`

### Available Scripts

- \`pnpm dev\` - Start development server with hot reload (tsx watch)
- \`pnpm build\` - Compile TypeScript to JavaScript
- \`pnpm start\` - Start production server (runs compiled code)
- \`pnpm typecheck\` - Type check without emitting files
- \`pnpm lint\` - Lint code with ESLint
- \`pnpm test\` - Run tests in watch mode
- \`pnpm test:unit\` - Run unit tests (excludes e2e/integration)
- \`pnpm test:coverage\` - Run tests with coverage

### Features

- **High Performance** - Fastify is one of the fastest Node.js frameworks
- **Type Safety** - Full TypeScript support
- **Plugin System** - Extensible via Fastify plugins
- **JSON Schema Validation** - Built-in request/response validation
- **Async/Await** - Modern async patterns

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

2. **Add Routes**
   - Define routes in \`src/index.ts\` or separate route files
   - Use Fastify's plugin system for modular routes
   - Add JSON schema validation for requests/responses

3. **Add Middleware**
   - Use Fastify hooks (onRequest, preHandler, etc.)
   - Add authentication/authorization
   - Add logging and error handling

4. **Use BOSS**
   - Run \`./start-boss.sh\` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### Documentation

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
`;
}

function getT3TemplateDoc(config: ProjectConfig): string {
  return `# Template Documentation: T3 Stack

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
`;
}

