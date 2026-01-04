import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateSetupScripts(projectPath: string): Promise<void> {
  const scriptsDir = path.join(projectPath, 'scripts');
  await fs.ensureDir(scriptsDir);

  // Copy setup-1password.sh script
  const setupScriptSource = path.join(__dirname, '../../assets/scripts/setup-1password.sh');
  const setupScriptDest = path.join(scriptsDir, 'setup-1password.sh');

  await fs.copy(setupScriptSource, setupScriptDest);

  // Make it executable
  await fs.chmod(setupScriptDest, 0o755);
}
