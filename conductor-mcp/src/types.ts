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

// Worker Configuration
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
  claudeMd: string;            // From CLAUDE.md
  roleDescription: string;     // From metadata.json
  phase: string;               // From metadata.json (formatted)
  artifactRequirements: string; // From metadata.json (formatted)
  claudeFolder?: {             // From .claude/ folder
    files: Array<{
      path: string;            // Original path
      contents: string;
    }>;
  };
  metadata: any;               // From metadata.json (validated against schema)
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
  manifest?: {
    tasksCompleted: string[];
    decisions: WorkerDecision[];
    issues: WorkerIssue[];
    recommendations: string[];
  };
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

export interface AskWorkerInput {
  workerId: string;
  question: string;
}

export interface AskWorkerOutput {
  success: boolean;
  workerId: string;
  question: string;
  answer?: string;
  error?: ConductorError;
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

// Worker Manifest Protocol
//
// Structured communication between BOSS (Claude Code) and WORKER (Claude Code in container)
// Workers maintain .boss/worker-manifest.json to report their work without BOSS needing to ask.

export interface WorkerManifest {
  // Identity
  workerId: string;                   // env-abc123
  workerType: WorkerType;            // architect, clarifier, etc.
  status: WorkerStatus;              // spawning, running, completed, failed

  // Timestamps
  startedAt: string;                 // ISO 8601
  lastUpdatedAt: string;             // ISO 8601
  completedAt?: string;              // ISO 8601

  // Work completed
  artifacts: WorkerArtifact[];       // Files created/modified
  decisions: WorkerDecision[];       // Key decisions made
  issues: WorkerIssue[];             // Problems encountered
  recommendations: string[];         // Next steps for BOSS

  // Metadata
  tasksCompleted: string[];          // Task descriptions
  principlesEstablished?: string[];  // For architect: principles set
  requirementsGathered?: string[];   // For clarifier: requirements found
  testsCreated?: number;             // For tester: test count
  coverageAchieved?: number;         // For tester: coverage %

  // BOSS Q&A (populated by ask_worker tool)
  bossQuestions?: Array<{
    question: string;
    answer: string;
    askedAt: string;
  }>;
}

export interface WorkerArtifact {
  path: string;                      // .specify/memory/constitution.md
  action: 'created' | 'modified' | 'deleted';
  purpose: string;                   // Human-readable description
  sections?: string[];               // For documents: sections created
  linesAdded?: number;               // For code: lines added
  linesModified?: number;            // For code: lines modified
}

export interface WorkerDecision {
  decision: string;                  // What was decided
  rationale: string;                 // Why it was decided
  impact: 'high' | 'medium' | 'low'; // Impact level
  reversible: boolean;               // Can this be undone?
}

export interface WorkerIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;               // Problem description
  impact: string;                    // What it affects
  suggestedAction?: string;          // How to resolve
  blocksProgress: boolean;           // Does this block work?
}

// Worker Result Schema
// Structure returned by workers via --output-format json --json-schema
// Conductor parses this and updates the manifest (workers don't write JSON manually)
export interface WorkerResult {
  artifacts: WorkerArtifact[];       // Files created/modified
  decisions: WorkerDecision[];       // Key decisions made
  issues: WorkerIssue[];             // Problems encountered
  recommendations: string[];         // What BOSS should do next
  tasksCompleted: string[];          // Work done descriptions

  // Worker-specific metadata (optional)
  principlesEstablished?: string[];  // For architect: principles set
  requirementsGathered?: string[];   // For clarifier: requirements found
  testsCreated?: number;             // For tester: test count
  coverageAchieved?: number;         // For tester: coverage %

  // Status indication
  workComplete: boolean;             // Is this task complete?
  nextSteps?: string[];              // What should happen next?
}
