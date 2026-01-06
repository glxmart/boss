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
  // New template system - map new templates to doc templates
  // For now, use t3-app docs for T3 variants, fastify for backend, and blank for others
  const templateMap: Record<string, string> = {
    't3-prisma': 'template-docs/t3-app.md',
    't3-drizzle': 'template-docs/t3-app.md',
    'nestjs-typeorm': 'template-docs/api-service-fastify.md', // Use API template for NestJS
    'fastify-native': 'template-docs/api-service-fastify.md',
    'astro-portfolio': 'template-docs/blank.md', // Use blank for Astro until we have a dedicated template
  };

  const templatePath = templateMap[template] || 'template-docs/blank.md';
  return await loadTemplate(templatePath, { config });
}
