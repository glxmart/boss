# Template Documentation: Astro Portfolio

This project was bootstrapped using the **Astro Portfolio** template via `create-astro`, which provides a fast static site with React islands.

## What Was Included

### Core Stack
- **Astro** - Static site generator with island architecture
- **React** - UI components (via @astrojs/react integration)
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **Vitest** - Testing framework
- **ESLint** - Code linting (ESLint 9 flat config)
- **Prettier** - Code formatting

### Project Structure

```
${config.name}/
├── src/
│   ├── pages/              # Astro pages (file-based routing)
│   ├── components/         # Astro and React components
│   ├── layouts/            # Page layouts
│   └── styles/             # Global styles
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
├── astro.config.mjs        # Astro configuration
├── tailwind.config.mjs     # Tailwind configuration
├── package.json            # Dependencies and scripts
└── docker-compose.yml      # Local infrastructure
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production (static output)
- `pnpm preview` - Preview production build
- `pnpm typecheck` - Type check without emitting files
- `pnpm lint` - Lint code with ESLint
- `pnpm test` - Run tests in watch mode
- `pnpm test:unit` - Run unit tests (excludes e2e/integration)
- `pnpm test:coverage` - Run tests with coverage

### Features

- **Island Architecture** - Partial hydration for optimal performance
- **React Integration** - Use React components where interactivity is needed
- **Static Output** - Pre-rendered HTML for fast loading
- **Tailwind CSS** - Utility-first styling with design system
- **File-based Routing** - Pages defined by file structure
- **Markdown Support** - Write content in Markdown/MDX

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

2. **Add Pages**
   - Create `.astro` files in `src/pages/`
   - Use file-based routing
   - Add layouts for consistent structure

3. **Add Interactive Components**
   - Create React components in `src/components/`
   - Use `client:*` directives for hydration
   - Keep static content in Astro components

4. **Use BOSS**
   - Run `./start-boss.sh` to start BOSS orchestration
   - BOSS will help you build features following the Spec-Kit workflow

### Deployment

Astro produces static HTML that can be deployed to any static host:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

### Documentation

- [Astro Documentation](https://docs.astro.build)
- [React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

