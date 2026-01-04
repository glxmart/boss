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

  it('should generate CLAUDE.md with BOSS integration section', async () => {
    const config: ProjectConfig = {
      name: 'test-project',
      template: 'nextjs-app-turbo',
      quality: 'production',
    };

    await generateClaudeMD(testDir, config);

    const claudePath = path.join(testDir, 'CLAUDE.md');
    expect(await fs.pathExists(claudePath)).toBe(true);

    const content = await fs.readFile(claudePath, 'utf8');

    // Check for BOSS integration section
    expect(content).toContain('BOSS Integration');
    expect(content).toContain('Constitutional Governance');
    expect(content).toContain('Spec-Kit Integration');
    expect(content).toContain('Quality Automation');

    // Check for BOSS documentation links
    expect(content).toContain('docs/conductor.md');
    expect(content).toContain('docs/workflow.md');
    expect(content).toContain('docs/workers.md');
  });

  it('should include project name and template info placeholders', async () => {
    const config: ProjectConfig = {
      name: 'my-awesome-project',
      template: 'api-service-fastify',
      quality: 'enterprise',
    };

    await generateClaudeMD(testDir, config);

    const content = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
    // Template contains placeholders that should be present
    expect(content).toContain('**Name**:');
    expect(content).toContain('**Template**:');
    expect(content).toContain('**Quality Preset**:');
    expect(content).toContain('**Stack**:');
  });

  it('should include quality standards', async () => {
    const config: ProjectConfig = {
      name: 'test',
      template: 'blank',
      quality: 'startup',
    };

    await generateClaudeMD(testDir, config);

    const content = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
    // Check for quality gates section
    expect(content).toContain('Quality Gates');
    expect(content).toContain('Coverage');
    // Check for best practices
    expect(content).toContain('Best Practices');
    expect(content).toContain('Testing');
  });
});
