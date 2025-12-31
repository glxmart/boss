import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateClaudeMD } from '../claude-md.js';
import type { ProjectConfig } from '../../types/index.js';

describe('claude-md generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-claude');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate CLAUDE.md with mandatory verbatim text', async () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'nextjs-app-turbo',
      quality: 'production'
    };

    await generateClaudeMD(testDir, config);

    const claudePath = path.join(testDir, 'CLAUDE.md');
    expect(await fs.pathExists(claudePath)).toBe(true);

    const content = await fs.readFile(claudePath, 'utf8');

    // Check for mandatory verbatim text
    expect(content).toContain('ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations');
    expect(content).toContain('DO NOT install or use the git cli with the environment_run_cmd tool');
    expect(content).toContain('container-use log <env_id>');
    expect(content).toContain('container-use checkout <env_id>');
  });

  it('should include project name and template info', async () => {
    const config: ProjectConfig = {
      name: 'my-awesome-project',
      template: 'api-service-fastify',
      quality: 'enterprise'
    };

    await generateClaudeMD(testDir, config);

    const content = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('my-awesome-project');
    expect(content).toContain('API Service (Fastify)');
    expect(content).toContain('Enterprise');
  });

  it('should include quality standards', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup'
    };

    await generateClaudeMD(testDir, config);

    const content = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('Test-First (NON-NEGOTIABLE)');
    expect(content).toContain('BDD (Mandatory)');
    expect(content).toContain('Feature Documentation (NON-NEGOTIABLE)');
  });
});

