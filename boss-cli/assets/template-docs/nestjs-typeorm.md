# Template Documentation: NestJS (TypeORM)

This project was bootstrapped using the **NestJS (TypeORM)** template from `brocoders/nestjs-boilerplate`, which provides an enterprise-grade backend with authentication, database, and best practices.

## What Was Included

### Core Stack
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **TypeORM** - Full-featured ORM for TypeScript
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Token authentication
- **Swagger** - API documentation
- **Vitest** - Testing framework
- **ESLint** - Code linting (ESLint 9 flat config)
- **Prettier** - Code formatting

### Project Structure

```
${config.name}/
├── src/
│   ├── modules/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   └── ...
│   ├── database/           # TypeORM configuration
│   ├── config/             # App configuration
│   └── main.ts             # Application entry
├── test/                   # Test files
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
```

### Available Scripts

- `pnpm start:dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start:prod` - Start production server
- `pnpm typecheck` - Type check without emitting files
- `pnpm lint` - Lint code with ESLint
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage
- `pnpm migration:generate` - Generate TypeORM migration
- `pnpm migration:run` - Run pending migrations

### Features

- **Authentication** - JWT-based auth with refresh tokens
- **Authorization** - Role-based access control
- **Database** - TypeORM with PostgreSQL support
- **Validation** - class-validator for request validation
- **Documentation** - Swagger/OpenAPI auto-generated docs
- **Logging** - Pino logger integration
- **Error Handling** - Global exception filters

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
   docker-compose up -d  # Start PostgreSQL
   pnpm migration:run
   pnpm start:dev
   ```

2. **Configure Database**
   - Update `.env` with your database credentials
   - Create entities in `src/modules/*/entities/`
   - Generate and run migrations

3. **Add Modules**
   - Use NestJS CLI: `nest g module <name>`
   - Follow the module pattern in existing modules
   - Add Swagger decorators for API documentation

4. **Use BOSS**
   - Run `./start-boss.sh` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### API Documentation

Once the server is running, access Swagger documentation at:
- `http://localhost:3000/api/docs`

### Documentation

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [brocoders/nestjs-boilerplate](https://github.com/brocoders/nestjs-boilerplate)

