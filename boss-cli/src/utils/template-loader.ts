import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { promises as fsPromises } from 'fs';
import { readFile } from './file-system.js';
import type { TemplateVariables } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the path to the assets folder
 * Works in both development (src/) and production (dist/) environments
 */
export function getAssetPath(relativePath: string, baseDir?: string): string {
  // If baseDir is provided (for testing), use it
  if (baseDir) {
    return path.join(baseDir, 'assets', relativePath);
  }

  // In development: src/utils/ -> assets is at boss-cli/assets/
  // In production: dist/utils/ -> assets is at boss-cli/assets/
  // Go up from utils/ to boss-cli/ root, then to assets/
  const bossCliRoot = path.resolve(__dirname, '../..');
  return path.join(bossCliRoot, 'assets', relativePath);
}

/**
 * Resolve nested object property path (e.g., "config.name" -> config.name)
 */
function resolveNestedProperty(obj: TemplateVariables, path: string): unknown {
  return path.split('.').reduce<unknown>((current, prop) => {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[prop];
  }, obj);
}

/**
 * Interpolate variables in template string
 * Supports: ${variable} and ${config.property}
 */
function interpolateTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, varPath) => {
    const trimmedPath = String(varPath).trim();

    // Try direct property first
    if (Object.hasOwn(variables, trimmedPath) && variables[trimmedPath] !== undefined) {
      const val = variables[trimmedPath];
      return typeof val === 'object' ? JSON.stringify(val) : String(val);
    }

    // Try nested property (e.g., config.name)
    const value = resolveNestedProperty(variables, trimmedPath);
    if (value !== undefined && value !== null) {
      // Handle objects (including arrays) specially to avoid '[object Object]'
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      // At this point, value is a primitive (string | number | boolean)
      return (value as string | number | boolean).toString();
    }

    // If not found, return the original placeholder
    return match;
  });
}

/**
 * Load a template file and interpolate variables
 * @param assetPath Relative path from assets/ folder (e.g., "git-hooks/pre-commit.sh")
 * @param variables Variables to interpolate in the template
 * @param baseDir Optional base directory for testing
 */
export async function loadTemplate(
  assetPath: string,
  variables: TemplateVariables = {},
  baseDir?: string
): Promise<string> {
  const fullPath = getAssetPath(assetPath, baseDir);

  if (!(await fs.pathExists(fullPath))) {
    throw new Error(`Template file not found: ${fullPath}`);
  }

  const template = await readFile(fullPath);
  return interpolateTemplate(template, variables);
}

/**
 * Discover all worker folders in assets/worker-configs/
 * @param baseDir Optional base directory for testing
 */
export async function discoverWorkers(baseDir?: string): Promise<string[]> {
  const workerConfigsPath = getAssetPath('worker-configs', baseDir);

  // Return empty array if directory doesn't exist
  if (!(await fs.pathExists(workerConfigsPath))) {
    return [];
  }

  const entries = await fsPromises.readdir(workerConfigsPath, { withFileTypes: true });
  const workers: string[] = [];

  for (const entry of entries) {
    // Filter out hidden files and common non-worker directories
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    // Only include directories
    if (entry.isDirectory()) {
      workers.push(entry.name);
    }
  }

  return workers.sort(); // Return sorted for consistency
}
