import { execa } from 'execa';
import path from 'path';
import { logger } from './logger.js';

export async function initGitRepository(projectPath: string): Promise<void> {
  logger.startSpinner('Initializing git repository...');
  try {
    await execa('git', ['init'], { cwd: projectPath });
    
    // Always configure git user for the repository (required for commits)
    // This ensures commits work even if user hasn't configured git globally
    try {
      await execa('git', ['config', 'user.name', 'The BOSS'], { cwd: projectPath });
      await execa('git', ['config', 'user.email', 'boss@glxmart.com'], { cwd: projectPath });
    } catch (configError) {
      // If local config fails, try to set global as fallback
      try {
        await execa('git', ['config', '--global', 'user.name', 'The BOSS']);
        await execa('git', ['config', '--global', 'user.email', 'boss@glxmart.com']);
      } catch (globalError) {
        // If both fail, log warning but continue (commit will use env vars)
        logger.warning('Could not configure git user, will use environment variables for commits');
      }
    }
    
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
  const gitEnv = {
    ...process.env,
    GIT_AUTHOR_NAME: 'The BOSS',
    GIT_AUTHOR_EMAIL: 'boss@glxmart.com',
    GIT_COMMITTER_NAME: 'The BOSS',
    GIT_COMMITTER_EMAIL: 'boss@glxmart.com'
  };

  const execOptions = {
    cwd: projectPath,
    env: gitEnv,
    timeout: 5000
  };

  try {
    // Use --no-verify to skip hooks and ensure git doesn't wait for input
    // Add a small delay to avoid race conditions with parallel tests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    await execa('git', ['commit', '-m', message, '--no-verify'], execOptions);
  } catch (error) {
    // If it's a lock/index file error, retry once
    if (error instanceof Error && error.message.includes('unable to write')) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await execa('git', ['commit', '-m', message, '--no-verify'], execOptions);
      return;
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

export async function createBranch(projectPath: string, branchName: string): Promise<void> {
  try {
    await execa('git', ['checkout', '-b', branchName], { cwd: projectPath });
  } catch (error) {
    logger.error(`Failed to create branch ${branchName}: ${error}`);
    throw error;
  }
}

export async function getCurrentBranch(projectPath: string): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: projectPath });
    return stdout.trim();
  } catch (error) {
    logger.error(`Failed to get current branch: ${error}`);
    throw error;
  }
}

