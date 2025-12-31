import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateDockerCompose } from '../docker-compose.js';

describe('docker-compose generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-docker');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

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
});

