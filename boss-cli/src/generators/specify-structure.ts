import path from 'path';
import { copyDirectory, makeExecutableRecursive, ensureDirectory } from '../utils/file-system.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function copySpecKitStructure(projectPath: string): Promise<void> {
  // Get path to bundled Spec-Kit in CLI
  const specKitPath = path.join(__dirname, '../../templates/spec-kit');

  // Ensure .specify directory exists
  await ensureDirectory(path.join(projectPath, '.specify'));

  // Copy Spec-Kit structure from CLI bundle to project
  if (await import('fs-extra').then((m) => m.default.pathExists(specKitPath))) {
    const fs = await import('fs-extra');

    // Copy templates
    if (await fs.pathExists(path.join(specKitPath, 'templates'))) {
      await copyDirectory(
        path.join(specKitPath, 'templates'),
        path.join(projectPath, '.specify', 'templates')
      );
    }

    // Copy scripts
    if (await fs.pathExists(path.join(specKitPath, 'scripts'))) {
      await copyDirectory(
        path.join(specKitPath, 'scripts'),
        path.join(projectPath, '.specify', 'scripts')
      );
      // Make scripts executable
      await makeExecutableRecursive(path.join(projectPath, '.specify', 'scripts'));
    }

    // Copy memory
    if (await fs.pathExists(path.join(specKitPath, 'memory'))) {
      await copyDirectory(
        path.join(specKitPath, 'memory'),
        path.join(projectPath, '.specify', 'memory')
      );
    }

    // Copy specify_cli if it exists
    if (await fs.pathExists(path.join(specKitPath, 'src', 'specify_cli'))) {
      await copyDirectory(
        path.join(specKitPath, 'src', 'specify_cli'),
        path.join(projectPath, '.specify', 'specify_cli')
      );
    }
  } else {
    // If Spec-Kit bundle doesn't exist, create minimal structure
    await ensureDirectory(path.join(projectPath, '.specify', 'templates'));
    await ensureDirectory(path.join(projectPath, '.specify', 'scripts'));
    await ensureDirectory(path.join(projectPath, '.specify', 'memory'));
    await ensureDirectory(path.join(projectPath, '.specify', 'specs'));
  }
}
