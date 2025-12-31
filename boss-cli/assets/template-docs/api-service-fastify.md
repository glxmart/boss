# Template Documentation: Fastify API Service

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

