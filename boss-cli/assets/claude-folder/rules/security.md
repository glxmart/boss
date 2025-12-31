# Security Guidelines

## Secrets Management

- NEVER commit secrets to git
- Use 1Password vault "boss" for all secrets
- Reference secrets via \`op://boss/credential/needed\` format
- Secrets are injected at runtime via container-use

## Dependencies

- Keep dependencies up to date
- Use security scanning tools
- Review dependency changes in PRs

## Code Security

- Validate all user input
- Use parameterized queries for database
- Implement proper authentication/authorization
- Follow OWASP guidelines

