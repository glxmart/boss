import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContainerUseClient } from '../../src/orchestration/container-use-client.js';
import { ContainerUseMCPClient } from '../../src/orchestration/mcp-client.js';
import { ErrorCategory } from '../../src/types.js';

// Mock the MCP client
vi.mock('../../src/orchestration/mcp-client.js', () => {
  const mockCallTool = vi.fn();
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockListTools = vi.fn();

  return {
    ContainerUseMCPClient: vi.fn().mockImplementation(() => ({
      callTool: mockCallTool,
      connect: mockConnect,
      disconnect: mockDisconnect,
      listTools: mockListTools,
    })),
  };
});

describe('ContainerUseClient Integration - MCP Protocol', () => {
  let client: ContainerUseClient;
  let mockMCPClient: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create client instance (this will create a mocked MCP client internally)
    client = new ContainerUseClient();

    // Get reference to the mocked MCP client instance
    mockMCPClient = (client as any).mcpClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createEnvironment', () => {
    it('should call environment_create and environment_config MCP tools', async () => {
      // Mock environment_create response
      mockMCPClient.callTool
        .mockResolvedValueOnce({
          environment_id: 'env-abc123',
        })
        // Mock environment_config response
        .mockResolvedValueOnce({
          success: true,
        });

      const result = await client.createEnvironment({
        environment_source: '/path/to/repo',
        title: 'Test Worker',
        base_image: 'node:22-slim',
        setup_commands: ['apt-get update'],
        install_commands: ['npm install'],
        environment_variables: { NODE_ENV: 'test' },
        secrets: ['SECRET_KEY=secret_value'],
        network: { allowed_hosts: ['*.example.com'] },
      });

      // Verify environment_create was called
      expect(mockMCPClient.callTool).toHaveBeenNthCalledWith(1, 'environment_create', {
        environment_source: '/path/to/repo',
        title: 'Test Worker',
        explanation: 'Creating environment for Test Worker',
      });

      // Verify environment_config was called
      expect(mockMCPClient.callTool).toHaveBeenNthCalledWith(2, 'environment_config', {
        environment_source: '/path/to/repo',
        environment_id: 'env-abc123',
        config: {
          base_image: 'node:22-slim',
          setup_commands: ['apt-get update', 'npm install'],
          envs: ['NODE_ENV=test', 'SECRET_KEY=secret_value'],
        },
        explanation: 'Configuring environment with node:22-slim',
      });

      expect(result.environment_id).toBe('env-abc123');
      expect(result.status).toBe('created');
    });

    it('should throw error if environment_create fails', async () => {
      mockMCPClient.callTool.mockRejectedValueOnce(new Error('MCP tool call failed'));

      await expect(async () => {
        await client.createEnvironment({
          environment_source: '/path/to/repo',
          title: 'Test Worker',
          base_image: 'node:22-slim',
          setup_commands: [],
          install_commands: [],
          environment_variables: {},
          secrets: [],
          network: { allowed_hosts: [] },
        });
      }).rejects.toThrow();
    });

    it('should combine setup and install commands', async () => {
      mockMCPClient.callTool
        .mockResolvedValueOnce({ environment_id: 'env-123' })
        .mockResolvedValueOnce({ success: true });

      await client.createEnvironment({
        environment_source: '/path/to/repo',
        title: 'Test',
        base_image: 'node:22-slim',
        setup_commands: ['apt-get update', 'apt-get install -y git'],
        install_commands: ['npm install -g pnpm', 'pnpm install'],
        environment_variables: {},
        secrets: [],
        network: { allowed_hosts: [] },
      });

      // Check that environment_config combined all commands
      const configCall = mockMCPClient.callTool.mock.calls[1];
      expect(configCall[1].config.setup_commands).toEqual([
        'apt-get update',
        'apt-get install -y git',
        'npm install -g pnpm',
        'pnpm install',
      ]);
    });
  });

  describe('executeInEnvironment', () => {
    it('should call environment_run_cmd MCP tool', async () => {
      mockMCPClient.callTool.mockResolvedValueOnce({
        stdout: 'Test output',
        output: 'Test output',
      });

      const result = await client.executeInEnvironment({
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        command: 'npm test',
      });

      expect(mockMCPClient.callTool).toHaveBeenCalledWith(
        'environment_run_cmd',
        {
          environment_source: '/path/to/repo',
          environment_id: 'env-123',
          command: 'npm test',
          explanation: 'Executing command in environment env-123',
        },
        { timeout: 180000 }
      );

      expect(result.stdout).toBe('Test output');
      expect(result.output).toBe('Test output');
    });

    it('should handle empty output', async () => {
      mockMCPClient.callTool.mockResolvedValueOnce({});

      const result = await client.executeInEnvironment({
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        command: 'echo test',
      });

      expect(result.stdout).toBe('');
      expect(result.output).toBe('');
    });
  });

  describe('environmentFileWrite', () => {
    it('should call environment_file_write MCP tool', async () => {
      mockMCPClient.callTool.mockResolvedValueOnce({ success: true });

      await client.environmentFileWrite({
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        target_file: '/workdir/.claude/CLAUDE.md',
        contents: 'Test content',
      });

      expect(mockMCPClient.callTool).toHaveBeenCalledWith('environment_file_write', {
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        target_file: '/workdir/.claude/CLAUDE.md',
        contents: 'Test content',
        explanation: 'Writing file /workdir/.claude/CLAUDE.md',
      });
    });

    it('should handle write failures', async () => {
      mockMCPClient.callTool.mockRejectedValueOnce(new Error('Write failed'));

      await expect(async () => {
        await client.environmentFileWrite({
          environment_source: '/path/to/repo',
          environment_id: 'env-123',
          target_file: '/workdir/test.txt',
          contents: 'content',
        });
      }).rejects.toThrow();
    });
  });

  describe('environmentFileRead', () => {
    it('should call environment_file_read MCP tool', async () => {
      mockMCPClient.callTool.mockResolvedValueOnce({
        contents: 'File contents here',
      });

      const result = await client.environmentFileRead({
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        target_file: '/workdir/.boss/manifest.json',
      });

      expect(mockMCPClient.callTool).toHaveBeenCalledWith('environment_file_read', {
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        target_file: '/workdir/.boss/manifest.json',
        should_read_entire_file: true,
        explanation: 'Reading file /workdir/.boss/manifest.json',
      });

      expect(result.contents).toBe('File contents here');
    });

    it('should handle empty file', async () => {
      mockMCPClient.callTool.mockResolvedValueOnce({ contents: '' });

      const result = await client.environmentFileRead({
        environment_source: '/path/to/repo',
        environment_id: 'env-123',
        target_file: '/workdir/empty.txt',
      });

      expect(result.contents).toBe('');
    });

    it('should handle read failures', async () => {
      mockMCPClient.callTool.mockRejectedValueOnce(new Error('File not found'));

      await expect(async () => {
        await client.environmentFileRead({
          environment_source: '/path/to/repo',
          environment_id: 'env-123',
          target_file: '/workdir/missing.txt',
        });
      }).rejects.toThrow();
    });
  });

  describe('mergeEnvironment', () => {
    it('should log warning about merge not implemented', async () => {
      // mergeEnvironment currently just logs a warning
      // It doesn't make MCP calls (merge is done via CLI)
      await client.mergeEnvironment({
        environment_id: 'env-123',
        target_branch: 'main',
      });

      // No MCP calls should be made
      expect(mockMCPClient.callTool).not.toHaveBeenCalled();
    });
  });

  describe('deleteEnvironment', () => {
    it('should log warning about delete not implemented', async () => {
      // deleteEnvironment currently just logs a warning
      // It doesn't make MCP calls (delete is done via CLI)
      await client.deleteEnvironment('env-123');

      // No MCP calls should be made
      expect(mockMCPClient.callTool).not.toHaveBeenCalled();
    });
  });

  describe('checkAvailability', () => {
    it('should return true if MCP client can connect', async () => {
      // Mock successful connection and tool listing
      mockMCPClient.connect.mockResolvedValueOnce(undefined);
      mockMCPClient.listTools.mockResolvedValueOnce([
        { name: 'environment_create' },
        { name: 'environment_run_cmd' },
      ]);

      const available = await client.checkAvailability();

      expect(available).toBe(true);
      expect(mockMCPClient.connect).toHaveBeenCalled();
      expect(mockMCPClient.listTools).toHaveBeenCalled();
    });

    it('should return false if MCP connection fails', async () => {
      mockMCPClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const available = await client.checkAvailability();

      expect(available).toBe(false);
    });
  });

  describe('listEnvironments', () => {
    it('should call environment_list MCP tool', async () => {
      const mockEnvs = [
        { environment_id: 'env-1', title: 'Worker 1' },
        { environment_id: 'env-2', title: 'Worker 2' },
      ];

      mockMCPClient.callTool.mockResolvedValueOnce({
        environments: mockEnvs,
      });

      const result = await client.listEnvironments('/path/to/repo');

      expect(mockMCPClient.callTool).toHaveBeenCalledWith('environment_list', {
        environment_source: '/path/to/repo',
        explanation: 'Listing all environments',
      });

      expect(result).toEqual(mockEnvs);
    });

    it('should return empty array if no environments', async () => {
      mockMCPClient.callTool.mockResolvedValueOnce({
        environments: [],
      });

      const result = await client.listEnvironments('/path/to/repo');

      expect(result).toEqual([]);
    });
  });
});
