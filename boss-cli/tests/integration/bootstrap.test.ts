import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import {
  createTestProject,
  cleanupTestProject,
  fileExists,
  readProjectFile,
  listProjectFiles
} from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';

describe('Bootstrap Integration Tests', () => {
  const projectName = 'test-bootstrap-project';

  beforeEach(async () => {
    await cleanupTestProject(projectName);
  });

  afterEach(async () => {
    await cleanupTestProject(projectName);
  });

  it('should bootstrap a complete project structure', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    // Check critical files exist
    expect(await fileExists(projectName, 'CLAUDE.md')).toBe(true);
    expect(await fileExists(projectName, 'start-boss.sh')).toBe(true);
    expect(await fileExists(projectName, '.boss/config.yaml')).toBe(true);
    expect(await fileExists(projectName, '.specify/templates')).toBe(true);
    expect(await fileExists(projectName, '.specify/scripts')).toBe(true);
    expect(await fileExists(projectName, '.specify/memory')).toBe(true);
    expect(await fileExists(projectName, '.container-use/environment.json')).toBe(true);
    expect(await fileExists(projectName, 'docker-compose.yml')).toBe(true);
  });

  it('should generate CLAUDE.md with mandatory verbatim text', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    const claudeContent = await readProjectFile(projectName, 'CLAUDE.md');
    expect(claudeContent).toContain('ALWAYS use ONLY Environments');
    expect(claudeContent).toContain('DO NOT install or use the git cli');
    expect(claudeContent).toContain('container-use log <env_id>');
  });

  it('should generate all worker configurations', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    const workers = [
      'architect',
      'clarifier',
      'spec-writer',
      'planner',
      'reviewer',
      'developer-frontend',
      'developer-backend',
      'developer-fullstack',
      'consolidator'
    ];

    for (const worker of workers) {
      expect(await fileExists(projectName, `.boss/workers/${worker}/prompt.md`)).toBe(true);
      expect(await fileExists(projectName, `.boss/workers/${worker}/container-config.json`)).toBe(true);
    }
  });

  it('should generate .claude/ directory structure', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    expect(await fileExists(projectName, '.claude/rules/code-style.md')).toBe(true);
    expect(await fileExists(projectName, '.claude/rules/testing.md')).toBe(true);
    expect(await fileExists(projectName, '.claude/rules/security.md')).toBe(true);
    expect(await fileExists(projectName, '.claude/rules/boss-workflow.md')).toBe(true);
    expect(await fileExists(projectName, '.claude/commands/boss-commands.md')).toBe(true);
    expect(await fileExists(projectName, '.claude/settings.json')).toBe(true);
  });

  it('should generate GitHub workflows', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    expect(await fileExists(projectName, '.github/workflows/boss-ci.yml')).toBe(true);
    expect(await fileExists(projectName, '.github/workflows/boss-gates.yml')).toBe(true);
    expect(await fileExists(projectName, '.github/CODEOWNERS')).toBe(true);
  });

  it('should generate git hooks', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    expect(await fileExists(projectName, '.husky/pre-commit')).toBe(true);
    expect(await fileExists(projectName, '.husky/commit-msg')).toBe(true);
  });

  it('should generate docker-compose.yml with required services', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    const dockerCompose = await readProjectFile(projectName, 'docker-compose.yml');
    expect(dockerCompose).toContain('postgres:');
    expect(dockerCompose).toContain('qdrant:');
    expect(dockerCompose).toContain('embeddings:');
  });

  it('should generate package.json for blank template', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    expect(await fileExists(projectName, 'package.json')).toBe(true);
    const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
    expect(packageJson.name).toBe(projectName);
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
  });

  it('should initialize git repository', async () => {
    const options = {
      template: 'blank' as const,
      quality: 'startup' as const,
      name: projectName,
      nonInteractive: true,
      projectPath: getTestProjectPath(projectName)
    };

    await bootstrapCommand(options);

    expect(await fileExists(projectName, '.git')).toBe(true);
  });
});

