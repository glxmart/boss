import path from 'path';
import { writeFile } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { Template, ProjectConfig } from '../types/index.js';

/**
 * Dockerfile configuration per template type
 */
interface DockerfileConfig {
  templateFile: string; // Asset path to Dockerfile template
  port: number; // Application port
  entrypoint: string; // Entry point file (relative to dist/)
  needsNginxConfig?: boolean; // Whether nginx.conf is needed (for static sites)
}

/**
 * Get Dockerfile configuration for a template
 */
function getDockerfileConfig(template: Template): DockerfileConfig {
  switch (template) {
    // T3 Stack (Next.js) - runs as Node.js server
    case 't3-prisma':
    case 't3-drizzle':
      return {
        templateFile: 'dockerfiles/node.Dockerfile',
        port: 3000,
        entrypoint: 'server.js',
      };

    // NestJS - runs as Node.js server
    case 'nestjs-typeorm':
      return {
        templateFile: 'dockerfiles/node.Dockerfile',
        port: 3000,
        entrypoint: 'main.js',
      };

    // Fastify - runs as Node.js server
    case 'fastify-native':
      return {
        templateFile: 'dockerfiles/node.Dockerfile',
        port: 3000,
        entrypoint: 'index.js',
      };

    // Astro - static site served by nginx
    case 'astro-portfolio':
      return {
        templateFile: 'dockerfiles/astro.Dockerfile',
        port: 80,
        entrypoint: 'index.html',
        needsNginxConfig: true,
      };

    default:
      // Default to Node.js configuration
      return {
        templateFile: 'dockerfiles/node.Dockerfile',
        port: 3000,
        entrypoint: 'index.js',
      };
  }
}

/**
 * Generate Dockerfile for the project based on template type
 */
export async function generateDockerfile(
  projectPath: string,
  template: Template,
  _config: ProjectConfig
): Promise<void> {
  const dockerConfig = getDockerfileConfig(template);

  // Load and interpolate Dockerfile template
  const dockerfileContent = await loadTemplate(dockerConfig.templateFile, {
    port: dockerConfig.port,
    entrypoint: dockerConfig.entrypoint,
  });

  // Write Dockerfile
  await writeFile(path.join(projectPath, 'Dockerfile'), dockerfileContent);

  // Generate nginx.conf for static sites
  if (dockerConfig.needsNginxConfig) {
    const nginxConfig = await loadTemplate('dockerfiles/nginx.conf');
    await writeFile(path.join(projectPath, 'nginx.conf'), nginxConfig);
  }
}

/**
 * Generate .dockerignore file for the project
 */
export async function generateDockerignore(projectPath: string): Promise<void> {
  const dockerignoreContent = await loadTemplate('dockerfiles/dockerignore');
  await writeFile(path.join(projectPath, '.dockerignore'), dockerignoreContent);
}

/**
 * Generate all Docker-related files for a project
 * This is the main entry point for Phase 3 Dockerfile generation
 */
export async function generateDockerFiles(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  await generateDockerfile(projectPath, template, config);
  await generateDockerignore(projectPath);
}

/**
 * Get the application port for a given template
 * Useful for docker-compose service configuration
 */
export function getTemplatePort(template: Template): number {
  return getDockerfileConfig(template).port;
}

/**
 * Check if a template produces a static site (served by nginx)
 */
export function isStaticSite(template: Template): boolean {
  return getDockerfileConfig(template).needsNginxConfig === true;
}
