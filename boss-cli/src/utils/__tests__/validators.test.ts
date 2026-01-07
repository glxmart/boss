import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  validateProjectName,
  validateTemplate,
  validateQualityPreset,
  validateProjectDirectory,
  validateMCPScope,
  validateTemplateAvailability,
} from '../validators.js';

// Mock the external-templates module
vi.mock('../../generators/external-templates.js', () => ({
  checkTemplateAvailability: vi.fn(),
  formatAvailabilityError: vi.fn(),
}));

describe('validators', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      expect(validateProjectName('my-project')).toEqual({ valid: true });
      expect(validateProjectName('project123')).toEqual({ valid: true });
      expect(validateProjectName('my-awesome-project')).toEqual({ valid: true });
    });

    it('should reject empty names', () => {
      const result = validateProjectName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject names with uppercase letters', () => {
      const result = validateProjectName('MyProject');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject names with spaces', () => {
      const result = validateProjectName('my project');
      expect(result.valid).toBe(false);
    });

    it('should reject names starting with hyphen', () => {
      const result = validateProjectName('-project');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('hyphen');
    });

    it('should reject names ending with hyphen', () => {
      const result = validateProjectName('project-');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('hyphen');
    });

    it('should reject names with only whitespace', () => {
      const result = validateProjectName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject names with special characters', () => {
      const result = validateProjectName('my_project');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTemplate', () => {
    it('should accept valid templates', () => {
      expect(validateTemplate('t3-prisma')).toEqual({ valid: true });
      expect(validateTemplate('fastify-native')).toEqual({ valid: true });
      expect(validateTemplate('t3-prisma')).toEqual({ valid: true });
      expect(validateTemplate('t3-drizzle')).toEqual({ valid: true });
    });

    it('should reject invalid templates', () => {
      const result = validateTemplate('invalid-template');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid template');
    });
  });

  describe('validateQualityPreset', () => {
    it('should accept valid presets', () => {
      expect(validateQualityPreset('startup')).toEqual({ valid: true });
      expect(validateQualityPreset('production')).toEqual({ valid: true });
      expect(validateQualityPreset('enterprise')).toEqual({ valid: true });
    });

    it('should reject invalid presets', () => {
      const result = validateQualityPreset('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid quality preset');
    });
  });

  describe('validateMCPScope', () => {
    it('should accept valid scopes', () => {
      expect(validateMCPScope('user')).toEqual({ valid: true });
      expect(validateMCPScope('project')).toEqual({ valid: true });
      expect(validateMCPScope('both')).toEqual({ valid: true });
    });

    it('should reject invalid scopes', () => {
      const result = validateMCPScope('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid MCP scope');
    });
  });

  describe('validateProjectDirectory', () => {
    const testDir = path.join(os.tmpdir(), 'boss-cli-test-validators');

    beforeEach(async () => {
      await fs.remove(testDir);
    });

    afterEach(async () => {
      await fs.remove(testDir);
    });

    it('should accept non-existent directory', async () => {
      const result = await validateProjectDirectory(path.join(testDir, 'new-dir'));
      expect(result.valid).toBe(true);
    });

    it('should accept empty directory', async () => {
      await fs.ensureDir(testDir);
      const result = await validateProjectDirectory(testDir);
      expect(result.valid).toBe(true);
    });

    it('should reject non-empty directory', async () => {
      await fs.ensureDir(testDir);
      await fs.writeFile(path.join(testDir, 'file.txt'), 'content');
      const result = await validateProjectDirectory(testDir);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not empty');
    });

    it('should reject path that is a file', async () => {
      const filePath = path.join(testDir, 'file.txt');
      await fs.ensureDir(testDir);
      await fs.writeFile(filePath, 'content');
      const result = await validateProjectDirectory(filePath);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not a directory');
    });
  });

  describe('validateTemplateAvailability', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return valid when template source is available', async () => {
      const { checkTemplateAvailability } = await import('../../generators/external-templates.js');
      vi.mocked(checkTemplateAvailability).mockResolvedValueOnce({ available: true });

      const result = await validateTemplateAvailability('t3-prisma');

      expect(result.valid).toBe(true);
      expect(checkTemplateAvailability).toHaveBeenCalledWith('t3-prisma');
    });

    it('should return invalid with error when template source is unavailable', async () => {
      const { checkTemplateAvailability, formatAvailabilityError } =
        await import('../../generators/external-templates.js');
      vi.mocked(checkTemplateAvailability).mockResolvedValueOnce({
        available: false,
        error: 'Cannot reach npm',
        remediation: 'Check network',
      });
      vi.mocked(formatAvailabilityError).mockReturnValueOnce('Formatted error message');

      const result = await validateTemplateAvailability('t3-prisma');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Formatted error message');
      expect(result.remediation).toBe('Check network');
    });
  });
});
