# T3 App Template

T3 Stack template downloaded from [create-t3-app](https://create.t3.gg/).

## What is T3?

The T3 Stack is a web development framework designed for simplicity, modularity, and full-stack type safety. It comprises:

- **Next.js** - React framework
- **tRPC** - End-to-end typesafe APIs
- **Tailwind CSS** - Utility-first CSS
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication

## Source

Template files from: https://github.com/t3-oss/create-t3-app

Downloaded from the main branch (latest version).

## Structure

The T3 template uses a modular structure:

- `base/` - Base template files (always included)
- `extras/` - Optional components:
  - `config/` - Configuration files (ESLint, Prettier, etc.)
  - `src/` - Additional source files (tRPC, auth, etc.)
  - `prisma/` - Database schemas
  - `start-database/` - Database setup scripts

## Usage

This template will be used by the BOSS bootstrap CLI when users select the `t3-app` template option.

The bootstrap process will:
1. Copy `base/` files to project root
2. Copy `extras/` files (all features included for BOSS)
3. Update package.json with project name
4. Handle special files (those starting with `_` are copied without the underscore)
