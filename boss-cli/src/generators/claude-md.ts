import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile, copyDirectory, readFile } from '../utils/file-system.js';
import { getAssetPath } from '../utils/template-loader.js';
import { TEMPLATES, QUALITY_PRESETS } from '../utils/prompts.js';
import type { ProjectConfig } from '../types/index.js';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate CLAUDE.md file for a project
 *
 * Creates a generic CLAUDE.md that works across all templates,
 * focusing on BOSS integration and common development workflows.
 */
export async function generateClaudeMD(projectPath: string, config: ProjectConfig): Promise<void> {
  const templateInfo = TEMPLATES[config.template];
  const qualityInfo = QUALITY_PRESETS[config.quality];

  // Load template file
  const templatePath = getAssetPath('claude-md/template.md');
  const templateSource = await readFile(templatePath);

  // Compile and render with Handlebars
  const template = Handlebars.compile(templateSource);
  const content = template({
    config,
    templateInfo: {
      name: templateInfo?.name || config.template,
      stack: formatStackForDisplay(templateInfo?.stack || []),
    },
    qualityInfo: {
      name: qualityInfo?.name || config.quality,
      gates: {
        coverage: qualityInfo?.gates.coverage || 80,
        mutation: qualityInfo?.gates.mutation || 80,
      },
    },
  });

  await writeFile(path.join(projectPath, 'CLAUDE.md'), content);

  // Copy docs folder from assets to project root
  const assetsDocsPath = path.join(__dirname, '../../assets/claude-md/docs');
  const projectDocsPath = path.join(projectPath, 'docs');
  const { pathExists } = await import('../utils/file-system.js');
  if (await pathExists(assetsDocsPath)) {
    await copyDirectory(assetsDocsPath, projectDocsPath);
  }
}

// Display-friendly stack names
const STACK_DISPLAY_NAMES: Record<string, string> = {
  nextjs: 'Next.js 15',
  turborepo: 'Turborepo',
  typescript: 'TypeScript',
  tailwind: 'Tailwind CSS',
  'shadcn-ui': 'shadcn/ui',
  prisma: 'Prisma',
  drizzle: 'Drizzle',
  trpc: 'tRPC',
  nextauth: 'NextAuth.js',
  vitest: 'Vitest',
  storybook: 'Storybook',
  kamal: 'Kamal',
  fastify: 'Fastify',
  nestjs: 'NestJS',
  typeorm: 'TypeORM',
  astro: 'Astro',
  react: 'React',
};

function formatStackForDisplay(stack: string[]): string {
  return stack.map((item) => STACK_DISPLAY_NAMES[item] || item).join(', ');
}
