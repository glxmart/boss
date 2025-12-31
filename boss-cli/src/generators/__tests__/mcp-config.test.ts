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

  it('should use op run wrapper for GitHub MCP server in project scope', async () => {
    const testProjectDir = path.join(os.tmpdir(), 'boss-cli-test-op-run');
    await fs.ensureDir(testProjectDir);

    await generateMCPConfig(testProjectDir, 'project');

    const mcpPath = path.join(testProjectDir, '.mcp.json');
    const config = JSON.parse(await fs.readFile(mcpPath, 'utf8'));

    // For project scope, GitHub MCP server should use op run wrapper
    // This follows the 1Password blog post pattern: op run --env-file=.env -- <command>
    expect(config.mcpServers.github.command).toBe('op');
    expect(config.mcpServers.github.args[0]).toBe('run');
    expect(config.mcpServers.github.args[1]).toBe('--env-file=.env');
    expect(config.mcpServers.github.args[2]).toBe('--');
    expect(config.mcpServers.github.args[3]).toBe('npx');
    expect(config.mcpServers.github.args[4]).toBe('@modelcontextprotocol/server-github');
  });

  it('should generate .env file with op:// references for project scope', async () => {
    const testProjectDir = path.join(os.tmpdir(), 'boss-cli-test-project');
    await fs.ensureDir(testProjectDir);

    await generateMCPConfig(testProjectDir, 'project');

    const envPath = path.join(testProjectDir, '.env');
    expect(await fs.pathExists(envPath)).toBe(true);

    const envContent = await fs.readFile(envPath, 'utf8');
    expect(envContent).toContain('GITHUB_PERSONAL_ACCESS_TOKEN=op://boss/github/token');
    expect(envContent).toContain('op run --env-file=.env');
  });

  it('should generate .mcp.json file in project directory for project scope', async () => {
    const testProjectDir = path.join(os.tmpdir(), 'boss-cli-test-project-mcp');
    await fs.ensureDir(testProjectDir);

    await generateMCPConfig(testProjectDir, 'project');

    const mcpPath = path.join(testProjectDir, '.mcp.json');
    expect(await fs.pathExists(mcpPath)).toBe(true);

    const config = JSON.parse(await fs.readFile(mcpPath, 'utf8'));
    expect(config.mcpServers).toBeDefined();
    expect(config.mcpServers['container-use']).toBeDefined();
    expect(config.mcpServers['github']).toBeDefined();
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

