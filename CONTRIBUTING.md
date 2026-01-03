# Contributing to BOSS

Thank you for your interest in contributing to BOSS! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 10.0.0 (for development)
- Docker Desktop
- Git

### Initial Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/boss.git
   cd boss
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write tests for new functionality
- Update documentation as needed
- Follow existing code style

### 3. Test Your Changes

```bash
# Test boss-cli
cd boss-cli
pnpm test

# Test conductor-mcp
cd conductor-mcp
pnpm test

# Integration tests
cd boss-cli
pnpm test:integration
```

### 4. Create a Changeset

```bash
pnpm changeset
```

- Select the packages you modified
- Choose the change type (major/minor/patch)
- Describe your changes

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: your feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions/changes
- `refactor:` - Code refactoring

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Project Structure

```
boss/
├── boss-cli/           # Bootstrap CLI package
├── conductor-mcp/      # MCP orchestration package
├── docs/              # Documentation
└── .github/           # GitHub workflows
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Write descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions focused and small

### Testing

- Write unit tests for utilities and generators
- Write integration tests for end-to-end flows
- Aim for >80% code coverage

### Documentation

- Update README.md if adding features
- Update CLAUDE.md for AI assistant guidance
- Add inline comments for complex logic
- Follow docs/CONTRIBUTING_DOCS.md for documentation changes

## Getting Help

- [Documentation](https://github.com/glxmart/boss/tree/main/docs)
- [GitHub Discussions](https://github.com/glxmart/boss/discussions)
- [Issues](https://github.com/glxmart/boss/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
