import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateMCPConfig } from '../mcp-config.js';

describe('mcp-config generator', () => {
  const testHomeDir = path.join(os.tmpdir(), 'boss-cli-test-home');
  const originalHome = process.env.HOME;

  beforeEach(async () => {
    // Mock HOME directory
    process.env.HOME = testHomeDir;
    await fs.ensureDir(testHomeDir);
  });

  afterEach(async () => {
    await fs.remove(testHomeDir);
    process.env.HOME = originalHome;
  });

  it('should create MCP config file in Claude Code directory', async () => {
    const configPath = path.join(testHomeDir, '.config', 'claude-code', 'mcp-servers.json');
    
    await generateMCPConfig();

    expect(await fs.pathExists(configPath)).toBe(true);

    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    expect(config.mcpServers).toBeDefined();
    expect(config.mcpServers['container-use']).toBeDefined();
    expect(config.mcpServers['github']).toBeDefined();
    expect(config.mcpServers['boss-knowledge']).toBeDefined();
  });

  it('should use op://boss/ format for secrets', async () => {
    await generateMCPConfig();

    const configPath = path.join(testHomeDir, '.config', 'claude-code', 'mcp-servers.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    expect(config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN).toBe('op://boss/github/token');
  });

  it('should merge with existing config', async () => {
    const configPath = path.join(testHomeDir, '.config', 'claude-code', 'mcp-servers.json');
    await fs.ensureDir(path.dirname(configPath));
    
    const existingConfig = {
      mcpServers: {
        'existing-server': {
          command: 'existing',
          args: []
        }
      }
    };
    await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2));

    await generateMCPConfig();

    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    expect(config.mcpServers['existing-server']).toBeDefined();
    expect(config.mcpServers['container-use']).toBeDefined();
  });
});

