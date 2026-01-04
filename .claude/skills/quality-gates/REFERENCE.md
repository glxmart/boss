# Quality Gates Reference

## Overview

This document provides detailed information about BOSS quality gates, standards, and validation requirements.

## Quality Standards

### Code Quality

**TypeScript Compilation**

- Zero TypeScript errors required
- Strict mode enabled (`strict: true` in tsconfig.json)
- No implicit any
- No unused variables/imports

**Linting**

- ESLint with recommended rules
- No warnings allowed in production
- Auto-fixable issues should be fixed automatically
- Manual review for complex issues

**Formatting**

- Prettier for consistent formatting
- Runs automatically via lint-staged on commit
- Configuration in `.prettierrc` or package.json

### Test Quality

**Coverage Requirements** (by quality preset)

| Preset     | Coverage | Mutation | Description                   |
| ---------- | -------- | -------- | ----------------------------- |
| startup    | 50%      | 60%      | Fast iteration, minimal gates |
| production | 80%      | 80%      | Balanced quality              |
| enterprise | 90%      | 90%      | Maximum quality               |

**Test Types**

1. **Unit Tests**
   - Test individual functions/classes
   - Fast execution (<5s per test file)
   - No external dependencies
   - Located: `src/**/__tests__/*.test.ts` or `src/**/*.test.ts`

2. **Integration Tests**
   - Test component integration
   - May use temp files/directories
   - Reasonable execution time (<60s per suite)
   - Located: `tests/integration/*.test.ts`

3. **E2E Tests**
   - Test complete workflows
   - May spawn containers/workers
   - Longer execution allowed (up to 5 minutes)
   - Located: `tests/e2e/*.test.ts`

**TDD Requirements**

- Tests must be written before implementation
- Commits should include tests for new features
- Test file patterns: `*.test.ts`, `*.spec.ts` (and .tsx, .js, .jsx variants)
- Enforced by pre-push hook

### Security Standards

**Secret Management**

- Never commit hardcoded secrets
- Use 1Password CLI (`op://` references)
- Environment variables for runtime secrets
- `.env` files with `op://` references (never actual secrets)

**Vulnerability Management**

- Run `pnpm audit` before releases
- Fix high/critical vulnerabilities immediately
- Review moderate vulnerabilities
- Document accepted risks

**Security Patterns Detected**

The security check scans for:

```bash
# Hardcoded secrets pattern
(password|secret|api_key|private_key|access_token)\s*[:=]\s*["'][^"']+["']

# Security TODOs
TODO.*(security|auth|password|secret|vulnerability)
```

**Dependency Auditing**

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically if possible
pnpm audit fix

# View details
pnpm audit --audit-level=moderate
```

## Git Hook Lifecycle

### Pre-Commit Hook

**Trigger**: `git commit`

**Execution Time**: ~5-10 seconds

**What Runs**:

1. lint-staged (Prettier formatting on staged files)

**Exit Codes**:

- 0: Success, commit proceeds
- 1: Failure, commit blocked

**Bypass** (not recommended):

```bash
git commit --no-verify
```

### Pre-Push Hook

**Trigger**: `git push`

**Execution Time**: ~2-3 minutes

**What Runs**:

1. Build validation (both packages)
2. Lint validation (both packages)
3. Security checks
4. Unit tests (both packages)
5. Integration tests (both packages)
6. E2E tests (conductor-mcp)
7. Test file presence check
8. Main branch protection

**Exit Codes**:

- 0: Success, push proceeds
- 1: Failure, push blocked

**Special Cases**:

1. **First Push to Main**
   - Allowed if main branch is empty
   - Validation runs but is lenient
   - No test file requirement

2. **GitHub Actions**
   - Allowed to push to main (for release automation)
   - Full validation still runs
   - Test warnings auto-approved

3. **Tag Pushes**
   - Allowed in CI (for release tags)
   - Detected by `refs/tags/` pattern

**Bypass** (not recommended):

```bash
git push --no-verify
```

## Validation Flow

### Local Development

```
1. Make changes
   ↓
2. Pre-commit hook (on git commit)
   - Format staged files
   ↓
3. Pre-push hook (on git push)
   - Build
   - Lint
   - Security
   - Tests
   ↓
4. Push to remote
```

### CI/CD Pipeline

```
1. Push to GitHub
   ↓
2. Package-specific tests
   - Test boss-cli (if changed)
   - Test conductor-mcp (if changed)
   ↓
3. Integration tests
   - Full bootstrap flow
   - Worker spawning
   - E2E workflows
   ↓
4. Release workflow (on main)
   - Version bump via changesets
   - Publish to npm
   - Create GitHub release
```

## Quality Presets

BOSS supports three quality presets configured during bootstrap:

### Startup Preset

**Philosophy**: Fast iteration, ship quickly

**Configuration**:

- Coverage: 50%
- Mutation: 60%
- Hook strictness: Lenient
- Security: Basic checks

**Use Cases**:

- MVP development
- Prototypes
- Early-stage projects
- Rapid experimentation

### Production Preset (Default)

**Philosophy**: Balanced quality and velocity

**Configuration**:

- Coverage: 80%
- Mutation: 80%
- Hook strictness: Standard
- Security: Comprehensive checks

**Use Cases**:

- Production applications
- Team collaboration
- Long-term maintenance
- Standard projects

### Enterprise Preset

**Philosophy**: Maximum quality, compliance-ready

**Configuration**:

- Coverage: 90%
- Mutation: 90%
- Hook strictness: Strict
- Security: Full audits

**Use Cases**:

- Regulated industries
- Critical systems
- Large teams
- High-stakes applications

## Tool Details

### security-check.sh

**Purpose**: Detect potential security issues

**Checks**:

1. Hardcoded secrets in staged files
2. Security-related TODOs
3. Dependency vulnerabilities (pnpm audit)

**Output Format**:

```
⚠️  Warning: [Issue description]
   [Remediation steps]
```

**Exit Code**: Always 0 (warnings only, non-blocking)

**Performance**: ~5-10 seconds

**Configuration**: Edit script to add custom patterns

### pre-commit-check.sh

**Purpose**: Format staged files before commit

**Checks**:

1. Run lint-staged (Prettier)

**Output Format**:

```
🔍 Running pre-commit checks...
  ✓ Running lint-staged (Prettier formatting on staged files)...
✅ Pre-commit checks passed!
```

**Exit Code**:

- 0: All formatting succeeded
- 1: Formatting failed

**Performance**: ~5-10 seconds

**Configuration**: package.json `lint-staged` section

### pre-push.sh

**Purpose**: Comprehensive validation before push

**Checks**:

1. Build (pnpm build)
2. Lint (pnpm lint)
3. Security (security-check.sh)
4. Unit tests (pnpm test)
5. Integration tests (pnpm test:integration)
6. E2E tests (pnpm test:e2e)
7. Test file presence
8. Main branch protection

**Output Format**:

```
🔍 Running pre-push validation...
  ✓ Building packages...
  ✓ Running lint check...
  ✓ Running security checks...
  ✓ Running unit tests...
  ✓ Running integration tests...
  ✓ Checking for tests...
✅ Pre-push validation passed!
```

**Exit Code**:

- 0: All checks passed
- 1: Any check failed

**Performance**: ~2-3 minutes

**Configuration**: Edit script for custom checks

### test-changed.sh

**Purpose**: Quick test feedback for changed files

**Checks**:

1. Find staged TypeScript files
2. Locate related test files
3. Run only related tests
4. Skip e2e/integration/container tests

**Output Format**:

```
🧪 Running tests for boss-cli...
  Running tests:
    - boss-cli/src/utils/git.test.ts
✅ Tests for boss-cli passed
```

**Exit Code**:

- 0: All related tests passed
- 1: Any test failed

**Performance**: ~10-30 seconds

**Configuration**: Edit script for custom test patterns

## Error Messages and Fixes

### "Potential hardcoded secrets detected"

**Cause**: Pattern matching found possible secrets

**Fix**:

```bash
# Review files
grep -r "password\|secret\|api_key" src/

# Remove hardcoded values
# Use environment variables instead
STRIPE_KEY=op://boss/stripe/secret_key

# Or use 1Password references
const key = process.env.STRIPE_KEY;
```

### "Security vulnerabilities found in dependencies"

**Cause**: `pnpm audit` found vulnerabilities

**Fix**:

```bash
# View details
pnpm audit

# Auto-fix if possible
pnpm audit fix

# Update specific package
pnpm update package-name

# Document if can't fix
# Add to SECURITY.md
```

### "Build errors detected"

**Cause**: TypeScript compilation errors

**Fix**:

```bash
# View errors
pnpm build

# Common fixes:
# - Fix type errors
# - Add missing imports
# - Update tsconfig.json
# - Install missing dependencies

pnpm install
pnpm build
```

### "Linting errors detected"

**Cause**: ESLint rule violations

**Fix**:

```bash
# View errors
pnpm lint

# Auto-fix
pnpm lint --fix

# Manual fixes for complex issues
# Update .eslintrc if needed
```

### "Unit tests failing"

**Cause**: Test assertions failed

**Fix**:

```bash
# Run tests to see failures
pnpm test

# Run specific test
pnpm test src/utils/git.test.ts

# Debug test
# Add console.log, debugger
# Fix implementation or test

# Re-run
pnpm test
```

### "No test files in commits being pushed"

**Cause**: TDD Constitution requires tests

**Fix**:

```bash
# Add test file
touch src/features/my-feature.test.ts

# Write tests
# Commit tests
git add src/features/my-feature.test.ts
git commit -m "test: add tests for my-feature"

# Or document why tests not needed
# Add skip-changeset label to PR
```

## Best Practices

### Before Committing

1. Run changed file tests: `./tools/test-changed.sh`
2. Review staged changes: `git diff --cached`
3. Ensure tests included
4. Commit with conventional message

### Before Pushing

1. Run full quality check: `./tools/pre-push.sh`
2. Or use workflow command: `.claude/skills/workflow-management/tools/2-quality-check.sh`
3. Fix all failures before pushing
4. Don't bypass hooks

### Security

1. Never commit secrets
2. Use 1Password CLI for credentials
3. Review security warnings
4. Run `pnpm audit` before releases
5. Update dependencies regularly

### Testing

1. Write tests first (TDD)
2. Include unit, integration, and e2e tests
3. Aim for good coverage (per preset)
4. Keep tests fast and focused
5. Mock external dependencies

### Continuous Improvement

1. Review failed CI runs
2. Update quality gates as needed
3. Add custom security patterns
4. Refine test strategies
5. Document accepted risks

## Integration Points

### With workflow-management

Step 2 (quality-check) uses these tools:

```bash
.claude/skills/workflow-management/tools/2-quality-check.sh
# Internally runs:
# - pnpm build
# - pnpm lint
# - pnpm test
# - security-check.sh
```

### With GitHub Actions

CI workflows use same validation:

```yaml
# .github/workflows/1.0-test-boss-cli.yml
- run: pnpm build
- run: pnpm lint
- run: pnpm test
```

### With Changesets

Release process requires:

- All quality gates passing
- Changeset created
- PR reviewed and approved
- Main branch protection

## Troubleshooting

### Hooks not running

**Symptoms**: Commits/pushes succeed without validation

**Diagnosis**:

```bash
# Check hooks exist
ls -la .git/hooks/

# Check executable
stat .git/hooks/pre-push

# Check hook path
git config core.hooksPath
```

**Fix**:

```bash
# Re-install hooks
cp scripts/pre-commit-check.sh .git/hooks/pre-commit
cp scripts/pre-push.sh .git/hooks/pre-push

# Make executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

# Test manually
.git/hooks/pre-push
```

### Slow validation

**Symptoms**: Pre-push takes >5 minutes

**Diagnosis**:

```bash
# Time each step
time pnpm build
time pnpm lint
time pnpm test
time pnpm test:integration
time pnpm test:e2e
```

**Optimization**:

```bash
# Skip integration/e2e locally (not recommended)
# Comment out in pre-push.sh

# Or use test-changed for quick checks
./tools/test-changed.sh

# Full validation only before push
```

### CI failures but local passes

**Symptoms**: Local validation passes, CI fails

**Common Causes**:

1. Missing files in git
2. Environment differences
3. Dependency issues
4. Timing issues

**Diagnosis**:

```bash
# Check what's committed
git status

# Verify dependencies
pnpm install --frozen-lockfile

# Run same commands as CI
pnpm build
pnpm test
```

**Fix**:

```bash
# Ensure all files committed
git add .

# Update lockfile
pnpm install

# Re-run validation
./tools/pre-push.sh
```

## Advanced Configuration

### Custom Quality Gates

Add custom checks to pre-push.sh:

```bash
# Add before "echo '✅ Pre-push validation passed!'"

echo "  ✓ Running custom check..."
if ! ./scripts/my-custom-check.sh; then
  echo "❌ Custom check failed"
  exit 1
fi
```

### Custom Security Patterns

Add to security-check.sh:

```bash
# Add custom pattern
if echo "$staged_files" | xargs grep -lE 'CUSTOM_PATTERN' 2>/dev/null; then
  echo "⚠️  Warning: Custom security issue detected"
  echo "   Review the files above"
fi
```

### Project-Specific Presets

Create custom preset in boss-cli:

```typescript
// boss-cli/src/presets/my-preset.ts
export const myPreset: QualityPreset = {
  name: 'my-preset',
  coverage: 85,
  mutation: 85,
  // ... other settings
};
```

## Metrics and Monitoring

### Quality Metrics

Track these metrics:

- Build success rate
- Test coverage percentage
- Lint error count
- Security vulnerability count
- Pre-push validation time
- CI/CD success rate

### Performance Metrics

Monitor validation performance:

- Pre-commit time (target: <10s)
- Pre-push time (target: <3min)
- Unit test time (target: <60s)
- Integration test time (target: <2min)
- E2E test time (target: <5min)

### Trend Analysis

Review trends monthly:

- Coverage trending up?
- Vulnerabilities trending down?
- Validation time acceptable?
- False positives decreasing?

## Resources

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [pnpm Audit](https://pnpm.io/cli/audit)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Conventional Commits](https://www.conventionalcommits.org/)
