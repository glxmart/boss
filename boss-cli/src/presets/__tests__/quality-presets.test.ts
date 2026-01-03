import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { applyQualityPreset } from '../quality-presets.js';
import yaml from 'js-yaml';

describe('quality-presets', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-presets');
  const bossDir = path.join(testDir, '.boss');
  const configPath = path.join(bossDir, 'config.yaml');

  beforeEach(async () => {
    await fs.ensureDir(bossDir);
    // Create a basic config.yaml
    const initialConfig = {
      name: 'test-project',
      version: '1.0.0',
      workers: [],
    };
    await fs.writeFile(configPath, yaml.dump(initialConfig));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('applyQualityPreset', () => {
    it('should apply startup preset to config.yaml', async () => {
      await applyQualityPreset(testDir, 'startup');

      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content) as any;

      expect(config.quality).toBeDefined();
      expect(config.quality.preset).toBe('startup');
      expect(config.quality.gates.coverage).toBe(60);
      expect(config.quality.gates.lint).toBe(true);
      expect(config.quality.gates.typecheck).toBe(true);
      expect(config.quality.gates.test).toBe(true);
      expect(config.quality.gates.mutation).toBeUndefined();
      expect(config.quality.gates.security).toBeUndefined();
    });

    it('should apply production preset to config.yaml', async () => {
      await applyQualityPreset(testDir, 'production');

      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content) as any;

      expect(config.quality).toBeDefined();
      expect(config.quality.preset).toBe('production');
      expect(config.quality.gates.coverage).toBe(80);
      expect(config.quality.gates.mutation).toBe(80);
      expect(config.quality.gates.lint).toBe(true);
      expect(config.quality.gates.typecheck).toBe(true);
      expect(config.quality.gates.test).toBe(true);
      expect(config.quality.gates.security).toBe(true);
    });

    it('should apply enterprise preset to config.yaml', async () => {
      await applyQualityPreset(testDir, 'enterprise');

      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content) as any;

      expect(config.quality).toBeDefined();
      expect(config.quality.preset).toBe('enterprise');
      expect(config.quality.gates.coverage).toBe(90);
      expect(config.quality.gates.mutation).toBe(80);
      expect(config.quality.gates.lint).toBe(true);
      expect(config.quality.gates.typecheck).toBe(true);
      expect(config.quality.gates.test).toBe(true);
      expect(config.quality.gates.security).toBe(true);
      expect(config.quality.gates.dependency_check).toBe(true);
    });

    it('should preserve existing config properties', async () => {
      // Add some additional properties to the config
      const existingConfig = {
        name: 'test-project',
        version: '1.0.0',
        workers: ['architect', 'developer'],
        customField: 'customValue',
      };
      await fs.writeFile(configPath, yaml.dump(existingConfig));

      await applyQualityPreset(testDir, 'production');

      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content) as any;

      expect(config.name).toBe('test-project');
      expect(config.version).toBe('1.0.0');
      expect(config.workers).toEqual(['architect', 'developer']);
      expect(config.customField).toBe('customValue');
      expect(config.quality).toBeDefined();
    });

    it('should use default preset when YAML file does not exist', async () => {
      // This tests the getDefaultPreset code path
      await applyQualityPreset(testDir, 'startup');

      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content) as any;

      expect(config.quality.preset).toBe('startup');
      expect(config.quality.gates.coverage).toBe(60);
    });

    it('should load preset from YAML file if it exists', async () => {
      // Create a custom preset YAML file
      const presetPath = path.join(
        path.dirname(path.dirname(__dirname)),
        'presets',
        'startup.yaml'
      );
      const customPreset = {
        gates: {
          coverage: 65,
          lint: true,
          typecheck: true,
          test: true,
          custom: 'value',
        },
      };

      await fs.ensureDir(path.dirname(presetPath));
      await fs.writeFile(presetPath, yaml.dump(customPreset));

      try {
        await applyQualityPreset(testDir, 'startup');

        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content) as any;

        // Should use the custom YAML preset
        expect(config.quality.preset).toBe('startup');
        expect(config.quality.gates.coverage).toBe(65);
        expect(config.quality.gates.custom).toBe('value');
      } finally {
        // Clean up the preset file
        await fs.remove(presetPath);
      }
    });

    it('should handle all preset types through default path', async () => {
      const presets: Array<'startup' | 'production' | 'enterprise'> = [
        'startup',
        'production',
        'enterprise',
      ];
      const expectedCoverages = { startup: 60, production: 80, enterprise: 90 };

      for (const preset of presets) {
        await applyQualityPreset(testDir, preset);

        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content) as any;

        expect(config.quality.gates.coverage).toBe(expectedCoverages[preset]);
        expect(config.quality.gates.lint).toBe(true);
        expect(config.quality.gates.typecheck).toBe(true);
        expect(config.quality.gates.test).toBe(true);
      }
    });

    it('should include security gate for production and enterprise', async () => {
      await applyQualityPreset(testDir, 'production');
      let content = await fs.readFile(configPath, 'utf8');
      let config = yaml.load(content) as any;
      expect(config.quality.gates.security).toBe(true);

      await applyQualityPreset(testDir, 'enterprise');
      content = await fs.readFile(configPath, 'utf8');
      config = yaml.load(content) as any;
      expect(config.quality.gates.security).toBe(true);
      expect(config.quality.gates.dependency_check).toBe(true);
    });

    it('should not include security gate for startup', async () => {
      await applyQualityPreset(testDir, 'startup');
      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content) as any;
      expect(config.quality.gates.security).toBeUndefined();
      expect(config.quality.gates.mutation).toBeUndefined();
    });
  });
});
