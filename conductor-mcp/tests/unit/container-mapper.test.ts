import { describe, it, expect } from 'vitest';
import {
  expandTemplate,
  expandEnvironmentVariables,
  assembleTaskPrompt,
  escapePromptForShell,
} from '../../src/config/container-mapper.js';

describe('container-mapper', () => {
  describe('expandTemplate', () => {
    it('should expand template variables', () => {
      const template = 'Worker: ${workerName}, Phase: ${phase}';
      const variables = { workerName: 'architect', phase: 'Phase 1' };

      const result = expandTemplate(template, variables);

      expect(result).toBe('Worker: architect, Phase: Phase 1');
    });

    it('should leave unknown variables unchanged', () => {
      const template = 'Worker: ${workerName}, Unknown: ${unknown}';
      const variables = { workerName: 'architect' };

      const result = expandTemplate(template, variables);

      expect(result).toBe('Worker: architect, Unknown: ${unknown}');
    });
  });

  describe('expandEnvironmentVariables', () => {
    it('should expand all environment variables', () => {
      const envVars = {
        WORKER_ROLE: '${workerName}',
        NODE_ENV: 'test',
      };
      const variables = { workerName: 'architect' };

      const result = expandEnvironmentVariables(envVars, variables);

      expect(result).toEqual({
        WORKER_ROLE: 'architect',
        NODE_ENV: 'test',
      });
    });
  });

  describe('assembleTaskPrompt', () => {
    it('should combine worker prompt and task prompt', () => {
      const workerPrompt = 'You are an architect worker.';
      const taskPrompt = 'Create a constitution.';

      const result = assembleTaskPrompt(workerPrompt, taskPrompt);

      expect(result).toContain(workerPrompt);
      expect(result).toContain(taskPrompt);
      expect(result).toContain('## Current Task');
    });
  });

  describe('escapePromptForShell', () => {
    it('should escape single quotes', () => {
      const prompt = "It's a test";

      const result = escapePromptForShell(prompt);

      expect(result).toBe("It'\\''s a test");
    });

    it('should handle prompts without quotes', () => {
      const prompt = 'Simple test';

      const result = escapePromptForShell(prompt);

      expect(result).toBe('Simple test');
    });
  });
});
