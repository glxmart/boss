import path from 'path';
import { ensureDirectory } from '../utils/file-system.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateProjectStructure(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const directories = [
    '.boss',
    '.boss/workers',
    '.boss/quality-gates',
    '.boss/templates',
    '.specify',
    '.specify/specs',
    '.container-use',
    '.github',
    '.github/workflows',
    '.husky',
    'scripts',
    'src',
    'tests',
    'docs',
  ];

  for (const dir of directories) {
    await ensureDirectory(path.join(projectPath, dir));
  }
}
