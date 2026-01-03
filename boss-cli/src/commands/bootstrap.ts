import path from 'path';
import { logger } from '../utils/logger.js';
import {
  promptProjectName,
  promptTemplate,
  promptQualityPreset,
  promptGitHubConfig,
  promptMCPScope,
  confirmBootstrap,
  TEMPLATES,
  QUALITY_PRESETS
} from '../utils/prompts.js';
import { validateProjectName, validateTemplate, validateQualityPreset, validateMCPScope } from '../utils/validators.js';
import { validateProjectDirectory } from '../utils/validators.js';
import type { BootstrapOptions, ProjectConfig } from '../types/index.js';
import { initGitRepository } from '../utils/git.js';
import { generateProjectStructure } from '../generators/project-structure.js';
import { generateBossConfig } from '../generators/boss-config.js';
import { copySpecKitStructure } from '../generators/specify-structure.js';
import { generateContainerUseConfig } from '../generators/container-use-config.js';
import { generateWorkerConfigs } from '../generators/worker-configs.js';
import { generateQualityGates } from '../generators/quality-gates.js';
import { generateMCPConfig } from '../generators/mcp-config.js';
import { generateGitHubWorkflows } from '../generators/github-workflows.js';
import { generateGitHooks } from '../generators/git-hooks.js';
import { generateDockerCompose } from '../generators/docker-compose.js';
import { generateClaudeMD } from '../generators/claude-md.js';
import { generateClaudeFolder } from '../generators/claude-folder.js';
import { generateStartBossScript } from '../generators/start-boss-sh.js';
import { loadTemplate } from '../generators/template-loader.js';
import { generateTemplateDocs } from '../generators/template-docs.js';
import { applyQualityPreset } from '../presets/quality-presets.js';
import { addFiles, commit, createBranch } from '../utils/git.js';
import { execa } from 'execa';

export async function bootstrapCommand(options: BootstrapOptions): Promise<void> {
  logger.section('🤖 BOSS Bootstrap');

  // Collect configuration
  const config = await collectConfiguration(options);

  // Validate project directory
  const projectPath = options.projectPath || path.resolve(process.cwd(), config.name);
  const dirValidation = await validateProjectDirectory(projectPath);
  if (!dirValidation.valid) {
    logger.error(dirValidation.error || 'Invalid project directory');
    process.exit(1);
  }

  // Confirm before proceeding
  const confirmed = await confirmBootstrap(config, options.nonInteractive || false);
  if (!confirmed) {
    logger.info('Bootstrap cancelled');
    return;
  }

  // Create project directory
  logger.startSpinner('Creating project directory...');
  const { ensureDirectory } = await import('../utils/file-system.js');
  await ensureDirectory(projectPath);
  logger.stopSpinner(true, 'Project directory created');

  try {
    // Initialize git repository
    await initGitRepository(projectPath);

    // Copy Spec-Kit from CLI bundle
    logger.startSpinner('Copying Spec-Kit structure...');
    await copySpecKitStructure(projectPath);
    logger.stopSpinner(true, 'Spec-Kit structure copied');

    // Generate project structure
    logger.startSpinner('Generating project structure...');
    await generateProjectStructure(projectPath, config);
    logger.stopSpinner(true, 'Project structure generated');

    // Generate BOSS config
    logger.startSpinner('Generating BOSS configuration...');
    await generateBossConfig(projectPath, config);
    logger.stopSpinner(true, 'BOSS configuration generated');

    // Generate container-use config
    logger.startSpinner('Generating container-use configuration...');
    await generateContainerUseConfig(projectPath);
    logger.stopSpinner(true, 'Container-use configuration generated');

    // Generate worker configs
    logger.startSpinner('Generating worker configurations...');
    await generateWorkerConfigs(projectPath, config);
    logger.stopSpinner(true, 'Worker configurations generated');

    // Apply quality preset
    logger.startSpinner('Applying quality preset...');
    await applyQualityPreset(projectPath, config.quality);
    logger.stopSpinner(true, 'Quality preset applied');

    // Generate quality gates
    logger.startSpinner('Generating quality gates...');
    await generateQualityGates(projectPath, config.quality);
    logger.stopSpinner(true, 'Quality gates generated');

    // Determine MCP scope BEFORE starting spinner (to avoid UI hang)
    let mcpScope: 'user' | 'project' | 'both' = 'both';
    if (options.mcpScope) {
      const validation = validateMCPScope(options.mcpScope);
      if (!validation.valid) {
        logger.error(validation.error || 'Invalid MCP scope');
        process.exit(1);
      }
      mcpScope = options.mcpScope as 'user' | 'project' | 'both';
    } else if (!options.nonInteractive) {
      mcpScope = await promptMCPScope();
    }

    // Generate MCP config
    logger.startSpinner('Generating MCP configuration...');
    await generateMCPConfig(projectPath, mcpScope);
    logger.stopSpinner(true, 'MCP configuration generated');

    // Generate GitHub workflows
    logger.startSpinner('Generating GitHub workflows...');
    await generateGitHubWorkflows(projectPath, config);
    logger.stopSpinner(true, 'GitHub workflows generated');

    // Generate git hooks (creates .husky/ directory and hook files)
    logger.startSpinner('Generating git hooks...');
    await generateGitHooks(projectPath, config.quality);
    logger.stopSpinner(true, 'Git hooks generated');

    // Generate Docker Compose
    logger.startSpinner('Generating Docker Compose...');
    await generateDockerCompose(projectPath);
    logger.stopSpinner(true, 'Docker Compose generated');

    // Generate critical files
    logger.startSpinner('Generating critical files...');
    await generateClaudeMD(projectPath, config);
    await generateClaudeFolder(projectPath, config);
    await generateStartBossScript(projectPath);
    logger.stopSpinner(true, 'Critical files generated');

    // Load and apply template (includes package.json with husky dependency and prepare script)
    logger.startSpinner(`Loading template: ${config.template}...`);
    await loadTemplate(projectPath, config.template, config);
    logger.stopSpinner(true, 'Template applied');

    // Initialize Husky after package.json exists (package.json has husky and prepare script)
    logger.startSpinner('Initializing Husky git hooks...');
    await initializeHuskyAfterPackageJson(projectPath);
    logger.stopSpinner(true, 'Husky initialized');

    // Generate template documentation
    logger.startSpinner('Generating template documentation...');
    await generateTemplateDocs(projectPath, config);
    logger.stopSpinner(true, 'Template documentation generated');

    // CRITICAL: Commit empty main branch FIRST (before any files)
    // Main branch must be pushed empty first, then all files go via feature branch/PR
    logger.startSpinner('Creating empty initial commit on main branch...');
    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: 'The BOSS',
      GIT_AUTHOR_EMAIL: 'boss@glxmart.com',
      GIT_COMMITTER_NAME: 'The BOSS',
      GIT_COMMITTER_EMAIL: 'boss@glxmart.com'
    };
    // Use --no-verify to skip hooks (dependencies aren't installed yet)
    await execa('git', ['commit', '--allow-empty', '-m', 'chore: initial empty commit', '--no-verify'], {
      cwd: projectPath,
      env: gitEnv
    });
    logger.stopSpinner(true, 'Empty main branch committed');

    // CRITICAL: Create feature/boss-initial-setup branch BEFORE committing files
    // All bootstrap files will be committed to feature branch, not main
    logger.startSpinner('Creating feature/boss-initial-setup branch...');
    await createInitialSetupBranch(projectPath);
    logger.stopSpinner(true, 'Feature branch created');

    // CRITICAL: Ensure test file exists (required for pre-push hook on feature branch)
    logger.startSpinner('Ensuring test file exists...');
    await ensureTestFileExists(projectPath, config);
    logger.stopSpinner(true, 'Test file ensured');

    // CRITICAL: Commit ALL bootstrap files to feature branch (NOT main)
    // Main branch stays empty - all files go via feature branch/PR
    logger.startSpinner('Committing all bootstrap files to feature branch...');
    await addFiles(projectPath, ['.']);
    
    // Verify test file is included before committing
    const { stdout: testFileCheck } = await execa('git', ['ls-files'], { cwd: projectPath });
    const hasTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(testFileCheck);
    if (!hasTestFile) {
      logger.warning('No test files found in staged files. Re-checking...');
      // Re-ensure test file exists
      await ensureTestFileExists(projectPath, config);
      await addFiles(projectPath, ['tests/']);
    }
    
    await commit(projectPath, 'chore: BOSS bootstrap - initial project structure');
    logger.stopSpinner(true, 'All bootstrap files committed to feature branch');

    // Success message
    logger.section('✅ Bootstrap Complete!');
    logger.success(`Project "${config.name}" has been bootstrapped successfully!`);
    logger.info(`\nNext steps:`);
    logger.info(`  1. cd ${config.name}`);
    logger.info(`  2. pnpm install (installs dependencies and initializes Husky via prepare script)`);
    logger.info(`  3. docker-compose up -d`);
    logger.info(`  4. Open project in Claude Code/Cursor`);
    logger.info(`  5. Run: ./start-boss.sh`);
    logger.info(`  6. BOSS will complete initial setup (GitHub repo, remote, branch protection, etc.)`);

  } catch (error) {
    logger.error(`Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function initializeHuskyAfterPackageJson(projectPath: string): Promise<void> {
  // Skip Husky initialization in test environments to avoid partial initialization issues
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    // Run husky to set up git hooks in .git/hooks directory (husky v9+ uses 'husky' instead of 'husky install')
    // This works even if husky isn't installed yet (npx downloads it temporarily)
    // After pnpm install, the prepare script will ensure husky is properly installed
    await execa('npx', ['husky'], {
      cwd: projectPath,
      stdio: 'pipe'
    });
    // Husky initialized successfully (silent success)
  } catch (error) {
    // If husky is not available, log warning but continue
    // The hooks are in .husky/ directory and prepare script will install them when dependencies are installed
    logger.warning('Husky initialization skipped (husky not available via npx).');
    logger.warning('Hooks are in .husky/ directory. Run "pnpm install" to activate hooks (prepare script will run husky).');
  }
}

async function ensureTestFileExists(projectPath: string, config: ProjectConfig): Promise<void> {
  // NOTE: Dynamic import of fs-extra requires accessing .default
  // See: docs/common-issues.md for details
  const fsModule = await import('fs-extra');
  const fs = fsModule.default;
  const { writeFile } = await import('../utils/file-system.js');
  const { loadTemplate: loadAssetTemplate } = await import('../utils/template-loader.js');
  
  // Check if any test files exist
  const testsDir = path.join(projectPath, 'tests');
  
  let hasTestFile = false;
  if (await fs.pathExists(testsDir)) {
    const files = await fs.readdir(testsDir, { recursive: true }) as string[];
    hasTestFile = files.some((f) => {
      return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f);
    });
  }
  
  // Also check root and src directories
  if (!hasTestFile) {
    try {
      const rootFiles = await fs.readdir(projectPath) as string[];
      hasTestFile = rootFiles.some((f) => {
        return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f);
      });
    } catch {
      // Ignore errors
    }
  }
  
  if (!hasTestFile) {
    const srcDir = path.join(projectPath, 'src');
    if (await fs.pathExists(srcDir)) {
      try {
        const srcFiles = await fs.readdir(srcDir, { recursive: true }) as string[];
        hasTestFile = srcFiles.some((f) => {
          return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f);
        });
      } catch {
        // Ignore errors
      }
    }
  }

  // If no test file exists, create a minimal one
  if (!hasTestFile) {
    await fs.ensureDir(testsDir);
    try {
      // Try to load the template test file
      const testFile = await loadAssetTemplate('template-loader/index.test.ts', { config });
      await writeFile(path.join(testsDir, 'index.test.ts'), testFile);
    } catch {
      // If template doesn't exist, create a minimal test file
      const minimalTest = `import { describe, it, expect } from 'vitest';

describe('Bootstrap Test', () => {
  it('should pass initial test', () => {
    expect(true).toBe(true);
  });
});
`;
      await writeFile(path.join(testsDir, 'index.test.ts'), minimalTest);
    }
  }
}

async function createInitialSetupBranch(projectPath: string): Promise<void> {
  // NOTE: Dynamic import of fs-extra requires accessing .default
  // See: docs/common-issues.md for details
  const fsModule = await import('fs-extra');
  const fs = fsModule.default;
  const { readFile, writeFile } = await import('../utils/file-system.js');
  const projectConfigPath = path.join(projectPath, '.boss', 'project-config.json');

  // CRITICAL: Verify we're on main branch before creating feature branch
  const { execa } = await import('execa');
  const { stdout: currentBranch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: projectPath });
  if (currentBranch.trim() !== 'main' && currentBranch.trim() !== 'master') {
    logger.warning(`Expected to be on main branch, but on ${currentBranch.trim()}. Switching to main...`);
    await execa('git', ['checkout', 'main'], { cwd: projectPath });
  }

  // Create and switch to feature/boss-initial-setup branch
  // This happens BEFORE committing bootstrap files - all files will go to feature branch
  await createBranch(projectPath, 'feature/boss-initial-setup');

  // Early return if project-config.json doesn't exist
  const configExists = await fs.pathExists(projectConfigPath);
  if (!configExists) {
    return;
  }

  const projectConfigContent = await readFile(projectConfigPath);
  const projectConfig = JSON.parse(projectConfigContent);
  const now = new Date().toISOString();

  // Update branch information
  projectConfig.currentBranch = 'feature/boss-initial-setup';
  if (projectConfig.repository?.branches) {
    projectConfig.repository.branches['feature/boss-initial-setup'] = {
      exists: true,
      lastCommit: null
    };
  }

  // Update initialization status
  projectConfig.initialization.stage = 'remote-setup';
  projectConfig.initialization.status = 'in-progress';

  // Mark branch creation operation as completed
  const branchOp = projectConfig.initialization.operationsRequired?.find(
    (op: { operation: string }) => op.operation === 'create-initial-setup-branch'
  );
  if (branchOp) {
    branchOp.status = 'completed';
    branchOp.completedAt = now;
  }

  // Update current workflow
  projectConfig.currentWorkflow = {
    stage: 'initialization',
    phase: 'remote-setup',
    status: 'awaiting-remote-creation'
  };

  // Update metadata
  if (projectConfig.metadata) {
    projectConfig.metadata.lastUpdated = now;
    projectConfig.metadata.notes = 'Initial setup branch created. All bootstrap files will be committed to feature branch. Ready for remote repository setup.';
  }

  await writeFile(projectConfigPath, JSON.stringify(projectConfig, null, 2));

  // Note: project-config.json will be committed with all other bootstrap files
  // No need to commit separately - it will be included in the main bootstrap commit
}

async function collectConfiguration(options: BootstrapOptions): Promise<ProjectConfig> {
  let name = options.name;
  let template = options.template;
  let quality = options.quality;
  let githubRepo = options.githubRepo;
  let githubOrg = options.githubOrg;

  // Interactive mode if flags omitted
  if (!name || !template || !quality) {
    logger.info('Running in interactive mode...\n');

    if (!name) {
      name = await promptProjectName();
    } else {
      const validation = validateProjectName(name);
      if (!validation.valid) {
        logger.error(validation.error || 'Invalid project name');
        process.exit(1);
      }
    }

    if (!template) {
      template = await promptTemplate();
    } else {
      const validation = validateTemplate(template);
      if (!validation.valid) {
        logger.error(validation.error || 'Invalid template');
        process.exit(1);
      }
    }

    if (!quality) {
      quality = await promptQualityPreset();
    } else {
      const validation = validateQualityPreset(quality);
      if (!validation.valid) {
        logger.error(validation.error || 'Invalid quality preset');
        process.exit(1);
      }
    }

    if (!githubRepo || !githubOrg) {
      const githubConfig = await promptGitHubConfig();
      githubRepo = githubConfig.repo || githubRepo;
      githubOrg = githubConfig.org || githubOrg;
    }
  } else {
    // Validate provided options
    const nameValidation = validateProjectName(name);
    if (!nameValidation.valid) {
      logger.error(nameValidation.error || 'Invalid project name');
      process.exit(1);
    }

    const templateValidation = validateTemplate(template);
    if (!templateValidation.valid) {
      logger.error(templateValidation.error || 'Invalid template');
      process.exit(1);
    }

    const qualityValidation = validateQualityPreset(quality);
    if (!qualityValidation.valid) {
      logger.error(qualityValidation.error || 'Invalid quality preset');
      process.exit(1);
    }
  }

  return {
    name: name!,
    template: template!,
    quality: quality!,
    githubRepo,
    githubOrg
  };
}

