import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { loadTemplate, getAssetPath, discoverWorkers } from '../template-loader.js';

describe('template-loader', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-template-loader');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    // Create test assets structure
    await fs.ensureDir(path.join(testDir, 'assets', 'test-templates'));
    await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('getAssetPath', () => {
    it('should resolve path to assets folder', () => {
      const assetPath = getAssetPath('test/file.txt');
      expect(assetPath).toContain('assets');
      expect(assetPath).toContain('test/file.txt');
    });

    it('should work with relative paths', () => {
      const assetPath = getAssetPath('worker-configs/architect/prompt.md');
      expect(assetPath).toContain('assets');
      expect(assetPath).toContain('worker-configs/architect/prompt.md');
    });
  });

  describe('loadTemplate', () => {
    it('should load template file content', async () => {
      const templatePath = path.join(testDir, 'assets', 'test-templates', 'simple.txt');
      await fs.writeFile(templatePath, 'Hello World', 'utf8');

      // Mock getAssetPath to return our test directory
      const content = await loadTemplate('test-templates/simple.txt', {}, testDir);
      expect(content).toBe('Hello World');
    });

    it('should interpolate simple variables', async () => {
      const templatePath = path.join(testDir, 'assets', 'test-templates', 'var.txt');
      await fs.writeFile(templatePath, 'Hello ${name}', 'utf8');

      const content = await loadTemplate('test-templates/var.txt', { name: 'World' }, testDir);
      expect(content).toBe('Hello World');
    });

    it('should interpolate nested object properties', async () => {
      const templatePath = path.join(testDir, 'assets', 'test-templates', 'nested.txt');
      await fs.writeFile(
        templatePath,
        'Project: ${config.name}, Quality: ${config.quality}',
        'utf8'
      );

      const content = await loadTemplate(
        'test-templates/nested.txt',
        { config: { name: 'my-project', quality: 'production' } },
        testDir
      );
      expect(content).toBe('Project: my-project, Quality: production');
    });

    it('should handle missing variables gracefully', async () => {
      const templatePath = path.join(testDir, 'assets', 'test-templates', 'missing.txt');
      await fs.writeFile(templatePath, 'Hello ${missing}', 'utf8');

      const content = await loadTemplate('test-templates/missing.txt', {}, testDir);
      // Should leave the variable placeholder or handle it gracefully
      expect(content).toBeDefined();
    });

    it('should handle multiple variables', async () => {
      const templatePath = path.join(testDir, 'assets', 'test-templates', 'multi.txt');
      await fs.writeFile(templatePath, '${a} and ${b} and ${c}', 'utf8');

      const content = await loadTemplate(
        'test-templates/multi.txt',
        { a: 'one', b: 'two', c: 'three' },
        testDir
      );
      expect(content).toBe('one and two and three');
    });

    it('should throw error for missing template file', async () => {
      await expect(loadTemplate('test-templates/nonexistent.txt', {}, testDir)).rejects.toThrow();
    });
  });

  describe('discoverWorkers', () => {
    it('should discover worker folders', async () => {
      // Create worker folders
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'architect'));
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'clarifier'));
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'spec-writer'));

      const workers = await discoverWorkers(testDir);
      expect(workers).toContain('architect');
      expect(workers).toContain('clarifier');
      expect(workers).toContain('spec-writer');
      expect(workers.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter out non-directories', async () => {
      // Create a file (not a directory)
      await fs.writeFile(
        path.join(testDir, 'assets', 'worker-configs', 'not-a-folder.txt'),
        'content',
        'utf8'
      );
      // Create a directory
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'architect'));

      const workers = await discoverWorkers(testDir);
      expect(workers).toContain('architect');
      expect(workers).not.toContain('not-a-folder.txt');
    });

    it('should filter out hidden files', async () => {
      // Create hidden folder
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', '.DS_Store'));
      // Create normal folder
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'architect'));

      const workers = await discoverWorkers(testDir);
      expect(workers).toContain('architect');
      expect(workers).not.toContain('.DS_Store');
    });

    it('should return empty array if directory does not exist', async () => {
      const workers = await discoverWorkers(path.join(testDir, 'nonexistent'));
      expect(workers).toEqual([]);
    });

    it('should filter out node_modules', async () => {
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'node_modules'));
      await fs.ensureDir(path.join(testDir, 'assets', 'worker-configs', 'architect'));

      const workers = await discoverWorkers(testDir);
      expect(workers).toContain('architect');
      expect(workers).not.toContain('node_modules');
    });
  });
});
