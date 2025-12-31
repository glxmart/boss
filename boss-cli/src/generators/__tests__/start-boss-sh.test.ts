import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateStartBossScript } from '../start-boss-sh.js';

describe('start-boss-sh generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-start-boss');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should generate start-boss.sh script', async () => {
    await generateStartBossScript(testDir);

    const scriptPath = path.join(testDir, 'start-boss.sh');
    expect(await fs.pathExists(scriptPath)).toBe(true);

    const stat = await fs.stat(scriptPath);
    expect(stat.mode & 0o111).toBeGreaterThan(0); // Executable
  });

  it('should include MCP restrictions', async () => {
    await generateStartBossScript(testDir);

    const content = await fs.readFile(path.join(testDir, 'start-boss.sh'), 'utf8');
    expect(content).toContain('--allowedTools');
    expect(content).toContain('mcp__container-use__*');
    expect(content).toContain('mcp__github__*');
    expect(content).toContain('mcp__knowledge-base__*');
  });

  it('should check for claude and cursor commands', async () => {
    await generateStartBossScript(testDir);

    const content = await fs.readFile(path.join(testDir, 'start-boss.sh'), 'utf8');
    expect(content).toContain('command -v claude');
    expect(content).toContain('command -v cursor');
  });
});

