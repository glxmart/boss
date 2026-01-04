import { describe, it, expect, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import { cleanupTestProject, fileExists } from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';
import type { Template, QualityPreset } from '../../src/types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Creates bootstrap options for a test project.
 */
function createTestOptions(
  projectName: string,
  template: Template = 'blank',
  quality: QualityPreset = 'startup'
): {
  template: Template;
  quality: QualityPreset;
  name: string;
  nonInteractive: true;
  projectPath: string;
  mcpScope: 'project';
} {
  return {
    template,
    quality,
    name: projectName,
    nonInteractive: true,
    projectPath: getTestProjectPath(projectName),
    mcpScope: 'project',
  };
}

/**
 * Run a command in the project directory
 */
async function runInProject(
  projectName: string,
  command: string
): Promise<{ stdout: string; stderr: string }> {
  const projectPath = getTestProjectPath(projectName);
  return execAsync(command, { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer
}

describe('Template E2E Tests', () => {
  // Increase timeout for e2e tests that run full builds
  const E2E_TIMEOUT = 180000; // 3 minutes

  describe('blank template', () => {
    const projectName = 'test-blank-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap and pass all quality gates',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Run type check
        const { stdout: typecheckOutput } = await runInProject(projectName, 'pnpm typecheck');
        expect(typecheckOutput).not.toContain('error TS');

        // Run lint
        const { stdout: lintOutput } = await runInProject(projectName, 'pnpm lint');
        expect(lintOutput).not.toContain('error');

        // Run tests
        const { stdout: testOutput } = await runInProject(projectName, 'pnpm test:unit');
        expect(testOutput).toContain('passed');
      },
      E2E_TIMEOUT
    );
  });

  describe('api-service-fastify template', () => {
    const projectName = 'test-api-service-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap and pass all quality gates',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'api-service-fastify', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Run type check
        const { stdout: typecheckOutput } = await runInProject(projectName, 'pnpm typecheck');
        expect(typecheckOutput).not.toContain('error TS');

        // Run lint
        const { stdout: lintOutput } = await runInProject(projectName, 'pnpm lint');
        expect(lintOutput).not.toContain('error');

        // Run tests
        const { stdout: testOutput } = await runInProject(projectName, 'pnpm test:unit');
        expect(testOutput).toContain('passed');

        // Run build
        const { stdout: buildOutput } = await runInProject(projectName, 'pnpm build');
        expect(buildOutput).not.toContain('error');
        expect(await fileExists(projectName, 'dist')).toBe(true);
      },
      E2E_TIMEOUT
    );
  });

  describe('nextjs-app-turbo template', () => {
    const projectName = 'test-nextjs-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    // SKIPPED: ESLint config export missing in @repo/config
    // See: https://github.com/glxmart/boss/issues/16
    it.skip(
      'should bootstrap and pass all quality gates (BROKEN: see issue #16)',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, 'pnpm-workspace.yaml')).toBe(true);
        expect(await fileExists(projectName, 'turbo.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);

        // Verify .gitignore includes node_modules/
        const gitignore = await runInProject(projectName, 'cat .gitignore');
        expect(gitignore.stdout).toContain('node_modules/');

        // Install dependencies (this should also generate Prisma client via postinstall)
        await runInProject(projectName, 'pnpm install');

        // Verify Prisma client was generated (check that TypeScript can resolve it)
        // Instead of hard-coding version, just verify the package is installed
        const { stdout: lsOutput } = await runInProject(
          projectName,
          'find node_modules -name "@prisma" -type d | head -1'
        );
        expect(lsOutput.trim()).toContain('@prisma');

        // Run type check (should pass with our NextAuth fix)
        const { stdout: typecheckOutput } = await runInProject(projectName, 'pnpm typecheck');
        expect(typecheckOutput).not.toContain('error TS');

        // Run lint (should pass with ESLint configs)
        const { stdout: lintOutput } = await runInProject(projectName, 'pnpm lint');
        expect(lintOutput).not.toContain('error');

        // Run tests (should pass with skeleton test files)
        const { stdout: testOutput } = await runInProject(projectName, 'pnpm test:unit');
        expect(testOutput).toContain('passed');
      },
      E2E_TIMEOUT
    );
  });

  describe('t3-app template', () => {
    const projectName = 'test-t3-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    // SKIPPED: Template has 130+ TypeScript errors (missing deps, env vars, module resolution)
    // See: https://github.com/glxmart/boss/issues/16
    it.skip(
      'should bootstrap and pass all quality gates (BROKEN: see issue #16)',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 't3-app', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);

        // Verify .gitignore includes node_modules/
        const gitignore = await runInProject(projectName, 'cat .gitignore');
        expect(gitignore.stdout).toContain('node_modules/');

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Run type check
        const { stdout: typecheckOutput } = await runInProject(projectName, 'pnpm typecheck');
        expect(typecheckOutput).not.toContain('error TS');

        // Run lint
        const { stdout: lintOutput } = await runInProject(projectName, 'pnpm lint');
        expect(lintOutput).not.toContain('error');

        // Run tests
        const { stdout: testOutput } = await runInProject(projectName, 'pnpm test:unit');
        expect(testOutput).toContain('passed');
      },
      E2E_TIMEOUT
    );
  });
});
