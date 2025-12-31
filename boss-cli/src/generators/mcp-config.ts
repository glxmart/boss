import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

export async function generateMCPConfig(): Promise<void> {
  // Detect Claude Code vs Cursor
  const configPath = await detectMCPConfigPath();
  
  if (!configPath) {
    logger.warning('Could not detect Claude Code or Cursor config directory. MCP config will not be created automatically.');
    return;
  }

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

  // Merge with BOSS MCP servers
  const bossMCPConfig = {
    'container-use': {
      command: 'container-use',
      args: ['mcp'],
      env: {
        CONTAINER_USE_HOME: '${HOME}/.container-use'
      }
    },
    'github': {
      command: 'npx',
      args: ['@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: 'op://boss/github/token'
      }
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

  // Merge configs (preserve existing, add/update BOSS servers)
  const mergedConfig = {
    mcpServers: {
      ...(existingConfig.mcpServers || {}),
      ...bossMCPConfig
    }
  };

  // Ensure directory exists
  await fs.ensureDir(path.dirname(configPath));

  // Write config
  await fs.writeFile(configPath, JSON.stringify(mergedConfig, null, 2), 'utf8');
  logger.info(`MCP configuration written to: ${configPath}`);
  logger.info('Note: You will need to create secrets in 1Password vault "boss" using op CLI');
}

async function detectMCPConfigPath(): Promise<string | null> {
  // Use process.env.HOME if available (for testing), otherwise fall back to os.homedir()
  const homeDir = process.env.HOME || os.homedir();
  const paths = [
    path.join(homeDir, '.config', 'claude-code', 'mcp-servers.json'),
    path.join(homeDir, '.cursor', 'mcp-servers.json')
  ];

  // Check if either config directory exists
  for (const configPath of paths) {
    const dir = path.dirname(configPath);
    if (await fs.pathExists(dir)) {
      return configPath;
    }
  }

  // If neither exists, try to create Claude Code config (more common)
  const claudeCodePath = path.join(homeDir, '.config', 'claude-code', 'mcp-servers.json');
  await fs.ensureDir(path.dirname(claudeCodePath));
  return claudeCodePath;
}

