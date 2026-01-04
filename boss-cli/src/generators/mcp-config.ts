import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';
import type { MCPScope, MCPConfigFile } from '../types/index.js';

export async function generateMCPConfig(
  projectPath?: string,
  scope: MCPScope = 'both'
): Promise<void> {
  const shouldGenerateUser = scope === 'user' || scope === 'both';
  const shouldGenerateProject = scope === 'project' || scope === 'both';

  // Generate .env file with op:// references (project scope only)
  if (shouldGenerateProject && projectPath) {
    await generateMCPEnvFile(projectPath);
  }

  // Generate global IDE MCP config (user scope) - ALWAYS generate for both IDEs
  if (shouldGenerateUser) {
    const homeDir = process.env.HOME || os.homedir();
    const bossMCPConfig = getBossMCPConfig(); // User scope - no op run wrapper

    // Generate Claude Code global config
    const claudeCodePath = path.join(homeDir, '.config', 'claude-code', 'mcp-servers.json');
    await fs.ensureDir(path.dirname(claudeCodePath));

    let claudeExistingConfig: MCPConfigFile = { mcpServers: {} };
    if (await fs.pathExists(claudeCodePath)) {
      try {
        const content = await fs.readFile(claudeCodePath, 'utf8');
        claudeExistingConfig = JSON.parse(content) as MCPConfigFile;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warning(`Failed to parse existing Claude Code MCP config: ${message}`);
      }
    }

    const claudeMergedConfig: MCPConfigFile = {
      mcpServers: {
        ...(claudeExistingConfig.mcpServers || {}),
        ...bossMCPConfig,
      },
    };

    await fs.writeFile(claudeCodePath, JSON.stringify(claudeMergedConfig, null, 2), 'utf8');
    logger.info(`Claude Code MCP configuration written to: ${claudeCodePath}`);

    // Generate Cursor global config
    const cursorPath = path.join(homeDir, '.cursor', 'mcp-servers.json');
    await fs.ensureDir(path.dirname(cursorPath));

    let cursorExistingConfig: MCPConfigFile = { mcpServers: {} };
    if (await fs.pathExists(cursorPath)) {
      try {
        const content = await fs.readFile(cursorPath, 'utf8');
        cursorExistingConfig = JSON.parse(content) as MCPConfigFile;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warning(`Failed to parse existing Cursor MCP config: ${message}`);
      }
    }

    const cursorMergedConfig: MCPConfigFile = {
      mcpServers: {
        ...(cursorExistingConfig.mcpServers || {}),
        ...bossMCPConfig,
      },
    };

    await fs.writeFile(cursorPath, JSON.stringify(cursorMergedConfig, null, 2), 'utf8');
    logger.info(`Cursor MCP configuration written to: ${cursorPath}`);
  }

  // Generate project-specific MCP config file (project scope) - ALWAYS generate for both IDEs
  if (shouldGenerateProject && projectPath) {
    // Generate .mcp.json (works for both Claude Code and Cursor)
    const projectMCPPath = path.join(projectPath, '.mcp.json');
    // For project scope, pass projectPath so MCP servers use op run wrapper
    const projectConfig: MCPConfigFile = {
      mcpServers: getBossMCPConfig(projectPath),
    };

    await fs.writeFile(projectMCPPath, JSON.stringify(projectConfig, null, 2), 'utf8');
    logger.info(`Project MCP configuration written to: ${projectMCPPath}`);

    // Always generate IDE-specific configs for both Claude Code and Cursor
    // Generate .claude/mcp.json
    const claudeMCPPath = path.join(projectPath, '.claude', 'mcp.json');
    await fs.ensureDir(path.dirname(claudeMCPPath));
    await fs.writeFile(claudeMCPPath, JSON.stringify(projectConfig, null, 2), 'utf8');
    logger.info(`Claude Code MCP configuration written to: ${claudeMCPPath}`);

    // Generate .cursor/mcp.json
    const cursorMCPPath = path.join(projectPath, '.cursor', 'mcp.json');
    await fs.ensureDir(path.dirname(cursorMCPPath));
    await fs.writeFile(cursorMCPPath, JSON.stringify(projectConfig, null, 2), 'utf8');
    logger.info(`Cursor MCP configuration written to: ${cursorMCPPath}`);
  }

  logger.info('Note: You will need to create secrets in 1Password vault "boss" using op CLI');
  if (shouldGenerateProject && projectPath) {
    logger.info('Note: MCP servers are configured to use op run automatically when they start');
    logger.info(
      'See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent'
    );
  }
}

function getBossMCPConfig(projectPath?: string): Record<string, any> {
  // Determine if we should use op run wrapper (only for project scope where .env exists)
  const useOpRun = projectPath !== undefined;
  // Use relative path .env (op run will resolve it relative to current working directory)
  const envFile = '.env';

  return {
    'container-use': {
      type: 'stdio',
      command: 'container-use',
      args: ['stdio'],
      env: {},
    },
    conductor: {
      // Use op run to wrap conductor and resolve CLAUDE_CODE_OAUTH_TOKEN from .env
      command: useOpRun ? 'op' : 'npx',
      args: useOpRun
        ? ['run', `--env-file=${envFile}`, '--', 'npx', '@glxmart/conductor-mcp', 'stdio']
        : ['@glxmart/conductor-mcp', 'stdio'],
    },
    github: {
      // Use op run to wrap the MCP server command and resolve op:// references from .env
      // This follows the 1Password blog post pattern: op run --env-file=.env -- <command>
      command: useOpRun ? 'op' : 'npx',
      args: useOpRun
        ? ['run', `--env-file=${envFile}`, '--', 'npx', '@modelcontextprotocol/server-github']
        : ['@modelcontextprotocol/server-github'],
      // No need for env section - op run resolves op:// references and injects them
    },
    'boss-knowledge': {
      command: 'npx',
      args: ['@glxmart/mcp-knowledge'],
      env: {
        DATABASE_URL: 'postgresql://boss:bosssecret@localhost:5432/boss_knowledge',
        QDRANT_URL: 'http://localhost:6333',
        EMBEDDING_SERVICE_URL: 'http://localhost:8080',
        EMBEDDING_MODEL: 'BAAI/bge-large-en-v1.5',
        EMBEDDING_DIMENSIONS: '1024',
      },
    },
  };
}

async function generateMCPEnvFile(projectPath: string): Promise<void> {
  // Generate .env file with op:// references for 1Password secret resolution
  // See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent
  const envPath = path.join(projectPath, '.env');

  const envContent = `# MCP Server Environment Variables
# These use 1Password secret references (op:// format)
# Start your IDE with: op run --env-file=.env -- <your-ide-command>
# See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent

# GitHub Authentication (used by GitHub MCP and git)
# Standardized on GITHUB_PERSONAL_ACCESS_TOKEN for consistency
GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token
# Git also uses GITHUB_TOKEN for HTTPS authentication - set to same value
GITHUB_TOKEN=op://boss/github/token

# Claude Code OAuth Token (used by Conductor MCP for workers)
CLAUDE_CODE_OAUTH_TOKEN=op://boss/claude-code/oauth-token

# Add other secrets as needed:
# OPENAI_API_KEY=op://boss/openai/api-key
# STRIPE_SECRET_KEY=op://boss/stripe/secret-key
`;

  await fs.writeFile(envPath, envContent, 'utf8');
  logger.info(`MCP environment file written to: ${envPath}`);
}

async function _detectIDE(): Promise<'.claude' | '.cursor'> {
  // Use process.env.HOME if available (for testing), otherwise fall back to os.homedir()
  const homeDir = process.env.HOME || os.homedir();

  // Check for Claude Code config directory first (default/preferred)
  const claudeCodeDir = path.join(homeDir, '.config', 'claude-code');
  if (await fs.pathExists(claudeCodeDir)) {
    return '.claude';
  }

  // Check for Cursor config directory
  const cursorDir = path.join(homeDir, '.cursor');
  if (await fs.pathExists(cursorDir)) {
    return '.cursor';
  }

  // Check for CLI commands as fallback
  const { execa } = await import('execa');
  try {
    await execa('claude', ['--version'], { reject: false });
    return '.claude';
  } catch {
    try {
      await execa('cursor', ['--version'], { reject: false });
      return '.cursor';
    } catch {
      // Neither detected, default to Claude Code
      return '.claude';
    }
  }
}
