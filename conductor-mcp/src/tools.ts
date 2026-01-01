/**
 * MCP tool definitions and handlers
 */

import { WorkerSpawner } from './lifecycle/worker-spawner.js';
import { StateTracker } from './lifecycle/state-tracker.js';
import { ContainerUseClient } from './orchestration/container-use-client.js';
import { listAvailableWorkers } from './config/worker-loader.js';
import {
  SpawnWorkerInput,
  ExecuteTaskInput,
  GetWorkerStatusInput,
  MergeWorkerInput,
  TerminateWorkerInput,
  ListWorkerTypesInput,
  WorkerType,
  ErrorCategory
} from './types.js';
import { logger } from './utils/logger.js';
import { ConductorException, createError } from './utils/error-handler.js';

// Initialize dependencies
const containerUseClient = new ContainerUseClient();
const stateTracker = new StateTracker();
const workerSpawner = new WorkerSpawner(containerUseClient, stateTracker);

// Worker type descriptions and phases
const WORKER_METADATA: Record<WorkerType, { description: string; phase: string }> = {
  'architect': {
    description: 'Create constitution with governing principles and standards',
    phase: 'Phase 1: Constitution'
  },
  'clarifier': {
    description: 'Gather business requirements through conversation',
    phase: 'Phase 2: Clarification'
  },
  'spec-writer': {
    description: 'Create user stories in BDD format',
    phase: 'Phase 3: Specification'
  },
  'planner': {
    description: 'Create technical plans and task breakdowns',
    phase: 'Phase 4/6: Planning & Task Breakdown'
  },
  'reviewer': {
    description: 'Validate against constitution compliance',
    phase: 'Phase 5: Validation'
  },
  'developer-frontend': {
    description: 'Implement frontend features with TDD + BDD',
    phase: 'Phase 7: Implementation'
  },
  'developer-backend': {
    description: 'Implement backend features with TDD + BDD',
    phase: 'Phase 7: Implementation'
  },
  'developer-fullstack': {
    description: 'Implement fullstack features with TDD + BDD',
    phase: 'Phase 7: Implementation'
  },
  'tester': {
    description: 'Create comprehensive test suites',
    phase: 'Phase 7: Implementation (Testing)'
  },
  'code-reviewer': {
    description: 'Review code quality and standards',
    phase: 'Phase 7: Implementation (Code Review)'
  },
  'security-engineer': {
    description: 'Ensure security and compliance',
    phase: 'Phase 0-8: Security (Cross-Phase)'
  },
  'devops-engineer': {
    description: 'Set up CI/CD and infrastructure',
    phase: 'Phase 0-8: Infrastructure (Cross-Phase)'
  },
  'technical-writer': {
    description: 'Create comprehensive documentation',
    phase: 'Phase 0-8: Documentation (Cross-Phase)'
  },
  'product-owner': {
    description: 'Represent business and user needs',
    phase: 'Phase 0-8: Business (Cross-Phase)'
  },
  'consolidator': {
    description: 'Merge all worker branches and create final artifacts',
    phase: 'Phase 8: Consolidation'
  }
};

/**
 * MCP Tool Handlers
 */

export async function handleSpawnWorker(args: unknown) {
  const input = args as SpawnWorkerInput;

  logger.info('Handling spawn_worker request', {
    workerType: input.workerType
  });

  return await workerSpawner.spawnWorker(input);
}

export async function handleExecuteTask(args: unknown) {
  const input = args as ExecuteTaskInput;

  logger.info('Handling execute_task request', {
    workerId: input.workerId
  });

  return await workerSpawner.executeTask(input);
}

export async function handleGetWorkerStatus(args: unknown) {
  const input = args as GetWorkerStatusInput;

  logger.info('Handling get_worker_status request', {
    workerId: input.workerId
  });

  try {
    const worker = stateTracker.getWorkerOrThrow(input.workerId);

    return {
      workerId: worker.workerId,
      workerType: worker.workerType,
      status: worker.status,
      branch: worker.branch,
      targetBranch: worker.targetBranch,
      startedAt: worker.startedAt,
      completedAt: worker.completedAt,
      artifacts: worker.artifacts,
      executionLog: worker.executionLog
    };
  } catch (error) {
    if (error instanceof ConductorException) {
      throw error;
    }
    throw new ConductorException(
      createError(
        ErrorCategory.WORKER_NOT_FOUND,
        `Worker ${input.workerId} not found`
      )
    );
  }
}

export async function handleMergeWorker(args: unknown) {
  const input = args as MergeWorkerInput;

  logger.info('Handling merge_worker request', {
    workerId: input.workerId
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
      target_branch: targetBranch
    });

    // Update worker state
    stateTracker.updateWorkerStatus(input.workerId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Worker ${input.workerId} merged successfully into ${targetBranch}`
    };
  } catch (error) {
    if (error instanceof ConductorException) {
      return {
        success: false,
        message: 'Failed to merge worker',
        error: error.error
      };
    }
    throw error;
  }
}

export async function handleTerminateWorker(args: unknown) {
  const input = args as TerminateWorkerInput;

  logger.info('Handling terminate_worker request', {
    workerId: input.workerId
  });

  try {
    // Verify worker exists (throws if not found)
    stateTracker.getWorkerOrThrow(input.workerId);

    // Delete environment
    await containerUseClient.deleteEnvironment(input.workerId);

    // Update worker state
    stateTracker.updateWorkerStatus(input.workerId, {
      status: 'terminated',
      completedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Worker ${input.workerId} terminated successfully`
    };
  } catch (error) {
    if (error instanceof ConductorException) {
      return {
        success: false,
        message: 'Failed to terminate worker',
        error: error.error
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

  const workers = availableWorkers.map(type => ({
    type,
    description: WORKER_METADATA[type]?.description || 'Unknown worker type',
    phase: WORKER_METADATA[type]?.phase || 'Unknown phase'
  }));

  return { workers };
}

export async function handleListActiveWorkers() {
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
    errors: errors.length > 0 ? errors : undefined
  };
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
            'architect', 'clarifier', 'spec-writer', 'planner', 'reviewer',
            'developer-frontend', 'developer-backend', 'developer-fullstack',
            'tester', 'code-reviewer', 'consolidator',
            'security-engineer', 'devops-engineer', 'technical-writer', 'product-owner'
          ],
          description: 'Type of worker to spawn'
        },
        taskPrompt: {
          type: 'string',
          description: 'Task instructions for the worker'
        },
        projectPath: {
          type: 'string',
          description: 'Absolute path to project root (defaults to cwd)'
        },
        targetBranch: {
          type: 'string',
          description: 'Branch to merge worker changes into (default: feature/boss-initial-setup)'
        }
      },
      required: ['workerType', 'taskPrompt']
    }
  },
  execute_task: {
    name: 'execute_task',
    description: 'Execute a task in an already-running worker environment',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID (env_id) returned from spawn_worker'
        },
        taskPrompt: {
          type: 'string',
          description: 'Additional task instructions'
        }
      },
      required: ['workerId', 'taskPrompt']
    }
  },
  get_worker_status: {
    name: 'get_worker_status',
    description: 'Get status and execution results for a worker',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to check'
        }
      },
      required: ['workerId']
    }
  },
  merge_worker: {
    name: 'merge_worker',
    description: 'Merge worker branch into target branch and cleanup',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to merge'
        },
        targetBranch: {
          type: 'string',
          description: 'Branch to merge into (optional, uses stored value)'
        }
      },
      required: ['workerId']
    }
  },
  terminate_worker: {
    name: 'terminate_worker',
    description: 'Terminate worker and discard changes (for failures/retries)',
    inputSchema: {
      type: 'object',
      properties: {
        workerId: {
          type: 'string',
          description: 'Worker ID to terminate'
        }
      },
      required: ['workerId']
    }
  },
  list_worker_types: {
    name: 'list_worker_types',
    description: 'Get list of available worker types and their descriptions',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Project path to load workers from'
        }
      }
    }
  },
  list_active_workers: {
    name: 'list_active_workers',
    description: 'Get list of currently active workers',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  conductor_health: {
    name: 'conductor_health',
    description: 'Check Conductor MCP health and dependencies',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
};
