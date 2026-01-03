import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import { cleanupTestProject, fileExists, readProjectFile } from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';

describe('Template Integration Tests', () => {
  beforeEach(async () => {
    // Cleanup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe('nextjs-app-turbo template', () => {
    const projectName = 'test-nextjs-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate Next.js project structure', async () => {
      const options = {
        template: 'nextjs-app-turbo' as const,
        quality: 'production' as const,
        name: projectName,
        nonInteractive: true,
        projectPath: getTestProjectPath(projectName),
      };

      await bootstrapCommand(options);

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.next).toBeDefined();
    });
  });

  describe('api-service-fastify template', () => {
    const projectName = 'test-api-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate Fastify API project structure', async () => {
      const options = {
        template: 'api-service-fastify' as const,
        quality: 'production' as const,
        name: projectName,
        nonInteractive: true,
        projectPath: getTestProjectPath(projectName),
      };

      await bootstrapCommand(options);

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.fastify).toBeDefined();
    });
  });

  describe('blank template', () => {
    const projectName = 'test-blank-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate minimal project structure', async () => {
      const options = {
        template: 'blank' as const,
        quality: 'startup' as const,
        name: projectName,
        nonInteractive: true,
        projectPath: getTestProjectPath(projectName),
      };

      await bootstrapCommand(options);

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      expect(await fileExists(projectName, 'tsconfig.json')).toBe(true);
      expect(await fileExists(projectName, 'vitest.config.ts')).toBe(true);
    });
  });
});
