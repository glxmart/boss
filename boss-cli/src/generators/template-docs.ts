import path from 'path';
import { writeFile } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { ProjectConfig, Template } from '../types/index.js';

export async function generateTemplateDocs(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const docContent = await getTemplateDocContent(config.template, config);
  const docPath = path.join(projectPath, 'docs', 'TEMPLATE.md');
  await writeFile(docPath, docContent);
}

async function getTemplateDocContent(template: Template, config: ProjectConfig): Promise<string> {
  // Template documentation files for each external template
  const templateMap: Record<Template, string> = {
    't3-prisma': 'template-docs/t3-prisma.md',
    't3-drizzle': 'template-docs/t3-drizzle.md',
    'nestjs-typeorm': 'template-docs/nestjs-typeorm.md',
    'fastify-native': 'template-docs/fastify-native.md',
    'astro-portfolio': 'template-docs/astro-portfolio.md',
  };

  const templatePath = templateMap[template];
  return await loadTemplate(templatePath, { config });
}
