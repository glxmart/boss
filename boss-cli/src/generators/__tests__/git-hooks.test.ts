import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateGitHooks } from '../git-hooks.js';

describe('git-hooks generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-git-hooks');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate .husky directory', async () => {
    await generateGitHooks(testDir, 'startup');

    expect(await fs.pathExists(path.join(testDir, '.husky'))).toBe(true);
  });

  it('should generate scripts directory', async () => {
    await generateGitHooks(testDir, 'startup');

    expect(await fs.pathExists(path.join(testDir, 'scripts'))).toBe(true);
  });

  it('should generate pre-commit hook', async () => {
    await generateGitHooks(testDir, 'startup');

    const hookPath = path.join(testDir, '.husky', 'pre-commit');
    expect(await fs.pathExists(hookPath)).toBe(true);

    const content = await fs.readFile(hookPath, 'utf8');
    expect(content).toContain('pre-commit-check.sh');

    // Check that hook is executable
    const stat = await fs.stat(hookPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0);
  });

  it('should generate commit-msg hook', async () => {
    await generateGitHooks(testDir, 'startup');

    const hookPath = path.join(testDir, '.husky', 'commit-msg');
    expect(await fs.pathExists(hookPath)).toBe(true);

    const content = await fs.readFile(hookPath, 'utf8');
    expect(content).toContain('Conventional Commits');
    expect(content).toContain('commit_msg=$(cat "$1")');

    // Check that hook is executable
    const stat = await fs.stat(hookPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0);
  });

  it('should generate pre-commit-check.sh script', async () => {
    await generateGitHooks(testDir, 'startup');

    const scriptPath = path.join(testDir, 'scripts', 'pre-commit-check.sh');
    expect(await fs.pathExists(scriptPath)).toBe(true);

    const content = await fs.readFile(scriptPath, 'utf8');
    expect(content).toContain('lint-staged');
    expect(content).toContain('test-changed.sh');
    expect(content).toContain('#!/bin/bash');

    // Check that script is executable
    const stat = await fs.stat(scriptPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0);
  });

  it('should generate test-changed.sh script', async () => {
    await generateGitHooks(testDir, 'startup');

    const scriptPath = path.join(testDir, 'scripts', 'test-changed.sh');
    expect(await fs.pathExists(scriptPath)).toBe(true);

    const content = await fs.readFile(scriptPath, 'utf8');
    expect(content).toContain('#!/bin/bash');
    expect(content).toContain('Test changed files script');
    expect(content).toContain('vitest run');
    expect(content).toContain('e2e');
    expect(content).toContain('integration');

    // Check that script is executable
    const stat = await fs.stat(scriptPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0);
  });

  it('should generate commit-msg hook with proper validation', async () => {
    await generateGitHooks(testDir, 'startup');

    const hookPath = path.join(testDir, '.husky', 'commit-msg');
    const content = await fs.readFile(hookPath, 'utf8');

    // Check for key validation patterns
    expect(content).toContain('^[a-z]+');
    expect(content).toContain('feat');
    expect(content).toContain('fix');
    expect(content).toContain('BREAKING CHANGE');
  });

  it('should generate pre-push hook', async () => {
    await generateGitHooks(testDir, 'startup');

    const hookPath = path.join(testDir, '.husky', 'pre-push');
    expect(await fs.pathExists(hookPath)).toBe(true);

    const content = await fs.readFile(hookPath, 'utf8');
    expect(content).toContain('Pre-push hook');
    expect(content).toContain('main');
    expect(content).toContain('typecheck');
    expect(content).toContain('test:unit');

    // Check that hook is executable
    const stat = await fs.stat(hookPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0);
  });

  it('should generate security-check.sh script', async () => {
    await generateGitHooks(testDir, 'startup');

    const scriptPath = path.join(testDir, 'scripts', 'security-check.sh');
    expect(await fs.pathExists(scriptPath)).toBe(true);

    const content = await fs.readFile(scriptPath, 'utf8');
    expect(content).toContain('#!/bin/bash');
    expect(content).toContain('Security check script');
    expect(content).toContain('hardcoded secrets');

    // Check that script is executable
    const stat = await fs.stat(scriptPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0);
  });

  it('should work with different quality presets', async () => {
    for (const quality of ['startup', 'production', 'enterprise'] as const) {
      const qualityDir = path.join(testDir, quality);
      await fs.ensureDir(qualityDir);

      await generateGitHooks(qualityDir, quality);

      expect(await fs.pathExists(path.join(qualityDir, '.husky', 'pre-commit'))).toBe(true);
      expect(await fs.pathExists(path.join(qualityDir, '.husky', 'commit-msg'))).toBe(true);
      expect(await fs.pathExists(path.join(qualityDir, '.husky', 'pre-push'))).toBe(true);
      expect(await fs.pathExists(path.join(qualityDir, 'scripts', 'pre-commit-check.sh'))).toBe(
        true
      );
      expect(await fs.pathExists(path.join(qualityDir, 'scripts', 'test-changed.sh'))).toBe(true);
      expect(await fs.pathExists(path.join(qualityDir, 'scripts', 'security-check.sh'))).toBe(true);
    }
  });
});
