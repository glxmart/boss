import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateClaudeFolder } from '../claude-folder.js';
import type { ProjectConfig } from '../../types/index.js';

describe('claude-folder generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-claude-folder');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
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
});

