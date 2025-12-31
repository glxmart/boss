import path from 'path';
import { writeFile } from '../utils/file-system.js';

export async function generateContainerUseConfig(projectPath: string): Promise<void> {
  const config = {
    base_image: 'node:22-slim',
    setup_commands: [
      'apt-get update',
      'apt-get install -y git curl build-essential bash'
    ],
    install_commands: [
      'npm install -g pnpm',
      'pnpm install'
    ],
    environment_variables: {
      NODE_ENV: 'development',
      CI: 'true',
      SPEC_KIT_MODE: 'true',
      SPEC_KIT_PATH: '.specify',
      PATH: '$PATH:.specify/scripts'
    },
    secrets: [],
    network: {
      allowed_hosts: [
        'registry.npmjs.org',
        'github.com',
        'api.anthropic.com'
      ]
    }
  };

  await writeFile(
    path.join(projectPath, '.container-use', 'environment.json'),
    JSON.stringify(config, null, 2)
  );
}

