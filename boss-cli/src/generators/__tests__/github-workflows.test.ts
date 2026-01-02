import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateGitHubWorkflows } from '../github-workflows.js';
import type { ProjectConfig } from '../../types/index.js';

describe('github-workflows generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-github-workflows');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('generateGitHubWorkflows', () => {
    it('should generate boss-ci.yml workflow', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production'
      };

      await generateGitHubWorkflows(testDir, config);

      const ciPath = path.join(testDir, '.github', 'workflows', 'boss-ci.yml');
      expect(await fs.pathExists(ciPath)).toBe(true);

      const content = await fs.readFile(ciPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should generate boss-gates.yml workflow', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production'
      };

      await generateGitHubWorkflows(testDir, config);

      const gatesPath = path.join(testDir, '.github', 'workflows', 'boss-gates.yml');
      expect(await fs.pathExists(gatesPath)).toBe(true);

      const content = await fs.readFile(gatesPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should generate CODEOWNERS file', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 'api-service-fastify',
        quality: 'startup'
      };

      await generateGitHubWorkflows(testDir, config);

      const codeownersPath = path.join(testDir, '.github', 'CODEOWNERS');
      expect(await fs.pathExists(codeownersPath)).toBe(true);

      const content = await fs.readFile(codeownersPath, 'utf8');
      expect(content).toBeTruthy();
    });

    it('should create .github/workflows directory if it does not exist', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 'blank',
        quality: 'enterprise'
      };

      const workflowsDir = path.join(testDir, '.github', 'workflows');
      expect(await fs.pathExists(workflowsDir)).toBe(false);

      await generateGitHubWorkflows(testDir, config);

      expect(await fs.pathExists(workflowsDir)).toBe(true);
    });

    it('should generate all three files for any quality preset', async () => {
      const qualities: Array<'startup' | 'production' | 'enterprise'> = ['startup', 'production', 'enterprise'];

      for (const quality of qualities) {
        const qualityTestDir = path.join(testDir, quality);
        await fs.ensureDir(qualityTestDir);

        const config: ProjectConfig = {
          name: 'test-project',
          template: 'nextjs-app-turbo',
          quality
        };

        await generateGitHubWorkflows(qualityTestDir, config);

        const ciPath = path.join(qualityTestDir, '.github', 'workflows', 'boss-ci.yml');
        const gatesPath = path.join(qualityTestDir, '.github', 'workflows', 'boss-gates.yml');
        const codeownersPath = path.join(qualityTestDir, '.github', 'CODEOWNERS');

        expect(await fs.pathExists(ciPath)).toBe(true);
        expect(await fs.pathExists(gatesPath)).toBe(true);
        expect(await fs.pathExists(codeownersPath)).toBe(true);

        await fs.remove(qualityTestDir);
      }
    });
  });
});
