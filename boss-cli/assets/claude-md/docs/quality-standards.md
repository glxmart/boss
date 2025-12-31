# Quality Standards

- **Test-First (NON-NEGOTIABLE)** - TDD cycle: red → green → refactor
- **BDD (Mandatory)** - Behavior-Driven Development with Given/When/Then
- **Feature Documentation (NON-NEGOTIABLE)** - Every feature must be documented
- **Coverage:** Coverage thresholds are defined in `.boss/config.yaml` and enforced by quality gates
- **Mutation Testing:** Mutation testing thresholds are defined in `.boss/config.yaml` and enforced by quality gates

Quality gates are configured based on the quality preset selected during bootstrap:
- **Startup:** Coverage ≥60%
- **Production:** Coverage ≥80%, Mutation ≥80%
- **Enterprise:** Coverage ≥90%, Mutation ≥80%

See `.boss/config.yaml` for the exact thresholds configured for this project.

