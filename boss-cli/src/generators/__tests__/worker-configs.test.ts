import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateWorkerConfigs } from '../worker-configs.js';
import type { ProjectConfig } from '../../types/index.js';

describe('worker-configs generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-workers');
  const originalHome = process.env.HOME;
  const testHomeDir = path.join(os.tmpdir(), 'boss-cli-test-home-workers');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, '.boss', 'workers'));
    await fs.ensureDir(testHomeDir);
    process.env.HOME = testHomeDir;
  });

  afterEach(async () => {
    await fs.remove(testDir);
    await fs.remove(testHomeDir);
    process.env.HOME = originalHome;
  });

  it('should generate all 9 worker configurations', async () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'blank',
      quality: 'startup'
    };

    await generateWorkerConfigs(testDir, config);

    const workers = [
      'architect',
      'clarifier',
      'spec-writer',
      'planner',
      'reviewer',
      'developer-frontend',
      'developer-backend',
      'developer-fullstack',
      'consolidator'
    ];

    for (const worker of workers) {
      const workerPath = path.join(testDir, '.boss', 'workers', worker);
      expect(await fs.pathExists(workerPath)).toBe(true);
      expect(await fs.pathExists(path.join(workerPath, 'prompt.md'))).toBe(true);
      expect(await fs.pathExists(path.join(workerPath, 'container-config.json'))).toBe(true);
    }
  });

  it('should generate prompt.md with phase information', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateWorkerConfigs(testDir, config);

    const architectPrompt = await fs.readFile(
      path.join(testDir, '.boss', 'workers', 'architect', 'prompt.md'),
      'utf8'
    );

    expect(architectPrompt).toContain('Phase 1: Constitution');
    expect(architectPrompt).toContain('Spec-Kit');
    expect(architectPrompt).toContain('Test-First');
    expect(architectPrompt).toContain('BDD');
  });

  it('should generate container-config.json with Spec-Kit environment variables', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateWorkerConfigs(testDir, config);

    const containerConfig = JSON.parse(
      await fs.readFile(
        path.join(testDir, '.boss', 'workers', 'developer-frontend', 'container-config.json'),
        'utf8'
      )
    );

    expect(containerConfig.environment_variables.SPEC_KIT_MODE).toBe('true');
    expect(containerConfig.environment_variables.SPEC_KIT_PATH).toBe('.specify');
    expect(containerConfig.environment_variables.PATH).toContain('.specify/scripts');
  });

  it('should generate .claude/ folder for workers when Claude Code is detected', async () => {
    // Create Claude Code config directory
    const claudeCodeDir = path.join(testHomeDir, '.config', 'claude-code');
    await fs.ensureDir(claudeCodeDir);

    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateWorkerConfigs(testDir, config);

    const workerPath = path.join(testDir, '.boss', 'workers', 'architect');
    expect(await fs.pathExists(path.join(workerPath, '.claude'))).toBe(true);
    expect(await fs.pathExists(path.join(workerPath, '.cursor'))).toBe(false);
  });

  it('should generate .cursor/ folder for workers when Cursor is detected', async () => {
    // Create Cursor config directory (but not Claude Code)
    const cursorDir = path.join(testHomeDir, '.cursor');
    await fs.ensureDir(cursorDir);

    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateWorkerConfigs(testDir, config);

    const workerPath = path.join(testDir, '.boss', 'workers', 'architect');
    expect(await fs.pathExists(path.join(workerPath, '.cursor'))).toBe(true);
    expect(await fs.pathExists(path.join(workerPath, '.claude'))).toBe(false);
    
    // Verify Cursor folder structure
    expect(await fs.pathExists(path.join(workerPath, '.cursor', 'commands'))).toBe(true);
    expect(await fs.pathExists(path.join(workerPath, '.cursor', 'skills'))).toBe(true);
    expect(await fs.pathExists(path.join(workerPath, '.cursor', 'agents'))).toBe(true);
  });

  it('should prefer Claude Code over Cursor for workers when both exist', async () => {
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

    await generateWorkerConfigs(testDir, config);

    const workerPath = path.join(testDir, '.boss', 'workers', 'architect');
    // Should prefer Claude Code
    expect(await fs.pathExists(path.join(workerPath, '.claude'))).toBe(true);
    expect(await fs.pathExists(path.join(workerPath, '.cursor'))).toBe(false);
  });
});

