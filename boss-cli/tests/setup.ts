import { beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Create temporary directory for tests
export const TEST_TEMP_DIR = path.join(os.tmpdir(), 'boss-cli-tests');

beforeAll(async () => {
  // Clean up any existing test directory
  if (await fs.pathExists(TEST_TEMP_DIR)) {
    await fs.remove(TEST_TEMP_DIR);
  }
  await fs.ensureDir(TEST_TEMP_DIR);
});

afterAll(async () => {
  // Clean up test directory
  if (await fs.pathExists(TEST_TEMP_DIR)) {
    await fs.remove(TEST_TEMP_DIR);
  }
});

export function getTestProjectPath(projectName: string): string {
  return path.join(TEST_TEMP_DIR, projectName);
}

