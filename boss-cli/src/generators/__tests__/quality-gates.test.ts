import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  generateQualityGates,
  generateTypeScriptConfig,
  generateESLintConfig,
  generatePrettierConfig,
  generateLintStagedConfig,
  getESLintDependencies,
} from '../quality-gates.js';

describe('quality-gates generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-quality-gates');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('generateQualityGates', () => {
    it('should generate quality gates config for startup preset', async () => {
      await generateQualityGates(testDir, 'startup');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      expect(await fs.pathExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.preset).toBe('startup');
      expect(config.gates).toBeDefined();
      expect(config.git_hooks.pre_commit.enabled).toBe(true);
      expect(config.git_hooks.pre_commit.commands).toEqual(['lint-staged', 'typecheck']);
      expect(config.git_hooks.commit_msg.enabled).toBe(true);
      expect(config.git_hooks.commit_msg.type).toBe('conventional-commits');
      expect(config.ci.enabled).toBe(true);
      expect(config.ci.checks).toEqual(['typecheck', 'lint', 'test']);
    });

    it('should generate quality gates config for production preset', async () => {
      await generateQualityGates(testDir, 'production');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.preset).toBe('production');
      expect(config.git_hooks.pre_commit.commands).toEqual([
        'lint-staged',
        'typecheck',
        'test-affected',
      ]);
      expect(config.git_hooks.commit_msg.type).toBe('conventional-commits');
      expect(config.ci.checks).toEqual(['typecheck', 'lint', 'test', 'coverage', 'security-scan']);
    });

    it('should generate quality gates config for enterprise preset', async () => {
      await generateQualityGates(testDir, 'enterprise');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.preset).toBe('enterprise');
      expect(config.git_hooks.pre_commit.commands).toEqual([
        'lint-staged',
        'typecheck',
        'test-affected',
      ]);
      expect(config.git_hooks.commit_msg.type).toBe('conventional-commits-with-ticket');
      expect(config.ci.checks).toEqual([
        'typecheck',
        'lint',
        'test',
        'coverage',
        'mutation-test',
        'security-scan',
        'dependency-check',
      ]);
    });

    it('should create directory structure if it does not exist', async () => {
      await generateQualityGates(testDir, 'startup');

      const qualityGatesDir = path.join(testDir, '.boss', 'quality-gates');
      expect(await fs.pathExists(qualityGatesDir)).toBe(true);
    });

    it('should write valid JSON content', async () => {
      await generateQualityGates(testDir, 'production');

      const configPath = path.join(testDir, '.boss', 'quality-gates', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf8');

      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should generate TypeScript config when template is provided', async () => {
      await generateQualityGates(testDir, 'startup', 't3-prisma');

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      expect(await fs.pathExists(tsconfigPath)).toBe(true);

      const content = await fs.readJson(tsconfigPath);
      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    });

    it('should generate ESLint config when template is provided', async () => {
      await generateQualityGates(testDir, 'startup', 't3-prisma');

      const eslintConfigPath = path.join(testDir, 'eslint.config.mjs');
      expect(await fs.pathExists(eslintConfigPath)).toBe(true);
    });

    it('should generate Prettier config', async () => {
      await generateQualityGates(testDir, 'startup');

      const prettierrcPath = path.join(testDir, '.prettierrc');
      expect(await fs.pathExists(prettierrcPath)).toBe(true);

      const prettierignorePath = path.join(testDir, '.prettierignore');
      expect(await fs.pathExists(prettierignorePath)).toBe(true);
    });

    it('should generate lint-staged config', async () => {
      await generateQualityGates(testDir, 'startup');

      const lintstagedPath = path.join(testDir, '.lintstagedrc.json');
      expect(await fs.pathExists(lintstagedPath)).toBe(true);
    });
  });

  describe('generateTypeScriptConfig', () => {
    it('should generate Next.js tsconfig for t3-prisma template', async () => {
      await generateTypeScriptConfig(testDir, 't3-prisma');

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      const content = await fs.readJson(tsconfigPath);

      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.jsx).toBe('preserve');
      expect(content.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    });

    it('should generate NestJS tsconfig for nestjs-typeorm template', async () => {
      await generateTypeScriptConfig(testDir, 'nestjs-typeorm');

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      const content = await fs.readJson(tsconfigPath);

      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.emitDecoratorMetadata).toBe(true);
      expect(content.compilerOptions.experimentalDecorators).toBe(true);
    });

    it('should generate Fastify tsconfig for fastify-native template', async () => {
      await generateTypeScriptConfig(testDir, 'fastify-native');

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      const content = await fs.readJson(tsconfigPath);

      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.module).toBe('ESNext');
    });

    it('should generate Astro tsconfig for astro-portfolio template', async () => {
      await generateTypeScriptConfig(testDir, 'astro-portfolio');

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      const content = await fs.readJson(tsconfigPath);

      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.jsx).toBe('react-jsx');
    });

    it('should merge strict settings into existing tsconfig', async () => {
      // Create an existing tsconfig
      const existingConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'CommonJS',
          strict: false, // This should be overridden
        },
      };
      await fs.writeJson(path.join(testDir, 'tsconfig.json'), existingConfig);

      await generateTypeScriptConfig(testDir, 't3-prisma');

      const tsconfigPath = path.join(testDir, 'tsconfig.json');
      const content = await fs.readJson(tsconfigPath);

      // Original settings should be preserved
      expect(content.compilerOptions.target).toBe('ES2020');
      expect(content.compilerOptions.module).toBe('CommonJS');

      // Strict settings should be applied
      expect(content.compilerOptions.strict).toBe(true);
      expect(content.compilerOptions.noUncheckedIndexedAccess).toBe(true);
      expect(content.compilerOptions.exactOptionalPropertyTypes).toBe(true);
    });
  });

  describe('generateESLintConfig', () => {
    it('should generate ESLint config for Next.js template', async () => {
      await generateESLintConfig(testDir, 't3-prisma');

      const eslintConfigPath = path.join(testDir, 'eslint.config.mjs');
      expect(await fs.pathExists(eslintConfigPath)).toBe(true);

      const content = await fs.readFile(eslintConfigPath, 'utf8');
      expect(content).toContain('eslint-plugin-react');
      expect(content).toContain('@next/eslint-plugin-next');
    });

    it('should generate ESLint config for NestJS template', async () => {
      await generateESLintConfig(testDir, 'nestjs-typeorm');

      const eslintConfigPath = path.join(testDir, 'eslint.config.mjs');
      expect(await fs.pathExists(eslintConfigPath)).toBe(true);
    });

    it('should generate ESLint config for Fastify template', async () => {
      await generateESLintConfig(testDir, 'fastify-native');

      const eslintConfigPath = path.join(testDir, 'eslint.config.mjs');
      expect(await fs.pathExists(eslintConfigPath)).toBe(true);
    });

    it('should generate ESLint config for Astro template', async () => {
      await generateESLintConfig(testDir, 'astro-portfolio');

      const eslintConfigPath = path.join(testDir, 'eslint.config.mjs');
      expect(await fs.pathExists(eslintConfigPath)).toBe(true);

      const content = await fs.readFile(eslintConfigPath, 'utf8');
      expect(content).toContain('eslint-plugin-astro');
    });

    it('should not overwrite existing ESLint config', async () => {
      const existingContent = '// Existing ESLint config';
      await fs.writeFile(path.join(testDir, 'eslint.config.mjs'), existingContent);

      await generateESLintConfig(testDir, 't3-prisma');

      const content = await fs.readFile(path.join(testDir, 'eslint.config.mjs'), 'utf8');
      expect(content).toBe(existingContent);
    });

    it('should not create config if .eslintrc.json exists', async () => {
      await fs.writeFile(path.join(testDir, '.eslintrc.json'), '{}');

      await generateESLintConfig(testDir, 't3-prisma');

      const eslintConfigPath = path.join(testDir, 'eslint.config.mjs');
      expect(await fs.pathExists(eslintConfigPath)).toBe(false);
    });
  });

  describe('generatePrettierConfig', () => {
    it('should generate .prettierrc', async () => {
      await generatePrettierConfig(testDir);

      const prettierrcPath = path.join(testDir, '.prettierrc');
      expect(await fs.pathExists(prettierrcPath)).toBe(true);

      const content = await fs.readJson(prettierrcPath);
      expect(content.semi).toBe(true);
      expect(content.singleQuote).toBe(true);
      expect(content.tabWidth).toBe(2);
    });

    it('should generate .prettierignore', async () => {
      await generatePrettierConfig(testDir);

      const prettierignorePath = path.join(testDir, '.prettierignore');
      expect(await fs.pathExists(prettierignorePath)).toBe(true);

      const content = await fs.readFile(prettierignorePath, 'utf8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('dist/');
    });

    it('should not overwrite existing .prettierrc', async () => {
      const existingConfig = { semi: false, singleQuote: false };
      await fs.writeJson(path.join(testDir, '.prettierrc'), existingConfig);

      await generatePrettierConfig(testDir);

      const content = await fs.readJson(path.join(testDir, '.prettierrc'));
      expect(content.semi).toBe(false);
      expect(content.singleQuote).toBe(false);
    });

    it('should not create config if prettier.config.js exists', async () => {
      await fs.writeFile(path.join(testDir, 'prettier.config.js'), 'module.exports = {}');

      await generatePrettierConfig(testDir);

      const prettierrcPath = path.join(testDir, '.prettierrc');
      expect(await fs.pathExists(prettierrcPath)).toBe(false);
    });
  });

  describe('generateLintStagedConfig', () => {
    it('should generate .lintstagedrc.json', async () => {
      await generateLintStagedConfig(testDir);

      const lintstagedPath = path.join(testDir, '.lintstagedrc.json');
      expect(await fs.pathExists(lintstagedPath)).toBe(true);

      const content = await fs.readJson(lintstagedPath);
      expect(content['*.{ts,tsx}']).toEqual(['eslint --fix', 'prettier --write']);
    });

    it('should not overwrite existing .lintstagedrc.json', async () => {
      const existingConfig = { '*.ts': ['echo "custom"'] };
      await fs.writeJson(path.join(testDir, '.lintstagedrc.json'), existingConfig);

      await generateLintStagedConfig(testDir);

      const content = await fs.readJson(path.join(testDir, '.lintstagedrc.json'));
      expect(content['*.ts']).toEqual(['echo "custom"']);
    });

    it('should not create config if lint-staged is in package.json', async () => {
      await fs.writeJson(path.join(testDir, 'package.json'), {
        'lint-staged': { '*.ts': ['eslint --fix'] },
      });

      await generateLintStagedConfig(testDir);

      const lintstagedPath = path.join(testDir, '.lintstagedrc.json');
      expect(await fs.pathExists(lintstagedPath)).toBe(false);
    });
  });

  describe('getESLintDependencies', () => {
    it('should return base dependencies plus Next.js specific for t3-prisma', () => {
      const deps = getESLintDependencies('t3-prisma');

      expect(deps).toContain('@eslint/js');
      expect(deps).toContain('typescript-eslint');
      expect(deps).toContain('eslint-config-prettier');
      expect(deps).toContain('eslint-plugin-react');
      expect(deps).toContain('eslint-plugin-react-hooks');
      expect(deps).toContain('@next/eslint-plugin-next');
    });

    it('should return base dependencies for NestJS', () => {
      const deps = getESLintDependencies('nestjs-typeorm');

      expect(deps).toContain('@eslint/js');
      expect(deps).toContain('typescript-eslint');
      expect(deps).toContain('eslint-config-prettier');
      expect(deps).not.toContain('eslint-plugin-react');
    });

    it('should return base dependencies plus Astro specific for astro-portfolio', () => {
      const deps = getESLintDependencies('astro-portfolio');

      expect(deps).toContain('@eslint/js');
      expect(deps).toContain('typescript-eslint');
      expect(deps).toContain('eslint-plugin-astro');
      expect(deps).toContain('eslint-plugin-react');
    });
  });
});
