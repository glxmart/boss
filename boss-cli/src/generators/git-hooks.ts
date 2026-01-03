import path from 'path';
import { writeFile, makeExecutable, ensureDirectory } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { QualityPreset } from '../types/index.js';

export async function generateGitHooks(projectPath: string, quality: QualityPreset): Promise<void> {
  await ensureDirectory(path.join(projectPath, '.husky'));
  await ensureDirectory(path.join(projectPath, 'scripts'));

  // Generate pre-commit check script
  await generatePreCommitCheckScript(projectPath);

  // Generate test changed files script
  await generateTestChangedScript(projectPath);

  // Generate pre-commit hook
  await generatePreCommitHook(projectPath, quality);

  // Generate commit-msg hook
  await generateCommitMsgHook(projectPath, quality);

  // Generate pre-push hook
  await generatePrePushHook(projectPath);

  // Generate security check script
  await generateSecurityCheckScript(projectPath);

  // Note: Husky initialization happens after package.json is created (in bootstrap.ts)
  // This ensures package.json with husky dependency exists before initialization
}

async function generatePreCommitCheckScript(projectPath: string): Promise<void> {
  const script = await loadTemplate('git-hooks/pre-commit-check.sh');
  const scriptPath = path.join(projectPath, 'scripts', 'pre-commit-check.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}

async function generateTestChangedScript(projectPath: string): Promise<void> {
  const script = await loadTemplate('git-hooks/test-changed.sh');
  const scriptPath = path.join(projectPath, 'scripts', 'test-changed.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}

async function generatePreCommitHook(projectPath: string, _quality: QualityPreset): Promise<void> {
  const hook = await loadTemplate('git-hooks/pre-commit.sh');
  const hookPath = path.join(projectPath, '.husky', 'pre-commit');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generateCommitMsgHook(projectPath: string, _quality: QualityPreset): Promise<void> {
  const hook = await loadTemplate('git-hooks/commit-msg.sh');
  const hookPath = path.join(projectPath, '.husky', 'commit-msg');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generatePrePushHook(projectPath: string): Promise<void> {
  const hook = await loadTemplate('git-hooks/pre-push.sh');
  const hookPath = path.join(projectPath, '.husky', 'pre-push');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generateSecurityCheckScript(projectPath: string): Promise<void> {
  const script = await loadTemplate('git-hooks/security-check.sh');
  const scriptPath = path.join(projectPath, 'scripts', 'security-check.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}
