/**
 * Container-Use MCP client interface
 * Wrapper around Container-Use MCP tools
 */

import { execa } from 'execa';
import {
  ContainerUseEnvironment,
  CreateEnvironmentParams,
  ExecuteInEnvironmentParams,
  EnvironmentFileWriteParams,
  EnvironmentFileReadParams,
  MergeEnvironmentParams,
  ErrorCategory
} from '../types.js';
import { throwConductorError, wrapError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';

/**
 * Interface to Container-Use CLI
 *
 * This client communicates with container-use via CLI subprocess execution (not MCP-to-MCP).
 * Each method maps to a container-use CLI command (create, exec, write, read, merge, delete).
 *
 * Future optimization: Could be replaced with direct MCP-to-MCP communication if both
 * servers are managed by the same MCP host process.
 */
export class ContainerUseClient {
  /**
   * Create a new container environment
   */
  async createEnvironment(params: CreateEnvironmentParams): Promise<ContainerUseEnvironment> {
    logger.info('Creating container environment', { base_image: params.base_image });

    try {
      const result = await this.callContainerUseTool('create_environment', {
        config: params
      });

      return {
        environment_id: result.environment_id,
        title: result.title,
        status: result.status
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
      const result = await this.callContainerUseTool('execute_in_environment', params);
      return result || {};
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
      await this.callContainerUseTool('environment_file_write', params);
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.CONTAINER_CONFIG_FAILED,
        'Failed to write file to environment'
      );
    }
  }

  /**
   * Read file from environment
   */
  async environmentFileRead(params: EnvironmentFileReadParams): Promise<string> {
    logger.debug('Reading file from environment', {
      environment_id: params.environment_id,
      target_file: params.target_file
    });

    try {
      const result = await this.callContainerUseTool('environment_file_read', params);
      return result.contents || '';
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.CONTAINER_CONFIG_FAILED,
        'Failed to read file from environment'
      );
    }
  }

  /**
   * Merge environment branch
   */
  async mergeEnvironment(params: MergeEnvironmentParams): Promise<void> {
    logger.info('Merging environment', {
      environment_id: params.environment_id,
      target_branch: params.target_branch
    });

    try {
      await this.callContainerUseTool('merge_environment', params);
    } catch (error) {
      throw wrapError(
        error,
        ErrorCategory.MERGE_FAILED,
        'Failed to merge environment'
      );
    }
  }

  /**
   * Delete environment
   */
  async deleteEnvironment(environmentId: string): Promise<void> {
    logger.info('Deleting environment', { environment_id: environmentId });

    try {
      await this.callContainerUseTool('delete_environment', {
        environment_id: environmentId
      });
    } catch (error) {
      logger.warn('Failed to delete environment', {
        environment_id: environmentId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - environment deletion is best-effort
    }
  }

  /**
   * Get environment details
   */
  async getEnvironment(environmentId: string): Promise<ContainerUseEnvironment> {
    logger.debug('Getting environment details', { environment_id: environmentId });

    try {
      const result = await this.callContainerUseTool('get_environment', {
        environment_id: environmentId
      });

      return {
        environment_id: result.environment_id,
        title: result.title,
        status: result.status
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
   * Check if Container-Use is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Try to call a simple Container-Use command
      await this.callContainerUseTool('list_environments', {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Call a Container-Use CLI command
   *
   * This implementation uses subprocess execution to call the container-use CLI directly.
   * The CLI provides the same functionality as the MCP server.
   */
  private async callContainerUseTool(toolName: string, params: any): Promise<any> {
    logger.debug('Calling container-use CLI', { toolName });

    try {
      // Map MCP tool names to CLI commands
      const command = this.mapToolNameToCommand(toolName);
      const args = this.buildCommandArgs(toolName, params);

      logger.debug('Executing container-use command', {
        command,
        args: args.join(' ')
      });

      // Execute container-use CLI
      const result = await execa('container-use', [command, ...args], {
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Parse JSON output if available
      if (result.stdout) {
        try {
          return JSON.parse(result.stdout);
        } catch {
          // Not JSON, return as string
          return { output: result.stdout };
        }
      }

      return {};
    } catch (error) {
      // Extract detailed error context from execa
      const errorContext: Record<string, unknown> = {
        toolName,
        error: error instanceof Error ? error.message : String(error)
      };

      // execa errors have additional properties
      if (error && typeof error === 'object') {
        if ('exitCode' in error) {
          errorContext.exitCode = error.exitCode;
        }
        if ('stderr' in error && error.stderr) {
          errorContext.stderr = error.stderr;
        }
        if ('signal' in error && error.signal) {
          errorContext.signal = error.signal;
        }
        if ('command' in error) {
          errorContext.command = error.command;
        }
      }

      logger.error('Container-Use CLI call failed', errorContext);

      // Check if container-use is not installed
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throwConductorError(
          ErrorCategory.CONTAINER_USE_UNAVAILABLE,
          'container-use CLI not found. Please install container-use: npm install -g container-use',
          { details: error }
        );
      }

      throw error;
    }
  }

  /**
   * Map MCP tool names to container-use CLI commands
   */
  private mapToolNameToCommand(toolName: string): string {
    const mapping: Record<string, string> = {
      'create_environment': 'create',
      'execute_in_environment': 'exec',
      'environment_file_write': 'write',
      'environment_file_read': 'read',
      'merge_environment': 'merge',
      'delete_environment': 'delete',
      'get_environment': 'get',
      'list_environments': 'list'
    };

    return mapping[toolName] || toolName;
  }

  /**
   * Build CLI arguments from tool parameters
   */
  private buildCommandArgs(toolName: string, params: any): string[] {
    const args: string[] = [];

    switch (toolName) {
      case 'create_environment':
        // container-use create --config <config-json>
        if (params.config) {
          args.push('--config', JSON.stringify(params.config));
        }
        if (params.title) {
          args.push('--title', params.title);
        }
        break;

      case 'execute_in_environment':
        // container-use exec <env-id> <command>
        if (params.environment_id) {
          args.push(params.environment_id);
        }
        if (params.command) {
          args.push(params.command);
        }
        break;

      case 'environment_file_write':
        // container-use write <env-id> <file-path> <contents>
        if (params.environment_id) {
          args.push(params.environment_id);
        }
        if (params.target_file) {
          args.push(params.target_file);
        }
        if (params.contents) {
          args.push(params.contents);
        }
        break;

      case 'environment_file_read':
        // container-use read <env-id> <file-path>
        if (params.environment_id) {
          args.push(params.environment_id);
        }
        if (params.target_file) {
          args.push(params.target_file);
        }
        break;

      case 'merge_environment':
        // container-use merge <env-id> --target <branch>
        if (params.environment_id) {
          args.push(params.environment_id);
        }
        if (params.target_branch) {
          args.push('--target', params.target_branch);
        }
        break;

      case 'delete_environment':
        // container-use delete <env-id>
        if (params.environment_id) {
          args.push(params.environment_id);
        }
        break;

      case 'get_environment':
        // container-use get <env-id>
        if (params.environment_id) {
          args.push(params.environment_id);
        }
        break;

      case 'list_environments':
        // container-use list
        break;

      default:
        // Pass params as JSON string for unknown commands
        args.push(JSON.stringify(params));
    }

    return args;
  }
}
