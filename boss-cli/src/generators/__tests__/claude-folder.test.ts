import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateClaudeFolder } from '../claude-folder.js';
import type { ProjectConfig } from '../../types/index.js';

describe('claude-folder generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-claude-folder');
  const originalHome = process.env.HOME;
  const testHomeDir = path.join(os.tmpdir(), 'boss-cli-test-home');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(testHomeDir);
    process.env.HOME = testHomeDir;
  });

  afterEach(async () => {
    await fs.remove(testDir);
    await fs.remove(testHomeDir);
    process.env.HOME = originalHome;
  });

  it('should generate .claude/ directory structure', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.claude', 'rules'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.claude', 'commands'))).toBe(true);
  });

  it('should generate all rule files', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    expect(await fs.pathExists(path.join(testDir, '.claude', 'rules', 'code-style.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.claude', 'rules', 'testing.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.claude', 'rules', 'security.md'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.claude', 'rules', 'boss-workflow.md'))).toBe(true);
  });

  it('should generate commands file', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    const commandsPath = path.join(testDir, '.claude', 'commands', 'boss-commands.md');
    expect(await fs.pathExists(commandsPath)).toBe(true);

    const content = await fs.readFile(commandsPath, 'utf8');
    expect(content).toContain('container-use');
    expect(content).toContain('Spec-Kit');
  });

  it('should generate settings.json', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    const settingsPath = path.join(testDir, '.claude', 'settings.json');
    expect(await fs.pathExists(settingsPath)).toBe(true);

    const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    expect(settings['spec-kit']).toBeDefined();
    expect(settings['spec-kit'].enabled).toBe(true);
    expect(settings['spec-kit'].path).toBe('.specify');
  });

  it('should generate .claude/ when Claude Code config directory exists', async () => {
    // Create Claude Code config directory
    const claudeCodeDir = path.join(testHomeDir, '.config', 'claude-code');
    await fs.ensureDir(claudeCodeDir);

    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.cursor'))).toBe(false);
  });

  it('should generate .cursor/ when Cursor config directory exists (and Claude Code does not)', async () => {
    // Create Cursor config directory (but not Claude Code)
    const cursorDir = path.join(testHomeDir, '.cursor');
    await fs.ensureDir(cursorDir);

    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    expect(await fs.pathExists(path.join(testDir, '.cursor'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(false);
    
    // Verify Cursor folder has same structure
    expect(await fs.pathExists(path.join(testDir, '.cursor', 'rules'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.cursor', 'commands'))).toBe(true);
  });

  it('should prefer Claude Code over Cursor when both exist', async () => {
    // Create both config directories
    const claudeCodeDir = path.join(testHomeDir, '.config', 'claude-code');
    const cursorDir = path.join(testHomeDir, '.cursor');
    await fs.ensureDir(claudeCodeDir);
    await fs.ensureDir(cursorDir);

    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    // Should prefer Claude Code
    expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.cursor'))).toBe(false);
  });

  it('should default to .claude/ when neither IDE config directory exists', async () => {
    // Don't create any config directories

    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeFolder(testDir, config);

    // Should default to Claude Code
    expect(await fs.pathExists(path.join(testDir, '.claude'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.cursor'))).toBe(false);
  });
});

