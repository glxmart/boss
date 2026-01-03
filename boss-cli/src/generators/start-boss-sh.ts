import path from 'path';
import { writeFile, makeExecutable } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';

export async function generateStartBossScript(projectPath: string): Promise<void> {
  const script = await loadTemplate('start-boss-sh/start-boss.sh');
  const scriptPath = path.join(projectPath, 'start-boss.sh');
  await writeFile(scriptPath, script);
  await makeExecutable(scriptPath);
}
