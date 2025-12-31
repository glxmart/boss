import path from 'path';
import { writeFile, makeExecutable, ensureDirectory } from '../utils/file-system.js';
import type { QualityPreset } from '../types/index.js';

export async function generateGitHooks(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  await ensureDirectory(path.join(projectPath, '.husky'));

  // Generate pre-commit hook
  await generatePreCommitHook(projectPath, quality);

  // Generate commit-msg hook
  await generateCommitMsgHook(projectPath, quality);
}

async function generatePreCommitHook(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  const commands = quality === 'startup'
    ? ['pnpm lint-staged', 'pnpm typecheck']
    : ['pnpm lint-staged', 'pnpm typecheck', 'pnpm test-affected'];

  const hook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

${commands.join('\n')}
`;

  const hookPath = path.join(projectPath, '.husky', 'pre-commit');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

async function generateCommitMsgHook(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  const hook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Conventional commits validation
commit_regex="${
  quality === 'enterprise'
    ? '^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\\(.+\\))?: .+'
    : '^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\\(.+\\))?: .+'
}"

if ! grep -qE "$commit_regex" "$1"; then
  echo "Invalid commit message format!"
  echo "Expected: <type>(<scope>): <description>"
  exit 1
fi
`;

  const hookPath = path.join(projectPath, '.husky', 'commit-msg');
  await writeFile(hookPath, hook);
  await makeExecutable(hookPath);
}

