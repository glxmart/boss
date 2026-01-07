import fs from 'fs-extra';
import path from 'path';

export async function ensureDirectory(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf8');
}

export async function pathExists(filePath: string): Promise<boolean> {
  return await fs.pathExists(filePath);
}

export async function makeExecutable(filePath: string): Promise<void> {
  await fs.chmod(filePath, 0o755);
}

export async function makeExecutableRecursive(
  dir: string,
  pattern: string = '*.sh'
): Promise<void> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await makeExecutableRecursive(filePath, pattern);
    } else {
      // Convert glob pattern to regex
      let shouldMakeExecutable = false;
      if (pattern === '*') {
        shouldMakeExecutable = true;
      } else if (file.endsWith('.sh')) {
        shouldMakeExecutable = true;
      } else if (pattern !== '*.sh') {
        // Convert glob pattern to regex (e.g., "*.sh" -> /^.*\.sh$/)
        const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        shouldMakeExecutable = regex.test(file);
      }

      if (shouldMakeExecutable) {
        await makeExecutable(filePath);
      }
    }
  }
}
