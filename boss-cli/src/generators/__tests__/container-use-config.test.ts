import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateContainerUseConfig } from '../container-use-config.js';

describe('container-use-config generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-container-use');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate container-use config directory', async () => {
    await generateContainerUseConfig(testDir);

    expect(await fs.pathExists(path.join(testDir, '.container-use'))).toBe(true);
  });

  it('should generate environment.json file', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    expect(await fs.pathExists(configPath)).toBe(true);

    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should generate environment.json with correct structure', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    // Validate config structure
    expect(config).toBeDefined();
    expect(config).toHaveProperty('base_image');
    expect(config).toHaveProperty('setup_commands');
    expect(config).toHaveProperty('install_commands');
    expect(config).toHaveProperty('environment_variables');
    expect(config).toHaveProperty('network');
  });

  it('should use ghcr.io/glxmart/boss-worker-base:latest as base image', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    expect(config.base_image).toBe('ghcr.io/glxmart/boss-worker-base:latest');
  });

  it('should have empty setup_commands (optimization)', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    // Setup commands should be empty - all system setup is in base image
    expect(config.setup_commands).toEqual([]);
  });

  it('should only include project-specific install commands', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    // Should only have project dependency install, not global packages
    expect(config.install_commands).toEqual(['pnpm install --frozen-lockfile']);
  });

  it('should include BOSS-specific environment variables', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    expect(config.environment_variables).toHaveProperty('IS_SANDBOX');
    expect(config.environment_variables).toHaveProperty('BOSS_VERSION');
    expect(config.environment_variables).toHaveProperty('SPEC_KIT_MODE');
    expect(config.environment_variables).toHaveProperty('NODE_ENV');
    expect(config.environment_variables.IS_SANDBOX).toBe('1');
    expect(config.environment_variables.SPEC_KIT_MODE).toBe('true');
  });

  it('should include correct network allowed hosts', async () => {
    await generateContainerUseConfig(testDir);

    const configPath = path.join(testDir, '.container-use', 'environment.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    expect(config.network).toHaveProperty('allowed_hosts');
    expect(config.network.allowed_hosts).toContain('api.anthropic.com');
    expect(config.network.allowed_hosts).toContain('claude.ai');
    expect(config.network.allowed_hosts).toContain('registry.npmjs.org');
    expect(config.network.allowed_hosts).toContain('github.com');
  });
});
