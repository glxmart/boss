# Quality Check

Run quality gates: build, lint, tests, and coverage checks.

## What This Does

Validates your changes meet BOSS quality standards before creating a changeset or PR:

1. **Build Check** - Ensures code compiles without errors
2. **Lint Check** - Validates code style and patterns
3. **Test Suite** - Runs all unit and integration tests
4. **Coverage Check** - Verifies test coverage meets thresholds

## Usage

**Invoke with:** "Run quality check" or "Check if my code passes quality gates"

When invoked, I will:

1. **Detect changed packages** - Check which packages have changes (boss-cli, conductor-mcp, or both)
2. **Run quality gates for each package**:

   ```bash
   # Install dependencies (if needed)
   pnpm install

   # Build packages
   pnpm build

   # Run linting
   pnpm --filter @glxmart/boss-cli lint
   pnpm --filter @glxmart/conductor-mcp lint

   # Run tests with coverage
   pnpm --filter @glxmart/boss-cli test:coverage
   pnpm --filter @glxmart/conductor-mcp test:coverage
   ```

3. **Report results**:
   - ✅ All checks passed
   - ❌ Which checks failed and why
   - 📊 Coverage statistics

## Quality Thresholds

Based on your quality preset in `.boss/boss.json`:

### Startup Preset

- Test coverage: 50%
- Mutation score: 60%

### Production Preset (default)

- Test coverage: 80%
- Mutation score: 80%

### Enterprise Preset

- Test coverage: 90%
- Mutation score: 90%

## What Gets Checked

**Build:**

- TypeScript compilation
- No type errors
- All dependencies resolved

**Lint:**

- ESLint rules
- Code style consistency
- Import organization

**Tests:**

- Unit tests pass
- Integration tests pass
- Coverage thresholds met

## Fixing Issues

**Build errors:**

```bash
# Check TypeScript errors
pnpm build
# Fix type errors in reported files
```

**Lint errors:**

```bash
# Auto-fix lint issues
pnpm --filter <package> lint --fix

# Check remaining issues
pnpm --filter <package> lint
```

**Test failures:**

```bash
# Run specific test file
pnpm --filter <package> test path/to/test

# Watch mode for development
pnpm --filter <package> test:watch
```

**Coverage gaps:**

```bash
# Generate coverage report
pnpm --filter <package> test:coverage

# Open HTML report
open boss-cli/coverage/index.html
open conductor-mcp/coverage/index.html
```

## Next Steps

After all checks pass:

1. Run `/3-create-changeset` (for code changes)
2. Run `/4-create-pr` to submit

## Related Commands

- `/1-start-feature` - Create feature branch
- `/3-create-changeset` - Create changeset for release
- `/4-create-pr` - Create pull request
