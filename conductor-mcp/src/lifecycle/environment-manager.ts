/**
 * Environment manager
 * Configures worker environments with Claude context
 */

import { ContainerUseClient } from '../orchestration/container-use-client.js';
import { WorkerConfig, WorkerManifest, WorkerType } from '../types.js';
import { expandTemplate } from '../config/container-mapper.js';
import { logger } from '../utils/logger.js';

export class EnvironmentManager {
  constructor(private containerUseClient: ContainerUseClient) {}

  /**
   * Configure worker environment with Claude-specific files
   */
  async configureWorkerEnvironment(
    environmentId: string,
    workerConfig: WorkerConfig,
    workerType: WorkerType
  ): Promise<void> {
    logger.info('Configuring worker environment', {
      environment_id: environmentId,
      workerType
    });

    // 1. Write CLAUDE.md with worker-specific context
    await this.configureClaudeMd(environmentId, workerConfig, workerType);

    // 2. Copy worker-specific .claude folder contents
    if (workerConfig.claudeFolder) {
      await this.configureClaudeFolder(environmentId, workerConfig, workerType);
    }

    // 3. Write worker manifest template
    await this.writeWorkerManifestTemplate(environmentId, workerType);

    logger.info('Worker environment configured successfully', {
      environment_id: environmentId,
      workerType
    });
  }

  /**
   * Configure CLAUDE.md in the environment
   *
   * CRITICAL: Write to worker-specific directory to avoid merge conflicts
   *
   * - /workdir/CLAUDE.md = BOSS's orchestration context (unchanged)
   * - /workdir/.claude/ = BOSS's configuration (unchanged)
   * - /workdir/.boss/workers/${workerType}/.claude/ = Worker's configuration (isolated)
   *
   * Workers use CLAUDE_CONFIG_DIR=/workdir/.boss/workers/${workerType}/.claude
   * (configured in container-config.json environment_variables) to read from
   * isolated location that won't conflict on merge.
   */
  private async configureClaudeMd(
    environmentId: string,
    workerConfig: WorkerConfig,
    workerType: WorkerType
  ): Promise<void> {
    logger.debug('Writing worker CLAUDE.md to isolated context', {
      environment_id: environmentId,
      workerType
    });

    // Expand template variables in CLAUDE.md
    const claudeMdContent = expandTemplate(workerConfig.claudeMd, {
      workerName: workerType,
      workerRoleDescription: workerConfig.roleDescription,
      phase: workerConfig.phase,
      artifactRequirements: workerConfig.artifactRequirements
    });

    // Write to /workdir/.boss/workers/${workerType}/.claude/CLAUDE.md
    // (CLAUDE_CONFIG_DIR will point here, won't conflict on merge)
    await this.containerUseClient.environmentFileWrite({
      environment_id: environmentId,
      target_file: `/workdir/.boss/workers/${workerType}/.claude/CLAUDE.md`,
      contents: claudeMdContent
    });
  }

  /**
   * Configure .claude folder contents
   *
   * Writes to /workdir/.boss/workers/${workerType}/.claude/ instead of /workdir/.claude/
   * to avoid conflicts with BOSS's configuration on merge.
   */
  private async configureClaudeFolder(
    environmentId: string,
    workerConfig: WorkerConfig,
    workerType: WorkerType
  ): Promise<void> {
    if (!workerConfig.claudeFolder) {
      return;
    }

    logger.debug('Copying worker .claude folder contents to isolated context', {
      environment_id: environmentId,
      workerType,
      fileCount: workerConfig.claudeFolder.files.length
    });

    for (const file of workerConfig.claudeFolder.files) {
      // Transform path: .claude/commands/file.md -> /workdir/.boss/workers/${workerType}/.claude/commands/file.md
      // (CLAUDE_CONFIG_DIR will point to /workdir/.boss/workers/${workerType}/.claude)
      const targetPath = `/workdir/.boss/workers/${workerType}/${file.path}`;

      // Expand template variables in file contents
      const contents = expandTemplate(file.contents, {
        workerName: workerType
      });

      logger.debug('Writing file to worker context', {
        environment_id: environmentId,
        target_file: targetPath
      });

      await this.containerUseClient.environmentFileWrite({
        environment_id: environmentId,
        target_file: targetPath,
        contents
      });
    }
  }

  /**
   * Write worker manifest template
   *
   * Creates initial .boss/worker-manifest-{workerId}.json for structured BOSS-Worker communication.
   * This initial manifest is created with default values (status: 'running', empty arrays).
   * After task execution, TaskExecutor.executeTaskWithSchema() receives the worker's structured
   * JSON output and updates this manifest with actual artifacts, decisions, and issues.
   *
   * CRITICAL: Per-worker manifest files prevent merge conflicts when running parallel workers.
   * Each worker gets its own manifest file: .boss/worker-manifest-env-abc123.json
   */
  private async writeWorkerManifestTemplate(
    environmentId: string,
    workerType: WorkerType
  ): Promise<void> {
    logger.debug('Writing worker manifest template', {
      environment_id: environmentId,
      workerType
    });

    const now = new Date().toISOString();
    const manifest: WorkerManifest = {
      workerId: environmentId,
      workerType,
      status: 'running',
      startedAt: now,
      lastUpdatedAt: now,
      artifacts: [],
      decisions: [],
      issues: [],
      recommendations: [],
      tasksCompleted: []
    };

    // Per-worker manifest file to prevent conflicts in parallel execution
    const manifestPath = `/workdir/.boss/worker-manifest-${environmentId}.json`;

    await this.containerUseClient.environmentFileWrite({
      environment_id: environmentId,
      target_file: manifestPath,
      contents: JSON.stringify(manifest, null, 2)
    });

    logger.debug('Worker manifest template written', {
      environment_id: environmentId,
      manifestPath
    });
  }
}
