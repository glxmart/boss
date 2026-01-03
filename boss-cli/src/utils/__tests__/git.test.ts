import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { initGitRepository, addFiles, commit, isGitRepository } from '../git.js';

describe('git utilities', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-git');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('initGitRepository', () => {
    it('should initialize a git repository', async () => {
      await initGitRepository(testDir);

      expect(await fs.pathExists(path.join(testDir, '.git'))).toBe(true);
    });

    it('should configure git user name and email', async () => {
      await initGitRepository(testDir);

      const { execa } = await import('execa');
      const { stdout: userName } = await execa('git', ['config', 'user.name'], { cwd: testDir });
      const { stdout: userEmail } = await execa('git', ['config', 'user.email'], { cwd: testDir });

      expect(userName).toBe('The BOSS');
      expect(userEmail).toBe('boss@glxmart.com');
    });
  });

  describe('isGitRepository', () => {
    it('should return true for a git repository', async () => {
      await initGitRepository(testDir);
      expect(await isGitRepository(testDir)).toBe(true);
    });

    it('should return false for a non-git directory', async () => {
      expect(await isGitRepository(testDir)).toBe(false);
    });
  });

  describe('addFiles', () => {
    it('should add files to git staging', async () => {
      await initGitRepository(testDir);
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content');

      await addFiles(testDir, ['test.txt']);

      const { execa } = await import('execa');
      const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: testDir });
      expect(stdout).toContain('test.txt');
    });

    it('should add multiple files', async () => {
      await initGitRepository(testDir);
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');

      await addFiles(testDir, ['file1.txt', 'file2.txt']);

      const { execa } = await import('execa');
      const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: testDir });
      expect(stdout).toContain('file1.txt');
      expect(stdout).toContain('file2.txt');
    });
  });

  describe('commit', () => {
    it('should create a commit with the given message', async () => {
      await initGitRepository(testDir);
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content');
      await addFiles(testDir, ['test.txt']);

      await commit(testDir, 'Test commit message');

      const { execa } = await import('execa');
      const { stdout } = await execa('git', ['log', '--oneline', '-1'], { cwd: testDir });
      expect(stdout).toContain('Test commit message');
    });

    it('should use --no-verify flag', async () => {
      await initGitRepository(testDir);
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content');
      await addFiles(testDir, ['test.txt']);

      // Should not throw even if hooks would fail
      await commit(testDir, 'Test commit');

      const { execa } = await import('execa');
      const { stdout } = await execa('git', ['log', '--oneline', '-1'], { cwd: testDir });
      expect(stdout).toBeTruthy();
    });
  });
});
