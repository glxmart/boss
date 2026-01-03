import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateProjectStructure } from '../project-structure.js';
import type { ProjectConfig } from '../../types/index.js';

describe('project-structure generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-structure');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate basic project structure', async () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'blank',
      quality: 'startup',
    };

    await generateProjectStructure(testDir, config);

    // Check for common directories
    expect(await fs.pathExists(path.join(testDir, 'src'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, 'tests'))).toBe(true);
  });

  it('should generate structure for different templates', async () => {
    const configs: ProjectConfig[] = [
      { name: 'test', template: 'blank', quality: 'startup' },
      { name: 'test', template: 'nextjs-app-turbo', quality: 'startup' },
      { name: 'test', template: 'api-service-fastify', quality: 'startup' },
    ];

    for (const config of configs) {
      const dir = path.join(testDir, config.template);
      await fs.ensureDir(dir);
      await generateProjectStructure(dir, config);
      expect(await fs.pathExists(path.join(dir, 'src'))).toBe(true);
      await fs.remove(dir);
    }
  });
});
