---
'@glxmart/boss-cli': minor
---

Add Next.js Turbo monorepo template with comprehensive stack

- Add nextjs-turbo-monorepo template with 11-technology stack (Next.js 15, Turborepo, shadcn/ui, Prisma, tRPC, NextAuth, Vitest, Storybook, Kamal)
- Add comprehensive error handling with descriptive messages for template loading
- Add template variable validation to prevent broken bootstrapped projects
- Add JSON.parse error handling with file path context
- Add chmod failure detection with script path details
- Improve test coverage for monorepo template (7 new unit tests)
- Add integration tests for all 11 stack technologies
- Update CLAUDE.md template with monorepo-specific patterns
- Update GitHub workflows for monorepo support (matrix builds, parallel jobs)
