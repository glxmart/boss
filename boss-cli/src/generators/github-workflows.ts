import path from 'path';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateGitHubWorkflows(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  await ensureDirectory(path.join(projectPath, '.github', 'workflows'));

  // Generate boss-ci.yml
  await generateCIWorkflow(projectPath, config);

  // Generate boss-gates.yml
  await generateGatesWorkflow(projectPath, config);

  // Generate CODEOWNERS
  await generateCODEOWNERS(projectPath);
}

async function generateCIWorkflow(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const workflow = `name: BOSS CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test
      
      - name: Coverage
        run: pnpm test:coverage
        continue-on-error: true
`;

  await writeFile(
    path.join(projectPath, '.github', 'workflows', 'boss-ci.yml'),
    workflow
  );
}

async function generateGatesWorkflow(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const workflow = `name: BOSS Quality Gates

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run quality gates
        run: pnpm test:gates
`;

  await writeFile(
    path.join(projectPath, '.github', 'workflows', 'boss-gates.yml'),
    workflow
  );
}

async function generateCODEOWNERS(projectPath: string): Promise<void> {
  const codeowners = `# BOSS Project Code Owners
* @${process.env.GITHUB_USER || 'your-username'}
`;

  await writeFile(
    path.join(projectPath, '.github', 'CODEOWNERS'),
    codeowners
  );
}

