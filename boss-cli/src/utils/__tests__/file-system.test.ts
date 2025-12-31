import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  ensureDirectory,
  writeFile,
  readFile,
  pathExists,
  makeExecutable,
  copyDirectory
} from '../file-system.js';

describe('file-system', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-fs');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const dir = path.join(testDir, 'new-dir');
      await ensureDirectory(dir);
      expect(await fs.pathExists(dir)).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const dir = path.join(testDir, 'existing-dir');
      await fs.ensureDir(dir);
      await ensureDirectory(dir);
      expect(await fs.pathExists(dir)).toBe(true);
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'test content';
      await writeFile(filePath, content);
      expect(await fs.readFile(filePath, 'utf8')).toBe(content);
    });

    it('should create parent directories', async () => {
      const filePath = path.join(testDir, 'nested', 'deep', 'file.txt');
      await writeFile(filePath, 'content');
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const filePath = path.join(testDir, 'read-test.txt');
      const content = 'read me';
      await fs.writeFile(filePath, content);
      expect(await readFile(filePath)).toBe(content);
    });
  });

  describe('pathExists', () => {
    it('should return true for existing path', async () => {
      const filePath = path.join(testDir, 'exists.txt');
      await fs.writeFile(filePath, 'content');
      expect(await pathExists(filePath)).toBe(true);
    });

    it('should return false for non-existing path', async () => {
      expect(await pathExists(path.join(testDir, 'not-exists.txt'))).toBe(false);
    });
  });

  describe('makeExecutable', () => {
    it('should make file executable', async () => {
      const filePath = path.join(testDir, 'script.sh');
      await fs.writeFile(filePath, '#!/bin/bash\necho "test"');
      await makeExecutable(filePath);
      const stat = await fs.stat(filePath);
      expect(stat.mode & 0o111).toBeGreaterThan(0);
    });
  });

  describe('copyDirectory', () => {
    it('should copy directory structure', async () => {
      const srcDir = path.join(testDir, 'src');
      const destDir = path.join(testDir, 'dest');
      await fs.ensureDir(srcDir);
      await fs.writeFile(path.join(srcDir, 'file.txt'), 'content');
      await fs.ensureDir(path.join(srcDir, 'nested'));
      await fs.writeFile(path.join(srcDir, 'nested', 'file2.txt'), 'content2');
      
      await copyDirectory(srcDir, destDir);
      
      expect(await fs.pathExists(path.join(destDir, 'file.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(destDir, 'nested', 'file2.txt'))).toBe(true);
      expect(await fs.readFile(path.join(destDir, 'file.txt'), 'utf8')).toBe('content');
      expect(await fs.readFile(path.join(destDir, 'nested', 'file2.txt'), 'utf8')).toBe('content2');
    });
  });
});

