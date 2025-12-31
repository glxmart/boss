import { execa } from 'execa';
import path from 'path';
import { logger } from './logger.js';

export async function initGitRepository(projectPath: string): Promise<void> {
  logger.startSpinner('Initializing git repository...');
  try {
    await execa('git', ['init'], { cwd: projectPath });
    // Configure git user for commits (required for test environments)
    await execa('git', ['config', 'user.name', 'BOSS CLI'], { cwd: projectPath });
    await execa('git', ['config', 'user.email', 'boss-cli@localhost'], { cwd: projectPath });
    logger.stopSpinner(true, 'Git repository initialized');
  } catch (error) {
    logger.stopSpinner(false, 'Failed to initialize git repository');
    throw error;
  }
}

export async function addFiles(projectPath: string, files: string[]): Promise<void> {
  try {
    await execa('git', ['add', ...files], { cwd: projectPath });
  } catch (error) {
    logger.error(`Failed to add files to git: ${error}`);
    throw error;
  }
}

export async function commit(projectPath: string, message: string): Promise<void> {
  try {
    // Use --no-verify to skip hooks and ensure git doesn't wait for input
    // Add a small delay to avoid race conditions with parallel tests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    await execa('git', ['commit', '-m', message, '--no-verify'], { 
      cwd: projectPath,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'BOSS CLI',
        GIT_AUTHOR_EMAIL: 'boss-cli@localhost',
        GIT_COMMITTER_NAME: 'BOSS CLI',
        GIT_COMMITTER_EMAIL: 'boss-cli@localhost'
      },
      // Retry on failure (handles race conditions)
      timeout: 5000
    });
  } catch (error) {
    // If it's a lock/index file error, retry once
    if (error instanceof Error && error.message.includes('unable to write')) {
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        await execa('git', ['commit', '-m', message, '--no-verify'], { 
          cwd: projectPath,
          env: {
            ...process.env,
            GIT_AUTHOR_NAME: 'BOSS CLI',
            GIT_AUTHOR_EMAIL: 'boss-cli@localhost',
            GIT_COMMITTER_NAME: 'BOSS CLI',
            GIT_COMMITTER_EMAIL: 'boss-cli@localhost'
          },
          timeout: 5000
        });
        return;
      } catch (retryError) {
        logger.error(`Failed to commit after retry: ${retryError}`);
        throw retryError;
      }
    }
    logger.error(`Failed to commit: ${error}`);
    throw error;
  }
}

export async function isGitRepository(dir: string): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--git-dir'], { cwd: dir });
    return stdout !== '';
  } catch {
    return false;
  }
}

