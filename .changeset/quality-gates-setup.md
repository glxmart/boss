---
'@glxmart/boss-cli': patch
'@glxmart/conductor-mcp': patch
---

Setup Husky and quality gates for monorepo

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
