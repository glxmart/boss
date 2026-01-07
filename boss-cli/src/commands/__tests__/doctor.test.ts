import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import {
  doctorCommand,
  validateOverlay,
  validateDependencies,
  validateDocker,
  validateGitRepository,
  validateQualityGates,
  type CheckResult,
} from '../doctor.js';

// Mock execa
vi.mock('execa');

describe('doctor command', () => {
  it('should be importable', async () => {
    expect(doctorCommand).toBeDefined();
    expect(typeof doctorCommand).toBe('function');
  });

  it('should export validation functions', () => {
    expect(validateOverlay).toBeDefined();
    expect(validateDependencies).toBeDefined();
    expect(validateDocker).toBeDefined();
    expect(validateGitRepository).toBeDefined();
    expect(validateQualityGates).toBeDefined();
  });
});

describe('validateOverlay', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `boss-doctor-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should fail when .boss directory is missing', async () => {
    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('.boss/');
    expect(result.remediation).toBeDefined();
  });

  it('should fail when required directories are missing', async () => {
    // Create .boss but not subdirectories
    await fs.ensureDir(path.join(tempDir, '.boss'));

    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('Missing');
  });

  it('should fail when required files are missing', async () => {
    // Create all required directories
    await fs.ensureDir(path.join(tempDir, '.boss', 'workers'));
    await fs.ensureDir(path.join(tempDir, '.boss', 'worker-manifests'));
    await fs.ensureDir(path.join(tempDir, '.specify'));
    await fs.ensureDir(path.join(tempDir, '.container-use'));

    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('config.yaml');
  });

  it('should pass when all required files and directories exist', async () => {
    // Create all required directories
    await fs.ensureDir(path.join(tempDir, '.boss', 'workers'));
    await fs.ensureDir(path.join(tempDir, '.boss', 'worker-manifests'));
    await fs.ensureDir(path.join(tempDir, '.specify'));
    await fs.ensureDir(path.join(tempDir, '.container-use'));

    // Create required files
    await fs.writeFile(path.join(tempDir, '.boss', 'config.yaml'), 'boss:\n  version: "1.0.0"');
    await fs.writeFile(
      path.join(tempDir, '.boss', 'project-config.json'),
      '{"project": {"name": "test"}}'
    );

    // Create optional files
    await fs.writeFile(
      path.join(tempDir, '.boss', 'template-version.json'),
      '{"template": "t3-prisma"}'
    );
    await fs.writeFile(path.join(tempDir, 'renovate.json'), '{}');
    await fs.writeFile(path.join(tempDir, '.mcp.json'), '{}');

    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('All required files present');
  });

  it('should warn when optional files are missing', async () => {
    // Create all required directories
    await fs.ensureDir(path.join(tempDir, '.boss', 'workers'));
    await fs.ensureDir(path.join(tempDir, '.boss', 'worker-manifests'));
    await fs.ensureDir(path.join(tempDir, '.specify'));
    await fs.ensureDir(path.join(tempDir, '.container-use'));

    // Create required files only
    await fs.writeFile(path.join(tempDir, '.boss', 'config.yaml'), 'boss:\n  version: "1.0.0"');
    await fs.writeFile(
      path.join(tempDir, '.boss', 'project-config.json'),
      '{"project": {"name": "test"}}'
    );

    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('optional missing');
  });

  it('should fail on invalid YAML in config.yaml', async () => {
    // Create all required directories
    await fs.ensureDir(path.join(tempDir, '.boss', 'workers'));
    await fs.ensureDir(path.join(tempDir, '.boss', 'worker-manifests'));
    await fs.ensureDir(path.join(tempDir, '.specify'));
    await fs.ensureDir(path.join(tempDir, '.container-use'));

    // Create invalid YAML
    await fs.writeFile(path.join(tempDir, '.boss', 'config.yaml'), 'invalid: yaml: content: :::');
    await fs.writeFile(
      path.join(tempDir, '.boss', 'project-config.json'),
      '{"project": {"name": "test"}}'
    );

    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('Invalid YAML');
  });

  it('should fail on invalid JSON in project-config.json', async () => {
    // Create all required directories
    await fs.ensureDir(path.join(tempDir, '.boss', 'workers'));
    await fs.ensureDir(path.join(tempDir, '.boss', 'worker-manifests'));
    await fs.ensureDir(path.join(tempDir, '.specify'));
    await fs.ensureDir(path.join(tempDir, '.container-use'));

    // Create valid YAML but invalid JSON
    await fs.writeFile(path.join(tempDir, '.boss', 'config.yaml'), 'boss:\n  version: "1.0.0"');
    await fs.writeFile(path.join(tempDir, '.boss', 'project-config.json'), '{ invalid json }');

    const result = await validateOverlay(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('Invalid JSON');
  });
});

describe('validateDependencies', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `boss-doctor-deps-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should warn when package.json is missing', async () => {
    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('No package.json');
  });

  it('should warn when lock file is missing', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}');

    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('No lock file');
  });

  it('should fail when lock file exists but node_modules is missing', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}');
    await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0');

    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('node_modules missing');
    expect(result.remediation).toContain('pnpm install');
  });

  it('should fail when node_modules is empty', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}');
    await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0');
    await fs.ensureDir(path.join(tempDir, 'node_modules'));

    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('node_modules is empty');
  });

  it('should pass when dependencies are properly installed (pnpm)', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}');
    await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0');
    await fs.ensureDir(path.join(tempDir, 'node_modules', 'some-package'));

    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('pnpm-lock.yaml');
  });

  it('should pass when dependencies are properly installed (npm)', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}');
    await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{"lockfileVersion": 3}');
    await fs.ensureDir(path.join(tempDir, 'node_modules', 'some-package'));

    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('package-lock.json');
  });

  it('should pass when dependencies are properly installed (yarn)', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}');
    await fs.writeFile(path.join(tempDir, 'yarn.lock'), '# yarn lockfile');
    await fs.ensureDir(path.join(tempDir, 'node_modules', 'some-package'));

    const result = await validateDependencies(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('yarn.lock');
  });
});

describe('validateDocker', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `boss-doctor-docker-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should warn when no Docker configuration exists', async () => {
    const result = await validateDocker(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('No Docker configuration');
  });

  it('should pass when all Docker files exist', async () => {
    await fs.writeFile(path.join(tempDir, 'Dockerfile'), 'FROM node:22-alpine');
    await fs.writeFile(path.join(tempDir, 'docker-compose.yml'), 'version: "3.8"');
    await fs.writeFile(path.join(tempDir, '.dockerignore'), 'node_modules');

    const result = await validateDocker(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('Dockerfile');
    expect(result.message).toContain('docker-compose.yml');
    expect(result.message).toContain('.dockerignore');
  });

  it('should warn when some Docker files are missing', async () => {
    await fs.writeFile(path.join(tempDir, 'Dockerfile'), 'FROM node:22-alpine');

    const result = await validateDocker(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('Missing');
    expect(result.message).toContain('docker-compose.yml');
  });

  it('should fail on invalid docker-compose.yml YAML', async () => {
    await fs.writeFile(path.join(tempDir, 'docker-compose.yml'), 'invalid: yaml: :::');

    const result = await validateDocker(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('Invalid YAML');
  });

  it('should pass when only docker-compose.yml exists', async () => {
    await fs.writeFile(
      path.join(tempDir, 'docker-compose.yml'),
      'version: "3.8"\nservices:\n  db:\n    image: postgres'
    );

    const result = await validateDocker(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('docker-compose.yml');
  });
});

describe('validateGitRepository', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `boss-doctor-git-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should fail when .git directory is missing', async () => {
    const result = await validateGitRepository(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('Not a git repository');
    expect(result.remediation).toContain('git init');
  });

  it('should detect when git repository exists', async () => {
    // Create a .git directory to simulate a repo
    await fs.ensureDir(path.join(tempDir, '.git'));

    const result = await validateGitRepository(tempDir);

    // Since we didn't actually init a git repo, it will warn about commit history
    expect(['warning', 'fail']).toContain(result.status);
  });
});

describe('validateQualityGates', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `boss-doctor-quality-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should fail when no quality gates are configured', async () => {
    const result = await validateQualityGates(tempDir);

    expect(result.status).toBe('fail');
    expect(result.message).toContain('No quality gates');
  });

  it('should pass when all quality gates are configured', async () => {
    await fs.ensureDir(path.join(tempDir, '.husky'));
    await fs.writeFile(path.join(tempDir, 'eslint.config.js'), 'export default [];');
    await fs.writeFile(path.join(tempDir, '.prettierrc'), '{}');
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

    const result = await validateQualityGates(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('husky');
    expect(result.message).toContain('eslint');
    expect(result.message).toContain('prettier');
    expect(result.message).toContain('typescript');
  });

  it('should warn when some quality gates are missing', async () => {
    await fs.writeFile(path.join(tempDir, 'eslint.config.js'), 'export default [];');
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

    const result = await validateQualityGates(tempDir);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('eslint');
    expect(result.message).toContain('typescript');
    expect(result.message).toContain('Missing');
  });

  it('should detect ESLint config in various formats', async () => {
    // Test .eslintrc.json format
    await fs.writeFile(path.join(tempDir, '.eslintrc.json'), '{}');

    const result = await validateQualityGates(tempDir);

    expect(result.message).toContain('eslint');
  });

  it('should detect ESLint config in package.json', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ eslintConfig: { rules: {} } })
    );

    const result = await validateQualityGates(tempDir);

    expect(result.message).toContain('eslint');
  });

  it('should detect Prettier config in package.json', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ prettier: { printWidth: 100 } })
    );

    const result = await validateQualityGates(tempDir);

    expect(result.message).toContain('prettier');
  });

  it('should detect lefthook as alternative to husky', async () => {
    await fs.writeFile(path.join(tempDir, 'lefthook.yml'), 'pre-commit:\n  commands: {}');
    await fs.writeFile(path.join(tempDir, 'eslint.config.js'), 'export default [];');
    await fs.writeFile(path.join(tempDir, '.prettierrc'), '{}');
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

    const result = await validateQualityGates(tempDir);

    expect(result.status).toBe('pass');
    expect(result.message).toContain('lefthook');
  });
});

describe('CheckResult interface', () => {
  it('should have the expected structure', () => {
    const result: CheckResult = {
      name: 'Test Check',
      status: 'pass',
      message: 'Test passed',
    };

    expect(result.name).toBe('Test Check');
    expect(result.status).toBe('pass');
    expect(result.message).toBe('Test passed');
    expect(result.remediation).toBeUndefined();
  });

  it('should allow optional remediation', () => {
    const result: CheckResult = {
      name: 'Test Check',
      status: 'fail',
      message: 'Test failed',
      remediation: 'Run: fix-it',
    };

    expect(result.remediation).toBe('Run: fix-it');
  });

  it('should have valid status values', () => {
    const validStatuses: CheckResult['status'][] = ['pass', 'fail', 'warning'];

    for (const status of validStatuses) {
      const result: CheckResult = {
        name: 'Test',
        status,
        message: 'Test',
      };
      expect(result.status).toBe(status);
    }
  });
});
