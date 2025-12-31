import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateTemplate,
  validateQualityPreset
} from '../validators.js';

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
  });

  describe('validateTemplate', () => {
    it('should accept valid templates', () => {
      expect(validateTemplate('nextjs-app-turbo')).toEqual({ valid: true });
      expect(validateTemplate('api-service-fastify')).toEqual({ valid: true });
      expect(validateTemplate('blank')).toEqual({ valid: true });
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
});

