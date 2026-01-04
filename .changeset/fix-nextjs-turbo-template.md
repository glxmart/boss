---
'@glxmart/boss-cli': minor
---

Fix critical nextjs-turbo-monorepo template issues

- Fix Prisma dependency versions (5.24.0 → 5.19.1)
- Fix next-auth version (^5.0.0 → 5.0.0-beta.25)
- Remove .json extensions from all tsconfig extends paths
- Add missing TypeScript type declarations for auth package
- Add missing tRPC package index exports
- Fix React.Node → React.ReactNode type error
- Enhance .gitignore with Next.js, Turbo, and Vercel entries
- Remove custom Prisma output path
- Add template variable replacement for layout/page files
- Simplify bootstrap instructions
