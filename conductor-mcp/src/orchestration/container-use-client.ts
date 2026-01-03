/**
 * Container-Use MCP client interface
 * Wrapper around Container-Use MCP tools
 */

import {
  ContainerUseEnvironment,
  CreateEnvironmentParams,
  ExecuteInEnvironmentParams,
  EnvironmentFileWriteParams,
  EnvironmentFileReadParams,
  MergeEnvironmentParams,
  ErrorCategory,
} from '../types.js';
import { wrapError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import { ContainerUseMCPClient } from './mcp-client.js';

/**
 * Interface to Container-Use MCP Server
 *
 * This client communicates with container-use via MCP protocol over stdio.
 * It starts container-use in stdio mode and uses MCP SDK to call tools.
 *
 * Container-use workflow:
 * 1. environment_create - Create new environment from git ref
 * 2. environment_config - Configure base image, setup commands, env vars
 * 3. environment_run_cmd - Execute commands in the environment
 * 4. environment_file_* - File operations
 */
export class ContainerUseClient {
  private mcpClient: ContainerUseMCPClient;

  constructor() {
    this.mcpClient = new ContainerUseMCPClient();
  }

  /**
   * Create a new container environment
   * This creates the environment and then configures it with base image, setup commands, etc.
   */
  async createEnvironment(params: CreateEnvironmentParams): Promise<ContainerUseEnvironment> {
    logger.info('Creating container environment', {
      title: params.title,
      base_image: params.base_image,
    });

    try {
      // Step 1: Create environment
      logger.debug('Calling environment_create', {
        environment_source: params.environment_source,
        title: params.title,
      });

      const createResult = await this.mcpClient.callTool('environment_create', {
        environment_source: params.environment_source,
        title: params.title,
        explanation: `Creating environment for ${params.title}`,
      });

      logger.debug('environment_create result received', {
        resultType: typeof createResult,
        resultKeys: createResult ? Object.keys(createResult) : [],
        hasEnvironmentId: 'environment_id' in (createResult || {}),
        hasId: 'id' in (createResult || {}),
        fullResult: JSON.stringify(createResult, null, 2),
      });

      // container-use returns "id" field, not "environment_id"
      const environmentId = createResult.environment_id || createResult.id;

      if (!environmentId) {
        logger.error('environment_create did not return environment_id', {
          createResult,
          resultKeys: createResult ? Object.keys(createResult) : [],
        });
        throw new Error('Failed to create environment: no environment_id returned');
      }

      logger.info('Environment created', { environment_id: environmentId });

      // Step 2: Configure environment with base image and setup
      // Convert setup_commands and install_commands to combined setup
      const allSetupCommands = [...params.setup_commands, ...params.install_commands];

      // Convert environment_variables object to env array format
      const envs = [
        ...Object.entries(params.environment_variables).map(([key, value]) => `${key}=${value}`),
        ...params.secrets,
      ];

      await this.mcpClient.callTool('environment_config', {
        environment_source: params.environment_source,
        environment_id: environmentId,
        config: {
          base_image: params.base_image,
          setup_commands: allSetupCommands,
          envs,
        },
        explanation: `Configuring environment with ${params.base_image}`,
      });

      logger.info('Environment configured', { environment_id: environmentId });

      return {
        environment_id: environmentId,
        title: params.title,
        status: 'created',
      };
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.CONTAINER_CREATION_FAILED,
        'Failed to create container environment'
      );
    }
  }

  /**
   * Execute command in environment
   */
  async executeInEnvironment(
    params: ExecuteInEnvironmentParams
  ): Promise<{ stdout?: string; output?: string }> {
    logger.debug('Executing in environment', {
      environment_id: params.environment_id,
      command: params.command.substring(0, 100) + '...',
    });

    try {
      // Use 3 minute timeout for claude execution (API calls can be slow)
      const result = await this.mcpClient.callTool(
        'environment_run_cmd',
        {
          environment_source: params.environment_source,
          environment_id: params.environment_id,
          command: params.command,
          explanation: `Executing command in environment ${params.environment_id}`,
        },
        { timeout: 180000 }
      ); // 3 minutes

      // container-use stores command output in git notes, not in MCP response
      // Read the output from git notes
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      let output = '';
      try {
        const gitResult = await execFileAsync(
          'git',
          [
            '-C',
            params.environment_source,
            'notes',
            '--ref=container-use',
            'show',
            `container-use/${params.environment_id}`,
          ],
          { maxBuffer: 10 * 1024 * 1024 }
        ); // 10MB buffer

        if (gitResult.stdout) {
          // Extract JSON from notes (it's after the command line)
          const jsonMatch = gitResult.stdout.match(/\n(\{.*\})\s*$/s);
          if (jsonMatch && jsonMatch[1]) {
            output = jsonMatch[1];
            logger.debug('Extracted output from git notes', {
              environment_id: params.environment_id,
              outputLength: output.length,
            });
          }
        }
      } catch (gitError) {
        logger.warn('Failed to read git notes for command output', {
          environment_id: params.environment_id,
          error: gitError instanceof Error ? gitError.message : String(gitError),
        });
      }

      return {
        stdout: output || result.stdout || result.output || '',
        output: output || result.output || result.stdout || '',
      };
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Failed to execute command in environment'
      );
    }
  }

  /**
   * Write file to environment
   */
  async environmentFileWrite(params: EnvironmentFileWriteParams): Promise<void> {
    logger.debug('Writing file to environment', {
      environment_id: params.environment_id,
      target_file: params.target_file,
    });

    try {
      await this.mcpClient.callTool('environment_file_write', {
        environment_source: params.environment_source,
        environment_id: params.environment_id,
        target_file: params.target_file,
        contents: params.contents,
        explanation: `Writing file ${params.target_file}`,
      });
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Failed to write file to environment'
      );
    }
  }

  /**
   * Read file from environment
   */
  async environmentFileRead(params: EnvironmentFileReadParams): Promise<{ contents: string }> {
    logger.debug('Reading file from environment', {
      environment_id: params.environment_id,
      target_file: params.target_file,
    });

    try {
      const result = await this.mcpClient.callTool('environment_file_read', {
        environment_source: params.environment_source,
        environment_id: params.environment_id,
        target_file: params.target_file,
        should_read_entire_file: true,
        explanation: `Reading file ${params.target_file}`,
      });

      return { contents: result.contents || '' };
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Failed to read file from environment'
      );
    }
  }

  /**
   * Merge environment changes to target branch
   * Note: container-use doesn't have a direct merge tool via MCP
   * This would need to use git commands or CLI merge command
   */
  async mergeEnvironment(params: MergeEnvironmentParams): Promise<void> {
    logger.info('Merging environment', {
      environment_id: params.environment_id,
      target_branch: params.target_branch,
    });

    // Container-use merge is done via CLI, not MCP
    // For now, log a warning - this needs to be handled differently
    logger.warn('Merge via MCP not yet implemented - use container-use CLI merge command', {
      environment_id: params.environment_id,
      target_branch: params.target_branch,
    });

    // TODO: Implement merge via CLI or find MCP equivalent
  }

  /**
   * Delete environment
   * Note: container-use doesn't expose delete via MCP
   * This would need to use the CLI delete command
   */
  async deleteEnvironment(environmentId: string): Promise<void> {
    logger.info('Deleting environment', { environment_id: environmentId });

    // Container-use delete is done via CLI, not MCP
    logger.warn('Delete via MCP not implemented - environment may persist', {
      environment_id: environmentId,
    });

    // TODO: Implement delete via CLI
  }

  /**
   * Get environment details
   */
  async getEnvironment(
    environmentId: string,
    environmentSource: string
  ): Promise<ContainerUseEnvironment> {
    logger.debug('Getting environment details', { environment_id: environmentId });

    try {
      const result = await this.mcpClient.callTool('environment_open', {
        environment_source: environmentSource,
        environment_id: environmentId,
        explanation: `Opening environment ${environmentId}`,
      });

      return {
        environment_id: result.environment_id || environmentId,
        title: result.title || '',
        status: result.status || 'unknown',
      };
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.CONTAINER_USE_UNAVAILABLE,
        'Failed to get environment details'
      );
    }
  }

  /**
   * List all environments
   */
  async listEnvironments(environmentSource: string): Promise<ContainerUseEnvironment[]> {
    logger.debug('Listing environments', { environment_source: environmentSource });

    try {
      const result = await this.mcpClient.callTool('environment_list', {
        environment_source: environmentSource,
        explanation: 'Listing all environments',
      });

      return result.environments || [];
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.CONTAINER_USE_UNAVAILABLE,
        'Failed to list environments'
      );
    }
  }

  /**
   * Check if Container-Use is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Try to connect to MCP server
      await this.mcpClient.connect();

      // List tools to verify MCP communication works
      const tools = await this.mcpClient.listTools();
      logger.debug('Container-use MCP tools available', { count: tools.length });

      return tools.length > 0;
    } catch (error) {
      logger.debug('Container-use not available', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    await this.mcpClient.disconnect();
  }

  /**
   * Inspect environment configuration (Phase 6: Configuration Learning)
   *
   * Returns the current configuration of a worker environment, including
   * any changes made during execution. This helps identify optimizations
   * that workers discovered and can be imported as defaults.
   */
  async inspectEnvironmentConfig(
    environmentId: string,
    environmentSource: string
  ): Promise<{
    baseImage: string;
    setupCommands: string[];
    installCommands: string[];
    environmentVariables: Record<string, string>;
  }> {
    logger.info('Inspecting environment configuration (Phase 6)', {
      environment_id: environmentId,
    });

    try {
      // Try to use MCP tool if available (may not be implemented yet)
      try {
        const result = await this.mcpClient.callTool('environment_config_show', {
          environment_source: environmentSource,
          environment_id: environmentId,
          explanation: `Inspecting config for ${environmentId}`,
        });

        logger.debug('Config inspection via MCP successful', { environmentId });

        return {
          baseImage: result.base_image || '',
          setupCommands: result.setup_commands || [],
          installCommands: result.install_commands || [],
          environmentVariables: result.environment_variables || {},
        };
      } catch (mcpError) {
        // MCP tool may not be available - log and fall back to manual inspection
        logger.debug('Config inspection via MCP not available, using fallback', {
          environmentId,
          error: mcpError instanceof Error ? mcpError.message : String(mcpError),
        });

        // Fallback: Return empty config (actual implementation would use CLI)
        // TODO: Implement CLI fallback with `container-use config show <env-id>`
        return {
          baseImage: '',
          setupCommands: [],
          installCommands: [],
          environmentVariables: {},
        };
      }
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Failed to inspect environment configuration'
      );
    }
  }

  /**
   * Import configuration from environment (Phase 6: Configuration Learning)
   *
   * Imports beneficial configuration changes discovered by a worker during
   * execution. This can include optimized setup commands, install commands,
   * or environment variables that improved performance.
   *
   * The imported configuration can then be used as defaults for future workers.
   */
  async importEnvironmentConfig(
    environmentId: string,
    environmentSource: string,
    options: {
      setupCommands?: string[];
      installCommands?: string[];
      environmentVariables?: Record<string, string>;
    }
  ): Promise<{
    imported: {
      setupCommands: string[];
      installCommands: string[];
      environmentVariables: Record<string, string>;
    };
  }> {
    logger.info('Importing environment configuration (Phase 6)', {
      environment_id: environmentId,
      hasSetupCommands: !!options.setupCommands,
      hasInstallCommands: !!options.installCommands,
      hasEnvVars: !!options.environmentVariables,
    });

    try {
      // Try to use MCP tool if available (may not be implemented yet)
      try {
        await this.mcpClient.callTool('environment_config_import', {
          environment_source: environmentSource,
          environment_id: environmentId,
          config: options,
          explanation: `Importing config from ${environmentId}`,
        });

        logger.info('Config import via MCP successful', { environmentId });

        return {
          imported: {
            setupCommands: options.setupCommands || [],
            installCommands: options.installCommands || [],
            environmentVariables: options.environmentVariables || {},
          },
        };
      } catch (mcpError) {
        // MCP tool may not be available - log and use fallback
        logger.debug('Config import via MCP not available, using fallback', {
          environmentId,
          error: mcpError instanceof Error ? mcpError.message : String(mcpError),
        });

        // Fallback: Log the config that would be imported
        // TODO: Implement CLI fallback with `container-use config import <env-id>`
        logger.info('Configuration to import (manual step required)', {
          environmentId,
          setupCommands: options.setupCommands,
          installCommands: options.installCommands,
          environmentVariables: options.environmentVariables,
        });

        return {
          imported: {
            setupCommands: options.setupCommands || [],
            installCommands: options.installCommands || [],
            environmentVariables: options.environmentVariables || {},
          },
        };
      }
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Failed to import environment configuration'
      );
    }
  }
}
