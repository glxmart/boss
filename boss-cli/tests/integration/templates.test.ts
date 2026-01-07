import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import { cleanupTestProject, fileExists, readProjectFile } from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';
import type { Template, QualityPreset } from '../../src/types/index.js';

/**
 * Creates bootstrap options for a test project.
 */
function createTestOptions(
  projectName: string,
  template: Template = 't3-prisma',
  quality: QualityPreset = 'production'
): {
  template: Template;
  quality: QualityPreset;
  name: string;
  nonInteractive: true;
  projectPath: string;
} {
  return {
    template,
    quality,
    name: projectName,
    nonInteractive: true,
    projectPath: getTestProjectPath(projectName),
  };
}

describe('Template Integration Tests', () => {
  beforeEach(async () => {
    // Cleanup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe('t3-prisma template (Full Stack)', () => {
    const projectName = 'test-t3-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate T3 project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 't3-prisma'));

      // Check essential files
      expect(await fileExists(projectName, 'package.json')).toBe(true);
      expect(await fileExists(projectName, 'tsconfig.json')).toBe(true);

      // Verify package.json
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.name).toBe(projectName);
    });

    it('should generate BOSS configuration', async () => {
      await bootstrapCommand(createTestOptions(projectName, 't3-prisma'));

      // Check BOSS config files
      expect(await fileExists(projectName, '.boss/config.yaml')).toBe(true);
      expect(await fileExists(projectName, '.boss/project-config.json')).toBe(true);

      const projectConfig = JSON.parse(
        await readProjectFile(projectName, '.boss/project-config.json')
      );

      // Verify template stack includes T3 components
      expect(projectConfig.project.template.stack).toBeDefined();
      expect(Array.isArray(projectConfig.project.template.stack)).toBe(true);
      expect(projectConfig.project.template.stack).toContain('nextjs');
      expect(projectConfig.project.template.stack).toContain('typescript');
      expect(projectConfig.project.template.stack).toContain('prisma');
      expect(projectConfig.project.template.stack).toContain('trpc');
    });

    it('should generate GitHub workflows', async () => {
      await bootstrapCommand(createTestOptions(projectName, 't3-prisma'));

      // Check GitHub workflow files
      expect(await fileExists(projectName, '.github/workflows/boss-ci.yml')).toBe(true);
      expect(await fileExists(projectName, '.github/workflows/boss-gates.yml')).toBe(true);
      expect(await fileExists(projectName, '.github/CODEOWNERS')).toBe(true);
    });

    it('should replace template variables correctly', async () => {
      await bootstrapCommand(createTestOptions(projectName, 't3-prisma'));

      // Check that {{PROJECT_NAME}} was replaced in package.json
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.name).toBe(projectName);
      expect(packageJson.name).not.toContain('{{PROJECT_NAME}}');
    });
  });

  describe('t3-drizzle template', () => {
    const projectName = 'test-t3-drizzle-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate T3 Drizzle project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 't3-drizzle'));

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.name).toBe(projectName);
    });
  });

  describe('fastify-native template', () => {
    const projectName = 'test-api-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate Fastify API project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'fastify-native'));

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.name).toBe(projectName);
    });
  });

  describe('nestjs-typeorm template', () => {
    const projectName = 'test-nestjs-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate NestJS project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nestjs-typeorm'));

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.name).toBe(projectName);
    });
  });

  describe('astro-portfolio template', () => {
    const projectName = 'test-astro-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate Astro project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'astro-portfolio'));

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.name).toBe(projectName);
    });
  });
});
