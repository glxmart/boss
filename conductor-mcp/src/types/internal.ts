// Internal type definitions for Conductor MCP
// These types are used to properly type MCP tool results and JSON parsing

// MCP tool result interfaces
export interface MCPToolResult {
  [key: string]: unknown;
}

export interface CreateEnvironmentResult extends MCPToolResult {
  environment_id?: string;
  id?: string;
  output?: string;
}

export interface ConfigShowResult extends MCPToolResult {
  base_image?: string;
  setup_commands?: string[];
  install_commands?: string[];
  environment_variables?: Record<string, string>;
  secrets?: string[];
  network?: { allowed_hosts?: string[] };
}

export interface ExecuteCommandResult extends MCPToolResult {
  stdout?: string;
  output?: string;
  exit_code?: number;
}

export interface FileReadResult extends MCPToolResult {
  contents?: string;
}

export interface EnvironmentResult extends MCPToolResult {
  environment_id?: string;
  title?: string;
  status?: string;
}

export interface EnvironmentListResult extends MCPToolResult {
  environments?: Array<{
    environment_id?: string;
    title?: string;
    status?: string;
  }>;
}

// JSON config file structures
export interface MetadataJson {
  description: string;
  phase: number | string | number[];
  outputs?: {
    [key: string]: {
      type: string;
      description?: string;
      required?: boolean;
    };
  };
  [key: string]: unknown;
}

export interface ContainerConfigJson {
  base_image?: string;
  setup_commands?: string[];
  install_commands?: string[];
  environment_variables?: Record<string, string>;
  secrets?: string[];
  network?: { allowed_hosts?: string[] };
  [key: string]: unknown;
}
