import inquirer from 'inquirer';
import type {
  Template,
  TemplateCategory,
  QualityPreset,
  MCPScope,
  TemplateInfo,
  TemplateCategoryInfo,
  QualityPresetInfo,
} from '../types/index.js';

// Template categories for the new category-based selection flow
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, TemplateCategoryInfo> = {
  fullstack: {
    name: 'Full Stack',
    description: 'Complete web applications with frontend and backend',
    templates: ['t3-prisma', 't3-drizzle'],
  },
  backend: {
    name: 'Backend',
    description: 'API services and server-side applications',
    templates: ['nestjs-typeorm', 'fastify-native'],
    // 'spring-boot-jpa' deferred to Phase B
  },
  frontend: {
    name: 'Frontend',
    description: 'Static sites and frontend-only applications',
    templates: ['astro-portfolio'],
  },
};

// New external template definitions
export const TEMPLATES: Record<Template, TemplateInfo> = {
  't3-prisma': {
    name: 'T3 Stack (Prisma)',
    description: 'Next.js + tRPC + Tailwind + Prisma + NextAuth.js',
    stack: ['nextjs', 'typescript', 'tailwind', 'prisma', 'trpc', 'nextauth', 'shadcn-ui'],
    category: 'fullstack',
    externalCommand: 'pnpm create t3-app@latest --prisma --tailwind --trpc --nextAuth',
    postProcessing: ['Add shadcn/ui', 'Add pino logging', 'Add error boundaries'],
  },
  't3-drizzle': {
    name: 'T3 Stack (Drizzle)',
    description: 'Next.js + tRPC + Tailwind + Drizzle ORM + NextAuth.js',
    stack: ['nextjs', 'typescript', 'tailwind', 'drizzle', 'trpc', 'nextauth', 'shadcn-ui'],
    category: 'fullstack',
    externalCommand: 'pnpm create t3-app@latest --drizzle --tailwind --trpc --nextAuth',
    postProcessing: ['Add shadcn/ui', 'Add pino logging', 'Add error boundaries'],
  },
  'nestjs-typeorm': {
    name: 'NestJS (TypeORM)',
    description: 'NestJS boilerplate with TypeORM, JWT auth, and best practices',
    stack: ['nestjs', 'typescript', 'typeorm', 'postgresql', 'jwt', 'swagger'],
    category: 'backend',
    externalCommand: 'git clone brocoders/nestjs-boilerplate',
    postProcessing: ['Add pino logging', 'Add global exception filters'],
  },
  'fastify-native': {
    name: 'Fastify Native',
    description: 'High-performance Fastify API with TypeBox validation',
    stack: ['fastify', 'typescript', 'typebox', 'prisma', 'vitest'],
    category: 'backend',
    externalCommand: 'pnpm create fastify',
    postProcessing: ['Add Prisma', 'Add TypeBox validation', 'Add pino logging'],
  },
  'astro-portfolio': {
    name: 'Astro Portfolio',
    description: 'Static portfolio site with Astro and React islands',
    stack: ['astro', 'typescript', 'tailwind', 'react'],
    category: 'frontend',
    externalCommand: 'pnpm create astro -- --template portfolio',
    postProcessing: ['Add React integration', 'Add Tailwind CSS'],
  },
  // 'spring-boot-jpa' deferred to Phase B (Java support)
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

export async function promptTemplateCategory(): Promise<TemplateCategory> {
  const choices = Object.entries(TEMPLATE_CATEGORIES).map(([value, info]) => ({
    name: `${info.name} - ${info.description}`,
    value,
  }));

  const { category } = await inquirer.prompt<{ category: TemplateCategory }>([
    {
      type: 'list',
      name: 'category',
      message: 'Select a project category:',
      choices,
    },
  ]);
  return category;
}

export async function promptTemplateInCategory(category: TemplateCategory): Promise<Template> {
  const categoryInfo = TEMPLATE_CATEGORIES[category];
  const choices = categoryInfo.templates.map((templateKey) => {
    const info = TEMPLATES[templateKey];
    return {
      name: `${info.name} - ${info.description}`,
      value: templateKey,
    };
  });

  const { template } = await inquirer.prompt<{ template: Template }>([
    {
      type: 'list',
      name: 'template',
      message: `Select a ${categoryInfo.name.toLowerCase()} template:`,
      choices,
    },
  ]);
  return template;
}

export async function promptTemplate(): Promise<Template> {
  // New flow: Category -> Template
  const category = await promptTemplateCategory();
  return promptTemplateInCategory(category);
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
