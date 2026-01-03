import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile, copyDirectory } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { ProjectConfig } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateClaudeMD(projectPath: string, config: ProjectConfig): Promise<void> {
  const templateInfo = getTemplateInfo(config.template);
  const qualityInfo = getQualityInfo(config.quality);

  const content = await loadTemplate('claude-md/template.md', {
    config,
    templateInfo: {
      name: templateInfo.name,
      stack: templateInfo.stack.join(', '),
    },
    qualityInfo: {
      name: qualityInfo.name,
      gates: {
        coverage: qualityInfo.gates.coverage || 80,
        mutation: qualityInfo.gates.mutation || 80,
      },
    },
  });

  await writeFile(path.join(projectPath, 'CLAUDE.md'), content);

  // Copy docs folder from assets to project root
  const assetsDocsPath = path.join(__dirname, '../../assets/claude-md/docs');
  const projectDocsPath = path.join(projectPath, 'docs');
  const { pathExists } = await import('../utils/file-system.js');
  const docsExists = await pathExists(assetsDocsPath);
  if (docsExists) {
    await copyDirectory(assetsDocsPath, projectDocsPath);
  }
}

function getTemplateInfo(template: string): { name: string; stack: string[] } {
  const templates: Record<string, { name: string; stack: string[] }> = {
    'nextjs-app-turbo': {
      name: 'Next.js App (Turbo)',
      stack: ['Next.js 15', 'TypeScript', 'Tailwind', 'Prisma', 'Vitest', 'shadcn/ui'],
    },
    'api-service-fastify': {
      name: 'API Service (Fastify)',
      stack: ['Fastify', 'TypeScript', 'Prisma', 'Vitest'],
    },
    't3-app': {
      name: 'T3 App',
      stack: ['Next.js', 'TypeScript', 'Tailwind', 'Prisma', 'tRPC', 'NextAuth.js'],
    },
    blank: {
      name: 'Blank',
      stack: ['TypeScript', 'Vitest'],
    },
  };
  return templates[template] || { name: template, stack: [] };
}

function getQualityInfo(quality: string): {
  name: string;
  gates: { coverage?: number; mutation?: number };
} {
  const qualities: Record<
    string,
    { name: string; gates: { coverage?: number; mutation?: number } }
  > = {
    startup: { name: 'Startup', gates: { coverage: 60 } },
    production: { name: 'Production', gates: { coverage: 80, mutation: 80 } },
    enterprise: { name: 'Enterprise', gates: { coverage: 90, mutation: 80 } },
  };
  return qualities[quality] || { name: quality, gates: {} };
}
