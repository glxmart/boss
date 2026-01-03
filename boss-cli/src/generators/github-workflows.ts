import path from 'path';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateGitHubWorkflows(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  await ensureDirectory(path.join(projectPath, '.github', 'workflows'));

  // Generate boss-ci.yml
  await generateCIWorkflow(projectPath, config);

  // Generate boss-gates.yml
  await generateGatesWorkflow(projectPath, config);

  // Generate CODEOWNERS
  await generateCODEOWNERS(projectPath);
}

async function generateCIWorkflow(projectPath: string, _config: ProjectConfig): Promise<void> {
  const workflow = await loadTemplate('github-workflows/boss-ci.yml');
  await writeFile(path.join(projectPath, '.github', 'workflows', 'boss-ci.yml'), workflow);
}

async function generateGatesWorkflow(projectPath: string, _config: ProjectConfig): Promise<void> {
  const workflow = await loadTemplate('github-workflows/boss-gates.yml');
  await writeFile(path.join(projectPath, '.github', 'workflows', 'boss-gates.yml'), workflow);
}

async function generateCODEOWNERS(projectPath: string): Promise<void> {
  const codeowners = await loadTemplate('github-workflows/CODEOWNERS', {
    githubUser: process.env.GITHUB_USER || 'your-username',
  });
  await writeFile(path.join(projectPath, '.github', 'CODEOWNERS'), codeowners);
}
