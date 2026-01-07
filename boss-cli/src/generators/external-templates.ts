import { execa, type ExecaError } from 'execa';
import path from 'path';
import type { Template, ProjectConfig } from '../types/index.js';
import { writeFile } from '../utils/file-system.js';

// Lazy-loaded fs-extra module
type FsExtra = typeof import('fs-extra');
let fsExtra: FsExtra | null = null;

async function getFs(): Promise<FsExtra> {
  if (!fsExtra) {
    const fsModule = await import('fs-extra');
    fsExtra = fsModule.default;
  }
  return fsExtra;
}

/**
 * Result of a template execution
 */
export interface TemplateExecutionResult {
  success: boolean;
  version: string | null;
  source: string;
  error?: string;
}

/**
 * Result of a template availability check
 */
export interface TemplateAvailabilityResult {
  available: boolean;
  error?: string;
  remediation?: string;
}

/**
 * Template executor configuration
 */
interface TemplateExecutorConfig {
  /** The external command to run (informational, actual execution uses executeTemplate) */
  command: string;
  /** Source of the template (for tracking) */
  source: string;
  /** Function to check if the template source is available */
  checkAvailability: () => Promise<TemplateAvailabilityResult>;
  /** Function to execute the template generation */
  executeTemplate: (projectPath: string, projectName: string) => Promise<TemplateExecutionResult>;
  /** Function to get the version of the template */
  getVersion: () => Promise<string | null>;
}

/**
 * Template executor registry
 */
const TEMPLATE_EXECUTORS: Record<Template, TemplateExecutorConfig> = {
  't3-prisma': {
    command: 'pnpm create t3-app@latest --prisma --tailwind --trpc --nextAuth',
    source: 'create-t3-app',
    checkAvailability: checkNpmAvailability('create-t3-app'),
    executeTemplate: executeT3Template('prisma'),
    getVersion: getNpmVersion('create-t3-app'),
  },
  't3-drizzle': {
    command: 'pnpm create t3-app@latest --drizzle --tailwind --trpc --nextAuth',
    source: 'create-t3-app',
    checkAvailability: checkNpmAvailability('create-t3-app'),
    executeTemplate: executeT3Template('drizzle'),
    getVersion: getNpmVersion('create-t3-app'),
  },
  'nestjs-typeorm': {
    command: 'git clone https://github.com/brocoders/nestjs-boilerplate.git',
    source: 'brocoders/nestjs-boilerplate',
    checkAvailability: checkGitHubAvailability('brocoders', 'nestjs-boilerplate'),
    executeTemplate: executeGitCloneTemplate('https://github.com/brocoders/nestjs-boilerplate.git'),
    getVersion: getGitHubVersion('brocoders', 'nestjs-boilerplate'),
  },
  'fastify-native': {
    command: 'pnpm create fastify',
    source: 'create-fastify',
    checkAvailability: checkNpmAvailability('create-fastify'),
    executeTemplate: executeFastifyTemplate(),
    getVersion: getNpmVersion('create-fastify'),
  },
  'astro-portfolio': {
    command: 'pnpm create astro -- --template portfolio',
    source: 'create-astro',
    checkAvailability: checkNpmAvailability('create-astro'),
    executeTemplate: executeAstroTemplate(),
    getVersion: getNpmVersion('create-astro'),
  },
};

/**
 * Check if npm registry is reachable and package exists
 */
function checkNpmAvailability(packageName: string): () => Promise<TemplateAvailabilityResult> {
  return async () => {
    try {
      // Check if pnpm can view the package (validates registry connectivity and package existence)
      await execa('pnpm', ['view', packageName, 'version'], {
        timeout: 30000,
        reject: true,
      });
      return { available: true };
    } catch (error) {
      const execaError = error as ExecaError;
      const isNetworkError =
        execaError.message?.includes('ENOTFOUND') ||
        execaError.message?.includes('ETIMEDOUT') ||
        execaError.message?.includes('EAI_AGAIN');

      if (isNetworkError) {
        return {
          available: false,
          error: `Cannot reach npm registry`,
          remediation: `Possible causes:\n  - Network connectivity issue\n  - npm registry down\n  - Firewall blocking npm\n\nRun 'pnpm ping' to verify npm connectivity.`,
        };
      }

      return {
        available: false,
        error: `Package '${packageName}' not found on npm`,
        remediation: `The package may have been renamed or removed. Check https://www.npmjs.com/package/${packageName}`,
      };
    }
  };
}

/**
 * Check if GitHub repository is accessible
 */
function checkGitHubAvailability(
  owner: string,
  repo: string
): () => Promise<TemplateAvailabilityResult> {
  return async () => {
    try {
      // Use git ls-remote to check if repo is accessible (doesn't require auth for public repos)
      await execa('git', ['ls-remote', '--exit-code', `https://github.com/${owner}/${repo}.git`], {
        timeout: 30000,
        reject: true,
      });
      return { available: true };
    } catch (error) {
      const execaError = error as ExecaError;
      const isNetworkError =
        execaError.message?.includes('Could not resolve host') ||
        execaError.message?.includes('Connection timed out');

      if (isNetworkError) {
        return {
          available: false,
          error: `Cannot reach GitHub`,
          remediation: `Possible causes:\n  - Network connectivity issue\n  - GitHub.com down\n  - Firewall blocking GitHub\n\nTry: curl -I https://github.com`,
        };
      }

      return {
        available: false,
        error: `Repository '${owner}/${repo}' not accessible`,
        remediation: `The repository may be private or moved. Check https://github.com/${owner}/${repo}`,
      };
    }
  };
}

/**
 * Get the latest version of an npm package
 */
function getNpmVersion(packageName: string): () => Promise<string | null> {
  return async () => {
    try {
      const { stdout } = await execa('pnpm', ['view', packageName, 'version'], {
        timeout: 30000,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  };
}

/**
 * Get the latest commit SHA of a GitHub repository
 */
function getGitHubVersion(owner: string, repo: string): () => Promise<string | null> {
  return async () => {
    try {
      const { stdout } = await execa(
        'git',
        ['ls-remote', `https://github.com/${owner}/${repo}.git`, 'HEAD'],
        { timeout: 30000 }
      );
      // Output format: <sha>\tHEAD
      const sha = stdout.split('\t')[0];
      return sha?.substring(0, 7) || null; // Return short SHA
    } catch {
      return null;
    }
  };
}

/**
 * Execute create-t3-app template
 */
function executeT3Template(
  orm: 'prisma' | 'drizzle'
): (projectPath: string, projectName: string) => Promise<TemplateExecutionResult> {
  return async (projectPath: string, projectName: string) => {
    const parentDir = path.dirname(projectPath);
    const version = await getNpmVersion('create-t3-app')();

    try {
      // create-t3-app creates a directory with the project name
      // We need to run it from the parent directory
      const args = [
        'create',
        't3-app@latest',
        projectName,
        '--noGit', // We handle git ourselves
        '--CI', // Non-interactive mode
        '--tailwind',
        '--trpc',
        '--nextAuth',
        orm === 'prisma' ? '--prisma' : '--drizzle',
        '--appRouter', // Use App Router (Next.js 13+)
      ];

      await execa('pnpm', args, {
        cwd: parentDir,
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
      });

      return {
        success: true,
        version,
        source: 'create-t3-app',
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        version,
        source: 'create-t3-app',
        error: execaError.stderr || execaError.message || 'Unknown error',
      };
    }
  };
}

/**
 * Execute git clone template
 */
function executeGitCloneTemplate(
  repoUrl: string
): (projectPath: string, projectName: string) => Promise<TemplateExecutionResult> {
  return async (projectPath: string, _projectName: string) => {
    const fs = await getFs();
    const parentDir = path.dirname(projectPath);
    const dirName = path.basename(projectPath);
    const version = await getGitHubVersion('brocoders', 'nestjs-boilerplate')();

    try {
      // Clone into the target directory
      await execa('git', ['clone', '--depth=1', repoUrl, dirName], {
        cwd: parentDir,
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
      });

      // Remove the .git directory (we'll init our own)
      const gitDir = path.join(projectPath, '.git');
      if (await fs.pathExists(gitDir)) {
        await fs.remove(gitDir);
      }

      return {
        success: true,
        version,
        source: 'brocoders/nestjs-boilerplate',
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        version,
        source: 'brocoders/nestjs-boilerplate',
        error: execaError.stderr || execaError.message || 'Unknown error',
      };
    }
  };
}

/**
 * Execute create-fastify template
 */
function executeFastifyTemplate(): (
  projectPath: string,
  projectName: string
) => Promise<TemplateExecutionResult> {
  return async (projectPath: string, projectName: string) => {
    const parentDir = path.dirname(projectPath);
    const version = await getNpmVersion('create-fastify')();

    try {
      // create-fastify creates a directory with the project name
      await execa('pnpm', ['create', 'fastify', projectName], {
        cwd: parentDir,
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
        env: {
          ...process.env,
          // create-fastify may prompt for options, we use defaults
          CI: 'true',
        },
      });

      return {
        success: true,
        version,
        source: 'create-fastify',
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        version,
        source: 'create-fastify',
        error: execaError.stderr || execaError.message || 'Unknown error',
      };
    }
  };
}

/**
 * Execute create-astro template
 */
function executeAstroTemplate(): (
  projectPath: string,
  projectName: string
) => Promise<TemplateExecutionResult> {
  return async (projectPath: string, projectName: string) => {
    const parentDir = path.dirname(projectPath);
    const version = await getNpmVersion('create-astro')();

    try {
      // create-astro creates a directory with the project name
      await execa(
        'pnpm',
        [
          'create',
          'astro@latest',
          projectName,
          '--template',
          'portfolio',
          '--no-git', // We handle git ourselves
          '--no-install', // We'll handle dependencies ourselves
          '--yes', // Accept defaults
        ],
        {
          cwd: parentDir,
          stdio: 'pipe',
          timeout: 300000, // 5 minutes timeout
        }
      );

      return {
        success: true,
        version,
        source: 'create-astro',
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        version,
        source: 'create-astro',
        error: execaError.stderr || execaError.message || 'Unknown error',
      };
    }
  };
}

/**
 * Check if template source is available before bootstrap
 */
export async function checkTemplateAvailability(
  template: Template
): Promise<TemplateAvailabilityResult> {
  const executor = TEMPLATE_EXECUTORS[template];
  if (!executor) {
    return {
      available: false,
      error: `Unknown template: ${template}`,
    };
  }

  return executor.checkAvailability();
}

/**
 * Execute external template and generate project files
 */
export async function executeExternalTemplate(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<TemplateExecutionResult> {
  const executor = TEMPLATE_EXECUTORS[template];
  if (!executor) {
    return {
      success: false,
      version: null,
      source: 'unknown',
      error: `Unknown template: ${template}`,
    };
  }

  // Execute the template
  const result = await executor.executeTemplate(projectPath, config.name);

  // Generate template-version.json on success
  if (result.success) {
    await generateTemplateVersion(projectPath, template, result.version, result.source);
  }

  return result;
}

/**
 * Generate .boss/template-version.json
 */
async function generateTemplateVersion(
  projectPath: string,
  template: Template,
  version: string | null,
  source: string
): Promise<void> {
  const fs = await getFs();
  const bossDir = path.join(projectPath, '.boss');

  // Ensure .boss directory exists
  await fs.ensureDir(bossDir);

  const templateVersion = {
    template,
    version: version || 'unknown',
    generatedAt: new Date().toISOString(),
    source,
  };

  await writeFile(
    path.join(bossDir, 'template-version.json'),
    JSON.stringify(templateVersion, null, 2)
  );
}

/**
 * Get template executor info (for display purposes)
 */
export function getTemplateExecutorInfo(template: Template): {
  command: string;
  source: string;
} | null {
  const executor = TEMPLATE_EXECUTORS[template];
  if (!executor) {
    return null;
  }

  return {
    command: executor.command,
    source: executor.source,
  };
}

/**
 * Format template availability error for display
 */
export function formatAvailabilityError(
  template: Template,
  result: TemplateAvailabilityResult
): string {
  const executor = TEMPLATE_EXECUTORS[template];
  const source = executor?.source || 'unknown';

  let message = `Error: Template source unavailable\n\n`;
  message += `Cannot reach ${source}.\n\n`;

  if (result.error) {
    message += `${result.error}\n\n`;
  }

  if (result.remediation) {
    message += result.remediation;
  }

  return message;
}
