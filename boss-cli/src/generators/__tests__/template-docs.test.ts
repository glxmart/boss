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

  it('should generate TEMPLATE.md for blank template', async () => {
    const config = {
      name: 'test-project',
      template: 'blank' as const,
      quality: 'startup' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    expect(content).toContain('Template Documentation: Blank');
    expect(content).toContain('test-project');
    expect(content).toContain('startup');
    expect(content).toContain('TypeScript');
    expect(content).toContain('Vitest');
  });

  it('should generate TEMPLATE.md for nextjs-app-turbo template', async () => {
    const config = {
      name: 'test-nextjs',
      template: 'nextjs-app-turbo' as const,
      quality: 'production' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    expect(content).toContain('Template Documentation: Next.js App (Turbo)');
    expect(content).toContain('test-nextjs');
    expect(content).toContain('production');
    expect(content).toContain('Next.js');
    expect(content).toContain('React');
  });

  it('should generate TEMPLATE.md for api-service-fastify template', async () => {
    const config = {
      name: 'test-api',
      template: 'api-service-fastify' as const,
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

  it('should generate TEMPLATE.md for t3-app template', async () => {
    const config = {
      name: 'test-t3',
      template: 't3-app' as const,
      quality: 'startup' as const,
    };

    await generateTemplateDocs(testDir, config);

    const docPath = path.join(testDir, 'docs', 'TEMPLATE.md');
    expect(await fs.pathExists(docPath)).toBe(true);

    const content = await fs.readFile(docPath, 'utf8');
    expect(content).toContain('Template Documentation: T3 Stack');
    expect(content).toContain('test-t3');
    expect(content).toContain('tRPC');
    expect(content).toContain('Prisma');
  });

  it('should include project-specific information', async () => {
    const config = {
      name: 'my-awesome-project',
      template: 'blank' as const,
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
