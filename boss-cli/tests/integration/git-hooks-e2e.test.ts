import { describe, it, expect, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import { cleanupTestProject, fileExists, writeProjectFile } from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';
import type { Template, QualityPreset } from '../../src/types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
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
 * Run a git command in the project directory
 */
async function runGitCommand(
  projectName: string,
  command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const projectPath = getTestProjectPath(projectName);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: projectPath });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
    };
  }
}

/**
 * Run a command in the project directory
 */
async function runInProject(
  projectName: string,
  command: string
): Promise<{ stdout: string; stderr: string }> {
  const projectPath = getTestProjectPath(projectName);
  return execAsync(command, { cwd: projectPath });
}

describe('Git Hooks E2E Tests', () => {
  const E2E_TIMEOUT = 120000; // 2 minutes

  describe('Pre-commit hook (linting)', () => {
    const projectName = 'test-git-hooks-precommit';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should block commits with linting errors',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

        // Install dependencies (required for hooks to work)
        await runInProject(projectName, 'pnpm install');

        // Verify hooks are installed
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);
        expect(await fileExists(projectName, '.husky/commit-msg')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-push')).toBe(true);

        // Create a file with linting errors
        const badCode = `// This file has intentional linting errors
const unused_var = "test";  // unused variable
function badFunction( ){  // bad formatting
console.log("no semicolon")  // missing semicolon
}`;

        await writeProjectFile(projectName, 'src/bad-file.ts', badCode);

        // Stage the file
        await runGitCommand(projectName, 'git add src/bad-file.ts');

        // Try to commit (should fail)
        const commitResult = await runGitCommand(projectName, 'git commit -m "test: add bad file"');

        expect(commitResult.exitCode).not.toBe(0);
        expect(commitResult.stdout + commitResult.stderr).toContain('unused');
      },
      E2E_TIMEOUT
    );

    it(
      'should allow commits with properly formatted code',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Create a properly formatted file
        const goodCode = `// This file is properly formatted
export function goodFunction() {
  console.log("properly formatted");
}`;

        await writeProjectFile(projectName, 'src/good-file.ts', goodCode);

        // Stage the file
        await runGitCommand(projectName, 'git add src/good-file.ts');

        // Try to commit (should succeed)
        const commitResult = await runGitCommand(
          projectName,
          'git commit -m "feat: add good function"'
        );

        expect(commitResult.exitCode).toBe(0);
      },
      E2E_TIMEOUT
    );
  });

  describe('Commit-msg hook (conventional commits)', () => {
    const projectName = 'test-git-hooks-commitmsg';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should block commits with non-conventional messages',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Create a valid file
        const goodCode = `export function testFn() { return true; }`;
        await writeProjectFile(projectName, 'src/test.ts', goodCode);

        // Stage the file
        await runGitCommand(projectName, 'git add src/test.ts');

        // Try to commit with bad message (should fail)
        const commitResult = await runGitCommand(projectName, 'git commit -m "bad commit message"');

        expect(commitResult.exitCode).not.toBe(0);
      },
      E2E_TIMEOUT
    );

    it(
      'should allow commits with conventional commit messages',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Create a valid file
        const goodCode = `export function testFn() { return true; }`;
        await writeProjectFile(projectName, 'src/test.ts', goodCode);

        // Stage the file
        await runGitCommand(projectName, 'git add src/test.ts');

        // Try to commit with conventional message (should succeed)
        const commitResult = await runGitCommand(
          projectName,
          'git commit -m "feat: add test function"'
        );

        expect(commitResult.exitCode).toBe(0);
      },
      E2E_TIMEOUT
    );
  });

  describe('Pre-push hook (tests)', () => {
    const projectName = 'test-git-hooks-prepush';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should run tests before push',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

        // Install dependencies
        await runInProject(projectName, 'pnpm install');

        // Create a valid file and commit it
        const goodCode = `export function testFn() { return true; }`;
        await writeProjectFile(projectName, 'src/test.ts', goodCode);

        await runGitCommand(projectName, 'git add src/test.ts');
        await runGitCommand(projectName, 'git commit -m "feat: add test"');

        // Try to push (will fail due to no remote, but hook should run)
        // Note: We can't test actual push without a remote, but we can verify
        // the hook file exists and is executable
        const hookPath = path.join(getTestProjectPath(projectName), '.husky', 'pre-push');
        const hookExists = await fs.pathExists(hookPath);
        expect(hookExists).toBe(true);

        // Verify hook is executable
        const stats = await fs.stat(hookPath);
        expect(stats.mode & fs.constants.S_IXUSR).toBeTruthy();
      },
      E2E_TIMEOUT
    );
  });
});
