import path from 'path';
import { writeFile } from '../utils/file-system.js';
import { DOCKER_IMAGE_FULL, BOSS_VERSION } from '../constants.js';

/**
 * Generate container-use configuration for BOSS projects
 *
 * Uses the pre-built boss/worker-base Docker image which includes:
 * - Node.js 22 (LTS)
 * - System dependencies (git, curl, build-essential)
 * - pnpm (package manager)
 * - claude-code (Anthropic CLI)
 *
 * This eliminates 60-90s of setup time per worker spawn.
 */
export async function generateContainerUseConfig(projectPath: string): Promise<void> {
  const config = {
    // Use pre-built BOSS worker base image (Phase 1 optimization)
    // This includes all system dependencies and global npm packages
    base_image: DOCKER_IMAGE_FULL,

    // Setup commands run AFTER pulling image, BEFORE copying code
    // Empty because all system setup is in the base image
    setup_commands: [],

    // Install commands run AFTER copying project code
    // Only include project-specific dependencies
    install_commands: [
      'pnpm install --frozen-lockfile'
    ],

    // Environment variables for all BOSS workers
    environment_variables: {
      // BOSS-specific
      IS_SANDBOX: '1',
      BOSS_VERSION,

      // Spec-Kit configuration
      SPEC_KIT_MODE: 'true',
      SPEC_KIT_PATH: '.specify',

      // Node.js environment
      NODE_ENV: 'production',

      // CI flag for automation detection
      CI: 'true',

      // PATH with Spec-Kit scripts
      PATH: '/usr/local/bin:/usr/bin:/bin:$PWD/.specify/scripts'
    },

    // Secrets managed via container-use CLI or 1Password
    secrets: [],

    // Network access - default hosts for BOSS workers
    network: {
      allowed_hosts: [
        // Anthropic API
        'api.anthropic.com',
        'claude.ai',

        // Package registries
        'registry.npmjs.org',

        // Version control
        'github.com'
      ]
    }
  };

  await writeFile(
    path.join(projectPath, '.container-use', 'environment.json'),
    JSON.stringify(config, null, 2)
  );
}

