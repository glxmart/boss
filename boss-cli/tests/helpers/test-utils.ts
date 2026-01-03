import fs from 'fs-extra';
import path from 'path';
import { getTestProjectPath } from '../setup.js';

export async function createTestProject(name: string): Promise<string> {
  const projectPath = getTestProjectPath(name);
  await fs.ensureDir(projectPath);
  return projectPath;
}

export async function cleanupTestProject(name: string): Promise<void> {
  const projectPath = getTestProjectPath(name);
  if (await fs.pathExists(projectPath)) {
    try {
      // Use remove with force to handle non-empty directories
      await fs.remove(projectPath);
    } catch (error) {
      // If removal fails, try again after a short delay (handles file locks)
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        await fs.remove(projectPath);
      } catch (retryError) {
        // Log but don't throw - cleanup failures shouldn't break tests
        console.warn(`Failed to cleanup test project ${name}: ${retryError}`);
      }
    }
  }
}

export async function projectExists(name: string): Promise<boolean> {
  const projectPath = getTestProjectPath(name);
  return await fs.pathExists(projectPath);
}

export async function fileExists(projectName: string, filePath: string): Promise<boolean> {
  const projectPath = getTestProjectPath(projectName);
  return await fs.pathExists(path.join(projectPath, filePath));
}

export async function readProjectFile(projectName: string, filePath: string): Promise<string> {
  const projectPath = getTestProjectPath(projectName);
  return await fs.readFile(path.join(projectPath, filePath), 'utf8');
}

export async function listProjectFiles(projectName: string, dir: string = '.'): Promise<string[]> {
  const projectPath = getTestProjectPath(projectName);
  const targetPath = path.join(projectPath, dir);
  if (!(await fs.pathExists(targetPath))) {
    return [];
  }
  const files: string[] = [];
  async function walk(dir: string, base: string) {
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);
      const relativePath = path.relative(base, fullPath);
      if (stat.isDirectory()) {
        files.push(relativePath + '/');
        await walk(fullPath, base);
      } else {
        files.push(relativePath);
      }
    }
  }
  await walk(targetPath, projectPath);
  return files.sort();
}
