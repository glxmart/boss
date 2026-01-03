#!/usr/bin/env node

/**
 * CLI entry point for Conductor MCP server
 */

import { ConductorServer } from './server.js';
import { logger } from './utils/logger.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] !== 'stdio') {
    console.error('Usage: conductor-mcp stdio');
    console.error('');
    console.error('This is an MCP server that must be run in stdio mode.');
    console.error('It should be configured in your MCP client (e.g., Claude Code, Cursor).');
    process.exit(1);
  }

  try {
    const server = new ConductorServer();
    await server.run();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
