import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContainerUseClient } from '../../src/orchestration/container-use-client.js';
import { ErrorCategory } from '../../src/types.js';
import { ConductorException } from '../../src/utils/error-handler.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn()
}));

import { execa } from 'execa';

describe('ContainerUseClient Integration', () => {
  let client: ContainerUseClient;

  beforeEach(() => {
    client = new ContainerUseClient();
    vi.clearAllMocks();
  });

  describe('createEnvironment', () => {
    it('should call container-use create with correct arguments', async () => {
      const mockResult = {
        stdout: JSON.stringify({
          environment_id: 'env-123',
          status: 'created'
        })
      };

      vi.mocked(execa).mockResolvedValue(mockResult as any);

      const result = await client.createEnvironment({
        base_image: 'node:22-slim',
        setup_commands: ['apt-get update'],
        install_commands: ['npm install'],
        environment_variables: { NODE_ENV: 'test' },
        secrets: [],
        network: { allowed_hosts: [] }
      });

      expect(execa).toHaveBeenCalledWith(
        'container-use',
        expect.arrayContaining(['create']),
        expect.any(Object)
      );

      expect(result.environment_id).toBe('env-123');
    });

    it('should throw error if container-use call fails', async () => {
      const error = new Error('ENOENT');
      vi.mocked(execa).mockRejectedValue(error);

      await expect(async () => {
        await client.createEnvironment({
          base_image: 'node:22-slim',
          setup_commands: [],
          install_commands: [],
          environment_variables: {},
          secrets: [],
          network: { allowed_hosts: [] }
        });
      }).rejects.toThrow();
    });
  });

  describe('executeInEnvironment', () => {
    it('should call container-use exec with environment ID and command', async () => {
      const mockResult = { stdout: '' };
      vi.mocked(execa).mockResolvedValue(mockResult as any);

      await client.executeInEnvironment({
        environment_id: 'env-123',
        command: 'npm test'
      });

      expect(execa).toHaveBeenCalledWith(
        'container-use',
        ['exec', 'env-123', 'npm test'],
        expect.any(Object)
      );
    });
  });

  describe('environmentFileWrite', () => {
    it('should call container-use write with file path and contents', async () => {
      const mockResult = { stdout: '' };
      vi.mocked(execa).mockResolvedValue(mockResult as any);

      await client.environmentFileWrite({
        environment_id: 'env-123',
        target_file: '/workdir/.claude/CLAUDE.md',
        contents: 'Test content'
      });

      expect(execa).toHaveBeenCalledWith(
        'container-use',
        ['write', 'env-123', '/workdir/.claude/CLAUDE.md', 'Test content'],
        expect.any(Object)
      );
    });
  });

  describe('mergeEnvironment', () => {
    it('should call container-use merge with target branch', async () => {
      const mockResult = { stdout: '' };
      vi.mocked(execa).mockResolvedValue(mockResult as any);

      await client.mergeEnvironment({
        environment_id: 'env-123',
        target_branch: 'main'
      });

      expect(execa).toHaveBeenCalledWith(
        'container-use',
        ['merge', 'env-123', '--target', 'main'],
        expect.any(Object)
      );
    });
  });

  describe('deleteEnvironment', () => {
    it('should call container-use delete', async () => {
      const mockResult = { stdout: '' };
      vi.mocked(execa).mockResolvedValue(mockResult as any);

      await client.deleteEnvironment('env-123');

      expect(execa).toHaveBeenCalledWith(
        'container-use',
        ['delete', 'env-123'],
        expect.any(Object)
      );
    });

    it('should not throw on delete failure', async () => {
      const error = new Error('Delete failed');
      vi.mocked(execa).mockRejectedValue(error);

      // Should not throw
      await client.deleteEnvironment('env-123');

      expect(execa).toHaveBeenCalled();
    });
  });

  describe('checkAvailability', () => {
    it('should return true if container-use is available', async () => {
      const mockResult = { stdout: '[]' };
      vi.mocked(execa).mockResolvedValue(mockResult as any);

      const available = await client.checkAvailability();

      expect(available).toBe(true);
      expect(execa).toHaveBeenCalledWith(
        'container-use',
        ['list'],
        expect.any(Object)
      );
    });

    it('should return false if container-use is not available', async () => {
      const error = new Error('ENOENT');
      vi.mocked(execa).mockRejectedValue(error);

      const available = await client.checkAvailability();

      expect(available).toBe(false);
    });
  });
});
