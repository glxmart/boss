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
        code: 'code' in err ? err.code : undefined
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
          code: 'code' in err ? err.code : undefined
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
      message: error.message
    });
    throw error;
  }

  // Load container-config.json (always from conductor, never from project)
  // Projects only contain CLAUDE.md and .claude/ folder, not container-config.json
  const conductorContainerConfigPath = join(CONDUCTOR_WORKER_CONFIGS, workerType, 'container-config.json');
  let containerConfig: any;
  try {
    const containerConfigContent = await readFile(conductorContainerConfigPath, 'utf-8');
    containerConfig = JSON.parse(containerConfigContent);
  } catch (error: any) {
    // File not found
    if (error.code === 'ENOENT') {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `container-config.json not found for worker "${workerType}" at ${conductorContainerConfigPath}. All workers must have container-config.json in conductor package.`,
        { workerType, details: { path: conductorContainerConfigPath } }
      );
    }

    // Permission denied
    if (error.code === 'EACCES') {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Permission denied reading container-config.json for worker "${workerType}" at ${conductorContainerConfigPath}`,
        { workerType, details: { path: conductorContainerConfigPath, error: error.message } }
      );
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `container-config.json for worker "${workerType}" contains invalid JSON at ${conductorContainerConfigPath}`,
        { workerType, details: { path: conductorContainerConfigPath, parseError: error.message } }
      );
    }

    // Other errors
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      `Failed to load container-config.json for worker "${workerType}": ${error.message}`,
      { workerType, details: { path: conductorContainerConfigPath, error: error.message } }
    );
  }

  // Check for deprecated prompt.md and warn
  const promptMdPath = join(workerDir, 'prompt.md');
  try {
    await stat(promptMdPath);
    logger.warn('Deprecated: prompt.md found - migrate to metadata.json', {
      workerType,
      path: promptMdPath,
      message: 'prompt.md is deprecated. Worker configuration should be defined in metadata.json'
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
      error: sharedError.message
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
        workerError: workerError.message
      });
      throwConductorError(
        ErrorCategory.WORKER_CONFIG_INVALID,
        `Failed to load CLAUDE.md template (checked shared at ${sharedClaudeMdPath} and worker-specific at ${workerClaudeMdPath})`,
        {
          workerType,
          details: {
            sharedError: sharedError.message,
            workerError: workerError.message
          }
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
    metadata
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

  const files: ClaudeFile[] = Array.from(fileMap.entries()).map(
    ([path, contents]) => ({ path, contents })
  );
  return { files };
}

export async function listAvailableWorkers(projectPath: string = process.cwd()): Promise<WorkerType[]> {
  const workers = new Set<WorkerType>();

  // First, load from conductor built-in configs
  try {
    const conductorEntries = await readdir(CONDUCTOR_WORKER_CONFIGS, { withFileTypes: true });
    conductorEntries
      .filter(entry => entry.isDirectory())
      .forEach(entry => workers.add(entry.name as WorkerType));
  } catch {
    logger.warn('Failed to load conductor built-in worker configs', {
      path: CONDUCTOR_WORKER_CONFIGS
    });
  }

  // Then, check for project overrides (will replace if same name exists)
  const projectWorkersDir = join(projectPath, '.boss', 'workers');
  try {
    const projectEntries = await readdir(projectWorkersDir, { withFileTypes: true });
    projectEntries
      .filter(entry => entry.isDirectory())
      .forEach(entry => workers.add(entry.name as WorkerType));
  } catch {
    // Project overrides are optional
  }

  return Array.from(workers);
}
