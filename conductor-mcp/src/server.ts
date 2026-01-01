/**
 * MCP server setup
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  TOOL_SCHEMAS,
  handleSpawnWorker,
  handleExecuteTask,
  handleGetWorkerStatus,
  handleMergeWorker,
  handleTerminateWorker,
  handleListWorkerTypes,
  handleListActiveWorkers,
  handleConductorHealth
} from './tools.js';
import { logger } from './utils/logger.js';
import { ConductorException } from './utils/error-handler.js';

export class ConductorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'conductor-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools');

      return {
        tools: Object.values(TOOL_SCHEMAS)
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      logger.info('Tool called', { toolName });

      try {
        let result;

        switch (toolName) {
          case 'spawn_worker':
            result = await handleSpawnWorker(args);
            break;

          case 'execute_task':
            result = await handleExecuteTask(args);
            break;

          case 'get_worker_status':
            result = await handleGetWorkerStatus(args);
            break;

          case 'merge_worker':
            result = await handleMergeWorker(args);
            break;

          case 'terminate_worker':
            result = await handleTerminateWorker(args);
            break;

          case 'list_worker_types':
            result = await handleListWorkerTypes(args);
            break;

          case 'list_active_workers':
            result = await handleListActiveWorkers();
            break;

          case 'conductor_health':
            result = await handleConductorHealth();
            break;

          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Tool execution failed', {
          toolName,
          error: error instanceof Error ? error.message : String(error)
        });

        // Handle ConductorException specially
        if (error instanceof ConductorException) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.error
                }, null, 2)
              }
            ],
            isError: false // Don't treat as MCP error, just return error in result
          };
        }

        // Re-throw other errors
        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('Conductor MCP server started');

    // Handle process signals
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down');
      await this.server.close();
      process.exit(0);
    });
  }
}
