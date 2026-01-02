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
  ErrorCategory
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
      base_image: params.base_image
    });

    try {
      // Step 1: Create environment
      logger.debug('Calling environment_create', {
        environment_source: params.environment_source,
        title: params.title
      });

      const createResult = await this.mcpClient.callTool('environment_create', {
        environment_source: params.environment_source,
        title: params.title,
        explanation: `Creating environment for ${params.title}`
      });

      logger.debug('environment_create result received', {
        resultType: typeof createResult,
        resultKeys: createResult ? Object.keys(createResult) : [],
        hasEnvironmentId: 'environment_id' in (createResult || {}),
        hasId: 'id' in (createResult || {}),
        fullResult: JSON.stringify(createResult, null, 2)
      });

      // container-use returns "id" field, not "environment_id"
      const environmentId = createResult.environment_id || createResult.id;

      if (!environmentId) {
        logger.error('environment_create did not return environment_id', {
          createResult,
          resultKeys: createResult ? Object.keys(createResult) : []
        });
        throw new Error('Failed to create environment: no environment_id returned');
      }

      logger.info('Environment created', { environment_id: environmentId });

      // Step 2: Configure environment with base image and setup
      // Convert setup_commands and install_commands to combined setup
      const allSetupCommands = [
        ...params.setup_commands,
        ...params.install_commands
      ];

      // Convert environment_variables object to env array format
      const envs = [
        ...Object.entries(params.environment_variables).map(([key, value]) => `${key}=${value}`),
        ...params.secrets
      ];

      await this.mcpClient.callTool('environment_config', {
        environment_source: params.environment_source,
        environment_id: environmentId,
        config: {
          base_image: params.base_image,
          setup_commands: allSetupCommands,
          envs
        },
        explanation: `Configuring environment with ${params.base_image}`
      });

      logger.info('Environment configured', { environment_id: environmentId });

      return {
        environment_id: environmentId,
        title: params.title,
        status: 'created'
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
  async executeInEnvironment(params: ExecuteInEnvironmentParams): Promise<{ stdout?: string; output?: string }> {
    logger.debug('Executing in environment', {
      environment_id: params.environment_id,
      command: params.command.substring(0, 100) + '...'
    });

    try {
      // Use 3 minute timeout for claude execution (API calls can be slow)
      const result = await this.mcpClient.callTool('environment_run_cmd', {
        environment_source: params.environment_source,
        environment_id: params.environment_id,
        command: params.command,
        explanation: `Executing command in environment ${params.environment_id}`
      }, { timeout: 180000 }); // 3 minutes

      return {
        stdout: result.stdout || result.output || '',
        output: result.output || result.stdout || ''
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
      target_file: params.target_file
    });

    try {
      await this.mcpClient.callTool('environment_file_write', {
        environment_source: params.environment_source,
        environment_id: params.environment_id,
        target_file: params.target_file,
        contents: params.contents,
        explanation: `Writing file ${params.target_file}`
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
      target_file: params.target_file
    });

    try {
      const result = await this.mcpClient.callTool('environment_file_read', {
        environment_source: params.environment_source,
        environment_id: params.environment_id,
        target_file: params.target_file,
        should_read_entire_file: true,
        explanation: `Reading file ${params.target_file}`
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
      target_branch: params.target_branch
    });

    // Container-use merge is done via CLI, not MCP
    // For now, log a warning - this needs to be handled differently
    logger.warn('Merge via MCP not yet implemented - use container-use CLI merge command', {
      environment_id: params.environment_id,
      target_branch: params.target_branch
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
      environment_id: environmentId
    });

    // TODO: Implement delete via CLI
  }

  /**
   * Get environment details
   */
  async getEnvironment(environmentId: string, environmentSource: string): Promise<ContainerUseEnvironment> {
    logger.debug('Getting environment details', { environment_id: environmentId });

    try {
      const result = await this.mcpClient.callTool('environment_open', {
        environment_source: environmentSource,
        environment_id: environmentId,
        explanation: `Opening environment ${environmentId}`
      });

      return {
        environment_id: result.environment_id || environmentId,
        title: result.title || '',
        status: result.status || 'unknown'
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
        explanation: 'Listing all environments'
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
        error: error instanceof Error ? error.message : String(error)
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
}
