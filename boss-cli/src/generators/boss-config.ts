import path from 'path';
import yaml from 'js-yaml';
import { writeFile } from '../utils/file-system.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateBossConfig(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const bossConfig = {
    boss: {
      version: '1.0.0',
      template: config.template,
      quality: config.quality
    },
    project: {
      name: config.name,
      type: getProjectType(config.template),
      stack: getStackForTemplate(config.template)
    },
    workers: {
      max_concurrent: 5,
      timeout: 3600
    },
    quality: {
      preset: config.quality,
      gates: {} // Will be populated by quality preset
    }
  };

  const yamlContent = yaml.dump(bossConfig, { indent: 2 });
  await writeFile(
    path.join(projectPath, '.boss', 'config.yaml'),
    yamlContent
  );
}

function getProjectType(template: string): string {
  if (template === 'nextjs-app-turbo') return 'web-app';
  if (template === 't3-app') return 'web-app';
  if (template === 'api-service-fastify') return 'api-service';
  return 'library';
}

function getStackForTemplate(template: string): string[] {
  const stacks: Record<string, string[]> = {
    'nextjs-app-turbo': ['nextjs', 'typescript', 'tailwind', 'prisma', 'vitest', 'shadcn-ui'],
    'api-service-fastify': ['fastify', 'typescript', 'prisma', 'vitest'],
    't3-app': ['nextjs', 'typescript', 'tailwind', 'prisma', 'trpc', 'nextauth'],
    'blank': ['typescript', 'vitest']
  };
  return stacks[template] || [];
}

