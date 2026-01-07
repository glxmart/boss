import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { applyTemplateEnhancements } from '../enhancements.js';
import type { ProjectConfig } from '../../types/index.js';

describe('enhancements generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-enhancements');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    // Create a minimal package.json for all tests
    await fs.writeJson(path.join(testDir, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {},
    });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('T3 template enhancements', () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 't3-prisma',
      quality: 'production',
    };

    it('should apply T3 enhancements', async () => {
      const result = await applyTemplateEnhancements(testDir, 't3-prisma', config);

      expect(result.template).toBe('t3-prisma');
      expect(result.enhancementsApplied.length).toBeGreaterThan(0);
    });

    it('should create error boundary component', async () => {
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      const errorBoundaryPath = path.join(testDir, 'src', 'components', 'error-boundary.tsx');
      expect(await fs.pathExists(errorBoundaryPath)).toBe(true);

      const content = await fs.readFile(errorBoundaryPath, 'utf8');
      expect(content).toContain('ErrorBoundary');
      expect(content).toContain('getDerivedStateFromError');
    });

    it('should create health check API route', async () => {
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      const healthRoutePath = path.join(testDir, 'src', 'app', 'api', 'health', 'route.ts');
      expect(await fs.pathExists(healthRoutePath)).toBe(true);

      const content = await fs.readFile(healthRoutePath, 'utf8');
      expect(content).toContain('GET');
      expect(content).toContain('HealthResponse');
    });

    it('should create pino logger utility', async () => {
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      const loggerPath = path.join(testDir, 'src', 'lib', 'logger.ts');
      expect(await fs.pathExists(loggerPath)).toBe(true);

      const content = await fs.readFile(loggerPath, 'utf8');
      expect(content).toContain('pino');
    });

    it('should create t3-env configuration', async () => {
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      const envConfigPath = path.join(testDir, 'src', 'lib', 'env.ts');
      expect(await fs.pathExists(envConfigPath)).toBe(true);

      const content = await fs.readFile(envConfigPath, 'utf8');
      expect(content).toContain('createEnv');
      expect(content).toContain('@t3-oss/env-nextjs');
    });

    it('should create shadcn/ui configuration', async () => {
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      const shadcnConfigPath = path.join(testDir, 'components.json');
      expect(await fs.pathExists(shadcnConfigPath)).toBe(true);

      const content = await fs.readFile(shadcnConfigPath, 'utf8');
      const shadcnConfig = JSON.parse(content);
      expect(shadcnConfig.$schema).toContain('shadcn');
    });

    it('should add enhancement dependencies to package.json', async () => {
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      const packageJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(packageJson.dependencies.pino).toBeDefined();
      expect(packageJson.dependencies['@t3-oss/env-nextjs']).toBeDefined();
      expect(packageJson.dependencies.zod).toBeDefined();
    });

    it('should work for t3-drizzle template', async () => {
      const drizzleConfig: ProjectConfig = {
        name: 'test-project',
        template: 't3-drizzle',
        quality: 'production',
      };

      const result = await applyTemplateEnhancements(testDir, 't3-drizzle', drizzleConfig);

      expect(result.template).toBe('t3-drizzle');
      expect(result.enhancementsApplied.length).toBeGreaterThan(0);
    });
  });

  describe('NestJS template enhancements', () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'nestjs-typeorm',
      quality: 'production',
    };

    it('should apply NestJS enhancements', async () => {
      const result = await applyTemplateEnhancements(testDir, 'nestjs-typeorm', config);

      expect(result.template).toBe('nestjs-typeorm');
      expect(result.enhancementsApplied.length).toBeGreaterThan(0);
    });

    it('should create pino logger service', async () => {
      await applyTemplateEnhancements(testDir, 'nestjs-typeorm', config);

      const loggerPath = path.join(testDir, 'src', 'common', 'logger.service.ts');
      expect(await fs.pathExists(loggerPath)).toBe(true);

      const content = await fs.readFile(loggerPath, 'utf8');
      expect(content).toContain('PinoLoggerService');
      expect(content).toContain('@Injectable');
    });

    it('should create global exception filter', async () => {
      await applyTemplateEnhancements(testDir, 'nestjs-typeorm', config);

      const filterPath = path.join(testDir, 'src', 'common', 'filters', 'all-exceptions.filter.ts');
      expect(await fs.pathExists(filterPath)).toBe(true);

      const content = await fs.readFile(filterPath, 'utf8');
      expect(content).toContain('AllExceptionsFilter');
      expect(content).toContain('@Catch');
    });

    it('should create health check controller', async () => {
      await applyTemplateEnhancements(testDir, 'nestjs-typeorm', config);

      const healthControllerPath = path.join(testDir, 'src', 'health', 'health.controller.ts');
      expect(await fs.pathExists(healthControllerPath)).toBe(true);

      const content = await fs.readFile(healthControllerPath, 'utf8');
      expect(content).toContain('HealthController');
      expect(content).toContain('/health');
    });

    it('should add NestJS enhancement dependencies', async () => {
      await applyTemplateEnhancements(testDir, 'nestjs-typeorm', config);

      const packageJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(packageJson.dependencies.pino).toBeDefined();
      expect(packageJson.dependencies['@nestjs/terminus']).toBeDefined();
    });
  });

  describe('Fastify template enhancements', () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'fastify-native',
      quality: 'production',
    };

    it('should apply Fastify enhancements', async () => {
      const result = await applyTemplateEnhancements(testDir, 'fastify-native', config);

      expect(result.template).toBe('fastify-native');
      expect(result.enhancementsApplied.length).toBeGreaterThan(0);
    });

    it('should create Prisma client singleton', async () => {
      await applyTemplateEnhancements(testDir, 'fastify-native', config);

      const prismaPath = path.join(testDir, 'src', 'lib', 'prisma.ts');
      expect(await fs.pathExists(prismaPath)).toBe(true);

      const content = await fs.readFile(prismaPath, 'utf8');
      expect(content).toContain('PrismaClient');
    });

    it('should create global error handler plugin', async () => {
      await applyTemplateEnhancements(testDir, 'fastify-native', config);

      const errorHandlerPath = path.join(testDir, 'src', 'plugins', 'error-handler.ts');
      expect(await fs.pathExists(errorHandlerPath)).toBe(true);

      const content = await fs.readFile(errorHandlerPath, 'utf8');
      expect(content).toContain('setErrorHandler');
    });

    it('should create health check routes', async () => {
      await applyTemplateEnhancements(testDir, 'fastify-native', config);

      const healthPath = path.join(testDir, 'src', 'routes', 'health.ts');
      expect(await fs.pathExists(healthPath)).toBe(true);

      const content = await fs.readFile(healthPath, 'utf8');
      expect(content).toContain('/health');
      expect(content).toContain('/ready');
    });

    it('should create TypeBox schemas', async () => {
      await applyTemplateEnhancements(testDir, 'fastify-native', config);

      const schemasPath = path.join(testDir, 'src', 'schemas', 'common.ts');
      expect(await fs.pathExists(schemasPath)).toBe(true);

      const content = await fs.readFile(schemasPath, 'utf8');
      expect(content).toContain('@sinclair/typebox');
    });

    it('should create Prisma schema', async () => {
      await applyTemplateEnhancements(testDir, 'fastify-native', config);

      const prismaSchemaPath = path.join(testDir, 'prisma', 'schema.prisma');
      expect(await fs.pathExists(prismaSchemaPath)).toBe(true);

      const content = await fs.readFile(prismaSchemaPath, 'utf8');
      expect(content).toContain('generator client');
      expect(content).toContain('datasource db');
    });

    it('should add Fastify enhancement dependencies', async () => {
      await applyTemplateEnhancements(testDir, 'fastify-native', config);

      const packageJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(packageJson.dependencies['@prisma/client']).toBeDefined();
      expect(packageJson.dependencies['@sinclair/typebox']).toBeDefined();
      expect(packageJson.devDependencies.prisma).toBeDefined();
    });
  });

  describe('Astro template enhancements', () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'astro-portfolio',
      quality: 'production',
    };

    it('should apply Astro enhancements', async () => {
      const result = await applyTemplateEnhancements(testDir, 'astro-portfolio', config);

      expect(result.template).toBe('astro-portfolio');
      expect(result.enhancementsApplied.length).toBeGreaterThan(0);
    });

    it('should create Astro config with integrations', async () => {
      await applyTemplateEnhancements(testDir, 'astro-portfolio', config);

      const astroConfigPath = path.join(testDir, 'astro.config.mjs');
      expect(await fs.pathExists(astroConfigPath)).toBe(true);

      const content = await fs.readFile(astroConfigPath, 'utf8');
      expect(content).toContain('@astrojs/react');
      expect(content).toContain('@astrojs/tailwind');
    });

    it('should create Tailwind configuration', async () => {
      await applyTemplateEnhancements(testDir, 'astro-portfolio', config);

      const tailwindConfigPath = path.join(testDir, 'tailwind.config.mjs');
      expect(await fs.pathExists(tailwindConfigPath)).toBe(true);

      const content = await fs.readFile(tailwindConfigPath, 'utf8');
      expect(content).toContain('tailwindcss');
      expect(content).toContain('content');
    });

    it('should create global CSS with Tailwind directives', async () => {
      await applyTemplateEnhancements(testDir, 'astro-portfolio', config);

      const globalCssPath = path.join(testDir, 'src', 'styles', 'global.css');
      expect(await fs.pathExists(globalCssPath)).toBe(true);

      const content = await fs.readFile(globalCssPath, 'utf8');
      expect(content).toContain('@tailwind base');
      expect(content).toContain('@tailwind components');
      expect(content).toContain('@tailwind utilities');
    });

    it('should create example React component', async () => {
      await applyTemplateEnhancements(testDir, 'astro-portfolio', config);

      const counterPath = path.join(testDir, 'src', 'components', 'Counter.tsx');
      expect(await fs.pathExists(counterPath)).toBe(true);

      const content = await fs.readFile(counterPath, 'utf8');
      expect(content).toContain('useState');
      expect(content).toContain('Counter');
    });

    it('should add Astro enhancement dependencies', async () => {
      await applyTemplateEnhancements(testDir, 'astro-portfolio', config);

      const packageJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['@astrojs/react']).toBeDefined();
      expect(packageJson.dependencies['@astrojs/tailwind']).toBeDefined();
      expect(packageJson.dependencies.tailwindcss).toBeDefined();
    });
  });

  describe('unknown template', () => {
    it('should return empty result for unknown template', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 'unknown-template' as any,
        quality: 'production',
      };

      const result = await applyTemplateEnhancements(testDir, 'unknown-template' as any, config);

      expect(result.enhancementsApplied).toHaveLength(0);
      expect(result.filesCreated).toHaveLength(0);
      expect(result.dependenciesAdded).toHaveLength(0);
    });
  });

  describe('idempotency', () => {
    it('should not overwrite existing files', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 't3-prisma',
        quality: 'production',
      };

      // Create an existing file
      const componentsDir = path.join(testDir, 'src', 'components');
      await fs.ensureDir(componentsDir);
      const existingContent = '// Existing error boundary';
      await fs.writeFile(path.join(componentsDir, 'error-boundary.tsx'), existingContent);

      // Apply enhancements
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      // Verify the existing file was not overwritten
      const content = await fs.readFile(
        path.join(testDir, 'src', 'components', 'error-boundary.tsx'),
        'utf8'
      );
      expect(content).toBe(existingContent);
    });

    it('should not overwrite existing dependencies', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        template: 't3-prisma',
        quality: 'production',
      };

      // Add existing dependency with specific version
      await fs.writeJson(path.join(testDir, 'package.json'), {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          pino: '^8.0.0', // Different version
        },
        devDependencies: {},
      });

      // Apply enhancements
      await applyTemplateEnhancements(testDir, 't3-prisma', config);

      // Verify the existing dependency was not overwritten
      const packageJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(packageJson.dependencies.pino).toBe('^8.0.0');
    });
  });
});
