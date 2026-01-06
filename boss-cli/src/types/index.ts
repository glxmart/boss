// New template system - external templates with BOSS overlay
export type Template =
  | 't3-prisma'
  | 't3-drizzle'
  | 'nestjs-typeorm'
  | 'fastify-native'
  | 'astro-portfolio';
// | 'spring-boot-jpa' // Deferred to Phase B (Java support)

export type TemplateCategory = 'fullstack' | 'backend' | 'frontend';

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
  category: TemplateCategory;
  externalCommand: string; // Command to run the external template generator
  postProcessing: string[]; // Post-processing steps description
}

export interface TemplateCategoryInfo {
  name: string;
  description: string;
  templates: Template[];
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

// Export internal types
export * from './internal.js';
