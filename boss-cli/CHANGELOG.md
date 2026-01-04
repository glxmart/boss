# @glxmart/boss-cli

## 1.2.0

### Minor Changes

- 2a69f8d: Fix critical nextjs-turbo-monorepo template issues
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

## 1.1.0

### Minor Changes

- 1e89117: Customize worker CLAUDE.md files based on metadata attributes

  All 15 worker CLAUDE.md files have been customized with worker-specific instructions:
  - Added role descriptions with phase, position, and primary command
  - Detailed required outputs with paths, types, and constraints
  - Specified decision-making authority from metadata
  - Listed required and optional inputs
  - Defined collaboration patterns with other workers
  - Included quality requirements and success criteria
  - Provided worker-specific git commit examples
  - Added customized project-config.json summary examples

  This ensures each worker receives clear, actionable instructions tailored to their specific responsibilities, improving worker execution quality and consistency.

  Additionally:
  - Updated BOSS orchestration documentation (conductor.md, workers.md, workflow.md)
  - Consolidated container-use.md content into other docs for clarity
  - Fixed test to match new template structure

## 1.0.0

### Minor Changes

- ae8ac70: Add Next.js Turbo monorepo template with comprehensive stack
  - Add nextjs-turbo-monorepo template with 11-technology stack (Next.js 15, Turborepo, shadcn/ui, Prisma, tRPC, NextAuth, Vitest, Storybook, Kamal)
  - Add comprehensive error handling with descriptive messages for template loading
  - Add template variable validation to prevent broken bootstrapped projects
  - Add JSON.parse error handling with file path context
  - Add chmod failure detection with script path details
  - Improve test coverage for monorepo template (7 new unit tests)
  - Add integration tests for all 11 stack technologies
  - Update CLAUDE.md template with monorepo-specific patterns
  - Update GitHub workflows for monorepo support (matrix builds, parallel jobs)

### Patch Changes

- 043faa6: Fix linting errors and improve type safety across codebase

  Massive type safety improvements fixing 179 ESLint errors:
  - Replaced all `any` types with proper type definitions
  - Created centralized MCP result type definitions
  - Fixed unsafe member access patterns throughout codebase
  - Added comprehensive type guards and assertions

  Enhanced error handling and debugging:
  - Improved error message propagation in container creation failures
  - Better error context preservation through exception wrapping
  - More descriptive error messages for troubleshooting

  Test infrastructure improvements:
  - Fixed test assertions to match updated type signatures
  - Added graceful skipping for e2e tests when Docker images unavailable
  - Improved error reporting in test failures

- b835bea: Fix MCP configuration hanging bug and Docker image auto-update
  - **MCP Hanging Fix**: Resolved issue where boss bootstrap would hang for 20+ minutes during "Generating MCP configuration..." by moving user prompt before spinner starts
  - **Docker Auto-Update**: Changed Docker base image reference from hardcoded `1.0.0-beta.0` to `latest` tag which auto-updates on version releases
  - **Docker Workflow**: Added `latest` tag to Docker workflow that publishes on git tag releases, fixed PR build tag generation
  - **Changeset Workflow**: Added pull-requests write permission to fix PR comment failures
  - **Template Mapping**: Added template directory mapping to support nextjs-app-turbo template (currently maps to t3-app)

- 043faa6: Setup Husky and quality gates for monorepo

  Implemented comprehensive quality gates to ensure code quality and consistency:
  - **Husky integration**: Added Git hooks for pre-commit, commit-msg, and pre-push validation
  - **Prettier formatting**: Automatic code formatting on staged files via lint-staged
  - **Conventional Commits**: Enforce commit message format (type, scope, description)
  - **Pre-push validation**: Build, lint, security checks, and unit tests before push
  - **Main branch protection**: Block direct pushes to main branch
  - **TDD enforcement**: Warn if commits lack test files
  - **Security scanning**: Check for hardcoded secrets and vulnerabilities
  - **GitHub workflows**: Added format checking to CI/CD pipelines

  Quality gates now match those applied to BOSS-bootstrapped projects, ensuring the monorepo follows its own best practices.

- Updated dependencies [043faa6]
- Updated dependencies [b835bea]
- Updated dependencies [043faa6]
  - @glxmart/conductor-mcp@0.1.0
