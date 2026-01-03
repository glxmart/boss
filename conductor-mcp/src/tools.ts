/**
 * MCP tool definitions and handlers
 */

import { WorkerSpawner } from './lifecycle/worker-spawner.js';
import { StateTracker } from './lifecycle/state-tracker.js';
import { ContainerUseClient } from './orchestration/container-use-client.js';
import { TaskExecutor } from './orchestration/task-executor.js';
import { listAvailableWorkers } from './config/worker-loader.js';
import {
  SpawnWorkerInput,
  SpawnWorkersParallelInput,
  ExecuteTaskInput,
  GetWorkerStatusInput,
  MergeWorkerInput,
  TerminateWorkerInput,
  ListWorkerTypesInput,
  AskWorkerInput,
  InspectWorkerConfigInput,
  ImportWorkerConfigInput,
  WorkerType,
  ErrorCategory,
  WorkerManifest,
} from './types.js';
import { logger } from './utils/logger.js';
import { ConductorException, createError, throwConductorError } from './utils/error-handler.js';

// Initialize dependencies
const containerUseClient = new ContainerUseClient();
const stateTracker = new StateTracker();
const workerSpawner = new WorkerSpawner(containerUseClient, stateTracker);
const taskExecutor = new TaskExecutor(containerUseClient);

/**
 * Validate and cast input to expected type
 * Throws ConductorException if validation fails
 */
function validateInput<T>(args: unknown, requiredFields: string[], toolName: string): T {
  if (!args || typeof args !== 'object') {
    throwConductorError(
      ErrorCategory.WORKER_EXECUTION_FAILED,
      `Invalid input for ${toolName}: expected object, got ${typeof args}`,
      { details: { args } }
    );
  }

  const input = args as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in input) || input[field] === undefined || input[field] === null) {
      throwConductorError(
        ErrorCategory.WORKER_EXECUTION_FAILED,
        `Invalid input for ${toolName}: missing required field "${field}"`,
        { details: { providedFields: Object.keys(input), requiredFields } }
      );
    }
  }

  return input as T;
}

// Worker type descriptions and phases
const WORKER_METADATA: Record<WorkerType, { description: string; phase: string }> = {
  architect: {
    description: 'Create constitution with governing principles and standards',
    phase: 'Phase 1: Constitution',
  },
  clarifier: {
    description: 'Gather business requirements through conversation',
    phase: 'Phase 2: Clarification',
  },
  'spec-writer': {
    description: 'Create user stories in BDD format',
    phase: 'Phase 3: Specification',
  },
  planner: {
    description: 'Create technical plans and task breakdowns',
    phase: 'Phase 4/6: Planning & Task Breakdown',
  },
  reviewer: {
    description: 'Validate against constitution compliance',
    phase: 'Phase 5: Validation',
  },
  'developer-frontend': {
    description: 'Implement frontend features with TDD + BDD',
    phase: 'Phase 7: Implementation',
  },
  'developer-backend': {
    description: 'Implement backend features with TDD + BDD',
    phase: 'Phase 7: Implementation',
  },
  'developer-fullstack': {
    description: 'Implement fullstack features with TDD + BDD',
    phase: 'Phase 7: Implementation',
  },
  tester: {
    description: 'Create comprehensive test suites',
    phase: 'Phase 7: Implementation (Testing)',
  },
  'code-reviewer': {
    description: 'Review code quality and standards',
    phase: 'Phase 7: Implementation (Code Review)',
  },
  'security-engineer': {
    description: 'Ensure security and compliance',
    phase: 'Phase 0-8: Security (Cross-Phase)',
  },
  'devops-engineer': {
    description: 'Set up CI/CD and infrastructure',
    phase: 'Phase 0-8: Infrastructure (Cross-Phase)',
  },
  'technical-writer': {
    description: 'Create comprehensive documentation',
    phase: 'Phase 0-8: Documentation (Cross-Phase)',
  },
  'product-owner': {
    description: 'Represent business and user needs',
    phase: 'Phase 0-8: Business (Cross-Phase)',
  },
  consolidator: {
    description: 'Merge all worker branches and create final artifacts',
    phase: 'Phase 8: Consolidation',
  },
};

/**
 * MCP Tool Handlers
 */

export async function handleSpawnWorker(args: unknown) {
  const input = validateInput<SpawnWorkerInput>(args, ['workerType', 'taskPrompt'], 'spawn_worker');

  logger.info('Handling spawn_worker request', {
    workerType: input.workerType,
  });

  return await workerSpawner.spawnWorker(input);
}

export async function handleSpawnWorkersParallel(args: unknown) {
  const input = validateInput<SpawnWorkersParallelInput>(
    args,
    ['workers'],
    'spawn_workers_parallel'
  );

  logger.info('Handling spawn_workers_parallel request (Phase 5 optimization)', {
    workersCount: input.workers.length,
    maxConcurrency: input.maxConcurrency || 5,
  });

  return await workerSpawner.spawnWorkersInParallel(input);
}

export async function handleExecuteTask(args: unknown) {
  const input = validateInput<ExecuteTaskInput>(args, ['workerId', 'taskPrompt'], 'execute_task');

  logger.info('Handling execute_task request', {
    workerId: input.workerId,
  });

  return await workerSpawner.executeTask(input);
}

export async function handleGetWorkerStatus(args: unknown) {
  const input = validateInput<GetWorkerStatusInput>(args, ['workerId'], 'get_worker_status');

  logger.info('Handling get_worker_status request', {
    workerId: input.workerId,
  });

  try {
    const worker = stateTracker.getWorkerOrThrow(input.workerId);

    // Get projectPath (default to current working directory)
    const projectPath = process.cwd();

    // Attempt to read worker manifest for detailed status
    const manifest = await taskExecutor.getWorkerManifest(input.workerId, projectPath);

    return {
      workerId: worker.workerId,
      workerType: worker.workerType,
      status: manifest?.status || worker.status,
      branch: worker.branch,
      targetBranch: worker.targetBranch,
      startedAt: worker.startedAt,
      completedAt: manifest?.completedAt || worker.completedAt,
      artifacts: manifest?.artifacts.map((a) => a.path) || worker.artifacts,
      executionLog: worker.executionLog,
      // Include manifest data if available
      manifest: manifest
        ? {
            tasksCompleted: manifest.tasksCompleted,
            decisions: manifest.decisions,
            issues: manifest.issues,
            recommendations: manifest.recommendations,
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof ConductorException) {
      throw error;
    }
    throw new ConductorException(
      createError(ErrorCategory.WORKER_NOT_FOUND, `Worker ${input.workerId} not found`)
    );
  }
}

export async function handleMergeWorker(args: unknown) {
  const input = args as MergeWorkerInput;

  logger.info('Handling merge_worker request', {
    workerId: input.workerId,
  });

  try {
    const worker = stateTracker.getWorkerOrThrow(input.workerId);

    // Check if already merged
    if (worker.status === 'completed') {
      throw new ConductorException(
        createError(
          ErrorCategory.WORKER_ALREADY_MERGED,
          `Worker ${input.workerId} already merged`,
          { workerId: input.workerId }
        )
      );
    }

    // Merge environment
    const targetBranch = input.targetBranch || worker.targetBranch;
    await containerUseClient.mergeEnvironment({
      environment_id: input.workerId,
      target_branch: targetBranch,
    });

    // Update worker state
    stateTracker.updateWorkerStatus(input.workerId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Worker ${input.workerId} merged successfully into ${targetBranch}`,
    };
  } catch (error) {
    if (error instanceof ConductorException) {
      return {
        success: false,
        message: 'Failed to merge worker',
        error: error.error,
      };
    }
    throw error;
  }
}

export async function handleTerminateWorker(args: unknown) {
  const input = args as TerminateWorkerInput;

  logger.info('Handling terminate_worker request', {
    workerId: input.workerId,
  });

  try {
    // Verify worker exists (throws if not found)
    stateTracker.getWorkerOrThrow(input.workerId);

    // Delete environment
    await containerUseClient.deleteEnvironment(input.workerId);

    // Update worker state
    stateTracker.updateWorkerStatus(input.workerId, {
      status: 'terminated',
      completedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Worker ${input.workerId} terminated successfully`,
    };
  } catch (error) {
    if (error instanceof ConductorException) {
      return {
        success: false,
        message: 'Failed to terminate worker',
        error: error.error,
      };
    }
    throw error;
  }
}

export async function handleListWorkerTypes(args: unknown) {
  const input = (args as ListWorkerTypesInput) || {};

  logger.info('Handling list_worker_types request');

  const projectPath = input.projectPath || process.cwd();
  const availableWorkers = await listAvailableWorkers(projectPath);

  const workers = availableWorkers.map((type) => ({
    type,
    description: WORKER_METADATA[type]?.description || 'Unknown worker type',
    phase: WORKER_METADATA[type]?.phase || 'Unknown phase',
  }));

  return { workers };
}

export function handleListActiveWorkers() {
  logger.info('Handling list_active_workers request');

  const workers = stateTracker.listActiveWorkers();

  return { workers };
}

export async function handleConductorHealth() {
  logger.info('Handling conductor_health request');

  const containerUseAvailable = await containerUseClient.checkAvailability();
  const errors: string[] = [];

  if (!containerUseAvailable) {
    errors.push('Container-Use MCP is not available');
  }

  return {
    healthy: containerUseAvailable,
    containerUseAvailable,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function handleAskWorker(args: unknown) {
  const input = validateInput<AskWorkerInput>(args, ['workerId', 'question'], 'ask_worker');

  logger.info('Handling ask_worker request', {
    workerId: input.workerId,
    questionLength: input.question.length,
  });

  try {
    // Verify worker exists
    stateTracker.getWorkerOrThrow(input.workerId);

    // Get projectPath (default to current working directory)
    const projectPath = process.cwd();

    // CRITICAL: Check that worker has completed its work
    // We can only ask questions to workers that have finished
    //
    // Design decision: We only allow questions to completed workers because:
    // 1. Session continuity: Workers use --session-id for state persistence. Asking
    //    questions mid-work could interfere with the worker's current task context.
    // 2. Consistency: Questions should be about completed work, not in-progress work
    //    that might change as the worker continues execution.
    // 3. Manifest validity: Running workers are still updating their manifest, so
    //    questions based on partial data could be misleading.
    const manifest = await taskExecutor.getWorkerManifest(input.workerId, projectPath);

    if (!manifest) {
      throw new ConductorException(
        createError(
          ErrorCategory.WORKER_EXECUTION_FAILED,
          `Cannot ask worker ${input.workerId}: manifest not found. Worker may not have started yet.`,
          { workerId: input.workerId }
        )
      );
    }

    if (manifest.status === 'running' || manifest.status === 'spawning') {
      throw new ConductorException(
        createError(
          ErrorCategory.WORKER_EXECUTION_FAILED,
          `Cannot ask worker ${input.workerId} a question because it is still working (status: ${manifest.status}). Use get_worker_status to monitor progress, then ask questions after worker completes.`,
          {
            workerId: input.workerId,
            details: {
              currentStatus: manifest.status,
              suggestedAction:
                'Call get_worker_status periodically until status is "completed" or "failed"',
            },
          }
        )
      );
    }

    // Worker has completed (or failed) - we can ask question
    logger.info('Worker completed, asking question with schema-based approach', {
      workerId: input.workerId,
      previousStatus: manifest.status,
    });

    // Build follow-up question prompt (schema-based approach)
    // Worker returns structured JSON, Conductor updates manifest
    const questionPrompt = `
BOSS is asking you a follow-up question about the work you completed:

"${input.question}"

Please answer the question based on your previous work. Your answer will be captured in structured JSON format.
`.trim();

    // Execute with schema validation to get structured answer
    const workerResult = await taskExecutor.executeTaskWithSchema(
      input.workerId,
      questionPrompt,
      projectPath,
      true /* continueSession */
    );

    // Extract answer from recommendations (first recommendation is the answer)
    let answer: string;
    let answerProvided: boolean;

    if (workerResult.recommendations.length > 0 && workerResult.recommendations[0]) {
      answer = workerResult.recommendations[0];
      answerProvided = true;
      logger.debug('Worker provided answer to question', {
        workerId: input.workerId,
        answerLength: answer.length,
      });
    } else {
      answer = 'Worker did not provide an answer to the question.';
      answerProvided = false;
      logger.warn('Worker returned no answer to question', {
        workerId: input.workerId,
        question: input.question,
        recommendationsCount: workerResult.recommendations.length,
        message: 'Worker should provide answer in recommendations array',
      });
    }

    // Update manifest with Q&A
    const updatedManifest: WorkerManifest = {
      ...manifest,
      lastUpdatedAt: new Date().toISOString(),
      bossQuestions: [
        ...(manifest.bossQuestions || []),
        {
          question: input.question,
          answer: answer || 'No answer provided',
          askedAt: new Date().toISOString(),
        },
      ],
      // Also merge any new artifacts/decisions from the answer
      artifacts: [...manifest.artifacts, ...workerResult.artifacts],
      decisions: [...manifest.decisions, ...workerResult.decisions],
      issues: [...manifest.issues, ...workerResult.issues],
    };

    // Write updated manifest
    await taskExecutor.updateWorkerManifest(input.workerId, updatedManifest, projectPath);

    return {
      success: answerProvided,
      workerId: input.workerId,
      question: input.question,
      answer,
      metadata: {
        answerProvided,
        workerIssuesReported: workerResult.issues.length,
      },
    };
  } catch (error) {
    logger.error('Failed to ask worker', {
      workerId: input.workerId,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof ConductorException) {
      return {
        success: false,
        workerId: input.workerId,
        question: input.question,
        error: error.error,
      };
    }

    throw error;
  }
}

export async function handleInspectWorkerConfig(args: unknown) {
  const input = validateInput<InspectWorkerConfigInput>(
    args,
    ['workerId'],
    'inspect_worker_config'
  );

  logger.info('Handling inspect_worker_config request (Phase 6)', {
    workerId: input.workerId,
  });

  try {
    // Get worker state
    const worker = stateTracker.getWorkerOrThrow(input.workerId);

    // Get projectPath
    const projectPath = process.cwd();

    // Inspect environment config
    const config = await containerUseClient.inspectEnvironmentConfig(input.workerId, projectPath);

    // TODO: If compareWithDefaults is true, compare with worker's initial config
    // and identify changes (requires storing initial config)

    return {
      success: true,
      workerId: input.workerId,
      workerType: worker.workerType,
      config,
      message: `Configuration inspected for ${worker.workerType} worker`,
    };
  } catch (error) {
    logger.error('Failed to inspect worker config', {
      workerId: input.workerId,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof ConductorException) {
      return {
        success: false,
        workerId: input.workerId,
        workerType: 'architect' as WorkerType, // Default
        config: {
          baseImage: '',
          setupCommands: [],
          installCommands: [],
          environmentVariables: {},
        },
        message: 'Failed to inspect worker config',
        error: error.error,
      };
    }

    throw error;
  }
}

export async function handleImportWorkerConfig(args: unknown) {
  const input = validateInput<ImportWorkerConfigInput>(args, ['workerId'], 'import_worker_config');

  logger.info('Handling import_worker_config request (Phase 6)', {
    workerId: input.workerId,
    importSetupCommands: input.importSetupCommands,
    importInstallCommands: input.importInstallCommands,
    importEnvironmentVariables: input.importEnvironmentVariables,
  });

  try {
    // Get worker state
    const worker = stateTracker.getWorkerOrThrow(input.workerId);

    // Get projectPath
    const projectPath = process.cwd();

    // First, inspect the environment to get current config
    const config = await containerUseClient.inspectEnvironmentConfig(input.workerId, projectPath);

    // Determine what to import based on input flags
    const toImport: {
      setupCommands?: string[];
      installCommands?: string[];
      environmentVariables?: Record<string, string>;
    } = {};

    if (input.importSetupCommands) {
      toImport.setupCommands = config.setupCommands;
    }

    if (input.importInstallCommands) {
      toImport.installCommands = config.installCommands;
    }

    if (input.importEnvironmentVariables) {
      toImport.environmentVariables = config.environmentVariables;
    }

    // If selective import specified, override with selective items
    if (input.selective) {
      if (input.selective.setupCommands) {
        toImport.setupCommands = input.selective.setupCommands;
      }
      if (input.selective.installCommands) {
        toImport.installCommands = input.selective.installCommands;
      }
      if (input.selective.environmentVariables) {
        const envVars: Record<string, string> = {};
        for (const key of input.selective.environmentVariables) {
          if (config.environmentVariables[key]) {
            envVars[key] = config.environmentVariables[key];
          }
        }
        toImport.environmentVariables = envVars;
      }
    }

    // Import the configuration
    const result = await containerUseClient.importEnvironmentConfig(
      input.workerId,
      projectPath,
      toImport
    );

    return {
      success: true,
      imported: result.imported,
      message: `Configuration imported from ${worker.workerType} worker`,
    };
  } catch (error) {
    logger.error('Failed to import worker config', {
      workerId: input.workerId,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof ConductorException) {
      return {
        success: false,
        imported: {
          setupCommands: [],
          installCommands: [],
          environmentVariables: {},
        },
        message: 'Failed to import worker config',
        error: error.error,
      };
    }

    throw error;
  }
}

/**
 * MCP Tool Schemas
 */

export const TOOL_SCHEMAS = {
  spawn_worker: {
    name: 'spawn_worker',
    description: 'Spawn a worker with full environment setup and configuration',
    inputSchema: {
      type: 'object',
      properties: {
        workerType: {
          type: 'string',
          enum: [
            'architect',
            'clarifier',
            'spec-writer',
            'planner',
            'reviewer',
            'developer-frontend',
            'developer-backend',
            'developer-fullstack',
            'tester',
            'code-reviewer',
            'consolidator',
            'security-engineer',
            'devops-engineer',
            'technical-writer',
            'product-owner',
          ],
          description: 'Type of worker to spawn',
        },
        taskPrompt: {
          type: 'string',
          description: 'Task instructions for the worker',
        },
        projectPath: {
          type: 'string',
          description: 'Absolute path to project root (defaults to cwd)',
        },
        targetBranch: {
          type: 'string',
          description: 'Branch to merge worker changes into (default: feature/boss-initial-setup)',
        },
        resumeEnvironmentId: {
          type: 'string',
          description:
            'Resume work in existing worker environment instead of creating new one (saves ~180s for iterative work)',
        },
      },
      required: ['workerType', 'taskPrompt'],
    },
  },
  spawn_workers_parallel: {
    name: 'spawn_workers_parallel',
    description:
      'Spawn multiple workers concurrently for massive time savings (Phase 5 optimization). Use this for multi-worker phases like Discovery (4 workers) or Implementation (3+ workers). Saves 540s+ by running workers in parallel instead of sequentially. Example: 4 workers take 180s instead of 720s (-75%).',
    inputSchema: {
      type: 'object',
      properties: {
        workers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              workerType: {
                type: 'string',
                enum: [
                  'architect',
                  'clarifier',
                  'spec-writer',
                  'planner',
                  'reviewer',
                  'developer-frontend',
                  'developer-backend',
                  'developer-fullstack',
                  'tester',
                  'code-reviewer',
                  'consolidator',
                  'security-engineer',
                  'devops-engineer',
                  'technical-writer',
                  'product-owner',
                ],
                description: 'Type of worker to spawn',
              },
              taskPrompt: {
                type: 'string',
                description: 'Task instructions for this worker',
              },
              resumeEnvironmentId: {
                type: 'string',
                description: 'Optional: Resume work in existing environment',
              },
            },
            required: ['workerType', 'taskPrompt'],
          },
          description: 'Array of workers to spawn in parallel',
        },
        projectPath: {
          type: 'string',
          description: 'Absolute path to project root (defaults to cwd)',
        },
        targetBranch: {
          type: 'string',
          description: 'Branch to merge worker changes into (default: feature/boss-initial-setup)',
        },
        maxConcurrency: {
          type: 'number',
          description:
            'Maximum number of workers to spawn concurrently (default: 5, max recommended: 5)',
          minimum: 1,
          maximum: 10,
        },
      },
      required: ['workers'],
    },
  },
  execute_task: {
    name: 'execute_task',
    description: 'Execute a task in an already-running worker environment',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID (env_id) returned from spawn_worker',
        },
        taskPrompt: {
          type: 'string',
          description: 'Additional task instructions',
        },
      },
      required: ['workerId', 'taskPrompt'],
    },
  },
  get_worker_status: {
    name: 'get_worker_status',
    description: 'Get status and execution results for a worker',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to check',
        },
      },
      required: ['workerId'],
    },
  },
  merge_worker: {
    name: 'merge_worker',
    description: 'Merge worker branch into target branch and cleanup',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to merge',
        },
        targetBranch: {
          type: 'string',
          description: 'Branch to merge into (optional, uses stored value)',
        },
      },
      required: ['workerId'],
    },
  },
  terminate_worker: {
    name: 'terminate_worker',
    description: 'Terminate worker and discard changes (for failures/retries)',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to terminate',
        },
      },
      required: ['workerId'],
    },
  },
  list_worker_types: {
    name: 'list_worker_types',
    description: 'Get list of available worker types and their descriptions',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Project path to load workers from',
        },
      },
    },
  },
  list_active_workers: {
    name: 'list_active_workers',
    description: 'Get list of currently active workers',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  conductor_health: {
    name: 'conductor_health',
    description: 'Check Conductor MCP health and dependencies',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  ask_worker: {
    name: 'ask_worker',
    description:
      'Ask a question to a COMPLETED worker. Uses schema-based JSON output for reliable answer capture. Worker must have finished (status=completed) before asking. Conductor parses the structured response and updates the manifest with the Q&A.',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to ask',
        },
        question: {
          type: 'string',
          description: 'Question to ask the worker',
        },
      },
      required: ['workerId', 'question'],
    },
  },
  inspect_worker_config: {
    name: 'inspect_worker_config',
    description:
      'Inspect worker environment configuration to identify optimizations discovered during execution (Phase 6: Configuration Learning). Returns the current configuration including base image, setup commands, install commands, and environment variables. Use this to learn from successful workers and identify beneficial changes.',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to inspect',
        },
        compareWithDefaults: {
          type: 'boolean',
          description: 'Compare with default config and identify changes (not yet implemented)',
        },
      },
      required: ['workerId'],
    },
  },
  import_worker_config: {
    name: 'import_worker_config',
    description:
      'Import configuration from a worker environment as new defaults (Phase 6: Configuration Learning). Use this to adopt optimizations discovered by workers, such as faster dependency installation methods, additional required tools, or performance-enhancing environment variables. Supports selective import of specific commands or variables.',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to import config from',
        },
        importSetupCommands: {
          type: 'boolean',
          description: 'Import all setup commands from worker',
        },
        importInstallCommands: {
          type: 'boolean',
          description: 'Import all install commands from worker',
        },
        importEnvironmentVariables: {
          type: 'boolean',
          description: 'Import all environment variables from worker',
        },
        selective: {
          type: 'object',
          properties: {
            setupCommands: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific setup commands to import',
            },
            installCommands: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific install commands to import',
            },
            environmentVariables: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific environment variable keys to import',
            },
          },
          description: 'Selectively import specific items instead of all',
        },
      },
      required: ['workerId'],
    },
  },
};
