# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: security@glxmart.com

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, command injection)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Update Process

1. Security issue is reported and confirmed
2. Fix is developed in a private repository
3. CVE is requested (if applicable)
4. Fix is released as a patch version
5. Security advisory is published

## Security Best Practices

When using BOSS:
- Keep dependencies up to date
- Use 1Password CLI for secret management (never commit secrets)
- Review worker configurations before deploying
- Use container isolation for untrusted code execution
- Enable GitHub branch protection rules
- Review security audit logs regularly
- Only use BOSS workers in sandboxed container environments
- Validate all inputs from workers before accepting results
- Rotate secrets regularly

## Known Security Considerations

### Container Isolation
BOSS workers run in isolated Docker containers via container-use. While this provides security:
- Workers have network access to allowed hosts only
- File system access is isolated per worker
- Secrets are managed via 1Password CLI integration

### Worker Trust Model
- Workers execute in isolated environments
- Each worker has its own Git branch
- Container configurations define security boundaries
- Network access is explicitly controlled per worker type

## Responsible Disclosure

We appreciate responsible disclosure of security vulnerabilities. Security researchers who report valid vulnerabilities will be acknowledged in our security advisories (unless they prefer to remain anonymous).
