# Manual Test Scripts

These scripts are for manual testing and verification of boss-cli templates. They are **not** run in CI/CD.

For automated testing, see `boss-cli/tests/integration/` which includes:

- `template-e2e.test.ts` - E2E tests for all templates
- `git-hooks-e2e.test.ts` - E2E tests for git hooks enforcement

## Available Scripts

### Template Tests

- `test-bootstrap.sh` - Test blank template bootstrap and quality gates
- `test-api-service.sh` - Test API service template
- `test-nextjs.sh` - Test Next.js monorepo template
- `test-t3.sh` - Test T3 stack template

### Git Hooks Test

- `test-git-hooks.sh` - Test Husky git hooks enforcement (pre-commit, commit-msg, pre-push)

## Usage

```bash
# From repo root
bash ./scripts/manual-tests/test-bootstrap.sh
bash ./scripts/manual-tests/test-api-service.sh
bash ./scripts/manual-tests/test-nextjs.sh
bash ./scripts/manual-tests/test-t3.sh
bash ./scripts/manual-tests/test-git-hooks.sh
```

## Test Results

See `TEMPLATE_TEST_RESULTS.md` in the repo root for comprehensive test results and known issues.

## Running Automated Tests

```bash
# Run all integration tests (including E2E)
cd boss-cli
pnpm test:integration

# Run only E2E tests
pnpm test:e2e

# Run specific test file
pnpm vitest run tests/integration/template-e2e.test.ts
pnpm vitest run tests/integration/git-hooks-e2e.test.ts
```
