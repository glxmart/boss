import path from 'path';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateClaudeFolder(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const claudePath = path.join(projectPath, '.claude');
  
  // Create directory structure
  await ensureDirectory(path.join(claudePath, 'rules'));
  await ensureDirectory(path.join(claudePath, 'commands'));

  // Generate rule files
  await generateCodeStyleRule(claudePath);
  await generateTestingRule(claudePath);
  await generateSecurityRule(claudePath);
  await generateBossWorkflowRule(claudePath);

  // Generate commands file
  await generateBossCommands(claudePath);

  // Generate settings.json (optional)
  await generateSettings(claudePath);
}

async function generateCodeStyleRule(claudePath: string): Promise<void> {
  const content = `# Code Style

## TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over \`any\`
- Use interfaces for object shapes
- Use enums for constants

## Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_CASE for constants
- Use kebab-case for file names

## Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Trailing commas in multi-line objects/arrays
`;

  await writeFile(path.join(claudePath, 'rules', 'code-style.md'), content);
}

async function generateTestingRule(claudePath: string): Promise<void> {
  const content = `# Testing Requirements

## Test-First (NON-NEGOTIABLE)

- Write tests BEFORE implementation
- Follow TDD cycle: red → green → refactor
- All tests must pass before committing

## BDD (Mandatory)

- Use Given/When/Then format for test descriptions
- Use BDD test frameworks (Cucumber, Gherkin, or equivalent)
- Tests should read like specifications

## Coverage

- Unit tests: ≥80% coverage
- Integration tests: Required for all API endpoints
- Mutation testing: ≥80% score

## Test Structure

\`\`\`
describe('Feature Name', () => {
  describe('Given [context]', () => {
    it('When [action], Then [expected result]', () => {
      // Test implementation
    });
  });
});
\`\`\`
`;

  await writeFile(path.join(claudePath, 'rules', 'testing.md'), content);
}

async function generateSecurityRule(claudePath: string): Promise<void> {
  const content = `# Security Guidelines

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
`;

  await writeFile(path.join(claudePath, 'rules', 'security.md'), content);
}

async function generateBossWorkflowRule(claudePath: string): Promise<void> {
  const content = `# BOSS Workflow Rules

## Spec-Kit Phases

Follow the 8-phase Spec-Kit methodology:

1. **Constitution** - Create/update constitution.md
2. **Clarification** - Gather business requirements
3. **Specification** - Write user stories (Given/When/Then)
4. **Planning** - Create technical plan
5. **Validation** - Validate against constitution
6. **Task Breakdown** - Create tasks.md with [P] markers
7. **Implementation** - TDD + BDD implementation
8. **Consolidation** - Merge and create delivery artifacts

## Worker Coordination

- Workers execute in parallel when tasks marked with [P]
- Each worker in isolated container-use environment
- Workers use Spec-Kit templates from \`.specify/templates/\`

## Quality Gates

- All quality gates must pass before merging
- Coverage and mutation thresholds are enforced
- Documentation must be complete
`;

  await writeFile(path.join(claudePath, 'rules', 'boss-workflow.md'), content);
}

async function generateBossCommands(claudePath: string): Promise<void> {
  const content = `# BOSS Commands

## Available Commands

### Container-Use Commands

- \`container-use log <env_id>\` - View worker logs
- \`container-use checkout <env_id>\` - Checkout worker branch

### Spec-Kit Commands

- \`bash .specify/scripts/speckit.plan.sh\` - Generate plan
- \`bash .specify/scripts/speckit.tasks.sh\` - Generate tasks
- \`bash .specify/scripts/speckit.implement.sh\` - Implement features

### BOSS Commands

- \`./start-boss.sh\` - Start BOSS with MCP restrictions
`;

  await writeFile(path.join(claudePath, 'commands', 'boss-commands.md'), content);
}

async function generateSettings(claudePath: string): Promise<void> {
  const settings = {
    "spec-kit": {
      "enabled": true,
      "path": ".specify"
    }
  };

  await writeFile(
    path.join(claudePath, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );
}

