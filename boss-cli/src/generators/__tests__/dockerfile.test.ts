import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  generateDockerfile,
  generateDockerignore,
  generateDockerFiles,
  getTemplatePort,
  isStaticSite,
} from '../dockerfile.js';
import type { ProjectConfig, Template } from '../../types/index.js';

describe('dockerfile generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-dockerfile');

  const baseConfig: ProjectConfig = {
    name: 'test-project',
    template: 't3-prisma',
    quality: 'production',
  };

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('generateDockerfile', () => {
    it('should generate Dockerfile for t3-prisma template', async () => {
      await generateDockerfile(testDir, 't3-prisma', baseConfig);

      const dockerfilePath = path.join(testDir, 'Dockerfile');
      expect(await fs.pathExists(dockerfilePath)).toBe(true);

      const content = await fs.readFile(dockerfilePath, 'utf8');
      expect(content).toContain('FROM node:22-alpine AS builder');
      expect(content).toContain('gcr.io/distroless/nodejs22-debian12');
      expect(content).toContain('pnpm install --frozen-lockfile');
      expect(content).toContain('EXPOSE 3000');
    });

    it('should generate Dockerfile for t3-drizzle template', async () => {
      await generateDockerfile(testDir, 't3-drizzle', baseConfig);

      const content = await fs.readFile(path.join(testDir, 'Dockerfile'), 'utf8');
      expect(content).toContain('FROM node:22-alpine AS builder');
      expect(content).toContain('gcr.io/distroless/nodejs22-debian12');
    });

    it('should generate Dockerfile for nestjs-typeorm template', async () => {
      const config = { ...baseConfig, template: 'nestjs-typeorm' as Template };
      await generateDockerfile(testDir, 'nestjs-typeorm', config);

      const content = await fs.readFile(path.join(testDir, 'Dockerfile'), 'utf8');
      expect(content).toContain('FROM node:22-alpine AS builder');
      expect(content).toContain('dist/main.js');
    });

    it('should generate Dockerfile for fastify-native template', async () => {
      const config = { ...baseConfig, template: 'fastify-native' as Template };
      await generateDockerfile(testDir, 'fastify-native', config);

      const content = await fs.readFile(path.join(testDir, 'Dockerfile'), 'utf8');
      expect(content).toContain('FROM node:22-alpine AS builder');
      expect(content).toContain('dist/index.js');
    });

    it('should generate Dockerfile for astro-portfolio template with nginx', async () => {
      const config = { ...baseConfig, template: 'astro-portfolio' as Template };
      await generateDockerfile(testDir, 'astro-portfolio', config);

      // Check Dockerfile
      const dockerfileContent = await fs.readFile(path.join(testDir, 'Dockerfile'), 'utf8');
      expect(dockerfileContent).toContain('FROM nginx:alpine');
      expect(dockerfileContent).toContain('/usr/share/nginx/html');

      // Check nginx.conf was also generated
      const nginxConfigPath = path.join(testDir, 'nginx.conf');
      expect(await fs.pathExists(nginxConfigPath)).toBe(true);

      const nginxContent = await fs.readFile(nginxConfigPath, 'utf8');
      expect(nginxContent).toContain('worker_processes auto');
      expect(nginxContent).toContain('location /health');
    });
  });

  describe('generateDockerignore', () => {
    it('should generate .dockerignore file', async () => {
      await generateDockerignore(testDir);

      const dockerignorePath = path.join(testDir, '.dockerignore');
      expect(await fs.pathExists(dockerignorePath)).toBe(true);

      const content = await fs.readFile(dockerignorePath, 'utf8');
      expect(content).toContain('node_modules');
      expect(content).toContain('.git');
      expect(content).toContain('dist');
      expect(content).toContain('.env');
      expect(content).toContain('tests');
      expect(content).toContain('.boss');
    });
  });

  describe('generateDockerFiles', () => {
    it('should generate both Dockerfile and .dockerignore', async () => {
      await generateDockerFiles(testDir, 't3-prisma', baseConfig);

      expect(await fs.pathExists(path.join(testDir, 'Dockerfile'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.dockerignore'))).toBe(true);
    });

    it('should generate nginx.conf for static sites', async () => {
      const config = { ...baseConfig, template: 'astro-portfolio' as Template };
      await generateDockerFiles(testDir, 'astro-portfolio', config);

      expect(await fs.pathExists(path.join(testDir, 'Dockerfile'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, '.dockerignore'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'nginx.conf'))).toBe(true);
    });
  });

  describe('getTemplatePort', () => {
    it('should return correct port for each template', () => {
      expect(getTemplatePort('t3-prisma')).toBe(3000);
      expect(getTemplatePort('t3-drizzle')).toBe(3000);
      expect(getTemplatePort('nestjs-typeorm')).toBe(3000);
      expect(getTemplatePort('fastify-native')).toBe(3000);
      expect(getTemplatePort('astro-portfolio')).toBe(80);
    });
  });

  describe('isStaticSite', () => {
    it('should correctly identify static sites', () => {
      expect(isStaticSite('astro-portfolio')).toBe(true);
      expect(isStaticSite('t3-prisma')).toBe(false);
      expect(isStaticSite('t3-drizzle')).toBe(false);
      expect(isStaticSite('nestjs-typeorm')).toBe(false);
      expect(isStaticSite('fastify-native')).toBe(false);
    });
  });
});
