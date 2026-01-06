import path from 'path';
import yaml from 'js-yaml';
import { writeFile } from '../utils/file-system.js';
import type { ProjectConfig } from '../types/index.js';
import { TEMPLATES, QUALITY_PRESETS } from '../utils/prompts.js';

export async function generateBossConfig(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const bossConfig = {
    boss: {
      version: '1.0.0',
      template: config.template,
      quality: config.quality,
    },
    project: {
      name: config.name,
      type: getProjectType(config.template),
      stack: getStackForTemplate(config.template),
    },
    workers: {
      max_concurrent: 5,
      timeout: 3600,
    },
    quality: {
      preset: config.quality,
      gates: {}, // Will be populated by quality preset
    },
  };

  const yamlContent = yaml.dump(bossConfig, { indent: 2 });
  await writeFile(path.join(projectPath, '.boss', 'config.yaml'), yamlContent);

  // Generate project-config.json for status tracking
  await generateProjectConfig(projectPath, config);
}

async function generateProjectConfig(projectPath: string, config: ProjectConfig): Promise<void> {
  const templateInfo = TEMPLATES[config.template];
  const qualityInfo = QUALITY_PRESETS[config.quality];
  const projectType = getProjectType(config.template);
  const stack = getStackForTemplate(config.template);

  const projectConfig = {
    // Project Identity
    project: {
      name: config.name,
      type: projectType,
      template: {
        id: config.template,
        name: templateInfo.name,
        description: templateInfo.description,
        stack: stack,
      },
      quality: {
        preset: config.quality,
        name: qualityInfo.name,
        description: qualityInfo.description,
        gates: qualityInfo.gates,
      },
      organization: config.githubOrg || null,
      createdAt: new Date().toISOString(),
    },

    // Initialization Status
    initialization: {
      stage: 'bootstrap',
      status: 'completed',
      bootstrapComplete: true,
      bootstrapDate: new Date().toISOString(),
      remoteCreated: false,
      initialSetupComplete: false,
      nextSteps: [
        'Create feature/boss-initial-setup branch (if not already created)',
        'Check if GitHub remote repository exists',
        'If no remote exists, ask user for repository preferences (private/public, organization)',
        'Create GitHub repository using GitHub MCP',
        'Add remote using Container-Use MCP',
        'Push initial commit to remote',
        'Mark initialization.stage as "ready"',
      ],
      operationsRequired: [
        {
          operation: 'create-initial-setup-branch',
          description: 'Create feature/boss-initial-setup branch for BOSS work',
          status: 'pending',
          required: true,
        },
        {
          operation: 'check-remote-repository',
          description: 'Check if GitHub remote repository exists',
          status: 'pending',
          required: true,
        },
        {
          operation: 'create-github-repository',
          description: 'Create GitHub repository if it does not exist',
          status: 'pending',
          required: false,
          dependsOn: ['check-remote-repository'],
        },
        {
          operation: 'add-remote',
          description: 'Add remote using Container-Use MCP',
          status: 'pending',
          required: true,
          dependsOn: ['create-github-repository'],
        },
        {
          operation: 'push-initial-commit',
          description: 'Push initial commit to remote',
          status: 'pending',
          required: true,
          dependsOn: ['add-remote'],
        },
      ],
    },

    // Repository Information
    repository: {
      remote: null,
      url: null,
      owner: null,
      name: config.name,
      private: null,
      organization: config.githubOrg || null,
      defaultBranch: 'main',
      branches: {
        main: {
          exists: true,
          lastCommit: null,
        },
        'feature/boss-initial-setup': {
          exists: false,
          lastCommit: null,
        },
      },
    },

    // Current State
    currentBranch: 'main',
    currentWorkflow: {
      stage: 'initialization',
      phase: 'bootstrap-complete',
      status: 'ready-for-setup',
    },

    // Workflow Tracking
    workflow: {
      stage: 'initialization',
      phase: 'bootstrap-complete',
      activeWorkers: [],
      completedTasks: [],
      pendingTasks: [
        'Complete initial setup (remote repository)',
        'Switch to feature/boss-initial-setup branch',
        'Begin Spec-Kit workflow (Constitution → Clarification → Specification → Planning → Implementation)',
      ],
    },

    // Worker Management
    workers: {
      summaries: [],
      availableWorkers: [
        // Phase-Specific Workers
        'architect', // Phase 1: Constitution
        'clarifier', // Phase 2: Clarification
        'spec-writer', // Phase 3: Specification
        'planner', // Phase 4: Planning & Phase 6: Task Breakdown
        'reviewer', // Phase 5: Validation
        'developer-frontend', // Phase 7: Implementation
        'developer-backend', // Phase 7: Implementation
        'developer-fullstack', // Phase 7: Implementation
        'tester', // Phase 7: Implementation (Testing)
        'code-reviewer', // Phase 7: Implementation (Code Review)
        'consolidator', // Phase 8: Consolidation
        // Cross-Phase Workers
        'product-owner', // Cross-Phase: Business & Requirements
        'security-engineer', // Cross-Phase: Security
        'devops-engineer', // Cross-Phase: Infrastructure & Deployment
        'technical-writer', // Cross-Phase: Documentation
      ],
      maxConcurrent: 5,
      timeout: 3600,
    },

    // Quality Gates Configuration
    qualityGates: {
      preset: config.quality,
      requirements: {
        coverage: qualityInfo.gates.coverage ?? null,
        mutation: qualityInfo.gates.mutation ?? null,
        lint: qualityInfo.gates.lint ?? false,
        typecheck: qualityInfo.gates.typecheck ?? false,
        test: qualityInfo.gates.test ?? false,
        security: qualityInfo.gates.security ?? false,
      },
      enforcement: {
        testFirst: true,
        bdd: true,
        documentation: true,
      },
    },

    // BOSS Configuration
    boss: {
      version: '1.0.0',
      orchestrator: 'claude-code',
      mcpServers: {
        'container-use': {
          enabled: true,
          purpose: 'Worker management and file operations',
        },
        github: {
          enabled: true,
          purpose: 'Repository and PR management',
        },
        'knowledge-base': {
          enabled: true,
          purpose: 'Context and pattern search',
        },
      },
      restrictions: {
        noGitCLI: true,
        noHostFileSystem: true,
        mcpOnly: true,
      },
    },

    // Metadata
    metadata: {
      bootstrapVersion: '1.0.0',
      bootstrapDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes: 'Project bootstrapped successfully. Ready for initial setup.',
    },
  };

  await writeFile(
    path.join(projectPath, '.boss', 'project-config.json'),
    JSON.stringify(projectConfig, null, 2)
  );
}

// Project type mapping based on template characteristics
const PROJECT_TYPE_MAP: Record<string, string> = {
  // New template system
  't3-prisma': 'web-app',
  't3-drizzle': 'web-app',
  'nestjs-typeorm': 'api-service',
  'fastify-native': 'api-service',
  'astro-portfolio': 'static-site',
};

function getProjectType(template: string): string {
  return PROJECT_TYPE_MAP[template] || 'library';
}

function getStackForTemplate(template: string): string[] {
  const templateInfo = TEMPLATES[template as keyof typeof TEMPLATES];
  return templateInfo?.stack || [];
}
