import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateRenovateConfig } from '../renovate.js';

describe('renovate generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-renovate');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate renovate.json file', async () => {
    await generateRenovateConfig(testDir);

    const renovatePath = path.join(testDir, 'renovate.json');
    expect(await fs.pathExists(renovatePath)).toBe(true);
  });

  it('should generate valid JSON', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should include recommended config extension', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    expect(config.extends).toBeDefined();
    expect(config.extends).toContain('config:recommended');
  });

  it('should include semantic commits extension', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    expect(config.extends).toContain(':semanticCommits');
  });

  it('should include package rules', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    expect(config.packageRules).toBeDefined();
    expect(Array.isArray(config.packageRules)).toBe(true);
    expect(config.packageRules.length).toBeGreaterThan(0);
  });

  it('should include automerge rules for dev dependencies', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    const devDepRule = config.packageRules.find(
      (rule: Record<string, unknown>) => rule.description === 'Automerge non-major dev dependencies'
    );
    expect(devDepRule).toBeDefined();
    expect(devDepRule.automerge).toBe(true);
  });

  it('should include grouped updates for TypeScript ecosystem', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    const tsRule = config.packageRules.find(
      (rule: Record<string, unknown>) => rule.groupName === 'TypeScript ecosystem'
    );
    expect(tsRule).toBeDefined();
  });

  it('should include vulnerability alerts configuration', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    expect(config.vulnerabilityAlerts).toBeDefined();
    expect(config.vulnerabilityAlerts.automerge).toBe(true);
  });

  it('should require manual review for major updates', async () => {
    await generateRenovateConfig(testDir);

    const content = await fs.readFile(path.join(testDir, 'renovate.json'), 'utf8');
    const config = JSON.parse(content);

    const majorRule = config.packageRules.find(
      (rule: Record<string, unknown>) =>
        rule.description === 'Require manual review for major updates'
    );
    expect(majorRule).toBeDefined();
    expect(majorRule.automerge).toBe(false);
  });
});
