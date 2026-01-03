# BOSS CLI Tests

Comprehensive test suite for the BOSS Bootstrap CLI.

## Test Structure

- **Unit Tests** (`src/**/__tests__/`) - Test individual functions and modules
- **Integration Tests** (`tests/integration/`) - Test full bootstrap flows
- **Helpers** (`tests/helpers/`) - Test utilities and fixtures

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run integration tests only
pnpm test:integration
```

## Test Coverage

Tests cover:

- ✅ Input validation
- ✅ File system operations
- ✅ Config generation (BOSS, MCP, Container-Use)
- ✅ Worker configuration generation
- ✅ Spec-Kit structure copying
- ✅ Template loading
- ✅ Quality preset application
- ✅ Full bootstrap flow
- ✅ All three templates (nextjs-app-turbo, api-service-fastify, blank)
- ✅ All three quality presets (startup, production, enterprise)

## Writing New Tests

1. Unit tests go in `src/**/__tests__/`
2. Integration tests go in `tests/integration/`
3. Use test helpers from `tests/helpers/test-utils.ts`
4. Clean up test projects in `afterEach` hooks
