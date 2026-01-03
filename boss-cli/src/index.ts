#!/usr/bin/env node

import { Command } from 'commander';
import { bootstrapCommand } from './commands/bootstrap.js';
import { doctorCommand } from './commands/doctor.js';
import { templatesCommand } from './commands/templates.js';
import { logger } from './utils/logger.js';
import type { BootstrapOptions } from './types/index.js';

const program = new Command();

program
  .name('boss')
  .description('BOSS Bootstrap CLI - Scaffold new BOSS projects')
  .version('1.0.0');

program
  .command('bootstrap')
  .description('Bootstrap a new BOSS project')
  .option(
    '-t, --template <template>',
    'Template to use (nextjs-app-turbo, api-service-fastify, blank)'
  )
  .option('-q, --quality <preset>', 'Quality preset (startup, production, enterprise)')
  .option('-n, --name <name>', 'Project name')
  .option('--org <org>', 'Organization name')
  .option('--github-repo <repo>', 'GitHub repository name')
  .option('--github-org <org>', 'GitHub organization')
  .option(
    '--mcp-scope <scope>',
    'MCP config scope: user (global IDE), project (project directory), or both (default: both)'
  )
  .option('--non-interactive', 'Skip confirmation prompts (useful for scripts)')
  .action(async (options: unknown) => {
    try {
      await bootstrapCommand(options as BootstrapOptions);
    } catch (error) {
      logger.error(`Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Check prerequisites and system health')
  .action(async () => {
    try {
      await doctorCommand();
    } catch (error) {
      logger.error(
        `Doctor check failed: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available templates')
  .action(() => {
    try {
      templatesCommand();
    } catch (error) {
      logger.error(
        `Failed to list templates: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program.parse();
