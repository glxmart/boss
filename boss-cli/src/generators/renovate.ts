import path from 'path';
import { copyFile } from '../utils/file-system.js';
import { getAssetPath } from '../utils/template-loader.js';

/**
 * Generate renovate.json for automated dependency updates
 *
 * Creates a Renovate configuration file with:
 * - Semantic commits for dependency updates
 * - Grouped updates for related packages
 * - Automerge for safe updates (patches, dev dependencies)
 * - Manual review for major updates
 * - Vulnerability alert handling
 */
export async function generateRenovateConfig(projectPath: string): Promise<void> {
  const sourcePath = getAssetPath('renovate/renovate.json');
  const destPath = path.join(projectPath, 'renovate.json');

  await copyFile(sourcePath, destPath);
}
