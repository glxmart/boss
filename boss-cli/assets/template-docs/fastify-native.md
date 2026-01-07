# Template Documentation: Fastify Native

This project was bootstrapped using the **Fastify Native** template via `create-fastify`, which provides a high-performance API server setup.

## What Was Included

### Core Stack
- **Fastify** - Fast and low overhead web framework
- **TypeScript** - Type-safe development
- **TypeBox** - JSON Schema Type Builder for validation
- **Prisma** - Next-generation ORM (via BOSS enhancements)
- **Pino** - Super fast Node.js logger
- **Vitest** - Testing framework
- **ESLint** - Code linting (ESLint 9 flat config)
- **Prettier** - Code formatting

### Project Structure

```
${config.name}/
├── src/
│   ├── routes/             # Route handlers
│   ├── plugins/            # Fastify plugins
│   ├── schemas/            # TypeBox validation schemas
│   └── app.ts              # Application setup
├── prisma/                 # Prisma schema (if added)
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
└── docker-compose.yml      # Local infrastructure
```

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm typecheck` - Type check without emitting files
- `pnpm lint` - Lint code with ESLint
- `pnpm test` - Run tests in watch mode
- `pnpm test:unit` - Run unit tests (excludes e2e/integration)
- `pnpm test:coverage` - Run tests with coverage

### Features

- **High Performance** - Fastify is one of the fastest Node.js frameworks
- **Type Safety** - Full TypeScript support with TypeBox schemas
- **Plugin System** - Extensible via Fastify plugins
- **JSON Schema Validation** - TypeBox for request/response validation
- **Structured Logging** - Pino for high-performance logging
- **Error Handling** - Global error handlers with proper responses

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
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Add Routes**
   - Create route files in `src/routes/`
   - Use TypeBox schemas for validation
   - Register routes as Fastify plugins

3. **Add Database (Optional)**
   - Initialize Prisma: `pnpm dlx prisma init`
   - Define your schema in `prisma/schema.prisma`
   - Generate client: `pnpm dlx prisma generate`

4. **Use BOSS**
   - Run `./start-boss.sh` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### Documentation

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Prisma Documentation](https://www.prisma.io/docs)

