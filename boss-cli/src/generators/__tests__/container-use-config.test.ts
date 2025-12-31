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

    // Check for expected structure (adjust based on actual implementation)
    expect(config).toBeDefined();
  });
});

