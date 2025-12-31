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

  it('should create MCP config files for both Claude Code and Cursor (user scope)', async () => {
    const claudeConfigPath = path.join(testHomeDir, '.config', 'claude-code', 'mcp-servers.json');
    const cursorConfigPath = path.join(testHomeDir, '.cursor', 'mcp-servers.json');
    
    await generateMCPConfig();

    // Both configs should be created
    expect(await fs.pathExists(claudeConfigPath)).toBe(true);
    expect(await fs.pathExists(cursorConfigPath)).toBe(true);

    // Verify Claude Code config
    const claudeConfig = JSON.parse(await fs.readFile(claudeConfigPath, 'utf8'));
    expect(claudeConfig.mcpServers).toBeDefined();
    expect(claudeConfig.mcpServers['container-use']).toBeDefined();
    expect(claudeConfig.mcpServers['github']).toBeDefined();
    expect(claudeConfig.mcpServers['boss-knowledge']).toBeDefined();

    // Verify Cursor config (should be identical)
    const cursorConfig = JSON.parse(await fs.readFile(cursorConfigPath, 'utf8'));
    expect(cursorConfig.mcpServers).toBeDefined();
    expect(cursorConfig.mcpServers['container-use']).toBeDefined();
    expect(cursorConfig.mcpServers['github']).toBeDefined();
    expect(cursorConfig.mcpServers['boss-knowledge']).toBeDefined();
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

  it('should generate MCP configs for both Claude Code and Cursor in project scope', async () => {
    const testProjectDir = path.join(os.tmpdir(), 'boss-cli-test-both-ides-mcp');
    await fs.ensureDir(testProjectDir);

    await generateMCPConfig(testProjectDir, 'project');

    // All three configs should be created
    const mcpPath = path.join(testProjectDir, '.mcp.json');
    const claudeMCPPath = path.join(testProjectDir, '.claude', 'mcp.json');
    const cursorMCPPath = path.join(testProjectDir, '.cursor', 'mcp.json');

    expect(await fs.pathExists(mcpPath)).toBe(true);
    expect(await fs.pathExists(claudeMCPPath)).toBe(true);
    expect(await fs.pathExists(cursorMCPPath)).toBe(true);

    // Verify all configs have the same structure
    const config = JSON.parse(await fs.readFile(mcpPath, 'utf8'));
    const claudeConfig = JSON.parse(await fs.readFile(claudeMCPPath, 'utf8'));
    const cursorConfig = JSON.parse(await fs.readFile(cursorMCPPath, 'utf8'));

    // All should have container-use with correct config
    expect(config.mcpServers['container-use'].type).toBe('stdio');
    expect(config.mcpServers['container-use'].args).toEqual(['stdio']);
    expect(claudeConfig.mcpServers['container-use'].type).toBe('stdio');
    expect(claudeConfig.mcpServers['container-use'].args).toEqual(['stdio']);
    expect(cursorConfig.mcpServers['container-use'].type).toBe('stdio');
    expect(cursorConfig.mcpServers['container-use'].args).toEqual(['stdio']);
  });

  it('should merge with existing config for both IDEs', async () => {
    const claudeConfigPath = path.join(testHomeDir, '.config', 'claude-code', 'mcp-servers.json');
    const cursorConfigPath = path.join(testHomeDir, '.cursor', 'mcp-servers.json');
    
    await fs.ensureDir(path.dirname(claudeConfigPath));
    await fs.ensureDir(path.dirname(cursorConfigPath));
    
    const existingClaudeConfig = {
      mcpServers: {
        'existing-server': {
          command: 'existing',
          args: []
        }
      }
    };
    await fs.writeFile(claudeConfigPath, JSON.stringify(existingClaudeConfig, null, 2));

    const existingCursorConfig = {
      mcpServers: {
        'another-server': {
          command: 'another',
          args: []
        }
      }
    };
    await fs.writeFile(cursorConfigPath, JSON.stringify(existingCursorConfig, null, 2));

    await generateMCPConfig();

    // Claude Code config should preserve existing and add BOSS servers
    const claudeConfig = JSON.parse(await fs.readFile(claudeConfigPath, 'utf8'));
    expect(claudeConfig.mcpServers['existing-server']).toBeDefined();
    expect(claudeConfig.mcpServers['container-use']).toBeDefined();

    // Cursor config should preserve existing and add BOSS servers
    const cursorConfig = JSON.parse(await fs.readFile(cursorConfigPath, 'utf8'));
    expect(cursorConfig.mcpServers['another-server']).toBeDefined();
    expect(cursorConfig.mcpServers['container-use']).toBeDefined();
  });
});

