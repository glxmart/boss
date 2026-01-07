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
  template: Template = 't3-prisma',
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

  describe('t3-prisma template', () => {
    const projectName = 'test-t3-prisma-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap successfully',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 't3-prisma', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);

        // Note: Full quality gates test requires external template to be properly scaffolded
        // The create-t3-app scaffolding is tested separately
      },
      E2E_TIMEOUT
    );
  });

  describe('t3-drizzle template', () => {
    const projectName = 'test-t3-drizzle-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap successfully',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 't3-drizzle', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);
      },
      E2E_TIMEOUT
    );
  });

  describe('fastify-native template', () => {
    const projectName = 'test-fastify-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap successfully',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'fastify-native', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);
      },
      E2E_TIMEOUT
    );
  });

  describe('nestjs-typeorm template', () => {
    const projectName = 'test-nestjs-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap successfully',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'nestjs-typeorm', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);
      },
      E2E_TIMEOUT
    );
  });

  describe('astro-portfolio template', () => {
    const projectName = 'test-astro-e2e';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it(
      'should bootstrap successfully',
      async () => {
        // Bootstrap project
        await bootstrapCommand(createTestOptions(projectName, 'astro-portfolio', 'startup'));

        // Verify project was created
        expect(await fileExists(projectName, 'package.json')).toBe(true);
        expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);
      },
      E2E_TIMEOUT
    );
  });
});
