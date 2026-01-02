/**
 * Task executor
 * Executes tasks in worker environments
 */

import { ContainerUseClient } from './container-use-client.js';
import { escapePromptForShell } from '../config/container-mapper.js';
import { WorkerManifest, WorkerResult, ErrorCategory } from '../types.js';
import { logger } from '../utils/logger.js';
import { throwConductorError } from '../utils/error-handler.js';

/**
 * JSON Schema for validated worker output.
 * Used with claude-code --output-format json --json-schema
 */
const WORKER_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    artifacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          action: { enum: ['created', 'modified', 'deleted'] },
          purpose: { type: 'string' },
          sections: { type: 'array', items: { type: 'string' } },
          linesAdded: { type: 'number' },
          linesModified: { type: 'number' }
        },
        required: ['path', 'action', 'purpose']
      }
    },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          decision: { type: 'string' },
          rationale: { type: 'string' },
          impact: { enum: ['high', 'medium', 'low'] },
          reversible: { type: 'boolean' }
        },
        required: ['decision', 'rationale', 'impact', 'reversible']
      }
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { enum: ['critical', 'high', 'medium', 'low'] },
          description: { type: 'string' },
          recommendation: { type: 'string' }
        },
        required: ['severity', 'description', 'recommendation']
      }
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' }
    },
    tasksCompleted: {
      type: 'array',
      items: { type: 'string' }
    },
    principlesEstablished: {
      type: 'array',
      items: { type: 'string' }
    },
    requirementsGathered: {
      type: 'array',
      items: { type: 'string' }
    },
    testsCreated: { type: 'number' },
    coverageAchieved: { type: 'number' },
    workComplete: { type: 'boolean' },
    nextSteps: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['artifacts', 'decisions', 'issues', 'recommendations', 'tasksCompleted', 'workComplete']
} as const;

export class TaskExecutor {
  constructor(private containerUseClient: ContainerUseClient) {}

  /**
   * Execute a task in a worker environment (LEGACY - non-schema approach)
   *
   * DEPRECATED: Use executeTaskWithSchema() instead for validated structured output.
   * This method executes claude-code without JSON schema validation and does not
   * return parsed results. Kept for backward compatibility.
   *
   * @param environmentId - Worker environment ID
   * @param taskPrompt - Task instructions
   * @param projectPath - Absolute path to git repository
   * @param continueSession - Whether to continue previous session
   */
  async executeTask(environmentId: string, taskPrompt: string, projectPath: string, continueSession: boolean = false): Promise<void> {
    logger.info('Executing task in environment', {
      environment_id: environmentId,
      promptLength: taskPrompt.length,
      continueSession
    });

    // Escape the prompt for shell execution
    const escapedPrompt = escapePromptForShell(taskPrompt);

    // Build claude-code command with proper flags
    // --print: Exit after response (non-interactive mode)
    // --session-id: Use worker ID as session ID for persistence
    // --continue: Continue previous session (if continueSession=true)
    const flags = [
      '--print',
      '--dangerously-skip-permissions',
      `--session-id ${environmentId}`
    ];

    if (continueSession) {
      flags.push('--continue');
    }

    const command = `echo '${escapedPrompt}' | claude-code ${flags.join(' ')}`;

    logger.debug('Executing claude-code command', {
      environment_id: environmentId,
      commandLength: command.length,
      continueSession
    });

    // Execute in the container environment
    await this.containerUseClient.executeInEnvironment({
      environment_source: projectPath,
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

  /**
   * Execute a task with JSON Schema validation (SCHEMA-BASED APPROACH)
   *
   * Uses --output-format json and --json-schema to enforce structured output from workers.
   * Claude Code validates the worker's JSON output against the schema before returning it.
   * Conductor then parses this validated JSON and updates the manifest file.
   *
   * Benefits over manual JSON writing:
   * - Schema validation catches malformed JSON before Conductor receives it
   * - Workers get clear structure requirements via the schema
   * - Eliminates manual file write operations by workers
   * - Reduces risk of JSON syntax errors or missing required fields
   */
  async executeTaskWithSchema(
    environmentId: string,
    taskPrompt: string,
    projectPath: string,
    continueSession: boolean = false
  ): Promise<WorkerResult> {
    logger.info('Executing task with schema validation', {
      environment_id: environmentId,
      promptLength: taskPrompt.length,
      continueSession
    });

    const escapedPrompt = escapePromptForShell(taskPrompt);

    // Use base64 encoding to safely pass schema to shell (prevents injection if schema contains quotes)
    const schemaJson = JSON.stringify(WORKER_RESULT_SCHEMA);
    const schemaBase64 = Buffer.from(schemaJson).toString('base64');

    const flags = [
      '--print',
      '--dangerously-skip-permissions',
      `--session-id ${environmentId}`,
      '--output-format json'
    ];

    if (continueSession) {
      flags.push('--continue');
    }

    // Decode base64 schema in shell and pass to claude-code
    const command = `echo '${escapedPrompt}' | claude-code ${flags.join(' ')} --json-schema "$(echo '${schemaBase64}' | base64 -d)"`;

    logger.debug('Executing claude-code command with schema', {
      environment_id: environmentId,
      commandLength: command.length,
      continueSession
    });

    const result = await this.containerUseClient.executeInEnvironment({
      environment_source: projectPath,
      environment_id: environmentId,
      command
    });

    return this.parseWorkerResult(environmentId, result);
  }

  /**
   * Parse worker output into WorkerResult
   *
   * CRITICAL: This method throws on parse failures instead of returning fake success.
   * Empty or malformed output indicates worker failure and must be surfaced to BOSS.
   */
  private parseWorkerResult(
    environmentId: string,
    result: { stdout?: string; output?: string }
  ): WorkerResult {
    const outputText = result.stdout || result.output;

    // CRITICAL: Empty output means worker failed to produce any output
    if (!outputText || outputText.trim() === '') {
      logger.error('Worker produced no output', {
        environment_id: environmentId,
        stdout: result.stdout,
        output: result.output
      });

      throwConductorError(
        ErrorCategory.WORKER_EXECUTION_FAILED,
        `Worker ${environmentId} produced no output. The worker may have crashed or failed to execute.`,
        {
          workerId: environmentId,
          details: {
            stdout: result.stdout,
            output: result.output,
            message: 'Worker must produce JSON output when using --output-format json'
          }
        }
      );
    }

    // Parse JSON
    try {
      const workerResult: WorkerResult = JSON.parse(outputText);

      logger.info('Worker result parsed successfully', {
        environment_id: environmentId,
        artifactsCount: workerResult.artifacts?.length || 0,
        decisionsCount: workerResult.decisions?.length || 0,
        workComplete: workerResult.workComplete
      });

      return workerResult;
    } catch (error) {
      const parseError = error instanceof Error ? error.message : String(error);
      const rawOutput = outputText || '';

      logger.error('Worker output JSON parsing failed - worker execution likely failed', {
        environment_id: environmentId,
        parseError,
        rawOutputPreview: rawOutput.substring(0, 500)
      });

      throwConductorError(
        ErrorCategory.WORKER_EXECUTION_FAILED,
        `Worker ${environmentId} produced invalid JSON output. This usually indicates the worker crashed or encountered an error. Check the execution log for details.`,
        {
          workerId: environmentId,
          details: {
            parseError,
            rawOutput: rawOutput.substring(0, 1000),
            expectedSchema: 'WorkerResult'
          }
        }
      );
    }
  }

  /**
   * Get worker manifest from environment
   *
   * Reads .boss/worker-manifest-{workerId}.json for structured worker communication
   *
   * Uses per-worker manifest files to support parallel worker execution without conflicts
   *
   * Returns null if manifest doesn't exist (new worker), throws on read/parse errors
   */
  async getWorkerManifest(environmentId: string, projectPath: string): Promise<WorkerManifest | null> {
    logger.debug('Getting worker manifest', { environment_id: environmentId });

    const manifestPath = `/workdir/.boss/worker-manifest-${environmentId}.json`;

    try {
      const result = await this.containerUseClient.environmentFileRead({
        environment_source: projectPath,
        environment_id: environmentId,
        target_file: manifestPath
      });

      const manifestContent = result.contents;

      // Empty file - manifest hasn't been written yet (new worker)
      if (!manifestContent || manifestContent.trim() === '') {
        logger.debug('Worker manifest not yet created (new worker)', {
          environment_id: environmentId
        });
        return null;
      }

      // Parse JSON
      let manifest: WorkerManifest;
      try {
        manifest = JSON.parse(manifestContent);
      } catch (parseError) {
        // JSON corruption is a serious error - don't hide it
        logger.error('Worker manifest contains corrupted JSON', {
          environment_id: environmentId,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          manifestPreview: manifestContent.substring(0, 200)
        });

        throwConductorError(
          ErrorCategory.WORKER_EXECUTION_FAILED,
          `Worker ${environmentId} manifest is corrupted (invalid JSON). This indicates a serious error. Terminate and retry the worker.`,
          {
            workerId: environmentId,
            details: {
              manifestPath,
              parseError: parseError instanceof Error ? parseError.message : String(parseError)
            }
          }
        );
      }

      logger.debug('Worker manifest retrieved', {
        environment_id: environmentId,
        status: manifest.status,
        artifactCount: manifest.artifacts.length
      });

      return manifest;
    } catch (error: any) {
      // File not found - manifest doesn't exist yet (OK for new workers)
      if (error.code === 'ENOENT' || error.message?.includes('not found')) {
        logger.debug('Worker manifest file does not exist yet', {
          environment_id: environmentId
        });
        return null;
      }

      // Permission or other I/O error - serious problem
      logger.error('Failed to read worker manifest due to I/O error', {
        environment_id: environmentId,
        error: error.message,
        code: error.code
      });

      throwConductorError(
        ErrorCategory.WORKER_EXECUTION_FAILED,
        `Failed to read worker ${environmentId} manifest at ${manifestPath}: ${error.message}. Check file permissions and container state.`,
        {
          workerId: environmentId,
          details: { manifestPath, error: error.message, code: error.code }
        }
      );
    }
  }

  /**
   * Update worker manifest file
   *
   * Conductor writes the manifest based on parsed worker output
   */
  async updateWorkerManifest(
    environmentId: string,
    manifest: WorkerManifest,
    projectPath: string
  ): Promise<void> {
    logger.debug('Updating worker manifest', {
      environment_id: environmentId,
      status: manifest.status
    });

    const manifestPath = `/workdir/.boss/worker-manifest-${environmentId}.json`;

    await this.containerUseClient.environmentFileWrite({
      environment_source: projectPath,
      environment_id: environmentId,
      target_file: manifestPath,
      contents: JSON.stringify(manifest, null, 2)
    });

    logger.info('Worker manifest updated', {
      environment_id: environmentId,
      artifactsCount: manifest.artifacts.length
    });
  }
}
