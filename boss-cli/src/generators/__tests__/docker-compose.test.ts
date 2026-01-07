import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateDockerCompose } from '../docker-compose.js';
import type { ProjectConfig, Template } from '../../types/index.js';

describe('docker-compose generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-docker');

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

  describe('infrastructure services only (no template)', () => {
    it('should generate docker-compose.yml with required services', async () => {
      await generateDockerCompose(testDir);

      const dockerComposePath = path.join(testDir, 'docker-compose.yml');
      expect(await fs.pathExists(dockerComposePath)).toBe(true);

      const content = await fs.readFile(dockerComposePath, 'utf8');
      expect(content).toContain('postgres:');
      expect(content).toContain('qdrant:');
      expect(content).toContain('embeddings:');
    });

    it('should include health checks for all services', async () => {
      await generateDockerCompose(testDir);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('healthcheck:');
      expect(content).toContain('boss-postgres');
      expect(content).toContain('boss-qdrant');
      expect(content).toContain('boss-embeddings');
    });

    it('should configure correct ports', async () => {
      await generateDockerCompose(testDir);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('5432:5432'); // PostgreSQL
      expect(content).toContain('6333:6333'); // Qdrant
      expect(content).toContain('8080:80'); // Embeddings
    });

    it('should not include app service when no template provided', async () => {
      await generateDockerCompose(testDir);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).not.toContain('app:');
      expect(content).not.toContain('test-project-app');
    });
  });

  describe('with app service (template provided)', () => {
    it('should include app service for t3-prisma template', async () => {
      await generateDockerCompose(testDir, 't3-prisma', baseConfig);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('app:');
      expect(content).toContain('test-project-app');
      expect(content).toContain('3000:3000');
      expect(content).toContain('depends_on:');
      expect(content).toContain(
        'DATABASE_URL=postgresql://boss:bosssecret@postgres:5432/boss_knowledge'
      );
    });

    it('should include app service for nestjs-typeorm template', async () => {
      const config = { ...baseConfig, template: 'nestjs-typeorm' as Template };
      await generateDockerCompose(testDir, 'nestjs-typeorm', config);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('app:');
      expect(content).toContain('DATABASE_HOST=postgres');
      expect(content).toContain('DATABASE_PORT=5432');
    });

    it('should include app service for fastify-native template', async () => {
      const config = { ...baseConfig, template: 'fastify-native' as Template };
      await generateDockerCompose(testDir, 'fastify-native', config);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('app:');
      expect(content).toContain('3000:3000');
      expect(content).toContain(
        'DATABASE_URL=postgresql://boss:bosssecret@postgres:5432/boss_knowledge'
      );
    });

    it('should include app service for astro-portfolio without database dependency', async () => {
      const config = { ...baseConfig, template: 'astro-portfolio' as Template };
      await generateDockerCompose(testDir, 'astro-portfolio', config);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('app:');
      expect(content).toContain('80:80');
      // Static sites don't depend on database
      expect(content).not.toContain('DATABASE_URL');
    });

    it('should include health check for app service', async () => {
      await generateDockerCompose(testDir, 't3-prisma', baseConfig);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('http://localhost:3000/health');
    });

    it('should still include infrastructure services when app service is added', async () => {
      await generateDockerCompose(testDir, 't3-prisma', baseConfig);

      const content = await fs.readFile(path.join(testDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('postgres:');
      expect(content).toContain('qdrant:');
      expect(content).toContain('embeddings:');
    });
  });
});
