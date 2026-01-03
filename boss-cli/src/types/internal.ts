// Internal type definitions for BOSS CLI
// These types are used to properly type JSON parsing and external library results

// Project configuration file structure
export interface ProjectConfigFile {
  currentBranch: string;
  repository?: {
    branches?: Record<string, { exists: boolean; lastCommit: string | null }>;
  };
  initialization: {
    stage: string;
    status: string;
    operationsRequired?: Array<{
      operation: string;
      status: string;
      completedAt?: string;
    }>;
  };
  currentWorkflow: {
    stage: string;
    phase: string;
    status: string;
  };
  metadata?: {
    lastUpdated: string;
    notes: string;
  };
}

// MCP configuration file structure
export interface MCPServerConfig {
  type?: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfigFile {
  mcpServers: Record<string, MCPServerConfig>;
}

// Package.json structure
export interface PackageJson {
  name: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  pnpm?: {
    onlyBuiltDependencies?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Worker metadata
export interface WorkerMetadata {
  primaryCommand?: string | string[];
  description?: string;
  phase?: number | string | number[];
  [key: string]: unknown;
}

// Quality configuration
export interface QualityConfig {
  coverage?: {
    threshold?: number;
  };
  mutation?: {
    threshold?: number;
  };
  [key: string]: unknown;
}

// Template variables
export type TemplateVariables = Record<string, string | number | boolean | object>;

// Inquirer prompt responses
export interface PromptResponse {
  [key: string]: string | boolean | string[];
}
