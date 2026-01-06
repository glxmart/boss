import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateTemplateDocs } from '../template-docs.js';

describe('template-docs generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-template-docs');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, 'docs'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate TEMPLATE.md for t3-prisma template', async () => {
    const config = {
      name: 'test-project',
      template: 't3-prisma' as const,
      quality: 'startup' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    expect(content).toContain('Template Documentation: T3 Stack');
    expect(content).toContain('test-project');
    expect(content).toContain('startup');
    expect(content).toContain('tRPC');
    expect(content).toContain('Prisma');
  });

  it('should generate TEMPLATE.md for t3-drizzle template', async () => {
    const config = {
      name: 'test-drizzle',
      template: 't3-drizzle' as const,
      quality: 'production' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    expect(content).toContain('Template Documentation: T3 Stack');
    expect(content).toContain('test-drizzle');
    expect(content).toContain('production');
  });

  it('should generate TEMPLATE.md for fastify-native template', async () => {
    const config = {
      name: 'test-api',
      template: 'fastify-native' as const,
      quality: 'enterprise' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    expect(content).toContain('Template Documentation: Fastify API Service');
    expect(content).toContain('test-api');
    expect(content).toContain('enterprise');
    expect(content).toContain('Fastify');
  });

  it('should generate TEMPLATE.md for nestjs-typeorm template', async () => {
    const config = {
      name: 'test-nestjs',
      template: 'nestjs-typeorm' as const,
      quality: 'startup' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    // NestJS uses the Fastify API Service template for now
    expect(content).toContain('Template Documentation: Fastify API Service');
    expect(content).toContain('test-nestjs');
  });

  it('should include project-specific information', async () => {
    const config = {
      name: 'my-awesome-project',
      template: 't3-prisma' as const,
      quality: 'production' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    const content = await fs.readFile(docPath, 'utf8');

    expect(content).toContain('my-awesome-project');
    expect(content).toContain('production');
    expect(content).toContain('Available Scripts');
    expect(content).toContain('Next Steps');
  });
});
