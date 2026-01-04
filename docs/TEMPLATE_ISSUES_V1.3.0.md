# Template Issues Found in v1.3.0

## Executive Summary

The Next.js Turbo Monorepo template has critical issues that prevent successful bootstrapping and usage. These issues should have been caught by integration tests but were not.

**Impact**: Users cannot successfully bootstrap and use projects with the `nextjs-app-turbo` template in v1.3.0.

## Critical Issues Found

### 1. Missing/Incomplete .gitignore

**Issue**: The template's `_gitignore` file is incomplete and missing critical entries.

**Evidence**:

- Template file: `boss-cli/templates/nextjs-turbo-monorepo/base/_gitignore`
- Missing: `node_modules/` entry (lines 3-6 only have partial coverage)
- Missing: `pnpm-lock.yaml`
- Missing: `.turbo/` build cache
- Missing: `*.tsbuildinfo` TypeScript build info

**Impact**:

- node_modules (29,000+ files, 123MB) get committed to git
- GitHub rejects push due to file size limits
- Users cannot complete initial setup

**Root Cause**: Template was created/updated without validating the .gitignore works

### 2. NextAuth v5 Type Export Issues

**Issue**: The template uses NextAuth v5 beta which has type inference issues with TypeScript's strict mode.

**Evidence**:

```typescript
// boss-cli/templates/nextjs-turbo-monorepo/base/packages/auth/src/config.ts:88
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

**Error**:

```
error TS2742: The inferred type of 'handlers' cannot be named without a reference to...
```

**Current Workaround Applied by User**:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig) as any;
```

**Impact**:

- TypeScript compilation fails
- `pnpm typecheck` fails
- Pre-push hooks block pushing

**Root Cause**: Using beta version of next-auth (5.0.0-beta.25) with unresolved type issues

### 3. Missing ESLint Configuration

**Issue**: Template packages reference ESLint but don't have configuration files.

**Evidence**:

- Packages have `"lint": "eslint . --max-warnings 0"` in package.json
- No `eslint.config.js` files in packages
- Only root has ESLint 9.x flat config

**Error**:

```
ERROR: command (/path/to/packages/utils) pnpm run lint exited (2)
Error: Could not find config file.
```

**Impact**:

- `pnpm lint` fails
- Pre-commit hooks fail
- Pre-push hooks fail

**Root Cause**: ESLint 9.x requires explicit configuration, template assumes inherited config

### 4. Invalid lint-staged Configuration

**Issue**: Generated lint-staged configuration uses old format.

**Evidence**:
Error message shows:

```
Invalid value for 'linters': {
  '*.{js,json,ts}': [ 'prettier --write', 'git add' ],
  '*.mdi', 'prettier --write', 'git add' ]
}
```

**Impact**:

- Pre-commit hook fails
- Users cannot commit changes
- Blocks entire workflow

**Root Cause**: lint-staged configuration generator using outdated format

### 5. Missing Prisma Client Generation

**Issue**: Template includes Prisma schema but doesn't generate client during bootstrap.

**Evidence**:

- Template has `packages/database/prisma/schema.prisma`
- No `pnpm db:generate` run during bootstrap
- TypeScript compilation fails without generated Prisma client

**Error**:

```
packages/database/src/index.ts:1:27 - error TS2307: Cannot find module '@prisma/client'
```

**Impact**:

- TypeScript fails immediately after bootstrap
- Users must manually run `pnpm db:generate`
- Not documented in bootstrap output

**Root Cause**: Bootstrap process doesn't run post-install generation steps

### 6. Missing Test Files

**Issue**: Template generates package structure but no test files.

**Evidence**:

- `pnpm test:unit` script exists in package.json
- No `.test.ts` or `.spec.ts` files in template
- Tests fail with "No test files found"

**Error**:

```
ERROR: command (/path/to/packages/database) pnpm run test:unit exited (1)
No test files found
```

**Impact**:

- `pnpm test:unit` fails
- Pre-push hooks block pushing
- Users must create dummy tests to proceed

**Root Cause**: Template doesn't include skeleton test files

## Why Weren't These Caught?

### Current Test Coverage Analysis

**Unit Tests**: ✅ PASS

- Tests mock all file operations
- Don't actually generate real projects
- Don't run quality gates on generated output
- Example: `boss-cli/src/commands/__tests__/bootstrap.test.ts` - all mocked

**Integration Tests**: ⚠️ PARTIAL

- `boss-cli/tests/integration/template-e2e.test.ts` exists
- **BUT** has explicit skips/workarounds for nextjs-turbo-monorepo:
  ```typescript
  // Line 154-156
  // Note: Type check is expected to fail due to next-auth v5 beta type issues
  // This is documented in TEMPLATE_TEST_RESULTS.md
  // Skipping full quality gates for this template until next-auth issues are resolved
  ```
- Known issues were documented but not fixed
- Tests pass by skipping validation

**E2E Tests**: ❌ NOT COMPREHENSIVE ENOUGH

- Don't test complete workflow: bootstrap → install → typecheck → lint → test → push
- Don't validate .gitignore actually works (would catch node_modules issue)
- Don't run in CI with actual git operations

### Test Gaps

1. **No Real Git Operations Test**: Tests don't actually try to `git add` and check what files are staged
2. **No Quality Gate Validation**: Tests skip running actual `pnpm typecheck`, `pnpm lint`, `pnpm test`
3. **Mocked Too Much**: File operations are mocked, so bad .gitignore isn't detected
4. **Known Issues Accepted**: Comments like "expected to fail" mean issues aren't blocking

## Recommendations

### Immediate Fixes (This PR)

1. ✅ Fix `.gitignore` template - add all missing entries
2. ✅ Fix NextAuth type exports - use proper type annotations or downgrade to stable
3. ✅ Add ESLint configs to all packages
4. ✅ Fix lint-staged configuration format
5. ✅ Add Prisma generation to bootstrap process
6. ✅ Add skeleton test files to template packages
7. ✅ Update integration tests to NOT skip quality gates

### Long-term Improvements

1. **Use Battle-Tested Templates**:
   - Fork/adapt Vercel's official Turborepo examples
   - Use create-t3-turbo or similar proven starters
   - Don't reinvent the wheel with custom templates

2. **Comprehensive E2E Tests**:
   - Actually bootstrap a project in CI
   - Run `pnpm install` (not mocked)
   - Run all quality gates (`typecheck`, `lint`, `test`)
   - Try to `git add .` and verify only correct files are staged
   - Try to push to a test repository

3. **Quality Gate CI**:
   - Add CI job that bootstraps each template
   - Runs full workflow end-to-end
   - Fails if any quality gate fails
   - Runs on every PR that touches templates

4. **Template Validation Tool**:
   - Script that validates template before release
   - Checks all required files exist
   - Verifies package.json scripts work
   - Ensures .gitignore includes essentials

## Impact Assessment

**Severity**: 🔴 Critical

**Users Affected**: All users trying to use `nextjs-app-turbo` template in v1.3.0

**Workaround Complexity**: High

- Requires manual fixes to multiple files
- Requires knowledge of TypeScript, ESLint, Prisma
- Requires use of `--no-verify` to bypass hooks
- Users may abandon BOSS entirely

**Time to Fix**:

- Immediate fixes: 2-4 hours
- Comprehensive E2E tests: 4-8 hours
- Template replacement research: 8-16 hours

## Related Files

- `boss-cli/templates/nextjs-turbo-monorepo/base/_gitignore`
- `boss-cli/templates/nextjs-turbo-monorepo/base/packages/auth/src/config.ts`
- `boss-cli/tests/integration/template-e2e.test.ts`
- `boss-cli/src/commands/bootstrap.ts`
- `boss-cli/src/generators/template-loader.ts`

## Next Steps

1. Apply immediate fixes to template
2. Remove test skips and verify tests pass
3. Create comprehensive E2E test
4. Consider replacing template with proven alternative
5. Add template validation to CI/CD pipeline
