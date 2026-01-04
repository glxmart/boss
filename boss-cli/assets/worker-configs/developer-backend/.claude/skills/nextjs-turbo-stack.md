# Next.js Turbo Stack

## Description

Create, modify, and review applications built with the Next.js Turbo monorepo stack. Use when working with Next.js 15, React 19, tRPC 11, Prisma 5.24, Tailwind CSS, Storybook, Vitest, Turbo, NextAuth v5, and pnpm workspaces.

## Overview

The BOSS nextjs-turbo-monorepo template provides a production-ready stack optimized for rapid development with type safety, testing, and scalability.

**Core Stack**:
- **Next.js 15** - React framework with App Router, server components, server actions
- **React 19** - UI library with new use hook, server components, concurrent features
- **tRPC 11** - Type-safe APIs without code generation
- **Prisma 5.24** - Type-safe database ORM with migrations
- **Tailwind CSS v4** - Utility-first CSS with shadcn/ui components
- **Storybook** - Component development and documentation
- **Vitest** - Fast unit testing with React Testing Library
- **Turbo** - High-performance monorepo build system
- **NextAuth v5** - Authentication with providers and sessions
- **pnpm** - Fast, disk-efficient package manager

## Monorepo Structure

```
project/
├── apps/
│   ├── web/                    # Main Next.js app
│   │   ├── app/                # App Router (Next.js 15)
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities
│   │   └── public/             # Static assets
│   └── admin/                  # Admin dashboard (optional)
├── packages/
│   ├── ui/                     # Shared React component library
│   │   ├── src/                # Component source
│   │   ├── .storybook/         # Storybook config
│   │   └── stories/            # Component stories
│   ├── database/               # Prisma ORM
│   │   ├── prisma/             # Schema and migrations
│   │   └── src/                # Prisma Client exports
│   ├── auth/                   # NextAuth configuration
│   │   └── src/                # Auth helpers and config
│   ├── trpc/                   # tRPC routers
│   │   └── src/                # API routers and procedures
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared configs
│       ├── eslint/             # ESLint config
│       ├── typescript/         # TypeScript config
│       └── tailwind/           # Tailwind config
├── turbo.json                  # Turbo pipeline config
├── pnpm-workspace.yaml         # pnpm workspace config
└── package.json                # Root package.json
```

## Next.js 15 (App Router)

### File-Based Routing

```
app/
├── layout.tsx                  # Root layout (wraps all pages)
├── page.tsx                    # Home page (/)
├── loading.tsx                 # Loading UI
├── error.tsx                   # Error boundary
├── not-found.tsx               # 404 page
├── dashboard/
│   ├── layout.tsx              # Dashboard layout
│   ├── page.tsx                # /dashboard
│   └── settings/
│       └── page.tsx            # /dashboard/settings
└── api/
    └── webhooks/
        └── route.ts            # API route
```

### Server Components (Default)

```tsx
// app/dashboard/page.tsx - Server Component (default)
import { prisma } from '@repo/database';

export default async function DashboardPage() {
  // Fetch data directly in server component
  const users = await prisma.user.findMany();

  return (
    <div>
      <h1>Dashboard</h1>
      <UserList users={users} />
    </div>
  );
}

// No need for useEffect or useState for data fetching!
```

### Client Components

```tsx
'use client'; // Required for client-side interactivity

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// Use client components for:
// - useState, useEffect, event handlers
// - Browser-only APIs (localStorage, window)
// - Interactive UI components
```

### Server Actions

```tsx
// app/actions/user.ts
'use server';

import { prisma } from '@repo/database';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const user = await prisma.user.create({
    data: { name, email }
  });

  revalidatePath('/users');
  return user;
}

// Call from client component:
// <form action={createUser}>...</form>
```

### Metadata API

```tsx
// app/dashboard/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'User dashboard',
};

// Or dynamic metadata:
export async function generateMetadata({ params }): Promise<Metadata> {
  const user = await getUser(params.id);
  return {
    title: user.name,
  };
}
```

### Middleware

```typescript
// middleware.ts (root level)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth check
  const token = request.cookies.get('session');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

## React 19

### New `use` Hook

```tsx
import { use } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // `use` hook unwraps promises (React 19)
  const user = use(userPromise);

  return <div>{user.name}</div>;
}

// Call from server component:
// <UserProfile userPromise={fetchUser()} />
```

### Transitions

```tsx
'use client';

import { useTransition } from 'react';

export function SearchForm() {
  const [isPending, startTransition] = useTransition();

  const handleSearch = (query: string) => {
    startTransition(() => {
      // Non-urgent update
      setSearchResults(query);
    });
  };

  return (
    <input
      onChange={(e) => handleSearch(e.target.value)}
      placeholder={isPending ? 'Searching...' : 'Search'}
    />
  );
}
```

### Server Components Best Practices

```tsx
// ✅ Good - fetch data in server component
async function UserDashboard() {
  const users = await prisma.user.findMany();
  return <UserList users={users} />;
}

// ✅ Good - pass data to client component as props
'use client';
function UserList({ users }: { users: User[] }) {
  const [selected, setSelected] = useState<User | null>(null);
  return <div>...</div>;
}

// ❌ Bad - fetch in client component (old pattern)
'use client';
function UserDashboard() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);
  return <div>...</div>;
}
```

## tRPC 11

### Router Setup

```typescript
// packages/trpc/src/router.ts
import { initTRPC } from '@trpc/server';
import { prisma } from '@repo/database';

const t = initTRPC.create();

export const appRouter = t.router({
  user: {
    list: t.procedure.query(async () => {
      return prisma.user.findMany();
    }),

    create: t.procedure
      .input(z.object({ name: z.string(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        return prisma.user.create({ data: input });
      }),

    getById: t.procedure
      .input(z.string())
      .query(async ({ input }) => {
        return prisma.user.findUnique({ where: { id: input } });
      }),
  },
});

export type AppRouter = typeof appRouter;
```

### Client Usage (Server Component)

```tsx
// app/users/page.tsx
import { api } from '@/lib/trpc/server';

export default async function UsersPage() {
  const users = await api.user.list();

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Client Usage (Client Component)

```tsx
'use client';

import { api } from '@/lib/trpc/client';

export function UserForm() {
  const utils = api.useUtils();
  const createUser = api.user.create.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
    },
  });

  const handleSubmit = (data: { name: string; email: string }) => {
    createUser.mutate(data);
  };

  return <form>...</form>;
}
```

### tRPC Best Practices

```typescript
// ✅ Good - type-safe inputs with Zod
.input(z.object({ email: z.string().email() }))

// ✅ Good - structured routers
export const appRouter = t.router({
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
});

// ✅ Good - error handling
.mutation(async ({ input }) => {
  try {
    return await prisma.user.create({ data: input });
  } catch (error) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
  }
})

// ❌ Bad - no input validation
.mutation(async ({ input }) => {
  return prisma.user.create({ data: input as any });
})
```

## Prisma 5.24

### Schema Design

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  profile   Profile?

  @@index([email])
  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@map("posts")
}

model Profile {
  id     String @id @default(cuid())
  bio    String?
  userId String @unique

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}
```

### Migrations

```bash
# Create migration
pnpm --filter database prisma migrate dev --name add_user_model

# Apply migrations in production
pnpm --filter database prisma migrate deploy

# Reset database (development only!)
pnpm --filter database prisma migrate reset

# Generate Prisma Client
pnpm --filter database prisma generate
```

### Prisma Client Usage

```typescript
// packages/database/src/index.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// CRUD operations
export async function createUser(data: { email: string; name: string }) {
  return prisma.user.create({ data });
}

export async function getUsers() {
  return prisma.user.findMany({
    include: {
      posts: true,
      profile: true,
    },
  });
}

export async function updateUser(id: string, data: { name?: string }) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
```

### Transactions

```typescript
const [user, profile] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'test@example.com' } }),
  prisma.profile.create({ data: { bio: 'Hello', userId: '...' } }),
]);

// Or interactive transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'test@example.com' } });
  await tx.profile.create({ data: { bio: 'Hello', userId: user.id } });
});
```

## Tailwind CSS v4

### Configuration

```javascript
// packages/config/tailwind/tailwind.config.js
export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};
```

### Usage with shadcn/ui

```tsx
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

export function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <Button variant="outline" className="mt-4">
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Custom Classes

```tsx
// ✅ Good - utility classes
<div className="flex items-center gap-4 p-4 rounded-lg bg-slate-100">
  <Avatar src={user.avatar} />
  <div className="flex-1">
    <h3 className="font-semibold text-lg">{user.name}</h3>
    <p className="text-sm text-gray-600">{user.bio}</p>
  </div>
</div>

// ✅ Good - responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>

// ❌ Bad - inline styles (defeats Tailwind's purpose)
<div style={{ display: 'flex', padding: '16px' }}>...</div>
```

## Storybook

### Story Structure

```tsx
// packages/ui/stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../src/button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline button',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Icon /> Send
      </>
    ),
  },
};
```

### Running Storybook

```bash
# Start Storybook dev server
pnpm --filter ui storybook

# Build static Storybook
pnpm --filter ui build-storybook
```

## Vitest

### Test Setup

```typescript
// packages/ui/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.stories.tsx', '**/*.config.*'],
    },
  },
});
```

### Component Tests

```typescript
// packages/ui/src/button.test.tsx
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies variant class', () => {
    const { container } = render(<Button variant="outline">Button</Button>);
    expect(container.firstChild).toHaveClass('btn-outline');
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter ui test
```

## Turbo

### Pipeline Configuration

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Running Tasks

```bash
# Build all packages
turbo build

# Build with dependencies
turbo build --filter=web...

# Run in parallel
turbo build test lint

# Clear cache
turbo build --force

# See what would run
turbo build --dry-run
```

### Task Dependencies

```json
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test",
    "lint": "turbo lint"
  }
}

// turbo automatically:
// - Builds dependencies first (^build)
// - Caches outputs
// - Runs tasks in parallel when possible
```

## NextAuth v5

### Configuration

```typescript
// packages/auth/src/index.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@repo/database';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && await verifyPassword(credentials.password, user.password)) {
          return user;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
});
```

### Usage in App Router

```tsx
// app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST } from '@repo/auth';

// app/dashboard/page.tsx
import { auth } from '@repo/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

### Client-Side Session

```tsx
'use client';

import { useSession } from 'next-auth/react';

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <a href="/login">Sign in</a>;
  }

  return <div>Hello, {session.user.name}</div>;
}
```

## pnpm Workspaces

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Package Dependencies

```json
// apps/web/package.json
{
  "name": "web",
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/database": "workspace:*",
    "@repo/trpc": "workspace:*",
    "next": "15.0.0"
  }
}
```

### pnpm Commands

```bash
# Install all dependencies
pnpm install

# Add dependency to specific package
pnpm --filter web add react-query

# Add dependency to all packages
pnpm --filter "**" add -D typescript

# Run command in specific package
pnpm --filter database prisma generate

# Run command in all packages
pnpm --recursive test

# Update dependencies
pnpm update --latest
```

## Common Patterns

### Data Fetching Pattern

```tsx
// Server Component (app/users/page.tsx)
import { api } from '@/lib/trpc/server';

export default async function UsersPage() {
  const users = await api.user.list();

  return <UserList initialUsers={users} />;
}

// Client Component (components/UserList.tsx)
'use client';

export function UserList({ initialUsers }: { initialUsers: User[] }) {
  const { data: users } = api.user.list.useQuery(undefined, {
    initialData: initialUsers,
    refetchOnMount: false,
  });

  return <div>{users.map(u => <UserCard key={u.id} user={u} />)}</div>;
}
```

### Form Handling

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc/client';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export function UserForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  const createUser = api.user.create.useMutation();

  const onSubmit = form.handleSubmit((data) => {
    createUser.mutate(data);
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

### Protected Routes

```tsx
// middleware.ts
import { auth } from '@repo/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});
```

## Performance Optimization

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Don't render on server
});
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  width={200}
  height={200}
  alt="User avatar"
  priority // Load immediately
/>
```

### Caching

```tsx
// Static rendering (default for server components)
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  return <div>{data}</div>;
}

// Dynamic rendering
export const dynamic = 'force-dynamic';
```

## When to Use This Skill

- Building features in Next.js + tRPC + Prisma stack
- Setting up monorepo packages and dependencies
- Writing type-safe APIs with tRPC
- Designing database schemas with Prisma
- Creating reusable UI components with Storybook
- Testing React components with Vitest
- Configuring Turbo pipelines
- Implementing authentication with NextAuth

## Related Skills

- `test-first-methodology.md` - TDD/BDD with Vitest
- `api-design-patterns.md` - tRPC router design
- `component-architecture.md` - React patterns
- `security-best-practices.md` - NextAuth security

## Key Takeaways

1. **Server Components First** - Use server components by default, client components when needed
2. **Type Safety Everywhere** - tRPC + Prisma + TypeScript = end-to-end type safety
3. **Monorepo Benefits** - Shared packages, consistent tooling, faster builds with Turbo
4. **Test Before Deploy** - Vitest + React Testing Library for comprehensive coverage
5. **Performance by Default** - Next.js optimizations (images, fonts, code splitting)
6. **Database Type Safety** - Prisma generates types from schema automatically
