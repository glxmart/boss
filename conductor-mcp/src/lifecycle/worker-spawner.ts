/**
 * Worker spawner
 * Orchestrates the complete worker spawning workflow
 */

import { loadWorkerConfig } from '../config/worker-loader.js';
import { mapToContainerUseConfig } from '../config/container-mapper.js';
import { ContainerUseClient } from '../orchestration/container-use-client.js';
import { TaskExecutor } from '../orchestration/task-executor.js';
import { EnvironmentManager } from './environment-manager.js';
import { StateTracker } from './state-tracker.js';
import {
  SpawnWorkerInput,
  SpawnWorkerOutput,
  ExecuteTaskInput,
  ExecuteTaskOutput,
  WorkerState,
  WorkerManifest,
  WorkerResult,
  WorkerType
} from '../types.js';
import { logger } from '../utils/logger.js';
import { ConductorException } from '../utils/error-handler.js';

/**
 * Create a WorkerManifest from a WorkerResult
 */
function createManifestFromResult(
  workerId: string,
  workerType: WorkerType,
  result: WorkerResult,
  startedAt: string,
  existingManifest?: WorkerManifest | null
): WorkerManifest {
  const now = new Date().toISOString();
  const isComplete = result.workComplete;

  return {
    workerId,
    workerType,
    status: isComplete ? 'completed' : 'running',
    startedAt: existingManifest?.startedAt || startedAt,
    lastUpdatedAt: now,
    completedAt: isComplete ? now : undefined,
    artifacts: existingManifest
      ? [...existingManifest.artifacts, ...result.artifacts]
      : result.artifacts,
    decisions: existingManifest
      ? [...existingManifest.decisions, ...result.decisions]
      : result.decisions,
    issues: existingManifest
      ? [...existingManifest.issues, ...result.issues]
      : result.issues,
    recommendations: result.recommendations,
    tasksCompleted: existingManifest
      ? [...existingManifest.tasksCompleted, ...result.tasksCompleted]
      : result.tasksCompleted,
    principlesEstablished: result.principlesEstablished || existingManifest?.principlesEstablished,
    requirementsGathered: result.requirementsGathered || existingManifest?.requirementsGathered,
    testsCreated: result.testsCreated || existingManifest?.testsCreated,
    coverageAchieved: result.coverageAchieved || existingManifest?.coverageAchieved
  };
}

export class WorkerSpawner {
  private containerUseClient: ContainerUseClient;
  private taskExecutor: TaskExecutor;
  private environmentManager: EnvironmentManager;
  private stateTracker: StateTracker;

  constructor(
    containerUseClient: ContainerUseClient,
    stateTracker: StateTracker
  ) {
    this.containerUseClient = containerUseClient;
    this.taskExecutor = new TaskExecutor(containerUseClient);
    this.environmentManager = new EnvironmentManager(containerUseClient);
    this.stateTracker = stateTracker;
  }

  /**
   * Spawn a worker with full environment setup and configuration
   */
  async spawnWorker(input: SpawnWorkerInput): Promise<SpawnWorkerOutput> {
    const projectPath = input.projectPath || process.cwd();
    const targetBranch = input.targetBranch || 'feature/boss-initial-setup';

    logger.info('Spawning worker', {
      workerType: input.workerType,
      projectPath
    });

    let environmentId: string | undefined;

    try {
      // 1. Load worker configuration
      const workerConfig = await loadWorkerConfig(input.workerType, projectPath);

      // 2. Create Container-Use environment
      const title = `${input.workerType}: ${input.taskPrompt.substring(0, 50)}...`;
      const containerConfig = mapToContainerUseConfig(
        workerConfig,
        { workerName: input.workerType },
        projectPath, // environment_source
        title // environment title
      );

      const env = await this.containerUseClient.createEnvironment(containerConfig);
      environmentId = env.environment_id;
      const branch = `container-use/${environmentId}`;

      // Register worker in state tracker (status: spawning)
      const workerState: WorkerState = {
        workerId: environmentId,
        workerType: input.workerType,
        branch,
        targetBranch,
        status: 'spawning',
        startedAt: new Date().toISOString(),
        artifacts: []
      };
      this.stateTracker.registerWorker(workerState);

      // 3. Configure container environment
      await this.environmentManager.configureWorkerEnvironment(
        environmentId,
        workerConfig,
        input.workerType,
        projectPath
      );

      // 4. Execute task with claude-code using JSON Schema validation
      // Worker context (role, responsibilities, methodology) is in CLAUDE.md
      // Path: /workdir/.boss/workers/${workerType}/.claude/CLAUDE.md (written by EnvironmentManager)
      // This isolated location prevents merge conflicts when parallel workers run
      const workerResult = await this.taskExecutor.executeTaskWithSchema(environmentId, input.taskPrompt, projectPath);

      // 5. Create manifest from worker's structured output
      const manifest = createManifestFromResult(
        environmentId,
        input.workerType,
        workerResult,
        workerState.startedAt
      );

      // Write manifest to worker's environment
      await this.taskExecutor.updateWorkerManifest(environmentId, manifest, projectPath);

      // 7. Update worker state in tracker
      this.stateTracker.updateWorkerStatus(environmentId, {
        status: manifest.status,
        lastTaskExecutedAt: new Date().toISOString(),
        artifacts: workerResult.artifacts.map(a => a.path)
      });

      logger.info('Worker spawned successfully', {
        workerId: environmentId,
        workerType: input.workerType,
        branch,
        status: manifest.status
      });

      // 8. Return worker details
      return {
        success: true,
        workerId: environmentId,
        workerType: input.workerType,
        branch,
        status: manifest.status,
        message: `${input.workerType} worker spawned successfully`,
        executionDetails: {
          environmentId,
          containerConfigApplied: true,
          claudeConfigured: true,
          taskStartedAt: workerState.startedAt
        }
      };
    } catch (error) {
      logger.error('Failed to spawn worker', {
        workerType: input.workerType,
        environmentId,
        error: error instanceof Error ? error.message : String(error)
      });

      // CRITICAL: Cleanup orphaned container if it was created
      if (environmentId) {
        logger.warn('Cleaning up orphaned container after spawn failure', {
          environmentId,
          workerType: input.workerType
        });

        try {
          // Delete the environment to prevent container leak
          await this.containerUseClient.deleteEnvironment(environmentId);
          logger.info('Orphaned container cleaned up successfully', { environmentId });
        } catch (cleanupError) {
          // Log cleanup failure but don't throw - original error is more important
          logger.error('Failed to cleanup orphaned container', {
            environmentId,
            cleanupError: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
          });
        }

        // Update state tracker to mark worker as failed
        this.stateTracker.updateWorkerStatus(environmentId, {
          status: 'failed',
          lastTaskExecutedAt: new Date().toISOString()
        });
      }

      if (error instanceof ConductorException) {
        return {
          success: false,
          workerId: environmentId || '',
          workerType: input.workerType,
          branch: '',
          status: 'failed',
          message: 'Failed to spawn worker',
          error: error.error
        };
      }

      throw error;
    }
  }

  /**
   * Execute additional task in existing worker (NEW APPROACH with schema)
   */
  async executeTask(input: ExecuteTaskInput): Promise<ExecuteTaskOutput> {
    logger.info('Executing task in worker', {
      workerId: input.workerId
    });

    try {
      // Get worker state
      const worker = this.stateTracker.getWorkerOrThrow(input.workerId);

      // Get projectPath from worker state or use current working directory
      const projectPath = process.cwd();

      // Get existing manifest (if any)
      const existingManifest = await this.taskExecutor.getWorkerManifest(input.workerId, projectPath);

      // Execute task with schema validation (continue existing session)
      const workerResult = await this.taskExecutor.executeTaskWithSchema(
        input.workerId,
        input.taskPrompt,
        projectPath,
        true
      );

      // Create updated manifest (merges with existing)
      const updatedManifest = createManifestFromResult(
        input.workerId,
        worker.workerType,
        workerResult,
        worker.startedAt,
        existingManifest
      );

      // Write updated manifest
      await this.taskExecutor.updateWorkerManifest(input.workerId, updatedManifest, projectPath);

      // Update worker state in tracker
      this.stateTracker.updateWorkerStatus(input.workerId, {
        status: updatedManifest.status,
        lastTaskExecutedAt: new Date().toISOString(),
        artifacts: updatedManifest.artifacts.map(a => a.path)
      });

      return {
        success: true,
        workerId: input.workerId,
        status: updatedManifest.status,
        executionLog: `Task executed at ${new Date().toISOString()}`,
        artifacts: updatedManifest.artifacts.map(a => a.path)
      };
    } catch (error) {
      logger.error('Failed to execute task', {
        workerId: input.workerId,
        error: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof ConductorException) {
        return {
          success: false,
          workerId: input.workerId,
          status: 'failed',
          error: error.error
        };
      }

      throw error;
    }
  }
}
