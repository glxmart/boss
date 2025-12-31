import inquirer from 'inquirer';
import type { Template, QualityPreset, TemplateInfo, QualityPresetInfo } from '../types/index.js';

export const TEMPLATES: Record<Template, TemplateInfo> = {
  'nextjs-app-turbo': {
    name: 'Next.js App (Turbo)',
    description: 'Next.js 15 + Turbo + Tailwind + Prisma + Vitest + shadcn/ui',
    stack: ['nextjs', 'typescript', 'tailwind', 'prisma', 'vitest', 'shadcn-ui']
  },
  'api-service-fastify': {
    name: 'API Service (Fastify)',
    description: 'Fastify + TypeScript + Prisma + Vitest',
    stack: ['fastify', 'typescript', 'prisma', 'vitest']
  },
  't3-app': {
    name: 'T3 App',
    description: 'T3 Stack - Next.js + tRPC + Tailwind + TypeScript + Prisma + NextAuth.js',
    stack: ['nextjs', 'typescript', 'tailwind', 'prisma', 'trpc', 'nextauth']
  },
  'blank': {
    name: 'Blank',
    description: 'Minimal TypeScript + Vitest setup',
    stack: ['typescript', 'vitest']
  }
};

export const QUALITY_PRESETS: Record<QualityPreset, QualityPresetInfo> = {
  'startup': {
    name: 'Startup',
    description: 'Fast iteration, minimal gates',
    gates: {
      lint: true,
      typecheck: true,
      test: true,
      coverage: 60
    }
  },
  'production': {
    name: 'Production',
    description: 'Balanced quality & speed',
    gates: {
      lint: true,
      typecheck: true,
      test: true,
      coverage: 80,
      mutation: 80
    }
  },
  'enterprise': {
    name: 'Enterprise',
    description: 'Maximum quality, comprehensive checks',
    gates: {
      lint: true,
      typecheck: true,
      test: true,
      coverage: 90,
      mutation: 80,
      security: true
    }
  }
};

export async function promptProjectName(): Promise<string> {
  const { name } = await inquirer.prompt([
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
      }
    }
  ]);
  return name.trim();
}

export async function promptTemplate(): Promise<Template> {
  const choices = Object.entries(TEMPLATES).map(([value, info]) => ({
    name: `${info.name} - ${info.description}`,
    value
  }));

  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices
    }
  ]);
  return template;
}

export async function promptQualityPreset(): Promise<QualityPreset> {
  const choices = Object.entries(QUALITY_PRESETS).map(([value, info]) => ({
    name: `${info.name} - ${info.description}`,
    value
  }));

  const { quality } = await inquirer.prompt([
    {
      type: 'list',
      name: 'quality',
      message: 'Select a quality preset:',
      choices
    }
  ]);
  return quality;
}

export async function promptGitHubConfig(): Promise<{ repo?: string; org?: string }> {
  const { configure } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configure',
      message: 'Configure GitHub repository?',
      default: false
    }
  ]);

  if (!configure) {
    return {};
  }

  const { org, repo } = await inquirer.prompt([
    {
      type: 'input',
      name: 'org',
      message: 'GitHub organization:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Organization is required';
        }
        return true;
      }
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
      }
    }
  ]);

  return { org: org.trim(), repo: repo.trim() };
}

export async function confirmBootstrap(config: {
  name: string;
  template: Template;
  quality: QualityPreset;
  githubRepo?: string;
}, nonInteractive: boolean = false): Promise<boolean> {
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

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with bootstrap?',
      default: true
    }
  ]);

  return confirm;
}

