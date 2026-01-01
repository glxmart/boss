/**
 * Worker configuration loader
 * Loads worker configs from .boss/workers/[workerType]/
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { WorkerConfig, WorkerType, ErrorCategory } from '../types.js';
import { throwConductorError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';

export async function loadWorkerConfig(
  workerType: WorkerType,
  projectPath: string = process.cwd()
): Promise<WorkerConfig> {
  const workerDir = join(projectPath, '.boss', 'workers', workerType);

  logger.debug('Loading worker configuration', { workerType, workerDir });

  // Check if worker directory exists
  try {
    await stat(workerDir);
  } catch {
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_NOT_FOUND,
      `Worker type "${workerType}" not found at ${workerDir}`,
      { workerType }
    );
  }

  // Load container-config.json
  const containerConfigPath = join(workerDir, 'container-config.json');
  let containerConfig: any;
  try {
    const containerConfigContent = await readFile(containerConfigPath, 'utf-8');
    containerConfig = JSON.parse(containerConfigContent);
  } catch (error) {
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      `Failed to load container-config.json for worker "${workerType}"`,
      { workerType, details: error }
    );
  }

  // Load prompt.md
  const promptPath = join(workerDir, 'prompt.md');
  let prompt: string;
  try {
    prompt = await readFile(promptPath, 'utf-8');
  } catch (error) {
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      `Failed to load prompt.md for worker "${workerType}"`,
      { workerType, details: error }
    );
  }

  // Load CLAUDE.md
  const claudeMdPath = join(workerDir, 'CLAUDE.md');
  let claudeMd: string;
  try {
    claudeMd = await readFile(claudeMdPath, 'utf-8');
  } catch (error) {
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      `Failed to load CLAUDE.md for worker "${workerType}"`,
      { workerType, details: error }
    );
  }

  // Extract metadata from prompt
  const roleDescription = extractRoleDescription(prompt);
  const phase = extractPhase(prompt);
  const artifactRequirements = extractArtifactRequirements(prompt);

  // Load .claude folder if exists
  const claudeFolder = await loadClaudeFolder(workerDir, workerType);

  const config: WorkerConfig = {
    workerType,
    base_image: containerConfig.base_image,
    setup_commands: containerConfig.setup_commands || [],
    install_commands: containerConfig.install_commands || [],
    environment_variables: containerConfig.environment_variables || {},
    secrets: containerConfig.secrets || [],
    network: containerConfig.network || { allowed_hosts: [] },
    prompt,
    claudeMd,
    roleDescription,
    phase,
    artifactRequirements,
    claudeFolder
  };

  logger.info('Worker configuration loaded successfully', { workerType });

  return config;
}

function extractRoleDescription(prompt: string): string {
  // Extract role description from prompt (simple heuristic)
  const lines = prompt.split('\n');
  const roleLineIndex = lines.findIndex(line => line.toLowerCase().includes('role:'));
  if (roleLineIndex !== -1 && roleLineIndex + 1 < lines.length) {
    return lines[roleLineIndex + 1]?.trim() || 'Execute assigned tasks';
  }
  return 'Execute assigned tasks following BOSS methodology';
}

function extractPhase(prompt: string): string {
  // Extract phase from prompt
  const phaseMatch = prompt.match(/Phase [\d-]+:?\s*([^\n]+)/i);
  if (phaseMatch) {
    return phaseMatch[0] || '';
  }
  return 'Unknown Phase';
}

function extractArtifactRequirements(prompt: string): string {
  // Extract artifact requirements section
  const artifactsMatch = prompt.match(/##?\s*Artifacts?[\s\S]*?(?=##|$)/i);
  if (artifactsMatch) {
    return artifactsMatch[0] || '';
  }
  return '';
}

async function loadClaudeFolder(workerDir: string, _workerType: string): Promise<WorkerConfig['claudeFolder']> {
  const claudeFolderPath = join(workerDir, '.claude');

  try {
    await stat(claudeFolderPath);
  } catch {
    // .claude folder doesn't exist, return undefined
    return undefined;
  }

  const files: Array<{ path: string; contents: string }> = [];

  // Load files from commands/, skills/, agents/ subdirectories
  for (const subfolder of ['commands', 'skills', 'agents']) {
    const subfolderPath = join(claudeFolderPath, subfolder);

    try {
      const entries = await readdir(subfolderPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name !== '.gitkeep' && entry.name !== '.DS_Store') {
          const filePath = join(subfolderPath, entry.name);
          const contents = await readFile(filePath, 'utf-8');

          // Store relative path from worker directory
          const relativePath = join('.claude', subfolder, entry.name);
          files.push({ path: relativePath, contents });
        }
      }
    } catch {
      // Subfolder doesn't exist, continue
      continue;
    }
  }

  return files.length > 0 ? { files } : undefined;
}

export async function listAvailableWorkers(projectPath: string = process.cwd()): Promise<WorkerType[]> {
  const workersDir = join(projectPath, '.boss', 'workers');

  try {
    const entries = await readdir(workersDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name as WorkerType);
  } catch {
    return [];
  }
}
