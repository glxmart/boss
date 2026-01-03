import path from 'path';
import fs from 'fs-extra';

export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      error: 'Project name must contain only lowercase letters, numbers, and hyphens',
    };
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    return { valid: false, error: 'Project name cannot start or end with a hyphen' };
  }

  return { valid: true };
}

export async function validateProjectDirectory(
  dir: string
): Promise<{ valid: boolean; error?: string }> {
  const fullPath = path.resolve(dir);

  if (await fs.pathExists(fullPath)) {
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      return { valid: false, error: `Path exists but is not a directory: ${fullPath}` };
    }

    const files = await fs.readdir(fullPath);
    if (files.length > 0) {
      return { valid: false, error: `Directory is not empty: ${fullPath}` };
    }
  }

  return { valid: true };
}

export function validateTemplate(template: string): { valid: boolean; error?: string } {
  const validTemplates = ['nextjs-app-turbo', 'api-service-fastify', 'blank', 't3-app'];
  if (!validTemplates.includes(template)) {
    return {
      valid: false,
      error: `Invalid template: ${template}. Must be one of: ${validTemplates.join(', ')}`,
    };
  }
  return { valid: true };
}

export function validateQualityPreset(quality: string): { valid: boolean; error?: string } {
  const validPresets = ['startup', 'production', 'enterprise'];
  if (!validPresets.includes(quality)) {
    return {
      valid: false,
      error: `Invalid quality preset: ${quality}. Must be one of: ${validPresets.join(', ')}`,
    };
  }
  return { valid: true };
}

export function validateMCPScope(scope: string): { valid: boolean; error?: string } {
  const validScopes = ['user', 'project', 'both'];
  if (!validScopes.includes(scope)) {
    return {
      valid: false,
      error: `Invalid MCP scope: ${scope}. Must be one of: ${validScopes.join(', ')}`,
    };
  }
  return { valid: true };
}
