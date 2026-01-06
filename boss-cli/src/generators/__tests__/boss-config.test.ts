import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { generateBossConfig } from '../boss-config.js';
import type { ProjectConfig } from '../../types/index.js';

describe('boss-config generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-config');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, '.boss'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate config.yaml for t3-prisma template', async () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 't3-prisma',
      quality: 'production',
    };

    await generateBossConfig(testDir, config);

    const configPath = path.join(testDir, '.boss', 'config.yaml');
    expect(await fs.pathExists(configPath)).toBe(true);

    const content = await fs.readFile(configPath, 'utf8');
    const parsed = yaml.load(content) as any;

    expect(parsed.boss.template).toBe('t3-prisma');
    expect(parsed.boss.quality).toBe('production');
    expect(parsed.project.name).toBe('test-project');
    expect(parsed.project.type).toBe('web-app');
    expect(parsed.project.stack).toContain('nextjs');
    expect(parsed.project.stack).toContain('shadcn-ui');
  });

  it('should generate config.yaml for fastify-native template', async () => {
    const config: ProjectConfig = {
      name: 'api-project',
      template: 'fastify-native',
      quality: 'enterprise',
    };

    await generateBossConfig(testDir, config);

    const content = await fs.readFile(path.join(testDir, '.boss', 'config.yaml'), 'utf8');
    const parsed = yaml.load(content) as any;

    expect(parsed.boss.template).toBe('fastify-native');
    expect(parsed.project.type).toBe('api-service');
    expect(parsed.project.stack).toContain('fastify');
  });

  it('should generate config.yaml for t3-drizzle template', async () => {
    const config: ProjectConfig = {
      name: 'drizzle-project',
      template: 't3-drizzle',
      quality: 'startup',
    };

    await generateBossConfig(testDir, config);

    const content = await fs.readFile(path.join(testDir, '.boss', 'config.yaml'), 'utf8');
    const parsed = yaml.load(content) as any;

    expect(parsed.boss.template).toBe('t3-drizzle');
    expect(parsed.project.type).toBe('web-app');
    expect(parsed.project.stack).toContain('drizzle');
  });
});
