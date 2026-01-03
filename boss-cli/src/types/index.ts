export type Template = 'nextjs-app-turbo' | 'api-service-fastify' | 'blank' | 't3-app';

export type QualityPreset = 'startup' | 'production' | 'enterprise';

export type MCPScope = 'user' | 'project' | 'both';

export interface BootstrapOptions {
  template?: Template;
  quality?: QualityPreset;
  name?: string;
  org?: string;
  githubRepo?: string;
  githubOrg?: string;
  interactive?: boolean;
  nonInteractive?: boolean;
  projectPath?: string; // Optional absolute path for project directory (for testing)
  mcpScope?: MCPScope; // MCP config scope: 'user' (global IDE), 'project' (project directory), or 'both'
}

export interface ProjectConfig {
  name: string;
  template: Template;
  quality: QualityPreset;
  org?: string;
  githubRepo?: string;
  githubOrg?: string;
}

export interface TemplateInfo {
  name: string;
  description: string;
  stack: string[];
}

export interface QualityPresetInfo {
  name: string;
  description: string;
  gates: QualityGates;
}

export interface QualityGates {
  coverage?: number;
  mutation?: number;
  lint?: boolean;
  typecheck?: boolean;
  test?: boolean;
  security?: boolean;
}
