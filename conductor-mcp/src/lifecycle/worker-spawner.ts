/**
 * Worker spawner
 * Orchestrates the complete worker spawning workflow
 */

import { loadWorkerConfig } from '../config/worker-loader.js';
import { mapToContainerUseConfig, assembleTaskPrompt } from '../config/container-mapper.js';
import { ContainerUseClient } from '../orchestration/container-use-client.js';
import { TaskExecutor } from '../orchestration/task-executor.js';
import { EnvironmentManager } from './environment-manager.js';
import { StateTracker } from './state-tracker.js';
import {
  SpawnWorkerInput,
  SpawnWorkerOutput,
  ExecuteTaskInput,
  ExecuteTaskOutput,
  WorkerState
} from '../types.js';
import { logger } from '../utils/logger.js';
import { ConductorException } from '../utils/error-handler.js';

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

    try {
      // 1. Load worker configuration
      const workerConfig = await loadWorkerConfig(input.workerType, projectPath);

      // 2. Create Container-Use environment
      const containerConfig = mapToContainerUseConfig(workerConfig, {
        workerName: input.workerType
      });

      const env = await this.containerUseClient.createEnvironment(containerConfig);
      const environmentId = env.environment_id;
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
        input.workerType
      );

      // 4. Assemble task prompt
      const fullPrompt = assembleTaskPrompt(workerConfig.prompt, input.taskPrompt);

      // 5. Execute task with claude-code
      await this.taskExecutor.executeTask(environmentId, fullPrompt);

      // 6. Update worker state to running
      this.stateTracker.updateWorkerStatus(environmentId, {
        status: 'running',
        lastTaskExecutedAt: new Date().toISOString()
      });

      logger.info('Worker spawned successfully', {
        workerId: environmentId,
        workerType: input.workerType,
        branch
      });

      // 7. Return worker details
      return {
        success: true,
        workerId: environmentId,
        workerType: input.workerType,
        branch,
        status: 'running',
        message: `${input.workerType} worker spawned successfully`,
        executionDetails: {
          environmentId,
          containerConfigApplied: true,
          claudeConfigured: true,
          taskStartedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to spawn worker', {
        workerType: input.workerType,
        error: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof ConductorException) {
        return {
          success: false,
          workerId: '',
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
   * Execute additional task in existing worker
   */
  async executeTask(input: ExecuteTaskInput): Promise<ExecuteTaskOutput> {
    logger.info('Executing task in worker', {
      workerId: input.workerId
    });

    try {
      // Get worker state
      const worker = this.stateTracker.getWorkerOrThrow(input.workerId);

      // Execute task
      await this.taskExecutor.executeTask(input.workerId, input.taskPrompt);

      // Update worker state
      this.stateTracker.updateWorkerStatus(input.workerId, {
        lastTaskExecutedAt: new Date().toISOString()
      });

      // Get execution log and artifacts (if available)
      const executionLog = await this.taskExecutor.getExecutionLog(input.workerId);
      const artifacts = await this.taskExecutor.getArtifacts(input.workerId);

      return {
        success: true,
        workerId: input.workerId,
        status: worker.status,
        executionLog,
        artifacts
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
