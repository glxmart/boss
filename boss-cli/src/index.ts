#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { doctorCommand } from './commands/doctor.js';
import { templatesCommand } from './commands/templates.js';
import { logger } from './utils/logger.js';
import type { BootstrapOptions } from './types/index.js';

const program = new Command();

program.name('boss').description('BOSS CLI - Initialize new BOSS projects').version('1.0.0');

// Helper function to create init command options
function addInitOptions(cmd: Command): Command {
  return cmd
    .option(
      '-t, --template <template>',
      'Template to use (t3-prisma, t3-drizzle, nestjs-typeorm, fastify-native, astro-portfolio)'
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
    .option('--non-interactive', 'Skip confirmation prompts (useful for scripts)');
}

// Primary command: init
addInitOptions(program.command('init').description('Initialize a new BOSS project')).action(
  async (options: unknown) => {
    try {
      await initCommand(options as BootstrapOptions);
    } catch (error) {
      logger.error(`Init failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
);

// Alias: bootstrap (for backwards compatibility)
addInitOptions(
  program.command('bootstrap').description('Initialize a new BOSS project (alias for init)')
).action(async (options: unknown) => {
  try {
    await initCommand(options as BootstrapOptions);
  } catch (error) {
    logger.error(`Init failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
});

program
  .command('doctor')
  .description('Check prerequisites and system health')
  .option(
    '-p, --project-dir <dir>',
    'Project directory to validate (defaults to current directory)'
  )
  .option('--skip-system', 'Skip system prerequisite checks')
  .option('--skip-project', 'Skip project validation checks')
  .action(async (options: { projectDir?: string; skipSystem?: boolean; skipProject?: boolean }) => {
    try {
      await doctorCommand({
        projectDir: options.projectDir,
        skipSystemChecks: options.skipSystem,
        skipProjectChecks: options.skipProject,
      });
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
