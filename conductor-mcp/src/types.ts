/**
 * Type definitions for Conductor MCP Server
 */

// Worker Types (15 total)
export type WorkerType =
  | 'architect'
  | 'clarifier'
  | 'spec-writer'
  | 'planner'
  | 'reviewer'
  | 'developer-frontend'
  | 'developer-backend'
  | 'developer-fullstack'
  | 'tester'
  | 'code-reviewer'
  | 'security-engineer'
  | 'devops-engineer'
  | 'technical-writer'
  | 'product-owner'
  | 'consolidator';

// Worker Status
export type WorkerStatus = 'spawning' | 'running' | 'completed' | 'failed' | 'terminated';

// Worker Configuration (from container-config.json)
export interface WorkerConfig {
  workerType: string;
  base_image: string;
  setup_commands: string[];
  install_commands: string[];
  environment_variables: Record<string, string>;
  secrets: string[];
  network: {
    allowed_hosts: string[];
  };
  prompt: string;              // From prompt.md
  claudeMd: string;            // From CLAUDE.md
  roleDescription: string;     // Extracted from prompt.md
  phase: string;               // Extracted from prompt.md
  artifactRequirements: string; // Extracted from prompt.md
  claudeFolder?: {             // From .claude/ folder
    files: Array<{
      path: string;            // Original path
      contents: string;
    }>;
  };
}

// Worker State (tracking active workers)
export interface WorkerState {
  workerId: string;           // env-abc123
  workerType: WorkerType;
  branch: string;             // container-use/env-abc123
  targetBranch: string;       // feature/boss-initial-setup
  status: WorkerStatus;
  startedAt: string;
  completedAt?: string;
  lastTaskExecutedAt?: string;
  artifacts: string[];        // Files created by worker
  executionLog?: string;
}

// MCP Tool Input/Output Types

export interface SpawnWorkerInput {
  workerType: WorkerType;
  taskPrompt: string;
  projectPath?: string;
  targetBranch?: string;
}

export interface SpawnWorkerOutput {
  success: boolean;
  workerId: string;
  workerType: WorkerType;
  branch: string;
  status: WorkerStatus;
  message: string;
  executionDetails?: {
    environmentId: string;
    containerConfigApplied: boolean;
    claudeConfigured: boolean;
    taskStartedAt: string;
  };
  error?: ConductorError;
}

export interface ExecuteTaskInput {
  workerId: string;
  taskPrompt: string;
}

export interface ExecuteTaskOutput {
  success: boolean;
  workerId: string;
  status: WorkerStatus;
  executionLog?: string;
  artifacts?: string[];
  error?: ConductorError;
}

export interface GetWorkerStatusInput {
  workerId: string;
}

export interface GetWorkerStatusOutput {
  workerId: string;
  workerType: WorkerType;
  status: WorkerStatus;
  branch: string;
  targetBranch: string;
  startedAt: string;
  completedAt?: string;
  artifacts: string[];
  executionLog?: string;
}

export interface MergeWorkerInput {
  workerId: string;
  targetBranch?: string;
}

export interface MergeWorkerOutput {
  success: boolean;
  message: string;
  error?: ConductorError;
}

export interface TerminateWorkerInput {
  workerId: string;
}

export interface TerminateWorkerOutput {
  success: boolean;
  message: string;
  error?: ConductorError;
}

export interface ListWorkerTypesInput {
  projectPath?: string;
}

export interface ListWorkerTypesOutput {
  workers: Array<{
    type: WorkerType;
    description: string;
    phase: string;
  }>;
}

export interface ListActiveWorkersOutput {
  workers: WorkerState[];
}

export interface ConductorHealthOutput {
  healthy: boolean;
  containerUseAvailable: boolean;
  errors?: string[];
}

// Error Types

export enum ErrorCategory {
  WORKER_CONFIG_NOT_FOUND = 'WORKER_CONFIG_NOT_FOUND',
  WORKER_CONFIG_INVALID = 'WORKER_CONFIG_INVALID',
  CONTAINER_CREATION_FAILED = 'CONTAINER_CREATION_FAILED',
  CONTAINER_CONFIG_FAILED = 'CONTAINER_CONFIG_FAILED',
  WORKER_EXECUTION_FAILED = 'WORKER_EXECUTION_FAILED',
  WORKER_NOT_FOUND = 'WORKER_NOT_FOUND',
  WORKER_ALREADY_MERGED = 'WORKER_ALREADY_MERGED',
  MERGE_FAILED = 'MERGE_FAILED',
  CONTAINER_USE_UNAVAILABLE = 'CONTAINER_USE_UNAVAILABLE'
}

export interface ConductorError {
  category: ErrorCategory;
  message: string;
  workerId?: string;
  workerType?: string;
  details?: unknown;
  retryable: boolean;
}

// Container-Use MCP Types

export interface ContainerUseEnvironment {
  environment_id: string;
  title?: string;
  status?: string;
}

export interface CreateEnvironmentParams {
  base_image: string;
  setup_commands: string[];
  install_commands: string[];
  environment_variables: Record<string, string>;
  secrets: string[];
  network: {
    allowed_hosts: string[];
  };
}

export interface ExecuteInEnvironmentParams {
  environment_id: string;
  command: string;
}

export interface EnvironmentFileWriteParams {
  environment_id: string;
  target_file: string;
  contents: string;
}

export interface EnvironmentFileReadParams {
  environment_id: string;
  target_file: string;
}

export interface MergeEnvironmentParams {
  environment_id: string;
  target_branch: string;
}

// Template Variables
export interface TemplateVariables {
  workerName: string;
  phase?: string;
  workerRoleDescription?: string;
  artifactRequirements?: string;
  [key: string]: string | undefined;
}
