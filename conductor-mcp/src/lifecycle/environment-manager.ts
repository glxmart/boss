/**
 * Environment manager
 * Configures worker environments with Claude context
 */

import { ContainerUseClient } from '../orchestration/container-use-client.js';
import { WorkerConfig } from '../types.js';
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
    workerType: string
  ): Promise<void> {
    logger.info('Configuring worker environment', {
      environment_id: environmentId,
      workerType
    });

    // 1. Overwrite .claude/CLAUDE.md with worker-specific version
    await this.configureClaudeMd(environmentId, workerConfig, workerType);

    // 2. Copy worker-specific .claude folder contents
    if (workerConfig.claudeFolder) {
      await this.configureClaudeFolder(environmentId, workerConfig, workerType);
    }

    logger.info('Worker environment configured successfully', {
      environment_id: environmentId,
      workerType
    });
  }

  /**
   * Configure CLAUDE.md in the environment
   */
  private async configureClaudeMd(
    environmentId: string,
    workerConfig: WorkerConfig,
    workerType: string
  ): Promise<void> {
    logger.debug('Writing CLAUDE.md to environment', {
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

    // Write to /workdir/.claude/CLAUDE.md
    await this.containerUseClient.environmentFileWrite({
      environment_id: environmentId,
      target_file: '/workdir/.claude/CLAUDE.md',
      contents: claudeMdContent
    });
  }

  /**
   * Configure .claude folder contents
   */
  private async configureClaudeFolder(
    environmentId: string,
    workerConfig: WorkerConfig,
    workerType: string
  ): Promise<void> {
    if (!workerConfig.claudeFolder) {
      return;
    }

    logger.debug('Copying .claude folder contents to environment', {
      environment_id: environmentId,
      workerType,
      fileCount: workerConfig.claudeFolder.files.length
    });

    for (const file of workerConfig.claudeFolder.files) {
      // Transform path: .claude/commands/file.md -> /workdir/.claude/commands/file.md
      const targetPath = `/workdir/${file.path}`;

      // Expand template variables in file contents
      const contents = expandTemplate(file.contents, {
        workerName: workerType
      });

      logger.debug('Writing file to environment', {
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
}
