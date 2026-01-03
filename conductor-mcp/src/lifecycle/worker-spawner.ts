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
  SpawnWorkersParallelInput,
  SpawnWorkersParallelOutput,
  ExecuteTaskInput,
  ExecuteTaskOutput,
  WorkerState,
  WorkerManifest,
  WorkerResult,
  WorkerType,
} from '../types.js';
import { logger } from '../utils/logger.js';
import { ConductorException } from '../utils/error-handler.js';
import { logPerformanceMetrics } from '../utils/performance-metrics.js';

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
    issues: existingManifest ? [...existingManifest.issues, ...result.issues] : result.issues,
    recommendations: result.recommendations,
    tasksCompleted: existingManifest
      ? [...existingManifest.tasksCompleted, ...result.tasksCompleted]
      : result.tasksCompleted,
    principlesEstablished: result.principlesEstablished || existingManifest?.principlesEstablished,
    requirementsGathered: result.requirementsGathered || existingManifest?.requirementsGathered,
    testsCreated: result.testsCreated || existingManifest?.testsCreated,
    coverageAchieved: result.coverageAchieved || existingManifest?.coverageAchieved,
  };
}

export class WorkerSpawner {
  private containerUseClient: ContainerUseClient;
  private taskExecutor: TaskExecutor;
  private environmentManager: EnvironmentManager;
  private stateTracker: StateTracker;

  constructor(containerUseClient: ContainerUseClient, stateTracker: StateTracker) {
    this.containerUseClient = containerUseClient;
    this.taskExecutor = new TaskExecutor(containerUseClient);
    this.environmentManager = new EnvironmentManager(containerUseClient);
    this.stateTracker = stateTracker;
  }

  /**
   * Spawn a worker with full environment setup and configuration
   *
   * Phase 4 Optimization: If resumeEnvironmentId is provided, resume work in existing
   * environment instead of creating new one (saves ~180s for iterative work)
   */
  async spawnWorker(input: SpawnWorkerInput): Promise<SpawnWorkerOutput> {
    const projectPath = input.projectPath || process.cwd();
    const targetBranch = input.targetBranch || 'feature/boss-initial-setup';

    // Phase 4: Check if resuming existing environment
    if (input.resumeEnvironmentId) {
      logger.info('Resuming worker in existing environment (Phase 4 optimization)', {
        workerType: input.workerType,
        resumeEnvironmentId: input.resumeEnvironmentId,
        projectPath,
      });

      return await this.resumeWorkerInEnvironment(
        input.resumeEnvironmentId,
        input.workerType,
        input.taskPrompt,
        projectPath
      );
    }

    // Normal flow: Create new environment
    logger.info('Spawning worker with new environment', {
      workerType: input.workerType,
      projectPath,
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
        artifacts: [],
      };
      this.stateTracker.registerWorker(workerState);

      // 3. Configure container environment
      await this.environmentManager.configureWorkerEnvironment(
        environmentId,
        workerConfig,
        input.workerType,
        projectPath
      );

      // 4. Execute task with claude using JSON Schema validation
      // Worker context (role, responsibilities, methodology) is in CLAUDE.md
      // Path: /workdir/.boss/workers/${workerType}/.claude/CLAUDE.md (written by EnvironmentManager)
      // This isolated location prevents merge conflicts when parallel workers run
      const workerResult = await this.taskExecutor.executeTaskWithSchema(
        environmentId,
        input.taskPrompt,
        projectPath
      );

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
        artifacts: workerResult.artifacts.map((a) => a.path),
      });

      logger.info('Worker spawned successfully', {
        workerId: environmentId,
        workerType: input.workerType,
        branch,
        status: manifest.status,
      });

      // 8. Log performance metrics (Phase 6)
      // TODO: Add detailed timing instrumentation for accurate metrics
      // For now, log basic metrics with placeholder timing values
      const endTime = new Date();
      const totalTimeMs = endTime.getTime() - new Date(workerState.startedAt).getTime();

      await logPerformanceMetrics(projectPath, {
        workerId: environmentId,
        workerType: input.workerType,
        startedAt: workerState.startedAt,
        completedAt: endTime.toISOString(),
        containerStartTime: 0, // TODO: Instrument container creation timing
        setupCommandsTime: 0, // TODO: Instrument setup commands timing
        installCommandsTime: 0, // TODO: Instrument install commands timing
        configurationTime: 0, // TODO: Instrument configuration timing
        taskExecutionTime: totalTimeMs, // Approximate for now
        totalTime: totalTimeMs,
        usedResumeOptimization: false, // Normal spawn, not resume
        wasPartOfParallelBatch: false, // Will be set by parallel spawner
        success: manifest.status === 'completed',
        artifactsCreated: workerResult.artifacts.length,
        decisionsCount: workerResult.decisions.length,
        issuesCount: workerResult.issues.length,
      });

      // 9. Return worker details
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
          taskStartedAt: workerState.startedAt,
        },
      };
    } catch (error) {
      logger.error('Failed to spawn worker', {
        workerType: input.workerType,
        environmentId,
        error: error instanceof Error ? error.message : String(error),
      });

      // CRITICAL: Cleanup orphaned container if it was created
      if (environmentId) {
        logger.warn('Cleaning up orphaned container after spawn failure', {
          environmentId,
          workerType: input.workerType,
        });

        try {
          // Delete the environment to prevent container leak
          await this.containerUseClient.deleteEnvironment(environmentId);
          logger.info('Orphaned container cleaned up successfully', { environmentId });
        } catch (cleanupError) {
          // Log cleanup failure but don't throw - original error is more important
          logger.error('Failed to cleanup orphaned container', {
            environmentId,
            cleanupError:
              cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        }

        // Update state tracker to mark worker as failed
        this.stateTracker.updateWorkerStatus(environmentId, {
          status: 'failed',
          lastTaskExecutedAt: new Date().toISOString(),
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
          error: error.error,
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
      workerId: input.workerId,
    });

    try {
      // Get worker state
      const worker = this.stateTracker.getWorkerOrThrow(input.workerId);

      // Get projectPath from worker state or use current working directory
      const projectPath = process.cwd();

      // Get existing manifest (if any)
      const existingManifest = await this.taskExecutor.getWorkerManifest(
        input.workerId,
        projectPath
      );

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
        artifacts: updatedManifest.artifacts.map((a) => a.path),
      });

      return {
        success: true,
        workerId: input.workerId,
        status: updatedManifest.status,
        executionLog: `Task executed at ${new Date().toISOString()}`,
        artifacts: updatedManifest.artifacts.map((a) => a.path),
      };
    } catch (error) {
      logger.error('Failed to execute task', {
        workerId: input.workerId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof ConductorException) {
        return {
          success: false,
          workerId: input.workerId,
          status: 'failed',
          error: error.error,
        };
      }

      throw error;
    }
  }

  /**
   * Resume worker in existing environment (Phase 4 optimization)
   *
   * This method resumes work in an existing container environment instead of creating
   * a new one, saving ~180s for iterative work like:
   * - Bug fixes in same feature
   * - Refinements after code review
   * - Additional tasks in same context
   *
   * Savings breakdown:
   * - Container creation: 60-90s (skipped)
   * - Configuration setup: 10-20s (skipped)
   * - Environment setup: 10-20s (skipped)
   * Total: ~180-360s saved per resume
   */
  private async resumeWorkerInEnvironment(
    environmentId: string,
    workerType: WorkerType,
    taskPrompt: string,
    projectPath: string
  ): Promise<SpawnWorkerOutput> {
    try {
      // 1. Verify environment exists in state tracker
      const existingWorker = this.stateTracker.getWorkerOrThrow(environmentId);

      // 2. Verify worker type matches (safety check)
      if (existingWorker.workerType !== workerType) {
        logger.warn('Worker type mismatch when resuming', {
          environmentId,
          requestedType: workerType,
          existingType: existingWorker.workerType,
        });
        // Allow resume but log warning - user may want to repurpose environment
      }

      logger.info('Resuming work in existing environment', {
        environmentId,
        workerType,
        existingStatus: existingWorker.status,
        branch: existingWorker.branch,
      });

      // 3. Get existing manifest (if any)
      const existingManifest = await this.taskExecutor.getWorkerManifest(
        environmentId,
        projectPath
      );

      // 4. Execute task with continue=true (uses --continue flag)
      // This reuses the existing Claude session with all previous context intact
      const workerResult = await this.taskExecutor.executeTaskWithSchema(
        environmentId,
        taskPrompt,
        projectPath,
        true // continueSession = true
      );

      // 5. Create updated manifest (merges with existing)
      const updatedManifest = createManifestFromResult(
        environmentId,
        workerType,
        workerResult,
        existingWorker.startedAt,
        existingManifest
      );

      // 6. Write updated manifest
      await this.taskExecutor.updateWorkerManifest(environmentId, updatedManifest, projectPath);

      // 7. Update worker state in tracker
      this.stateTracker.updateWorkerStatus(environmentId, {
        status: updatedManifest.status,
        lastTaskExecutedAt: new Date().toISOString(),
        artifacts: updatedManifest.artifacts.map((a) => a.path),
      });

      logger.info('Worker resumed successfully', {
        workerId: environmentId,
        workerType,
        status: updatedManifest.status,
        newArtifacts: workerResult.artifacts.length,
      });

      // 8. Log performance metrics (Phase 6 - Resume optimization)
      const endTime = new Date();
      const totalTimeMs = endTime.getTime() - new Date(existingWorker.startedAt).getTime();

      await logPerformanceMetrics(projectPath, {
        workerId: environmentId,
        workerType,
        startedAt: existingWorker.startedAt,
        completedAt: endTime.toISOString(),
        containerStartTime: 0, // Skipped - resume doesn't create container
        setupCommandsTime: 0, // Skipped
        installCommandsTime: 0, // Skipped
        configurationTime: 0, // Skipped
        taskExecutionTime: totalTimeMs,
        totalTime: totalTimeMs,
        usedResumeOptimization: true, // Phase 4 optimization
        wasPartOfParallelBatch: false,
        success: updatedManifest.status === 'completed',
        artifactsCreated: workerResult.artifacts.length,
        decisionsCount: workerResult.decisions.length,
        issuesCount: workerResult.issues.length,
      });

      // 9. Return worker details (same format as spawn)
      return {
        success: true,
        workerId: environmentId,
        workerType,
        branch: existingWorker.branch,
        status: updatedManifest.status,
        message: `${workerType} worker resumed successfully (saved ~180s by reusing environment)`,
        executionDetails: {
          environmentId,
          containerConfigApplied: false, // Not applied - reused existing
          claudeConfigured: false, // Not configured - reused existing
          taskStartedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Failed to resume worker in environment', {
        environmentId,
        workerType,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof ConductorException) {
        return {
          success: false,
          workerId: environmentId,
          workerType,
          branch: '',
          status: 'failed',
          message: 'Failed to resume worker',
          error: error.error,
        };
      }

      throw error;
    }
  }

  /**
   * Spawn multiple workers in parallel (Phase 5 optimization)
   *
   * This method spawns multiple workers concurrently with configurable concurrency
   * limiting to prevent resource exhaustion. Provides massive time savings for
   * multi-worker phases like Discovery (4 workers) or Implementation (3+ workers).
   *
   * Performance Impact:
   * - Sequential: 4 workers × 180s = 720s (12 minutes)
   * - Parallel: max(180s) = 180s (3 minutes)
   * - Savings: 540s (9 minutes, -75%)
   *
   * Features:
   * - Configurable concurrency limit (default: 5 parallel workers)
   * - Graceful partial failure handling
   * - Comprehensive progress tracking
   * - Time savings calculation
   * - Resource-aware batching
   *
   * @param input Configuration for parallel spawning
   * @returns Results for all workers plus performance summary
   */
  async spawnWorkersInParallel(
    input: SpawnWorkersParallelInput
  ): Promise<SpawnWorkersParallelOutput> {
    const startTime = Date.now();
    const maxConcurrency = input.maxConcurrency || 5;
    const projectPath = input.projectPath || process.cwd();
    const targetBranch = input.targetBranch || 'feature/boss-initial-setup';

    logger.info('Starting parallel worker spawning (Phase 5 optimization)', {
      totalWorkers: input.workers.length,
      maxConcurrency,
      projectPath,
    });

    // Batch workers to respect concurrency limit
    const results: SpawnWorkerOutput[] = [];
    const batches: (typeof input.workers)[] = [];

    for (let i = 0; i < input.workers.length; i += maxConcurrency) {
      batches.push(input.workers.slice(i, i + maxConcurrency));
    }

    // Process each batch concurrently
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      if (!batch) continue; // TypeScript safety (should never happen)

      logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`, {
        batchSize: batch.length,
        workerTypes: batch.map((w) => w.workerType),
      });

      // Spawn all workers in this batch concurrently
      const batchPromises = batch.map(async (workerInput) => {
        try {
          const spawnInput: SpawnWorkerInput = {
            workerType: workerInput.workerType,
            taskPrompt: workerInput.taskPrompt,
            projectPath,
            targetBranch,
            resumeEnvironmentId: workerInput.resumeEnvironmentId,
          };

          const result = await this.spawnWorker(spawnInput);
          return result;
        } catch (error) {
          logger.error('Worker spawn failed in parallel batch', {
            workerType: workerInput.workerType,
            batchIndex: batchIndex + 1,
            error: error instanceof Error ? error.message : String(error),
          });

          // Return failed result instead of throwing
          return {
            success: false,
            workerId: '',
            workerType: workerInput.workerType,
            branch: '',
            status: 'failed' as const,
            message: `Failed to spawn ${workerInput.workerType}: ${error instanceof Error ? error.message : String(error)}`,
            error: error instanceof ConductorException ? error.error : undefined,
          };
        }
      });

      // Wait for all workers in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      logger.info(`Batch ${batchIndex + 1}/${batches.length} completed`, {
        succeeded: batchResults.filter((r) => r.success).length,
        failed: batchResults.filter((r) => !r.success).length,
      });
    }

    // Calculate summary statistics
    const endTime = Date.now();
    const totalDurationMs = endTime - startTime;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Calculate time savings
    // Sequential time: total workers × avg spawn time (180s)
    // Parallel time: actual duration
    const sequentialTimeMs = input.workers.length * 180000; // 180s per worker
    const timeSavedMs = sequentialTimeMs - totalDurationMs;

    const summary = {
      total: input.workers.length,
      succeeded,
      failed,
      timeSaved: this.formatDuration(timeSavedMs),
      totalDuration: this.formatDuration(totalDurationMs),
    };

    const allSucceeded = failed === 0;
    const message = allSucceeded
      ? `All ${succeeded} workers spawned successfully in parallel (saved ${summary.timeSaved})`
      : `${succeeded}/${input.workers.length} workers spawned successfully (${failed} failed)`;

    logger.info('Parallel worker spawning completed', {
      ...summary,
      timeSavedMs,
      totalDurationMs,
      allSucceeded,
    });

    return {
      success: allSucceeded,
      results,
      summary,
      message,
    };
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms < 0) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }
}
