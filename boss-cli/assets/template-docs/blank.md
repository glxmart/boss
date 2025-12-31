# Template Documentation: Blank

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

