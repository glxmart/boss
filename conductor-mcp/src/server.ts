/**
 * MCP server setup
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  TOOL_SCHEMAS,
  handleSpawnWorker,
  handleSpawnWorkersParallel,
  handleExecuteTask,
  handleGetWorkerStatus,
  handleMergeWorker,
  handleTerminateWorker,
  handleListWorkerTypes,
  handleListActiveWorkers,
  handleConductorHealth,
  handleAskWorker,
  handleInspectWorkerConfig,
  handleImportWorkerConfig,
} from './tools.js';
import { logger } from './utils/logger.js';
import { ConductorException } from './utils/error-handler.js';

type ToolHandler = (args: unknown) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  spawn_worker: handleSpawnWorker,
  spawn_workers_parallel: handleSpawnWorkersParallel,
  execute_task: handleExecuteTask,
  get_worker_status: handleGetWorkerStatus,
  merge_worker: handleMergeWorker,
  terminate_worker: handleTerminateWorker,
  list_worker_types: handleListWorkerTypes,
  list_active_workers: async () => Promise.resolve(handleListActiveWorkers()),
  conductor_health: handleConductorHealth,
  ask_worker: handleAskWorker,
  inspect_worker_config: handleInspectWorkerConfig,
  import_worker_config: handleImportWorkerConfig,
};

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
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      logger.debug('Listing available tools');

      return {
        tools: Object.values(TOOL_SCHEMAS),
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      logger.info('Tool called', { toolName });

      try {
        const handler = TOOL_HANDLERS[toolName];
        if (!handler) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        const result = await handler(args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Tool execution failed', {
          toolName,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof ConductorException) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.error,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: false,
          };
        }

        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('Conductor MCP server started');

    // Handle process signals
    process.on('SIGINT', () => {
      void (async () => {
        logger.info('Received SIGINT, shutting down');
        await this.server.close();
        process.exit(0);
      })();
    });

    process.on('SIGTERM', () => {
      void (async () => {
        logger.info('Received SIGTERM, shutting down');
        await this.server.close();
        process.exit(0);
      })();
    });
  }
}
