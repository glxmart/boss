import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootstrapCommand } from '../bootstrap.js';
import type { BootstrapOptions } from '../../types/index.js';

// Mock all dependencies
vi.mock('../../utils/logger.js', () => ({
  logger: {
    section: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    startSpinner: vi.fn(),
    stopSpinner: vi.fn()
  }
}));

vi.mock('../../utils/validators.js', () => ({
  validateProjectName: vi.fn((name: string) => ({ valid: true })),
  validateTemplate: vi.fn((template: string) => ({ valid: true })),
  validateQualityPreset: vi.fn((quality: string) => ({ valid: true })),
  validateMCPScope: vi.fn((scope: string) => ({ valid: true })),
  validateProjectDirectory: vi.fn(async () => ({ valid: true }))
}));

vi.mock('../../utils/prompts.js', () => ({
  promptProjectName: vi.fn(async () => 'test-project'),
  promptTemplate: vi.fn(async () => 'nextjs-app-turbo'),
  promptQualityPreset: vi.fn(async () => 'production'),
  promptGitHubConfig: vi.fn(async () => ({ repo: 'test-repo', org: 'test-org' })),
  promptMCPScope: vi.fn(async () => 'both'),
  confirmBootstrap: vi.fn(async () => true),
  TEMPLATES: {
    'nextjs-app-turbo': { name: 'Next.js App', description: 'Test', stack: [] }
  },
  QUALITY_PRESETS: {
    'production': { name: 'Production', description: 'Test', gates: {} }
  }
}));

vi.mock('../../utils/git.js', () => ({
  initGitRepository: vi.fn(async () => {}),
  addFiles: vi.fn(async () => {}),
  commit: vi.fn(async () => {}),
  createBranch: vi.fn(async () => {})
}));

vi.mock('../../utils/file-system.js', () => ({
  ensureDirectory: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
  readFile: vi.fn(async () => '{}'),
  pathExists: vi.fn(async () => false)
}));

vi.mock('../../generators/project-structure.js', () => ({
  generateProjectStructure: vi.fn(async () => {})
}));

vi.mock('../../generators/boss-config.js', () => ({
  generateBossConfig: vi.fn(async () => {})
}));

vi.mock('../../generators/specify-structure.js', () => ({
  copySpecKitStructure: vi.fn(async () => {})
}));

vi.mock('../../generators/container-use-config.js', () => ({
  generateContainerUseConfig: vi.fn(async () => {})
}));

vi.mock('../../generators/worker-configs.js', () => ({
  generateWorkerConfigs: vi.fn(async () => {})
}));

vi.mock('../../generators/quality-gates.js', () => ({
  generateQualityGates: vi.fn(async () => {})
}));

vi.mock('../../generators/mcp-config.js', () => ({
  generateMCPConfig: vi.fn(async () => {})
}));

vi.mock('../../generators/github-workflows.js', () => ({
  generateGitHubWorkflows: vi.fn(async () => {})
}));

vi.mock('../../generators/git-hooks.js', () => ({
  generateGitHooks: vi.fn(async () => {})
}));

vi.mock('../../generators/docker-compose.js', () => ({
  generateDockerCompose: vi.fn(async () => {})
}));

vi.mock('../../generators/claude-md.js', () => ({
  generateClaudeMD: vi.fn(async () => {})
}));

vi.mock('../../generators/claude-folder.js', () => ({
  generateClaudeFolder: vi.fn(async () => {})
}));

vi.mock('../../generators/start-boss-sh.js', () => ({
  generateStartBossScript: vi.fn(async () => {})
}));

vi.mock('../../generators/template-loader.js', () => ({
  loadTemplate: vi.fn(async () => {}),
  loadAssetTemplate: vi.fn(async () => 'test content')
}));

vi.mock('../../generators/template-docs.js', () => ({
  generateTemplateDocs: vi.fn(async () => {})
}));

vi.mock('../../presets/quality-presets.js', () => ({
  applyQualityPreset: vi.fn(async () => {})
}));

vi.mock('execa', () => ({
  execa: vi.fn(async (cmd: string, args: string[]) => {
    // Mock git commands
    if (cmd === 'git') {
      if (args[0] === 'ls-files') {
        return { stdout: 'tests/index.test.ts' };
      }
      if (args[0] === 'rev-parse') {
        return { stdout: 'main' };
      }
      return { stdout: '', stderr: '' };
    }
    // Mock npx husky
    if (cmd === 'npx' && args[0] === 'husky') {
      return { stdout: '', stderr: '' };
    }
    return { stdout: '', stderr: '' };
  })
}));

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(async () => false),
    ensureDir: vi.fn(async () => {}),
    readdir: vi.fn(async () => []),
    writeFile: vi.fn(async () => {})
  }
}));

describe('bootstrap command', () => {
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    processExitSpy.mockRestore();
  });

  describe('bootstrapCommand', () => {
    it('should bootstrap project with all options provided (non-interactive)', async () => {
      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        githubRepo: 'test-repo',
        githubOrg: 'test-org',
        mcpScope: 'both',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      // Verify all generators were called
      const { generateProjectStructure } = await import('../../generators/project-structure.js');
      const { generateBossConfig } = await import('../../generators/boss-config.js');
      const { copySpecKitStructure } = await import('../../generators/specify-structure.js');

      expect(generateProjectStructure).toHaveBeenCalled();
      expect(generateBossConfig).toHaveBeenCalled();
      expect(copySpecKitStructure).toHaveBeenCalled();
    });

    it('should handle user cancellation', async () => {
      const { confirmBootstrap } = await import('../../utils/prompts.js');
      vi.mocked(confirmBootstrap).mockResolvedValueOnce(false);

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: false
      };

      await bootstrapCommand(options);

      const { logger } = await import('../../utils/logger.js');
      expect(logger.info).toHaveBeenCalledWith('Bootstrap cancelled');
    });

    it('should exit on invalid project directory', async () => {
      const { validateProjectDirectory } = await import('../../utils/validators.js');
      vi.mocked(validateProjectDirectory).mockResolvedValueOnce({
        valid: false,
        error: 'Directory is not empty'
      });

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should validate project name when provided', async () => {
      const { validateProjectName } = await import('../../utils/validators.js');
      vi.mocked(validateProjectName).mockReturnValueOnce({
        valid: false,
        error: 'Invalid project name'
      });

      const options: BootstrapOptions = {
        name: 'Invalid Name',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should validate template when provided', async () => {
      const { validateTemplate } = await import('../../utils/validators.js');
      vi.mocked(validateTemplate).mockReturnValueOnce({
        valid: false,
        error: 'Invalid template'
      });

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'invalid-template' as any,
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should validate quality preset when provided', async () => {
      const { validateQualityPreset } = await import('../../utils/validators.js');
      vi.mocked(validateQualityPreset).mockReturnValueOnce({
        valid: false,
        error: 'Invalid quality preset'
      });

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'invalid-quality' as any,
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should validate MCP scope when provided', async () => {
      const { validateMCPScope } = await import('../../utils/validators.js');
      vi.mocked(validateMCPScope).mockReturnValueOnce({
        valid: false,
        error: 'Invalid MCP scope'
      });

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        mcpScope: 'invalid-scope' as any,
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should use interactive prompts when options missing', async () => {
      const { promptProjectName, promptTemplate, promptQualityPreset, promptGitHubConfig } =
        await import('../../utils/prompts.js');

      const options: BootstrapOptions = {
        nonInteractive: false
      };

      await bootstrapCommand(options);

      expect(promptProjectName).toHaveBeenCalled();
      expect(promptTemplate).toHaveBeenCalled();
      expect(promptQualityPreset).toHaveBeenCalled();
      expect(promptGitHubConfig).toHaveBeenCalled();
    });

    it('should initialize git repository', async () => {
      const { initGitRepository } = await import('../../utils/git.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(initGitRepository).toHaveBeenCalled();
    });

    it('should generate all required configurations', async () => {
      const { generateWorkerConfigs } = await import('../../generators/worker-configs.js');
      const { generateQualityGates } = await import('../../generators/quality-gates.js');
      const { generateMCPConfig } = await import('../../generators/mcp-config.js');
      const { generateGitHubWorkflows } = await import('../../generators/github-workflows.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(generateWorkerConfigs).toHaveBeenCalled();
      expect(generateQualityGates).toHaveBeenCalled();
      expect(generateMCPConfig).toHaveBeenCalled();
      expect(generateGitHubWorkflows).toHaveBeenCalled();
    });

    it('should create initial setup branch', async () => {
      const { createBranch } = await import('../../utils/git.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(createBranch).toHaveBeenCalledWith(
        expect.any(String),
        'feature/boss-initial-setup'
      );
    });

    it('should commit bootstrap files', async () => {
      const { addFiles, commit } = await import('../../utils/git.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(addFiles).toHaveBeenCalledWith(expect.any(String), ['.']);
      expect(commit).toHaveBeenCalledWith(
        expect.any(String),
        'chore: BOSS bootstrap - initial project structure'
      );
    });

    it('should handle bootstrap errors', async () => {
      const { generateProjectStructure } = await import('../../generators/project-structure.js');
      vi.mocked(generateProjectStructure).mockRejectedValueOnce(
        new Error('Generation failed')
      );

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await expect(bootstrapCommand(options)).rejects.toThrow('Generation failed');
    });

    it('should apply quality preset', async () => {
      const { applyQualityPreset } = await import('../../presets/quality-presets.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(applyQualityPreset).toHaveBeenCalledWith(
        expect.any(String),
        'production'
      );
    });

    it('should load template', async () => {
      const { loadTemplate } = await import('../../generators/template-loader.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(loadTemplate).toHaveBeenCalledWith(
        expect.any(String),
        'nextjs-app-turbo',
        expect.objectContaining({
          name: 'test-project',
          template: 'nextjs-app-turbo',
          quality: 'production'
        })
      );
    });

    it('should use project scope for MCP when specified', async () => {
      const { generateMCPConfig } = await import('../../generators/mcp-config.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        mcpScope: 'project',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(generateMCPConfig).toHaveBeenCalledWith(
        expect.any(String),
        'project'
      );
    });

    it('should use user scope for MCP when specified', async () => {
      const { generateMCPConfig } = await import('../../generators/mcp-config.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        mcpScope: 'user',
        nonInteractive: true
      };

      await bootstrapCommand(options);

      expect(generateMCPConfig).toHaveBeenCalledWith(
        expect.any(String),
        'user'
      );
    });

    it('should prompt for MCP scope in interactive mode when not provided', async () => {
      const { promptMCPScope } = await import('../../utils/prompts.js');

      const options: BootstrapOptions = {
        name: 'test-project',
        template: 'nextjs-app-turbo',
        quality: 'production',
        nonInteractive: false
      };

      await bootstrapCommand(options);

      expect(promptMCPScope).toHaveBeenCalled();
    });
  });
});
