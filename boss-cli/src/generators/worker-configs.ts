import path from 'path';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import type { ProjectConfig } from '../types/index.js';

const WORKERS = [
  'architect',
  'clarifier',
  'spec-writer',
  'planner',
  'reviewer',
  'developer-frontend',
  'developer-backend',
  'developer-fullstack',
  'consolidator'
];

const WORKER_PHASES: Record<string, string> = {
  'architect': 'Phase 1: Constitution',
  'clarifier': 'Phase 2: Clarification',
  'spec-writer': 'Phase 3: Specification',
  'planner': 'Phase 4: Planning & Phase 6: Task Breakdown',
  'reviewer': 'Phase 5: Validation',
  'developer-frontend': 'Phase 7: Implementation',
  'developer-backend': 'Phase 7: Implementation',
  'developer-fullstack': 'Phase 7: Implementation',
  'consolidator': 'Phase 8: Consolidation'
};

export async function generateWorkerConfigs(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  for (const worker of WORKERS) {
    const workerPath = path.join(projectPath, '.boss', 'workers', worker);
    await ensureDirectory(workerPath);

    // Generate prompt.md
    await generateWorkerPrompt(workerPath, worker, config);

    // Generate container-config.json
    await generateWorkerContainerConfig(workerPath, worker);
  }
}

async function generateWorkerPrompt(
  workerPath: string,
  workerName: string,
  config: ProjectConfig
): Promise<void> {
  const phase = WORKER_PHASES[workerName] || 'Unknown Phase';
  
  const prompt = `# ${workerName} Worker

## Phase: ${phase}

## Your Role

${getWorkerRoleDescription(workerName)}

## Spec-Kit Integration

- Spec-Kit templates are available in \`.specify/templates/\`
- Spec-Kit scripts are available in \`.specify/scripts/\`
- Use Spec-Kit templates as reference for artifact format
- Follow Spec-Kit structure and conventions

## Artifact Requirements

${getArtifactRequirements(workerName)}

## Quality Requirements

- Test-First (NON-NEGOTIABLE) - TDD cycle: red → green → refactor
- BDD (Behavior-Driven Development) - Mandatory layer, Given/When/Then in specs and tests
- Feature Documentation (NON-NEGOTIABLE) - Every feature must have complete documentation
- Coverage ≥80%
- Mutation testing ≥80%

## Constitution Compliance

- All work must comply with \`.specify/memory/constitution.md\`
- Validate against constitution before completing work
- Report any violations or warnings

## Knowledge Base Integration

- Query knowledge base for similar patterns before starting
- Use existing patterns when available
- Document new patterns for future use

## Container-Use Constraints

- Environment-only operations mandate
- DO NOT use git CLI directly
- All file, code, and shell operations must use container-use environments
- Inform user how to view work: \`container-use log <env_id>\` AND \`container-use checkout <env_id>\`
`;

  await writeFile(path.join(workerPath, 'prompt.md'), prompt);
}

function getWorkerRoleDescription(workerName: string): string {
  const descriptions: Record<string, string> = {
    'architect': 'Create constitution.md with governing principles. Enforce Test-First, BDD, and Documentation as NON-NEGOTIABLE.',
    'clarifier': 'Gather business requirements through conversation. Ask business questions (not technical). Document user personas and workflows.',
    'spec-writer': 'Create spec.md with user stories in Given/When/Then format (BDD format). Include acceptance criteria and edge cases.',
    'planner': 'Create plan.md, data-model.md, contracts/. Plan BDD test strategy and documentation structure. Create tasks.md with [P] markers.',
    'reviewer': 'Validate plan against constitution. Check TDD/BDD/Documentation compliance. Verify BDD layer and documentation requirements.',
    'developer-frontend': 'Implement frontend features following TDD + BDD. Create BDD tests and feature documentation.',
    'developer-backend': 'Implement backend features following TDD + BDD. Create API documentation and feature documentation.',
    'developer-fullstack': 'Implement fullstack features following TDD + BDD. Create comprehensive tests and documentation.',
    'consolidator': 'Merge all worker branches. Create quickstart.md and checklist.md. Validate documentation completeness.'
  };
  return descriptions[workerName] || 'Execute assigned tasks following BOSS methodology.';
}

function getArtifactRequirements(workerName: string): string {
  const requirements: Record<string, string> = {
    'architect': '- `.specify/memory/constitution.md` - Must include Architectural Principles, Development Methodology, Testing Standards, Documentation Standards',
    'clarifier': '- `.specify/specs/000-requirements/clarification.md` - Business questions, user personas, workflows',
    'spec-writer': '- `.specify/specs/001-feature/spec.md` - User stories in Given/When/Then format',
    'planner': '- `.specify/specs/001-feature/plan.md`, `data-model.md`, `contracts/` - Technical approach\n- `.specify/specs/001-feature/tasks.md` - Task breakdown with [P] markers',
    'reviewer': '- `.specify/specs/001-feature/validation-report.md` - Constitution compliance check',
    'developer-frontend': '- `src/` - Implementation code\n- `tests/` - BDD tests\n- `docs/` - Feature documentation',
    'developer-backend': '- `src/` - Implementation code\n- `tests/` - BDD tests\n- `docs/` - API and feature documentation',
    'developer-fullstack': '- `src/` - Implementation code\n- `tests/` - BDD tests\n- `docs/` - Comprehensive documentation',
    'consolidator': '- `.specify/specs/001-feature/quickstart.md` - Setup guide\n- `.specify/specs/001-feature/checklist.md` - Quality checklist'
  };
  return requirements[workerName] || '- Complete assigned tasks following Spec-Kit format';
}

async function generateWorkerContainerConfig(
  workerPath: string,
  workerName: string
): Promise<void> {
  const config = {
    base_image: 'node:22-slim',
    setup_commands: [
      'apt-get update',
      'apt-get install -y bash git curl build-essential'
    ],
    install_commands: [
      'npm install -g pnpm',
      'pnpm install'
    ],
    environment_variables: {
      WORKER_ROLE: workerName,
      NODE_ENV: 'test',
      SPEC_KIT_MODE: 'true',
      SPEC_KIT_PATH: '.specify',
      PATH: '$PATH:.specify/scripts'
    },
    secrets: [],
    network: {
      allowed_hosts: [
        'registry.npmjs.org',
        'github.com'
      ]
    }
  };

  await writeFile(
    path.join(workerPath, 'container-config.json'),
    JSON.stringify(config, null, 2)
  );
}

