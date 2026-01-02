/**
 * MCP Client for Container-Use
 * Manages stdio communication with container-use MCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger.js';
import { ErrorCategory } from '../types.js';
import { throwConductorError } from '../utils/error-handler.js';

export class ContainerUseMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private isConnected: boolean = false;

  /**
   * Connect to container-use MCP server via stdio
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('Already connected to container-use MCP server');
      return;
    }

    logger.info('Starting container-use MCP server');

    try {
      // Spawn container-use stdio process
      this.process = spawn('container-use', ['stdio'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle process errors
      this.process.on('error', (error) => {
        logger.error('Container-use process error', { error: error.message });
        this.isConnected = false;
      });

      this.process.on('exit', (code, signal) => {
        logger.info('Container-use process exited', { code, signal });
        this.isConnected = false;
      });

      // Log stderr for debugging
      this.process.stderr?.on('data', (data) => {
        logger.debug('Container-use stderr', { output: data.toString() });
      });

      // Create transport using process stdin/stdout
      this.transport = new StdioClientTransport({
        command: 'container-use',
        args: ['stdio']
      });

      // Create MCP client
      this.client = new Client({
        name: 'conductor-mcp',
        version: '0.1.0'
      }, {
        capabilities: {}
      });

      // Connect client to transport
      await this.client.connect(this.transport);

      this.isConnected = true;
      logger.info('Connected to container-use MCP server');
    } catch (error) {
      logger.error('Failed to connect to container-use MCP server', {
        error: error instanceof Error ? error.message : String(error)
      });
      await this.disconnect();
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    logger.info('Disconnecting from container-use MCP server');

    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.process && !this.process.killed) {
        this.process.kill();
        this.process = null;
      }

      this.transport = null;
      this.isConnected = false;

      logger.info('Disconnected from container-use MCP server');
    } catch (error) {
      logger.warn('Error during disconnect', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(name: string, args: Record<string, unknown>, options?: { timeout?: number }): Promise<any> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throwConductorError(
        ErrorCategory.CONTAINER_USE_UNAVAILABLE,
        'MCP client not initialized'
      );
    }

    // Default timeout is 180 seconds (3 minutes) for worker execution
    // Can be overridden per-call
    const timeout = options?.timeout || 180000;

    logger.debug('Calling container-use MCP tool', { name, args, timeout });

    try {
      // Pass timeout to MCP SDK (it has a 60s default, we need more for claude)
      const result = await this.client.callTool({
        name,
        arguments: args
      }, undefined, { timeout });

      logger.debug('MCP tool call successful', { name });
      logger.debug('MCP raw response:', {
        name,
        resultKeys: Object.keys(result),
        hasContent: !!result.content,
        contentLength: Array.isArray(result.content) ? result.content.length : 0,
        fullResult: JSON.stringify(result, null, 2)
      });

      // Parse result content
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const content = result.content[0];
        logger.debug('MCP content item:', {
          name,
          contentType: content?.type,
          hasText: 'text' in (content || {}),
          contentPreview: typeof content === 'object' && 'text' in content
            ? (content.text as string).substring(0, 200)
            : 'no text field'
        });

        if (content && typeof content === 'object' && 'type' in content && content.type === 'text' && 'text' in content) {
          try {
            const text = content.text as string;
            // Try to parse as JSON first
            const parsed = JSON.parse(text);
            logger.debug('MCP parsed JSON:', { name, parsed });
            return parsed;
          } catch (parseError) {
            // If JSON parsing fails, try to extract JSON from the beginning of the text
            // container-use sometimes returns JSON followed by warning text
            const text = content.text as string;
            const jsonMatch = text.match(/^(\{[\s\S]*?\})\n/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                const parsed = JSON.parse(jsonMatch[1]);
                logger.debug('MCP extracted and parsed JSON from mixed content:', { name, parsed });
                return parsed;
              } catch {
                // Fall through to return as text
              }
            }

            logger.warn('MCP response not JSON, returning as text', {
              name,
              textPreview: text.substring(0, 200),
              parseError: parseError instanceof Error ? parseError.message : String(parseError)
            });
            return { output: text };
          }
        }
      }

      logger.debug('MCP returning raw result', { name });
      return result;
    } catch (error) {
      logger.error('MCP tool call failed', {
        name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throwConductorError(
        ErrorCategory.CONTAINER_USE_UNAVAILABLE,
        'MCP client not initialized'
      );
    }

    try {
      const result = await this.client.listTools();
      return result.tools;
    } catch (error) {
      logger.error('Failed to list tools', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isActive(): boolean {
    return this.isConnected && this.client !== null;
  }
}
