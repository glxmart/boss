import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { copySpecKitStructure } from '../specify-structure.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('specify-structure generator', () => {
  const testDir = path.join(os.tmpdir(), 'boss-cli-test-specify');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should copy Spec-Kit structure to .specify/', async () => {
    await copySpecKitStructure(testDir);

    // Check that .specify directory exists
    expect(await fs.pathExists(path.join(testDir, '.specify'))).toBe(true);

    // Check for key directories
    expect(await fs.pathExists(path.join(testDir, '.specify', 'templates'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.specify', 'scripts'))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.specify', 'memory'))).toBe(true);
  });

  it('should copy templates directory', async () => {
    await copySpecKitStructure(testDir);

    const templatesPath = path.join(testDir, '.specify', 'templates');
    expect(await fs.pathExists(templatesPath)).toBe(true);

    // Check for template files
    const files = await fs.readdir(templatesPath);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should copy scripts directory and make them executable', async () => {
    await copySpecKitStructure(testDir);

    const scriptsPath = path.join(testDir, '.specify', 'scripts');
    expect(await fs.pathExists(scriptsPath)).toBe(true);

    // Check for bash scripts
    const bashPath = path.join(scriptsPath, 'bash');
    if (await fs.pathExists(bashPath)) {
      const bashFiles = await fs.readdir(bashPath);
      const shFiles = bashFiles.filter((f) => f.endsWith('.sh'));

      if (shFiles.length > 0) {
        // Check that at least one script is executable
        const firstScript = path.join(bashPath, shFiles[0]);
        const stat = await fs.stat(firstScript);
        expect(stat.mode & 0o111).toBeGreaterThan(0);
      }
    }
  });

  it('should copy memory directory with constitution', async () => {
    await copySpecKitStructure(testDir);

    const memoryPath = path.join(testDir, '.specify', 'memory');
    expect(await fs.pathExists(memoryPath)).toBe(true);

    const constitutionPath = path.join(memoryPath, 'constitution.md');
    if (await fs.pathExists(constitutionPath)) {
      const content = await fs.readFile(constitutionPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
