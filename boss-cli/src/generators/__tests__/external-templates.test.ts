import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkTemplateAvailability,
  executeExternalTemplate,
  getTemplateExecutorInfo,
  formatAvailabilityError,
} from '../external-templates.js';
import type { ProjectConfig } from '../../types/index.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Mock fs-extra
const mockPathExists = vi.fn(async () => true);
const mockEnsureDir = vi.fn(async () => {});
const mockRemove = vi.fn(async () => {});
const mockReadFile = vi.fn(async () => '{}');
const mockWriteFile = vi.fn(async () => {});

const mockFs = {
  pathExists: mockPathExists,
  ensureDir: mockEnsureDir,
  remove: mockRemove,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  default: {
    pathExists: mockPathExists,
    ensureDir: mockEnsureDir,
    remove: mockRemove,
    readFile: mockReadFile,
    writeFile: mockWriteFile,
  },
};

vi.mock('fs-extra', () => mockFs);

// Mock file-system utils
vi.mock('../../utils/file-system.js', () => ({
  writeFile: vi.fn(async () => {}),
  readFile: vi.fn(async () => '{}'),
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    startSpinner: vi.fn(),
    stopSpinner: vi.fn(),
  },
}));

describe('external-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateExecutorInfo', () => {
    it('should return executor info for t3-prisma template', () => {
      const info = getTemplateExecutorInfo('t3-prisma');
      expect(info).toBeDefined();
      expect(info?.source).toBe('create-t3-app');
      expect(info?.command).toContain('pnpm create t3-app');
    });

    it('should return executor info for t3-drizzle template', () => {
      const info = getTemplateExecutorInfo('t3-drizzle');
      expect(info).toBeDefined();
      expect(info?.source).toBe('create-t3-app');
      expect(info?.command).toContain('drizzle');
    });

    it('should return executor info for nestjs-typeorm template', () => {
      const info = getTemplateExecutorInfo('nestjs-typeorm');
      expect(info).toBeDefined();
      expect(info?.source).toBe('brocoders/nestjs-boilerplate');
      expect(info?.command).toContain('git clone');
    });

    it('should return executor info for fastify-native template', () => {
      const info = getTemplateExecutorInfo('fastify-native');
      expect(info).toBeDefined();
      expect(info?.source).toBe('create-fastify');
      expect(info?.command).toContain('pnpm create fastify');
    });

    it('should return executor info for astro-portfolio template', () => {
      const info = getTemplateExecutorInfo('astro-portfolio');
      expect(info).toBeDefined();
      expect(info?.source).toBe('create-astro');
      expect(info?.command).toContain('pnpm create astro');
    });

    it('should return null for unknown template', () => {
      const info = getTemplateExecutorInfo('unknown-template' as 't3-prisma');
      expect(info).toBeNull();
    });
  });

  describe('checkTemplateAvailability', () => {
    it('should return available for npm package when reachable', async () => {
      const { execa } = await import('execa');
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '7.32.0' } as never);

      const result = await checkTemplateAvailability('t3-prisma');

      expect(result.available).toBe(true);
      expect(execa).toHaveBeenCalledWith('pnpm', ['view', 'create-t3-app', 'version'], {
        timeout: 30000,
        reject: true,
      });
    });

    it('should return unavailable with remediation for network error', async () => {
      const { execa } = await import('execa');
      const networkError = new Error('ENOTFOUND npm registry');
      vi.mocked(execa).mockRejectedValueOnce(networkError);

      const result = await checkTemplateAvailability('t3-prisma');

      expect(result.available).toBe(false);
      expect(result.error).toContain('Cannot reach npm registry');
      expect(result.remediation).toContain('pnpm ping');
    });

    it('should return unavailable for missing npm package', async () => {
      const { execa } = await import('execa');
      const notFoundError = new Error('404 Not Found');
      vi.mocked(execa).mockRejectedValueOnce(notFoundError);

      const result = await checkTemplateAvailability('fastify-native');

      expect(result.available).toBe(false);
      expect(result.error).toContain('not found on npm');
    });

    it('should check GitHub availability for nestjs-typeorm template', async () => {
      const { execa } = await import('execa');
      vi.mocked(execa).mockResolvedValueOnce({ stdout: 'abc1234\tHEAD' } as never);

      const result = await checkTemplateAvailability('nestjs-typeorm');

      expect(result.available).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        'git',
        ['ls-remote', '--exit-code', 'https://github.com/brocoders/nestjs-boilerplate.git'],
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it('should return unavailable for unknown template', async () => {
      const result = await checkTemplateAvailability('unknown' as 't3-prisma');

      expect(result.available).toBe(false);
      expect(result.error).toContain('Unknown template');
    });
  });

  describe('executeExternalTemplate', () => {
    const testConfig: ProjectConfig = {
      name: 'test-project',
      template: 't3-prisma',
      quality: 'production',
    };

    it('should execute t3-prisma template', async () => {
      const { execa } = await import('execa');
      // Mock version check
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '7.32.0' } as never);
      // Mock template execution
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await executeExternalTemplate('/parent/test-project', 't3-prisma', testConfig);

      expect(result.success).toBe(true);
      expect(result.source).toBe('create-t3-app');
      // Second call should be the template execution
      expect(execa).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['create', 't3-app@latest', 'test-project', '--prisma']),
        expect.objectContaining({ cwd: '/parent' })
      );
    });

    it('should execute t3-drizzle template', async () => {
      const { execa } = await import('execa');
      // Mock version check
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '7.32.0' } as never);
      // Mock template execution
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const drizzleConfig: ProjectConfig = {
        name: 'drizzle-project',
        template: 't3-drizzle',
        quality: 'production',
      };

      const result = await executeExternalTemplate(
        '/parent/drizzle-project',
        't3-drizzle',
        drizzleConfig
      );

      expect(result.success).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['--drizzle']),
        expect.anything()
      );
    });

    it('should execute nestjs-typeorm template via git clone', async () => {
      const { execa } = await import('execa');
      // Mock version check (git ls-remote)
      vi.mocked(execa).mockResolvedValueOnce({ stdout: 'abc1234\tHEAD' } as never);
      // Mock git clone
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const nestConfig: ProjectConfig = {
        name: 'nest-project',
        template: 'nestjs-typeorm',
        quality: 'production',
      };

      const result = await executeExternalTemplate(
        '/parent/nest-project',
        'nestjs-typeorm',
        nestConfig
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('brocoders/nestjs-boilerplate');
      expect(execa).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['clone', '--depth=1']),
        expect.objectContaining({ cwd: '/parent' })
      );
    });

    it('should execute fastify-native template', async () => {
      const { execa } = await import('execa');
      // Mock version check
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '5.0.0' } as never);
      // Mock template execution
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const fastifyConfig: ProjectConfig = {
        name: 'fastify-project',
        template: 'fastify-native',
        quality: 'startup',
      };

      const result = await executeExternalTemplate(
        '/parent/fastify-project',
        'fastify-native',
        fastifyConfig
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('create-fastify');
    });

    it('should execute astro-portfolio template', async () => {
      const { execa } = await import('execa');
      // Mock version check
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '4.0.0' } as never);
      // Mock template execution
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const astroConfig: ProjectConfig = {
        name: 'astro-project',
        template: 'astro-portfolio',
        quality: 'startup',
      };

      const result = await executeExternalTemplate(
        '/parent/astro-project',
        'astro-portfolio',
        astroConfig
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('create-astro');
      expect(execa).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['--template', 'portfolio']),
        expect.anything()
      );
    });

    it('should return failure result on execution error', async () => {
      const { execa } = await import('execa');
      // Mock version check
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '7.32.0' } as never);
      // Mock execution failure
      const execError = new Error('Command failed');
      (execError as { stderr?: string }).stderr = 'Some error output';
      vi.mocked(execa).mockRejectedValueOnce(execError);

      const result = await executeExternalTemplate('/parent/test-project', 't3-prisma', testConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Some error output');
    });

    it('should return failure result for unknown template', async () => {
      const unknownConfig: ProjectConfig = {
        name: 'unknown-project',
        template: 'unknown' as 't3-prisma',
        quality: 'production',
      };

      const result = await executeExternalTemplate(
        '/parent/unknown-project',
        'unknown' as 't3-prisma',
        unknownConfig
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown template');
    });

    it('should generate template-version.json on success', async () => {
      const { execa } = await import('execa');
      const { writeFile } = await import('../../utils/file-system.js');

      // Mock version check
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '7.32.0' } as never);
      // Mock template execution
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      await executeExternalTemplate('/parent/test-project', 't3-prisma', testConfig);

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('template-version.json'),
        expect.stringContaining('"template": "t3-prisma"')
      );
    });
  });

  describe('formatAvailabilityError', () => {
    it('should format error message for unavailable template', () => {
      const result = formatAvailabilityError('t3-prisma', {
        available: false,
        error: 'Cannot reach npm registry',
        remediation: 'Run pnpm ping to verify connectivity',
      });

      expect(result).toContain('Error: Template source unavailable');
      expect(result).toContain('create-t3-app');
      expect(result).toContain('Cannot reach npm registry');
      expect(result).toContain('Run pnpm ping');
    });

    it('should handle missing remediation', () => {
      const result = formatAvailabilityError('t3-prisma', {
        available: false,
        error: 'Some error',
      });

      expect(result).toContain('Error: Template source unavailable');
      expect(result).toContain('Some error');
    });
  });
});
