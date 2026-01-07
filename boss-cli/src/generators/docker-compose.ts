import path from 'path';
import { writeFile } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { Template, ProjectConfig } from '../types/index.js';
import { getTemplatePort, isStaticSite } from './dockerfile.js';

/**
 * Generate docker-compose.yml with infrastructure services and optionally the app service
 * @param projectPath Path to the project
 * @param template Optional template for app service configuration
 * @param config Optional project config for app service configuration
 */
export async function generateDockerCompose(
  projectPath: string,
  template?: Template,
  config?: ProjectConfig
): Promise<void> {
  // Load base docker-compose template (infrastructure services)
  const baseDockerCompose = await loadTemplate('docker-compose/docker-compose.yml');

  // If template is provided, add the app service
  if (template && config) {
    const appService = generateAppService(template, config);
    const fullDockerCompose = insertAppService(baseDockerCompose, appService);
    await writeFile(path.join(projectPath, 'docker-compose.yml'), fullDockerCompose);
  } else {
    // Just infrastructure services
    await writeFile(path.join(projectPath, 'docker-compose.yml'), baseDockerCompose);
  }
}

/**
 * Generate the app service configuration for docker-compose
 */
function generateAppService(template: Template, config: ProjectConfig): string {
  const port = getTemplatePort(template);
  const isStatic = isStaticSite(template);

  // Static sites (Astro) don't need database dependencies
  const dependencies = isStatic ? [] : ['postgres'];

  const dependsOnSection =
    dependencies.length > 0
      ? `
    depends_on:
${dependencies.map((dep) => `      ${dep}:\n        condition: service_healthy`).join('\n')}`
      : '';

  // Environment variables differ based on template type
  const envVars = isStatic ? [] : getEnvVarsForTemplate(template);

  const environmentSection =
    envVars.length > 0
      ? `
    environment:
${envVars.map((env) => `      - ${env}`).join('\n')}`
      : '';

  return `  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${config.name}-app
    ports:
      - "${port}:${port}"${dependsOnSection}${environmentSection}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:${port}/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
`;
}

/**
 * Get environment variables for a template type
 */
function getEnvVarsForTemplate(template: Template): string[] {
  const baseEnvVars = ['NODE_ENV=production'];

  switch (template) {
    case 't3-prisma':
    case 't3-drizzle':
      return [
        ...baseEnvVars,
        'DATABASE_URL=postgresql://boss:bosssecret@postgres:5432/boss_knowledge',
      ];

    case 'nestjs-typeorm':
      return [
        ...baseEnvVars,
        'DATABASE_HOST=postgres',
        'DATABASE_PORT=5432',
        'DATABASE_USER=boss',
        'DATABASE_PASSWORD=bosssecret',
        'DATABASE_NAME=boss_knowledge',
      ];

    case 'fastify-native':
      return [
        ...baseEnvVars,
        'DATABASE_URL=postgresql://boss:bosssecret@postgres:5432/boss_knowledge',
      ];

    default:
      return baseEnvVars;
  }
}

/**
 * Insert app service into docker-compose content
 * Inserts the app service as the first service in the services section
 */
function insertAppService(baseContent: string, appService: string): string {
  // Find the services: section and insert the app service after it
  const servicesMatch = baseContent.match(/^services:\s*$/m);
  if (!servicesMatch) {
    // If no services section, add one
    return `${baseContent.trim()}\n\nservices:\n${appService}`;
  }

  const insertPosition = (servicesMatch.index ?? 0) + servicesMatch[0].length;
  return (
    baseContent.slice(0, insertPosition) + '\n' + appService + baseContent.slice(insertPosition)
  );
}
