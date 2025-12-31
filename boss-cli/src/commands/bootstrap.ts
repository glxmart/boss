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
import { addFiles, commit } from '../utils/git.js';

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

    // Commit Spec-Kit to git (critical for container-use)
    logger.startSpinner('Committing Spec-Kit to git...');
    await addFiles(projectPath, ['.specify/']);
    await commit(projectPath, 'Add Spec-Kit templates, scripts, and structure');
    logger.stopSpinner(true, 'Spec-Kit committed to git');

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

    // Generate MCP config
    logger.startSpinner('Generating MCP configuration...');
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
    await generateMCPConfig(projectPath, mcpScope);
    logger.stopSpinner(true, 'MCP configuration generated');

    // Generate GitHub workflows
    logger.startSpinner('Generating GitHub workflows...');
    await generateGitHubWorkflows(projectPath, config);
    logger.stopSpinner(true, 'GitHub workflows generated');

    // Generate git hooks
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

    // Load and apply template
    logger.startSpinner(`Loading template: ${config.template}...`);
    await loadTemplate(projectPath, config.template, config);
    logger.stopSpinner(true, 'Template applied');

    // Generate template documentation
    logger.startSpinner('Generating template documentation...');
    await generateTemplateDocs(projectPath, config);
    logger.stopSpinner(true, 'Template documentation generated');

    // Commit all bootstrap files
    logger.startSpinner('Committing bootstrap files...');
    await addFiles(projectPath, ['.']);
    await commit(projectPath, 'chore: BOSS bootstrap - initial project structure');
    logger.stopSpinner(true, 'Bootstrap files committed');

    // Success message
    logger.section('✅ Bootstrap Complete!');
    logger.success(`Project "${config.name}" has been bootstrapped successfully!`);
    logger.info(`\nNext steps:`);
    logger.info(`  1. cd ${config.name}`);
    logger.info(`  2. docker-compose up -d`);
    logger.info(`  3. Open project in Claude Code/Cursor`);
    logger.info(`  4. Run: ./start-boss.sh`);

  } catch (error) {
    logger.error(`Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
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

