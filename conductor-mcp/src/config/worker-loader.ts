/**
 * Worker configuration loader
 *
 * Loading priority:
 * 1. Project override: .boss/workers/[workerType]/ (if exists)
 * 2. Conductor built-in: conductor-mcp/worker-configs/[workerType]/
 *
 * This allows projects to customize worker configs while providing
 * sensible defaults from the Conductor package.
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WorkerConfig, WorkerType, ErrorCategory } from '../types.js';
import { throwConductorError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';
import { validateWorkerMetadata } from '../validation/schema-validator.js';

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conductor package's built-in worker configs and templates
const CONDUCTOR_WORKER_CONFIGS = join(__dirname, '..', '..', 'worker-configs');
const CONDUCTOR_TEMPLATES = join(__dirname, '..', '..', 'templates');

/**
 * Deep merge two objects. Worker config overrides base config.
 * - Objects are merged recursively
 * - Arrays are replaced (not concatenated)
 * - Primitives are overridden
 */
function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result: any = { ...base };

  for (const key in override) {
    if (override.hasOwnProperty(key)) {
      const overrideValue = override[key];
      const baseValue = base[key];

      if (overrideValue === undefined) {
        // Skip undefined values
        continue;
      }

      if (Array.isArray(overrideValue)) {
        // Arrays: replace completely (don't concat)
        result[key] = overrideValue;
      } else if (
        typeof overrideValue === 'object' &&
        overrideValue !== null &&
        !Array.isArray(overrideValue) &&
        typeof baseValue === 'object' &&
        baseValue !== null &&
        !Array.isArray(baseValue)
      ) {
        // Objects: merge recursively
        result[key] = deepMerge(baseValue, overrideValue);
      } else {
        // Primitives: override
        result[key] = overrideValue;
      }
    }
  }

  return result;
}

export async function loadWorkerConfig(
  workerType: WorkerType,
  projectPath: string = process.cwd()
): Promise<WorkerConfig> {
  // Try project override first
  const projectWorkerDir = join(projectPath, '.boss', 'workers', workerType);

  let workerDir: string;
  let source: 'project' | 'conductor';

  try {
    await stat(projectWorkerDir);
    workerDir = projectWorkerDir;
    source = 'project';
    logger.debug('Loading worker config from project override', { workerType, workerDir });
  } catch (err) {
    // Log non-ENOENT errors (permission denied, corruption, I/O errors, etc.)
    if (err && typeof err === 'object' && 'code' in err && err.code !== 'ENOENT') {
      logger.warn('Error accessing project worker config, falling back to conductor package', {
        workerType,
        projectWorkerDir,
        error: err instanceof Error ? err.message : String(err),
        code: 'code' in err ? err.code : undefined,
      });
    }

    // Fall back to conductor built-in configs
    workerDir = join(CONDUCTOR_WORKER_CONFIGS, workerType);
    source = 'conductor';
    logger.debug('Loading worker config from conductor package', { workerType, workerDir });

    // Check if conductor config exists
    try {
      await stat(workerDir);
    } catch (err) {
      // Log non-ENOENT errors before throwing
      if (err && typeof err === 'object' && 'code' in err && err.code !== 'ENOENT') {
        logger.error('Error accessing conductor worker config', {
          workerType,
          workerDir,
          error: err instanceof Error ? err.message : String(err),
          code: 'code' in err ? err.code : undefined,
        });
      }

      throwConductorError(
        ErrorCategory.WORKER_CONFIG_NOT_FOUND,
        `Worker type "${workerType}" not found in conductor package (${CONDUCTOR_WORKER_CONFIGS}) or project (${projectWorkerDir})`,
        { workerType }
      );
    }
  }

  logger.info('Loading worker configuration', { workerType, source, workerDir });

  // Load metadata.json (always from conductor, never from project)
  // Projects only contain CLAUDE.md and .claude/ folder, not metadata.json
  const conductorMetadataPath = join(CONDUCTOR_WORKER_CONFIGS, workerType, 'metadata.json');
  let metadata: any;
  try {
    const metadataContent = await readFile(conductorMetadataPath, 'utf-8');
    metadata = JSON.parse(metadataContent);

    // Validate metadata against master schema
    await validateWorkerMetadata(metadata);
    logger.debug('Worker metadata loaded and validated', { workerType });
  } catch (error: any) {
    // File not found
    if (error.code === 'ENOENT') {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `metadata.json not found for worker "${workerType}" at ${conductorMetadataPath}. All workers must have metadata.json in conductor package.`,
        { workerType, details: { path: conductorMetadataPath } }
      );
    }

    // Permission denied
    if (error.code === 'EACCES') {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Permission denied reading metadata.json for worker "${workerType}" at ${conductorMetadataPath}. Check file permissions.`,
        { workerType, details: { path: conductorMetadataPath, error: error.message } }
      );
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `metadata.json for worker "${workerType}" contains invalid JSON at ${conductorMetadataPath}. Fix the JSON syntax.`,
        { workerType, details: { path: conductorMetadataPath, parseError: error.message } }
      );
    }

    // Validation error from validateWorkerMetadata (already a ConductorException - rethrow as-is)
    // or other unexpected errors - log and rethrow
    logger.debug('Rethrowing error from worker metadata loading', {
      workerType,
      path: conductorMetadataPath,
      errorType: error.constructor.name,
      message: error.message,
    });
    throw error;
  }

  // Load container configuration with inheritance:
  // 1. Load base config from _base/container-config.json (required)
  // 2. Load worker-specific config (optional)
  // 3. Deep merge: worker overrides base

  // Load base container config (required for all workers)
  const baseContainerConfigPath = join(CONDUCTOR_WORKER_CONFIGS, '_base', 'container-config.json');
  let baseContainerConfig: any;
  try {
    const baseConfigContent = await readFile(baseContainerConfigPath, 'utf-8');
    baseContainerConfig = JSON.parse(baseConfigContent);
    logger.debug('Loaded base container config', { path: baseContainerConfigPath });
  } catch (error: any) {
    // File not found
    if (error.code === 'ENOENT') {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Base container-config.json not found at ${baseContainerConfigPath}. This file is required for all workers.`,
        { details: { path: baseContainerConfigPath } }
      );
    }

    // Permission denied
    if (error.code === 'EACCES') {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Permission denied reading base container-config.json at ${baseContainerConfigPath}`,
        { details: { path: baseContainerConfigPath, error: error.message } }
      );
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Base container-config.json contains invalid JSON at ${baseContainerConfigPath}`,
        { details: { path: baseContainerConfigPath, parseError: error.message } }
      );
    }

    // Other errors
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      `Failed to load base container-config.json: ${error.message}`,
      { details: { path: baseContainerConfigPath, error: error.message } }
    );
  }

  // Load worker-specific container config (optional)
  const conductorContainerConfigPath = join(
    CONDUCTOR_WORKER_CONFIGS,
    workerType,
    'container-config.json'
  );
  let workerContainerConfig: any = {};
  let hasWorkerOverride = false;

  try {
    const workerConfigContent = await readFile(conductorContainerConfigPath, 'utf-8');
    workerContainerConfig = JSON.parse(workerConfigContent);
    hasWorkerOverride = true;
    logger.debug('Loaded worker-specific container config override', {
      workerType,
      path: conductorContainerConfigPath,
    });
  } catch (error: any) {
    // Worker-specific config is optional - ENOENT is expected for most workers
    if (error.code === 'ENOENT') {
      logger.debug('No worker-specific container config, using base only', {
        workerType,
        path: conductorContainerConfigPath,
      });
    } else if (error.code === 'EACCES') {
      // Permission denied is a real error
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Permission denied reading worker container-config.json for "${workerType}" at ${conductorContainerConfigPath}`,
        { workerType, details: { path: conductorContainerConfigPath, error: error.message } }
      );
    } else if (error instanceof SyntaxError) {
      // JSON parse error is a real error
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Worker container-config.json for "${workerType}" contains invalid JSON at ${conductorContainerConfigPath}`,
        { workerType, details: { path: conductorContainerConfigPath, parseError: error.message } }
      );
    } else {
      // Other errors are real errors
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Failed to load worker container-config.json for "${workerType}": ${error.message}`,
        { workerType, details: { path: conductorContainerConfigPath, error: error.message } }
      );
    }
  }

  // Deep merge: worker-specific config overrides base config
  // Using lodash merge for deep object merging
  const containerConfig = hasWorkerOverride
    ? deepMerge(baseContainerConfig, workerContainerConfig)
    : baseContainerConfig;

  logger.info('Container config assembled', {
    workerType,
    hasWorkerOverride,
    baseImage: containerConfig.base_image,
  });

  // Check for deprecated prompt.md and warn
  const promptMdPath = join(workerDir, 'prompt.md');
  try {
    await stat(promptMdPath);
    logger.warn('Deprecated: prompt.md found - migrate to metadata.json', {
      workerType,
      path: promptMdPath,
      message: 'prompt.md is deprecated. Worker configuration should be defined in metadata.json',
    });
  } catch {
    // Expected - prompt.md doesn't exist (this is the desired state)
  }

  // Load CLAUDE.md from shared template (all workers use same template)
  const sharedClaudeMdPath = join(CONDUCTOR_TEMPLATES, 'CLAUDE.md');
  let claudeMd: string;
  try {
    claudeMd = await readFile(sharedClaudeMdPath, 'utf-8');
    logger.debug('Loaded shared CLAUDE.md template', { path: sharedClaudeMdPath });
  } catch (sharedError: any) {
    logger.debug('Shared CLAUDE.md not found, attempting worker-specific fallback', {
      sharedPath: sharedClaudeMdPath,
      error: sharedError.message,
    });

    // Fallback to worker-specific CLAUDE.md if it exists (for backward compatibility)
    const workerClaudeMdPath = join(workerDir, 'CLAUDE.md');
    try {
      claudeMd = await readFile(workerClaudeMdPath, 'utf-8');
      logger.debug('Loaded worker-specific CLAUDE.md', { workerType, path: workerClaudeMdPath });
    } catch (workerError: any) {
      logger.error('Failed to load both shared and worker-specific CLAUDE.md', {
        workerType,
        sharedPath: sharedClaudeMdPath,
        workerPath: workerClaudeMdPath,
        sharedError: sharedError.message,
        workerError: workerError.message,
      });
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Failed to load CLAUDE.md template (checked shared at ${sharedClaudeMdPath} and worker-specific at ${workerClaudeMdPath})`,
        {
          workerType,
          details: {
            sharedError: sharedError.message,
            workerError: workerError.message,
          },
        }
      );
    }
  }

  // Use metadata.json for role description, phase, and artifact requirements
  const roleDescription = metadata.description;
  const phase = formatPhase(metadata.phase);
  const artifactRequirements = formatArtifactRequirements(metadata.outputs);

  // Load .claude folder if exists
  const claudeFolder = await loadClaudeFolder(workerDir);

  const config: WorkerConfig = {
    workerType,
    base_image: containerConfig.base_image,
    setup_commands: containerConfig.setup_commands || [],
    install_commands: containerConfig.install_commands || [],
    environment_variables: containerConfig.environment_variables || {},
    secrets: containerConfig.secrets || [],
    network: containerConfig.network || { allowed_hosts: [] },
    claudeMd,
    roleDescription,
    phase,
    artifactRequirements,
    claudeFolder,
    metadata,
  };

  logger.info('Worker configuration loaded successfully', { workerType });

  return config;
}

function formatPhase(phase: unknown): string {
  if (typeof phase === 'number') {
    return `Phase ${phase}`;
  }
  if (typeof phase === 'string') {
    return phase;
  }
  if (Array.isArray(phase)) {
    return `Phase ${phase.join(', ')}`;
  }
  return 'Unknown Phase';
}

interface OutputItem {
  path: string;
  type: string;
  description: string;
}

interface OutputsConfig {
  required?: OutputItem[];
  optional?: OutputItem[];
}

function formatOutputItem(output: OutputItem): string {
  return `- **${output.path}** (${output.type}): ${output.description}`;
}

function formatArtifactRequirements(outputs: OutputsConfig | null | undefined): string {
  if (!outputs?.required) {
    return '';
  }

  const lines = ['## Artifacts\n', '### Required Outputs:\n'];
  lines.push(...outputs.required.map(formatOutputItem));

  if (outputs.optional && outputs.optional.length > 0) {
    lines.push('\n### Optional Outputs:\n');
    lines.push(...outputs.optional.map(formatOutputItem));
  }

  return lines.join('\n');
}

const IGNORED_FILES = new Set(['.gitkeep', '.DS_Store']);

function isValidCommandFile(entry: { isFile(): boolean; name: string }): boolean {
  return entry.isFile() && !IGNORED_FILES.has(entry.name) && entry.name.endsWith('.md');
}

function isValidClaudeFile(entry: { isFile(): boolean; name: string }): boolean {
  return entry.isFile() && !IGNORED_FILES.has(entry.name);
}

async function loadSharedCommands(): Promise<Array<{ path: string; contents: string }>> {
  const sharedCommandsPath = join(CONDUCTOR_TEMPLATES, 'commands');
  const files: Array<{ path: string; contents: string }> = [];

  try {
    const entries = await readdir(sharedCommandsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (isValidCommandFile(entry)) {
        const filePath = join(sharedCommandsPath, entry.name);
        const contents = await readFile(filePath, 'utf-8');
        const relativePath = join('.claude', 'commands', entry.name);
        files.push({ path: relativePath, contents });
      }
    }

    logger.debug('Loaded shared Spec-Kit commands', { count: files.length });
  } catch {
    logger.warn('No shared commands found', { path: sharedCommandsPath });
  }

  return files;
}

// NOTE: Workers are already isolated agents running in containers
// No 'agents' subfolder needed - the worker itself IS the agent
const CLAUDE_SUBFOLDERS = ['commands', 'skills'] as const;

type ClaudeFile = { path: string; contents: string };

async function loadClaudeFolder(workerDir: string): Promise<WorkerConfig['claudeFolder']> {
  const claudeFolderPath = join(workerDir, '.claude');

  // Start with shared commands (all workers get these)
  const fileMap = new Map<string, string>();
  const sharedCommands = await loadSharedCommands();
  for (const file of sharedCommands) {
    fileMap.set(file.path, file.contents);
  }

  // Load worker-specific .claude files (override shared files with same name)
  try {
    await stat(claudeFolderPath);

    for (const subfolder of CLAUDE_SUBFOLDERS) {
      const subfolderPath = join(claudeFolderPath, subfolder);

      try {
        const entries = await readdir(subfolderPath, { withFileTypes: true });

        for (const entry of entries) {
          if (isValidClaudeFile(entry)) {
            const filePath = join(subfolderPath, entry.name);
            const contents = await readFile(filePath, 'utf-8');
            const relativePath = join('.claude', subfolder, entry.name);

            if (fileMap.has(relativePath)) {
              logger.debug('Worker-specific file overrides shared', { path: relativePath });
            }
            fileMap.set(relativePath, contents);
          }
        }
      } catch {
        // Subfolder doesn't exist, continue
      }
    }
  } catch {
    // .claude folder doesn't exist, that's okay - we still have shared commands
  }

  if (fileMap.size === 0) {
    return undefined;
  }

  const files: ClaudeFile[] = Array.from(fileMap.entries()).map(([path, contents]) => ({
    path,
    contents,
  }));
  return { files };
}

export async function listAvailableWorkers(
  projectPath: string = process.cwd()
): Promise<WorkerType[]> {
  const workers = new Set<WorkerType>();

  // First, load from conductor built-in configs
  try {
    const conductorEntries = await readdir(CONDUCTOR_WORKER_CONFIGS, { withFileTypes: true });
    conductorEntries
      .filter((entry) => entry.isDirectory() && entry.name !== '_base') // Exclude _base directory
      .forEach((entry) => workers.add(entry.name as WorkerType));
  } catch {
    logger.warn('Failed to load conductor built-in worker configs', {
      path: CONDUCTOR_WORKER_CONFIGS,
    });
  }

  // Then, check for project overrides (will replace if same name exists)
  const projectWorkersDir = join(projectPath, '.boss', 'workers');
  try {
    const projectEntries = await readdir(projectWorkersDir, { withFileTypes: true });
    projectEntries
      .filter((entry) => entry.isDirectory())
      .forEach((entry) => workers.add(entry.name as WorkerType));
  } catch {
    // Project overrides are optional
  }

  return Array.from(workers);
}
