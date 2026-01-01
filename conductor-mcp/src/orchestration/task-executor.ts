/**
 * Task executor
 * Executes tasks in worker environments
 */

import { ContainerUseClient } from './container-use-client.js';
import { escapePromptForShell } from '../config/container-mapper.js';
import { logger } from '../utils/logger.js';

export class TaskExecutor {
  constructor(private containerUseClient: ContainerUseClient) {}

  /**
   * Execute a task in a worker environment
   */
  async executeTask(environmentId: string, taskPrompt: string): Promise<void> {
    logger.info('Executing task in environment', {
      environment_id: environmentId,
      promptLength: taskPrompt.length
    });

    // Escape the prompt for shell execution
    const escapedPrompt = escapePromptForShell(taskPrompt);

    // Assemble the command to pipe the prompt to claude-code
    const command = `echo '${escapedPrompt}' | claude-code --dangerously-skip-permissions`;

    logger.debug('Executing claude-code command', {
      environment_id: environmentId,
      commandLength: command.length
    });

    // Execute in the container environment
    await this.containerUseClient.executeInEnvironment({
      environment_id: environmentId,
      command
    });

    logger.info('Task execution completed', { environment_id: environmentId });
  }

  /**
   * Get execution log from environment
   * This would query Container-Use for the command history/logs
   */
  async getExecutionLog(environmentId: string): Promise<string> {
    logger.debug('Getting execution log', { environment_id: environmentId });

    // TODO: Implement log retrieval from Container-Use
    // This would call something like container-use log <env-id>

    return `Execution log for ${environmentId} (not yet implemented)`;
  }

  /**
   * Get artifacts created by worker
   * This would query the environment for files created
   */
  async getArtifacts(environmentId: string): Promise<string[]> {
    logger.debug('Getting artifacts', { environment_id: environmentId });

    // TODO: Implement artifact retrieval from Container-Use
    // This would call something like container-use diff <env-id>
    // and parse the output to find created/modified files

    return [];
  }
}
