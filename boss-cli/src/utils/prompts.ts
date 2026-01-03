import inquirer from 'inquirer';
import type {
  Template,
  QualityPreset,
  MCPScope,
  TemplateInfo,
  QualityPresetInfo,
} from '../types/index.js';

export const TEMPLATES: Record<Template, TemplateInfo> = {
  'nextjs-app-turbo': {
    name: 'Next.js Turbo Monorepo',
    description: 'Next.js 15 + Turborepo + shadcn/ui + Prisma + tRPC + NextAuth + Vitest + Storybook + Kamal',
    stack: [
      'nextjs',
      'turborepo',
      'typescript',
      'tailwind',
      'shadcn-ui',
      'prisma',
      'trpc',
      'nextauth',
      'vitest',
      'storybook',
      'kamal',
    ],
  },
  'api-service-fastify': {
    name: 'API Service (Fastify)',
    description: 'Fastify + TypeScript + Prisma + Vitest',
    stack: ['fastify', 'typescript', 'prisma', 'vitest'],
  },
  't3-app': {
    name: 'T3 App',
    description: 'T3 Stack - Next.js + tRPC + Tailwind + TypeScript + Prisma + NextAuth.js',
    stack: ['nextjs', 'typescript', 'tailwind', 'prisma', 'trpc', 'nextauth'],
  },
  blank: {
    name: 'Blank',
    description: 'Minimal TypeScript + Vitest setup',
    stack: ['typescript', 'vitest'],
  },
};

export const QUALITY_PRESETS: Record<QualityPreset, QualityPresetInfo> = {
  startup: {
    name: 'Startup',
    description: 'Fast iteration, minimal gates',
    gates: {
      lint: true,
      typecheck: true,
      test: true,
      coverage: 60,
    },
  },
  production: {
    name: 'Production',
    description: 'Balanced quality & speed',
    gates: {
      lint: true,
      typecheck: true,
      test: true,
      coverage: 80,
      mutation: 80,
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Maximum quality, comprehensive checks',
    gates: {
      lint: true,
      typecheck: true,
      test: true,
      coverage: 90,
      mutation: 80,
      security: true,
    },
  },
};

export async function promptProjectName(): Promise<string> {
  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Project name is required';
        }
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    },
  ]);
  return name.trim();
}

export async function promptTemplate(): Promise<Template> {
  const choices = Object.entries(TEMPLATES).map(([value, info]) => ({
    name: `${info.name} - ${info.description}`,
    value,
  }));

  const { template } = await inquirer.prompt<{ template: Template }>([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices,
    },
  ]);
  return template;
}

export async function promptQualityPreset(): Promise<QualityPreset> {
  const choices = Object.entries(QUALITY_PRESETS).map(([value, info]) => ({
    name: `${info.name} - ${info.description}`,
    value,
  }));

  const { quality } = await inquirer.prompt<{ quality: QualityPreset }>([
    {
      type: 'list',
      name: 'quality',
      message: 'Select a quality preset:',
      choices,
    },
  ]);
  return quality;
}

export async function promptMCPScope(): Promise<MCPScope> {
  const { scope } = await inquirer.prompt<{ scope: MCPScope }>([
    {
      type: 'list',
      name: 'scope',
      message: 'MCP configuration scope:',
      choices: [
        {
          name: 'User (Global) - Install MCP config in IDE settings (~/.cursor or ~/.config/claude-code)',
          value: 'user',
        },
        {
          name: 'Project - Install MCP config in project directory (.mcp.json)',
          value: 'project',
        },
        {
          name: 'Both - Install in both user and project locations',
          value: 'both',
        },
      ],
      default: 'both',
    },
  ]);
  return scope;
}

export async function promptGitHubConfig(): Promise<{ repo?: string; org?: string }> {
  const { configure } = await inquirer.prompt<{ configure: boolean }>([
    {
      type: 'confirm',
      name: 'configure',
      message: 'Configure GitHub repository?',
      default: false,
    },
  ]);

  if (!configure) {
    return {};
  }

  const { org, repo } = await inquirer.prompt<{ org: string; repo: string }>([
    {
      type: 'input',
      name: 'org',
      message: 'GitHub organization:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Organization is required';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'repo',
      message: 'GitHub repository name:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Repository name is required';
        }
        return true;
      },
    },
  ]);

  return { org: org.trim(), repo: repo.trim() };
}

export async function confirmBootstrap(
  config: {
    name: string;
    template: Template;
    quality: QualityPreset;
    githubRepo?: string;
  },
  nonInteractive: boolean = false
): Promise<boolean> {
  const templateInfo = TEMPLATES[config.template];
  const qualityInfo = QUALITY_PRESETS[config.quality];

  console.log('\n' + '='.repeat(60));
  console.log('Bootstrap Configuration:');
  console.log('='.repeat(60));
  console.log(`Project Name: ${config.name}`);
  console.log(`Template: ${templateInfo.name}`);
  console.log(`Quality Preset: ${qualityInfo.name}`);
  if (config.githubRepo) {
    console.log(`GitHub Repo: ${config.githubRepo}`);
  }
  console.log('='.repeat(60) + '\n');

  if (nonInteractive) {
    return true;
  }

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with bootstrap?',
      default: true,
    },
  ]);

  return confirm;
}
