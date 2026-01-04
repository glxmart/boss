# Test-First Methodology

## Description

Create, modify, and validate tests using Test-Driven Development (TDD) and Behavior-Driven Development (BDD). Use when implementing features, writing test suites, achieving coverage requirements, or ensuring code quality through test-first practices.

## Overview

BOSS mandates Test-First development for all implementation work. This is NON-NEGOTIABLE per the constitution established by the architect. Every line of code must be preceded by a failing test.

**Core Principles**:
- **RED**: Write failing test first
- **GREEN**: Make test pass with minimal code
- **REFACTOR**: Clean up while keeping tests green
- **BDD**: Given/When/Then scenarios from spec.md become tests
- **Coverage**: Minimum 80% line, branch, and function coverage
- **Mutation**: Minimum 80% mutation score

## TDD Cycle (RED-GREEN-REFACTOR)

### Phase 1: RED (Write Failing Test)

```typescript
// Step 1: Write test FIRST (before implementation exists)
import { describe, it, expect } from 'vitest';
import { registerUser } from './register'; // ← Doesn't exist yet!

describe('registerUser', () => {
  it('creates user with valid email and password', async () => {
    const result = await registerUser({
      email: 'test@example.com',
      password: 'SecurePass123',
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.id).toBeDefined();
  });
});

// Step 2: Run test → Should FAIL
// pnpm test src/auth/register.test.ts
// ❌ FAIL: Cannot find module './register'
```

**Why RED First?**:
- Ensures test actually runs and can fail
- Validates test is testing the right thing
- Prevents false positives from tests that never fail

### Phase 2: GREEN (Make Test Pass)

```typescript
// src/auth/register.ts - Minimal implementation to pass
import { prisma } from '@repo/database';

export async function registerUser(data: { email: string; password: string }) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: await hashPassword(data.password),
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

// Step 3: Run test → Should PASS
// pnpm test src/auth/register.test.ts
// ✅ PASS: 1 test passed
```

**Why Minimal Code?**:
- Avoid over-engineering
- Only write code that's needed to pass tests
- YAGNI (You Aren't Gonna Need It)

### Phase 3: REFACTOR (Clean Up)

```typescript
// Refactor while keeping tests green
export async function registerUser(data: RegisterInput) {
  validateEmail(data.email);        // Extract validation
  const hashedPassword = await hashPassword(data.password);

  const user = await createUserInDatabase({
    email: data.email,
    password: hashedPassword,
  });

  return formatUserResponse(user);   // Extract formatting
}

// Step 4: Run test → Should STILL PASS
// pnpm test src/auth/register.test.ts
// ✅ PASS: 1 test passed (same result, cleaner code)
```

**What to Refactor**:
- Extract duplicated code
- Improve naming
- Simplify complex logic
- Add type safety
- Optimize performance

**RED-GREEN-REFACTOR is mandatory for EVERY feature**

## BDD: Given/When/Then

### From Spec to Test

Spec-Kit specifications use BDD format - convert them directly to tests:

**spec.md (from spec-writer)**:
```markdown
**Scenario 1.1: Successful Registration**
- **Given** I am on the registration page
- **And** I have a valid email "user@example.com"
- **And** I have a strong password "SecurePass123"
- **When** I submit the registration form
- **Then** I should see "Registration successful" message
- **And** I should receive a verification email
- **And** my account should be created in the database
```

**Converted to Test**:
```typescript
describe('User Registration', () => {
  describe('Scenario 1.1: Successful Registration', () => {
    it('shows success message, sends verification email, and creates account', async () => {
      // GIVEN: Valid inputs
      const email = 'user@example.com';
      const password = 'SecurePass123';

      // WHEN: Submit registration
      const result = await registerUser({ email, password });

      // THEN: Success message
      expect(result.message).toBe('Registration successful');

      // AND: Verification email sent
      expect(emailService.sendVerification).toHaveBeenCalledWith(email);

      // AND: Account created in database
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
    });
  });
});
```

### BDD Best Practices

```typescript
// ✅ Good - descriptive test names match scenarios
describe('Scenario 1.2: Invalid Email Format', () => {
  it('rejects registration and shows error message', async () => {
    // ...
  });
});

// ✅ Good - clear Given/When/Then structure
it('calculates total price with tax', () => {
  // GIVEN
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // WHEN
  const total = calculateTotal(items, taxRate);

  // THEN
  expect(total).toBe(330); // (100 + 200) * 1.1
});

// ❌ Bad - unclear what's being tested
it('works correctly', () => {
  const result = doSomething();
  expect(result).toBeTruthy();
});

// ❌ Bad - testing multiple scenarios in one test
it('handles all cases', () => {
  expect(func(1)).toBe(2);
  expect(func(2)).toBe(4);
  expect(func('invalid')).toThrow();
  // Too many concerns!
});
```

## Test Pyramid

Maintain 70% unit / 20% integration / 10% E2E distribution:

### Unit Tests (70%)

**Purpose**: Test individual functions/components in isolation.

```typescript
// Unit test - fast, isolated
describe('calculateDiscount', () => {
  it('applies 10% discount to regular users', () => {
    expect(calculateDiscount(100, 'regular')).toBe(90);
  });

  it('applies 20% discount to premium users', () => {
    expect(calculateDiscount(100, 'premium')).toBe(80);
  });

  it('throws error for negative amounts', () => {
    expect(() => calculateDiscount(-10, 'regular')).toThrow('Amount must be positive');
  });
});

// Mock dependencies
vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
```

**Characteristics**:
- Fast (< 1ms each)
- No external dependencies (database, API, filesystem)
- Test pure logic
- Use mocks/stubs for dependencies

### Integration Tests (20%)

**Purpose**: Test multiple components working together.

```typescript
// Integration test - real database, real services
describe('User Registration Integration', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany(); // Clean database
  });

  it('registers user and sends welcome email', async () => {
    // Uses real Prisma, real email service
    const result = await registerUser({
      email: 'test@example.com',
      password: 'SecurePass123',
    });

    // Verify database state
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(user).toBeDefined();

    // Verify email was sent (integration with email service)
    expect(emailService.sentEmails).toHaveLength(1);
    expect(emailService.sentEmails[0].to).toBe('test@example.com');
  });
});
```

**Characteristics**:
- Slower (10-100ms each)
- Use real databases (test database, not production)
- Test multiple layers together
- Verify integrations between systems

### E2E Tests (10%)

**Purpose**: Test complete user flows from UI to database.

```typescript
// E2E test - real browser, real UI, real backend
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Navigate to registration
  await page.goto('/register');

  // Fill form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page.locator('text=Registration successful')).toBeVisible();

  // Navigate to login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

**Characteristics**:
- Slowest (1-10s each)
- Real browser interaction
- Test critical user journeys
- Catch issues that unit/integration tests miss

## Coverage Requirements

### Line/Branch/Function Coverage (≥80%)

```bash
# Run tests with coverage
pnpm test:coverage

# Output:
# File         | % Stmts | % Branch | % Funcs | % Lines |
# auth/        |   87.5  |   82.3   |   90.0  |   88.2  | ✅
# users/       |   92.1  |   88.7   |   95.0  |   91.5  | ✅
# payments/    |   76.4  |   71.2   |   80.0  |   75.8  | ❌ Below 80%
```

**Meeting Coverage**:
```typescript
// ❌ Low coverage - only happy path
test('processes payment', () => {
  expect(processPayment(100)).resolves.toBe(true);
});
// Coverage: 50% (missing error cases, edge cases)

// ✅ High coverage - happy path + edge cases + errors
describe('processPayment', () => {
  it('processes valid payment', async () => {
    expect(await processPayment(100)).toBe(true);
  });

  it('rejects negative amounts', async () => {
    await expect(processPayment(-10)).rejects.toThrow('Invalid amount');
  });

  it('rejects zero amount', async () => {
    await expect(processPayment(0)).rejects.toThrow('Invalid amount');
  });

  it('handles payment gateway timeout', async () => {
    vi.mocked(paymentGateway.process).mockRejectedValue(new TimeoutError());
    await expect(processPayment(100)).rejects.toThrow('Payment timeout');
  });
});
// Coverage: 95% (all branches tested)
```

### Mutation Testing (≥80%)

**Purpose**: Ensure tests actually catch bugs (not just execute code).

```bash
# Run mutation testing
pnpm test:mutation

# Stryker mutates code and re-runs tests
# If tests still pass after mutation, tests are weak
```

**Example**:
```typescript
// Original code
function calculateDiscount(amount: number, userType: string) {
  if (userType === 'premium') {
    return amount * 0.8; // 20% discount
  }
  return amount * 0.9; // 10% discount
}

// Mutation 1: Change 0.8 to 0.9
// If test still passes → test doesn't verify actual discount amount!

// ❌ Weak test (mutation survives)
it('applies discount to premium users', () => {
  const result = calculateDiscount(100, 'premium');
  expect(result).toBeLessThan(100); // Too vague!
});

// ✅ Strong test (mutation killed)
it('applies 20% discount to premium users', () => {
  const result = calculateDiscount(100, 'premium');
  expect(result).toBe(80); // Exact value - catches mutation!
});
```

## Testing Patterns for BOSS Stack

### Testing tRPC Routers

```typescript
// src/server/api/routers/user.test.ts
import { appRouter } from '../root';
import { createInnerTRPCContext } from '../trpc';
import { prisma } from '@repo/database';

describe('user.list', () => {
  it('returns all users', async () => {
    // Setup
    await prisma.user.createMany({
      data: [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ],
    });

    // Create tRPC caller
    const ctx = createInnerTRPCContext({});
    const caller = appRouter.createCaller(ctx);

    // Execute
    const users = await caller.user.list();

    // Verify
    expect(users).toHaveLength(2);
    expect(users[0].email).toBe('user1@example.com');
  });
});
```

### Testing Server Components

```typescript
// app/users/page.test.tsx
import { render } from '@testing-library/react';
import UsersPage from './page';

// Mock API call
vi.mock('@/lib/trpc/server', () => ({
  api: {
    user: {
      list: vi.fn().mockResolvedValue([
        { id: '1', name: 'User 1', email: 'user1@example.com' },
      ]),
    },
  },
}));

test('renders user list', async () => {
  const { findByText } = render(await UsersPage());

  expect(await findByText('User 1')).toBeDefined();
  expect(await findByText('user1@example.com')).toBeDefined();
});
```

### Testing Client Components

```typescript
// components/UserForm.test.tsx
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UserForm } from './UserForm';

test('submits form with valid data', async () => {
  const onSubmit = vi.fn();
  render(<UserForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
  await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com',
  });
});
```

### Testing Prisma Queries

```typescript
// services/user.test.ts
import { prisma } from '@repo/database';
import { createUser, getUser } from './user';

describe('createUser', () => {
  it('creates user in database', async () => {
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user.id).toBeDefined();

    // Verify in database
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe('test@example.com');
  });
});
```

## Test Organization

### File Structure

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx              # Co-located with component
├── api/
│   ├── users.ts
│   └── users.test.ts                # Co-located with API route
└── services/
    ├── user.ts
    └── user.test.ts                 # Co-located with service

tests/
├── integration/
│   └── user-registration.test.ts   # Integration tests
└── e2e/
    └── auth-flow.spec.ts            # Playwright E2E tests
```

### Test Naming

```typescript
// ✅ Good - describes what and why
describe('UserService', () => {
  describe('createUser', () => {
    it('creates user with hashed password', () => {});
    it('rejects duplicate email addresses', () => {});
    it('sends welcome email after creation', () => {});
  });
});

// ❌ Bad - vague names
describe('test user stuff', () => {
  it('test1', () => {});
  it('works', () => {});
});
```

## Common Patterns

### Setup and Teardown

```typescript
describe('User API', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    // Cleanup if needed
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Disconnect from database after all tests
    await prisma.$disconnect();
  });
});
```

### Test Fixtures

```typescript
// tests/fixtures/users.ts
export const validUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'SecurePass123',
};

export const premiumUser = {
  ...validUser,
  tier: 'premium',
};

// In tests:
import { validUser } from '../fixtures/users';

test('creates user', async () => {
  const user = await createUser(validUser);
  expect(user.email).toBe(validUser.email);
});
```

### Mocking

```typescript
// Mock external service
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Prisma
vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      create: vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
      findUnique: vi.fn(),
    },
  },
}));

// Verify mock was called
expect(sendEmail).toHaveBeenCalledWith({
  to: 'test@example.com',
  subject: 'Welcome',
});
```

## Anti-Patterns

### ❌ Testing Implementation Details

```typescript
// ❌ Bad - tests internal state
test('increments counter', () => {
  const component = new Counter();
  component.count = 5; // Testing private state
  expect(component.count).toBe(5);
});

// ✅ Good - tests behavior
test('increments counter', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Count: 1')).toBeDefined();
});
```

### ❌ Testing Third-Party Libraries

```typescript
// ❌ Bad - testing Next.js router
test('Next.js router works', () => {
  const router = useRouter();
  router.push('/test');
  expect(router.pathname).toBe('/test');
});

// ✅ Good - test YOUR code that uses router
test('navigates to dashboard on login', async () => {
  const mockPush = vi.fn();
  vi.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }));

  await userEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});
```

### ❌ Skipping Edge Cases

```typescript
// ❌ Bad - only happy path
test('adds numbers', () => {
  expect(add(2, 3)).toBe(5);
});

// ✅ Good - edge cases covered
describe('add', () => {
  it('adds positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('adds negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('adds zero', () => {
    expect(add(0, 5)).toBe(5);
  });

  it('handles floating point', () => {
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });
});
```

## Workflow Integration

### Developer Workflow

```bash
# 1. Read spec.md scenario
cat .specify/specs/user-authentication/spec.md

# 2. Write FAILING test (RED)
cat > src/auth/register.test.ts << 'EOF'
test('registers user', () => {
  expect(await registerUser({ ... })).toBeDefined();
});
EOF
pnpm test src/auth/register.test.ts
# ❌ FAIL: registerUser is not defined

# 3. Implement minimal code (GREEN)
cat > src/auth/register.ts << 'EOF'
export async function registerUser() { ... }
EOF
pnpm test src/auth/register.test.ts
# ✅ PASS

# 4. Refactor (keep GREEN)
# Clean up code, add edge cases, improve structure
pnpm test src/auth/register.test.ts
# ✅ PASS

# 5. Verify coverage
pnpm test:coverage
# Coverage: 87.5% ✅

# 6. Commit
git add src/auth/register.ts src/auth/register.test.ts
git commit -m "feat: implement user registration with TDD"
```

## When to Use This Skill

- Implementing any feature (TDD is mandatory)
- Converting BDD scenarios from spec.md to tests
- Achieving coverage requirements (≥80%)
- Writing mutation-resistant tests
- Organizing test suites
- Testing tRPC routers, Prisma queries, React components

## Related Skills

- `nextjs-turbo-stack.md` - Testing with Vitest in the stack
- `spec-kit-workflow.md` - Converting spec.md to tests
- `boss-manifest-protocol.md` - Reporting test results

## Key Takeaways

1. **RED-GREEN-REFACTOR** - Mandatory cycle for ALL code
2. **Test First, Always** - No code without a failing test
3. **BDD Scenarios → Tests** - Direct conversion from spec.md
4. **Test Pyramid** - 70% unit, 20% integration, 10% E2E
5. **Coverage Minimums** - 80% line/branch/function, 80% mutation
6. **Strong Assertions** - Exact values, not vague checks
7. **Test Behavior** - Not implementation details
