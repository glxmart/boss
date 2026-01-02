import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateQualityGates } from '../quality-gates.js';

describe('quality-gates generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-quality-gates');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('generateQualityGates', () => {
    it('should generate quality gates config for startup preset', async () => {
      await generateQualityGates(testDir, 'startup');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      expect(await fs.pathExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.preset).toBe('startup');
      expect(config.gates).toBeDefined();
      expect(config.git_hooks.pre_commit.enabled).toBe(true);
      expect(config.git_hooks.pre_commit.commands).toEqual(['lint-staged', 'typecheck']);
      expect(config.git_hooks.commit_msg.enabled).toBe(true);
      expect(config.git_hooks.commit_msg.type).toBe('conventional-commits');
      expect(config.ci.enabled).toBe(true);
      expect(config.ci.checks).toEqual(['typecheck', 'lint', 'test']);
    });

    it('should generate quality gates config for production preset', async () => {
      await generateQualityGates(testDir, 'production');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.preset).toBe('production');
      expect(config.git_hooks.pre_commit.commands).toEqual(['lint-staged', 'typecheck', 'test-affected']);
      expect(config.git_hooks.commit_msg.type).toBe('conventional-commits');
      expect(config.ci.checks).toEqual(['typecheck', 'lint', 'test', 'coverage', 'security-scan']);
    });

    it('should generate quality gates config for enterprise preset', async () => {
      await generateQualityGates(testDir, 'enterprise');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.preset).toBe('enterprise');
      expect(config.git_hooks.pre_commit.commands).toEqual(['lint-staged', 'typecheck', 'test-affected']);
      expect(config.git_hooks.commit_msg.type).toBe('conventional-commits-with-ticket');
      expect(config.ci.checks).toEqual([
        'typecheck',
        'lint',
        'test',
        'coverage',
        'mutation-test',
        'security-scan',
        'dependency-check'
      ]);
    });

    it('should create directory structure if it does not exist', async () => {
      await generateQualityGates(testDir, 'startup');

      const qualityGatesDir = path.join(testDir, '.boss', 'quality-gates');
      expect(await fs.pathExists(qualityGatesDir)).toBe(true);
    });

    it('should write valid JSON content', async () => {
      await generateQualityGates(testDir, 'production');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf8');

      expect(() => JSON.parse(content)).not.toThrow();
    });
  });
});
