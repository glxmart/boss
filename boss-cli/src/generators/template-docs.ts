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
  const templateMap: Record<string, string> = {
    'blank': 'template-docs/blank.md',
    'nextjs-app-turbo': 'template-docs/nextjs-app-turbo.md',
    'api-service-fastify': 'template-docs/api-service-fastify.md',
    't3-app': 'template-docs/t3-app.md'
  };
  
  const templatePath = templateMap[template] || templateMap['blank'];
  return await loadTemplate(templatePath, { config });
}
