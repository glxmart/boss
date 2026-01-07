import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import yaml from 'js-yaml';
import { cleanupTestProject, fileExists, readProjectFile } from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';

describe('Quality Presets Integration Tests', () => {
  describe('startup preset', () => {
    const projectName = 'test-startup-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should apply startup quality gates', async () => {
      const options = {
        template: 't3-prisma' as const,
        quality: 'startup' as const,
        name: projectName,
        nonInteractive: true,
        projectPath: getTestProjectPath(projectName),
      };

      await bootstrapCommand(options);

      const config = yaml.load(await readProjectFile(projectName, '.boss/config.yaml')) as any;

      expect(config.quality.preset).toBe('startup');
      expect(config.quality.gates.coverage).toBe(60);
    });
  });

  describe('production preset', () => {
    const projectName = 'test-production-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should apply production quality gates', async () => {
      const options = {
        template: 't3-prisma' as const,
        quality: 'production' as const,
        name: projectName,
        nonInteractive: true,
        projectPath: getTestProjectPath(projectName),
      };

      await bootstrapCommand(options);

      const config = yaml.load(await readProjectFile(projectName, '.boss/config.yaml')) as any;

      expect(config.quality.preset).toBe('production');
      expect(config.quality.gates.coverage).toBe(80);
      expect(config.quality.gates.mutation).toBe(80);
    });
  });

  describe('enterprise preset', () => {
    const projectName = 'test-enterprise-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should apply enterprise quality gates', async () => {
      const options = {
        template: 't3-prisma' as const,
        quality: 'enterprise' as const,
        name: projectName,
        nonInteractive: true,
        projectPath: getTestProjectPath(projectName),
      };

      await bootstrapCommand(options);

      const config = yaml.load(await readProjectFile(projectName, '.boss/config.yaml')) as any;

      expect(config.quality.preset).toBe('enterprise');
      expect(config.quality.gates.coverage).toBe(90);
      expect(config.quality.gates.mutation).toBe(80);
      expect(config.quality.gates.security).toBe(true);
    });
  });
});
