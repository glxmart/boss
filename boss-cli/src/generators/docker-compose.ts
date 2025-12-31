import path from 'path';
import { writeFile } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';

export async function generateDockerCompose(projectPath: string): Promise<void> {
  const dockerCompose = await loadTemplate('docker-compose/docker-compose.yml');
  await writeFile(
    path.join(projectPath, 'docker-compose.yml'),
    dockerCompose
  );
}

