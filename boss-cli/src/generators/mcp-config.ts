import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';
import type { MCPScope } from '../types/index.js';

export async function generateMCPConfig(projectPath?: string, scope: MCPScope = 'both'): Promise<void> {
  const shouldGenerateUser = scope === 'user' || scope === 'both';
  const shouldGenerateProject = scope === 'project' || scope === 'both';

  // Generate .env file with op:// references (project scope only)
  if (shouldGenerateProject && projectPath) {
    await generateMCPEnvFile(projectPath);
  }

  // Generate global IDE MCP config (user scope)
  if (shouldGenerateUser) {
    const configPath = await detectMCPConfigPath();
    
    if (configPath) {
      // Read existing config if present
      let existingConfig: any = {};
      if (await fs.pathExists(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          existingConfig = JSON.parse(content);
        } catch (error) {
          logger.warning(`Failed to parse existing MCP config: ${error}`);
        }
      }

      // Merge with BOSS MCP servers (user scope - no project path, so no op run wrapper)
      const bossMCPConfig = getBossMCPConfig();

      // Merge configs (preserve existing, add/update BOSS servers)
      const mergedConfig = {
        mcpServers: {
          ...(existingConfig.mcpServers || {}),
          ...bossMCPConfig
        }
      };

      // Ensure directory exists
      await fs.ensureDir(path.dirname(configPath));

      // Write global config
      await fs.writeFile(configPath, JSON.stringify(mergedConfig, null, 2), 'utf8');
      logger.info(`MCP configuration written to: ${configPath}`);
    } else {
      logger.warning('Could not detect Claude Code or Cursor config directory. Global MCP config will not be created automatically.');
    }
  }

  // Generate project-specific MCP config file (project scope)
  if (shouldGenerateProject && projectPath) {
    const projectMCPPath = path.join(projectPath, '.mcp.json');
    // For project scope, pass projectPath so MCP servers use op run wrapper
    const projectConfig = {
      mcpServers: getBossMCPConfig(projectPath)
    };
    
    await fs.writeFile(projectMCPPath, JSON.stringify(projectConfig, null, 2), 'utf8');
    logger.info(`Project MCP configuration written to: ${projectMCPPath}`);
  }

  logger.info('Note: You will need to create secrets in 1Password vault "boss" using op CLI');
  if (shouldGenerateProject && projectPath) {
    logger.info('Note: MCP servers are configured to use op run automatically when they start');
    logger.info('See: https://1password.com/blog/securing-mcp-servers-with-1password-stop-credential-exposure-in-your-agent');
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
      env: {}
    },
    'github': {
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
      args: ['@boss/mcp-knowledge'],
      env: {
        DATABASE_URL: 'postgresql://boss:bosssecret@localhost:5432/boss_knowledge',
        QDRANT_URL: 'http://localhost:6333',
        EMBEDDING_SERVICE_URL: 'http://localhost:8080',
        EMBEDDING_MODEL: 'BAAI/bge-large-en-v1.5',
        EMBEDDING_DIMENSIONS: '1024'
      }
    }
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

# GitHub MCP Server
GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token

# Add other secrets as needed:
# OPENAI_API_KEY=op://boss/openai/api-key
# STRIPE_SECRET_KEY=op://boss/stripe/secret-key
`;

  await fs.writeFile(envPath, envContent, 'utf8');
  logger.info(`MCP environment file written to: ${envPath}`);
}

async function detectMCPConfigPath(): Promise<string | null> {
  // Use process.env.HOME if available (for testing), otherwise fall back to os.homedir()
  const homeDir = process.env.HOME || os.homedir();
  
  // Always default to Claude Code (create directory if needed)
  const claudeCodePath = path.join(homeDir, '.config', 'claude-code', 'mcp-servers.json');
  const claudeCodeDir = path.dirname(claudeCodePath);
  
  // Ensure Claude Code directory exists (default)
  await fs.ensureDir(claudeCodeDir);
  return claudeCodePath;
}

