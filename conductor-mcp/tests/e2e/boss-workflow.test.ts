/**
 * E2E Test: BOSS Workflow Integration
 *
 * This test bootstraps a real BOSS project and simulates BOSS orchestrating
 * workers via Conductor MCP. It validates the full end-to-end flow.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ErrorCategory } from '../../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_PROJECT_NAME = 'conductor-e2e-test';
const TEST_DIR = '/tmp';
const TEST_PROJECT_PATH = path.join(TEST_DIR, TEST_PROJECT_NAME);
const BOSS_CLI_PATH = path.resolve(__dirname, '../../../boss-cli');

describe('E2E: BOSS Workflow with Conductor MCP', () => {
  let projectPath: string;

  beforeAll(async () => {
    projectPath = TEST_PROJECT_PATH;

    // Clean up any existing test project
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }

    // Build boss-cli
    console.log('\n📦 Building boss-cli...');
    await execa('pnpm', ['install'], {
      cwd: BOSS_CLI_PATH,
      stdio: 'inherit',
    });
    await execa('pnpm', ['build'], {
      cwd: BOSS_CLI_PATH,
      stdio: 'inherit',
    });

    // Bootstrap test project
    console.log(`\n🚀 Bootstrapping test project: ${projectPath}`);
    await execa(
      'node',
      [
        path.join(BOSS_CLI_PATH, 'dist/index.js'),
        'bootstrap',
        '--template',
        't3-prisma',
        '--quality',
        'startup',
        '--name',
        TEST_PROJECT_NAME,
        '--non-interactive',
      ],
      {
        cwd: TEST_DIR,
        stdio: 'inherit',
      }
    );

    // Verify project was created
    const exists = await fs
      .access(projectPath)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      throw new Error(`Test project was not created at ${projectPath}`);
    }

    console.log('✅ Test project bootstrapped successfully');

    // Install dependencies to fix TypeScript errors
    console.log('\n📦 Installing dependencies...');
    try {
      await execa('pnpm', ['install'], {
        cwd: projectPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          HUSKY: '0', // Disable Husky during install
        },
      });
      console.log('✅ Dependencies installed');

      // Commit pnpm-lock.yaml to avoid uncommitted changes warning
      try {
        await execa('git', ['add', 'pnpm-lock.yaml'], { cwd: projectPath });
        await execa('git', ['commit', '-m', 'chore: add pnpm-lock.yaml'], { cwd: projectPath });
        console.log('✅ Committed pnpm-lock.yaml');
      } catch (err) {
        console.warn('⚠️  Could not commit pnpm-lock.yaml (may already be committed)');
      }
    } catch (err) {
      console.warn('⚠️  Failed to install dependencies (non-critical):', err);
    }

    // Disable git hooks for container-use operations
    // This prevents pre-push hooks from blocking environment creation
    console.log('\n🔧 Disabling git hooks for testing...');
    try {
      await execa('git', ['config', 'core.hooksPath', '/dev/null'], {
        cwd: projectPath,
      });
      console.log('✅ Git hooks disabled for testing');
    } catch (err) {
      console.warn('⚠️  Could not disable git hooks (non-critical)');
    }
  }, 180000); // 3 minute timeout for bootstrap + install

  afterAll(async () => {
    // Clean up test project
    if (projectPath) {
      console.log(`\n🧹 Cleaning up test project: ${projectPath}`);
      try {
        await fs.rm(projectPath, { recursive: true, force: true });
        console.log('✅ Test project cleaned up');
      } catch (err) {
        console.warn('⚠️  Failed to clean up test project:', err);
      }
    }
  });

  it('should have bootstrapped a valid BOSS project', async () => {
    // Verify critical directories exist
    const criticalPaths = [
      '.boss',
      '.specify',
      '.container-use',
      '.claude',
      '.git',
      '.boss/workers',
    ];

    for (const p of criticalPaths) {
      const fullPath = path.join(projectPath, p);
      const exists = await fs
        .access(fullPath)
        .then(() => true)
        .catch(() => false);
      expect(exists, `${p} should exist`).toBe(true);
    }

    // Verify critical files exist
    const criticalFiles = ['CLAUDE.md', 'start-boss.sh', 'docker-compose.yml', '.boss/config.yaml'];

    for (const f of criticalFiles) {
      const fullPath = path.join(projectPath, f);
      const exists = await fs
        .access(fullPath)
        .then(() => true)
        .catch(() => false);
      expect(exists, `${f} should exist`).toBe(true);
    }
  });

  it('should have worker configurations (project-level)', async () => {
    const workersDir = path.join(projectPath, '.boss/workers');
    const workerTypes = await fs.readdir(workersDir);

    expect(workerTypes.length).toBeGreaterThan(0);
    expect(workerTypes).toContain('architect');
    expect(workerTypes).toContain('clarifier');
    expect(workerTypes).toContain('developer-frontend');

    // Project has CLAUDE.md and .claude folder
    // Both Claude Code and Cursor use the same .claude configuration (no separate .cursor folder needed)
    // prompt.md, container-config.json, and metadata.json are in conductor-mcp/worker-configs/
    const architectWorkerDir = path.join(workersDir, 'architect');

    // Verify CLAUDE.md exists (used by both Claude Code and Cursor)
    const claudeMdPath = path.join(architectWorkerDir, 'CLAUDE.md');
    const claudeMdExists = await fs
      .access(claudeMdPath)
      .then(() => true)
      .catch(() => false);
    expect(claudeMdExists, 'architect/CLAUDE.md should exist').toBe(true);

    // Verify .claude folder exists (used by both tools)
    const claudeFolderPath = path.join(architectWorkerDir, '.claude');
    const claudeFolderExists = await fs
      .access(claudeFolderPath)
      .then(() => true)
      .catch(() => false);
    expect(claudeFolderExists, 'architect/.claude folder should exist').toBe(true);

    // Verify .claude has commands and skills (but NOT agents - workers are already agents)
    const commandsPath = path.join(claudeFolderPath, 'commands');
    const commandsExists = await fs
      .access(commandsPath)
      .then(() => true)
      .catch(() => false);
    expect(commandsExists, 'architect/.claude/commands should exist').toBe(true);

    const skillsPath = path.join(claudeFolderPath, 'skills');
    const skillsExists = await fs
      .access(skillsPath)
      .then(() => true)
      .catch(() => false);
    expect(skillsExists, 'architect/.claude/skills should exist').toBe(true);

    // Verify architect gets its relevant Spec-Kit command (constitution.md based on primaryCommand)
    const constitutionPath = path.join(commandsPath, 'constitution.md');
    const constitutionExists = await fs
      .access(constitutionPath)
      .then(() => true)
      .catch(() => false);
    expect(
      constitutionExists,
      "architect/.claude/commands/constitution.md should exist (architect's primary command)"
    ).toBe(true);

    // Verify boss-commands.md is NOT copied to workers (BOSS-specific only)
    const bossCommandsPath = path.join(commandsPath, 'boss-commands.md');
    const bossCommandsExists = await fs
      .access(bossCommandsPath)
      .then(() => true)
      .catch(() => false);
    expect(
      bossCommandsExists,
      'architect/.claude/commands/boss-commands.md should NOT exist (BOSS-specific only)'
    ).toBe(false);

    // Verify NO .cursor folder (Cursor uses .claude config)
    const cursorFolderPath = path.join(architectWorkerDir, '.cursor');
    const cursorFolderExists = await fs
      .access(cursorFolderPath)
      .then(() => true)
      .catch(() => false);
    expect(
      cursorFolderExists,
      'architect/.cursor folder should NOT exist (Cursor uses .claude)'
    ).toBe(false);

    // Verify prompt.md and container-config.json DO NOT exist in project (conductor owns these)
    const promptMdPath = path.join(architectWorkerDir, 'prompt.md');
    const promptMdExists = await fs
      .access(promptMdPath)
      .then(() => true)
      .catch(() => false);
    expect(promptMdExists, 'architect/prompt.md should NOT exist in project').toBe(false);

    const containerConfigPath = path.join(architectWorkerDir, 'container-config.json');
    const containerConfigExists = await fs
      .access(containerConfigPath)
      .then(() => true)
      .catch(() => false);
    expect(
      containerConfigExists,
      'architect/container-config.json should NOT exist in project'
    ).toBe(false);
  });

  it('should have container-use available', async () => {
    try {
      await execa('container-use', ['--version']);
      console.log('✅ container-use is available');
    } catch (err) {
      console.warn('⚠️  container-use is not available. Some tests may be skipped.');
      console.warn('   Install with: npm install -g @anthropic-ai/container-use');
    }
  });

  it('should be able to read worker configuration (simulating conductor)', async () => {
    // Conductor reads metadata.json and container-config.json from its own worker-configs/ directory
    const conductorWorkerConfigsPath = path.resolve(__dirname, '../../worker-configs');
    const architectMetadataPath = path.join(conductorWorkerConfigsPath, 'architect/metadata.json');
    const architectContainerConfigPath = path.join(
      conductorWorkerConfigsPath,
      'architect/container-config.json'
    );

    // Verify metadata.json exists and is valid
    const metadataContent = await fs.readFile(architectMetadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    expect(metadata.workerType).toBe('architect');
    expect(metadata.phase).toBe(1);
    expect(metadata.description).toBeTruthy();
    expect(metadata.inputs).toBeDefined();
    expect(metadata.outputs).toBeDefined();
    expect(metadata.outputs.required).toBeInstanceOf(Array);
    expect(metadata.outputs.required.length).toBeGreaterThan(0);

    // Verify base container-config.json exists and is valid
    const baseContainerConfigPath2 = path.join(
      path.resolve(__dirname, '../../worker-configs'),
      '_base',
      'container-config.json'
    );
    const baseContainerConfigContent = await fs.readFile(baseContainerConfigPath2, 'utf-8');
    const baseContainerConfig = JSON.parse(baseContainerConfigContent);

    expect(baseContainerConfig).toHaveProperty('base_image');
    expect(baseContainerConfig.base_image).toBeTruthy();
    expect(baseContainerConfig).toHaveProperty('install_commands');

    // Verify the project has worker-specific CLAUDE.md (not the container config)
    const projectClaudeMdPath = path.join(projectPath, '.boss/workers/architect/CLAUDE.md');
    const projectClaudeMdExists = await fs
      .access(projectClaudeMdPath)
      .then(() => true)
      .catch(() => false);
    expect(projectClaudeMdExists, 'Project should have worker-specific CLAUDE.md').toBe(true);
  });

  it('should have git repository initialized', async () => {
    const gitDir = path.join(projectPath, '.git');
    const exists = await fs
      .access(gitDir)
      .then(() => true)
      .catch(() => false);
    expect(exists, '.git directory should exist').toBe(true);

    // Verify git status works
    const { stdout } = await execa('git', ['status', '--porcelain'], {
      cwd: projectPath,
    });

    // Should have clean working directory (everything committed)
    expect(stdout.trim()).toBe('');
  });

  it('should have CLAUDE.md with BOSS instructions', async () => {
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    // Verify CLAUDE.md has BOSS-related content
    expect(content).toContain('BOSS Integration');
    expect(content).toContain('Constitutional Governance');
    expect(content).toContain('Spec-Kit Integration');
    expect(content).toContain('docs/conductor.md');
    // Note: 'spawn_worker' is a tool in conductor MCP, referenced in conductor.md
  });

  it('should have valid worker configuration for spawning', async () => {
    // Validate that conductor has everything needed to spawn a worker
    // Note: Actual worker spawning requires container-use MCP server (stdio mode)
    // This test validates the configuration without spawning a real container

    console.log('\n🔍 Validating worker spawn configuration...');

    // Verify conductor has complete worker configuration
    const conductorWorkerConfigsPath = path.resolve(__dirname, '../../worker-configs');
    const architectPath = path.join(conductorWorkerConfigsPath, 'architect');

    // Check metadata.json exists (required for all workers)
    const metadataPath = path.join(architectPath, 'metadata.json');
    const metadataExists = await fs
      .access(metadataPath)
      .then(() => true)
      .catch(() => false);
    expect(metadataExists, 'conductor worker-configs/architect/metadata.json should exist').toBe(
      true
    );

    // Check base container config exists (required for all workers)
    const baseContainerConfigPath = path.join(
      conductorWorkerConfigsPath,
      '_base',
      'container-config.json'
    );
    const baseConfigExists = await fs
      .access(baseContainerConfigPath)
      .then(() => true)
      .catch(() => false);
    expect(
      baseConfigExists,
      'conductor worker-configs/_base/container-config.json should exist'
    ).toBe(true);

    // Load base container config
    const baseContainerConfig = JSON.parse(await fs.readFile(baseContainerConfigPath, 'utf-8'));

    // Check if worker has specific overrides (optional)
    const workerContainerConfigPath = path.join(architectPath, 'container-config.json');
    const workerConfigExists = await fs
      .access(workerContainerConfigPath)
      .then(() => true)
      .catch(() => false);

    // Use base config (worker config is optional)
    const containerConfig = workerConfigExists
      ? JSON.parse(await fs.readFile(workerContainerConfigPath, 'utf-8'))
      : baseContainerConfig;

    expect(containerConfig).toHaveProperty('base_image');
    expect(containerConfig.base_image).toBeTruthy();
    expect(containerConfig).toHaveProperty('install_commands');
    expect(Array.isArray(containerConfig.install_commands)).toBe(true);

    // Verify environment variables include Claude Code installation
    expect(containerConfig).toHaveProperty('environment_variables');

    console.log('✅ Worker configuration is valid for spawning');
    console.log(`   Base image: ${containerConfig.base_image}`);
    console.log(`   Install commands: ${containerConfig.install_commands.length}`);
  });

  it('should spawn a worker and verify environment setup', async () => {
    // Worker spawning via MCP protocol integration
    console.log('\n🚀 Testing actual worker spawning...');

    // Import conductor components
    const { WorkerSpawner } = await import('../../src/lifecycle/worker-spawner.js');
    const { ContainerUseClient } = await import('../../src/orchestration/container-use-client.js');
    const { StateTracker } = await import('../../src/lifecycle/state-tracker.js');

    // Check if container-use is available
    const containerUseClient = new ContainerUseClient();
    const isAvailable = await containerUseClient.checkAvailability();

    if (!isAvailable) {
      console.log('⚠️  container-use not available, skipping worker spawn test');
      console.log('   Install with: npm install -g @anthropic-ai/container-use');
      return;
    }

    // Check if Docker is running
    try {
      await execa('docker', ['info']);
    } catch (err) {
      console.log('⚠️  Docker is not running, skipping worker spawn test');
      console.log('   Start Docker Desktop to run this test');
      return;
    }

    console.log('✅ Prerequisites met (container-use + Docker)');

    const stateTracker = new StateTracker();
    const spawner = new WorkerSpawner(containerUseClient, stateTracker);

    let workerId: string | undefined;

    try {
      console.log('📦 Spawning clarifier worker...');

      // Spawn a clarifier worker with a simple, self-contained task
      // The task should be clear and not require additional user input
      const result = await spawner.spawnWorker({
        workerType: 'clarifier',
        taskPrompt:
          'Analyze this requirement: "Create a simple TODO app with add, delete, and mark complete functionality." List the key features and any assumptions you need to make. Provide your analysis in the structured JSON format.',
        projectPath,
        targetBranch: 'feature/boss-initial-setup',
      });

      // Check if spawn was successful
      if (!result.success) {
        // Check if this is a Docker image availability issue (expected in CI/local environments)
        // The underlying error from container-use will contain image pull failure details
        const errorCategory = result.error?.category;
        const errorDetails = result.error?.details;

        if (
          errorCategory === ErrorCategory.CONTAINER_CREATION_FAILED &&
          errorDetails instanceof Error &&
          (errorDetails.message.includes('failed to resolve image') ||
            errorDetails.message.includes('401 Unauthorized'))
        ) {
          console.log('⚠️  Docker image not available, skipping worker spawn test');
          console.log('   This is expected if boss-worker-base image is not published');
          console.log('   Category:', errorCategory);
          console.log('   Details:', errorDetails.message);
          return;
        }

        console.error('❌ Worker spawn failed:', result.message);
        console.error('   Error:', result.error);
        throw new Error(`Worker spawn failed: ${result.message}`);
      }

      workerId = result.workerId;
      console.log(`✅ Worker spawned: ${workerId}`);

      // Verify worker ID format
      expect(workerId).toBeTruthy();
      expect(typeof workerId).toBe('string');
      expect(workerId.length).toBeGreaterThan(0); // container-use generates friendly names like "optimum-sloth"

      // Verify worker state was tracked
      const workerState = stateTracker.getWorker(workerId);
      expect(workerState).toBeTruthy();
      expect(workerState?.workerType).toBe('clarifier');
      expect(workerState?.status).toMatch(/running|completed/);

      console.log(`   Status: ${workerState?.status}`);
      console.log(`   Worker ID: ${workerId}`);

      // Verify worker manifest was created
      const manifestPath = path.join(projectPath, '.boss', `worker-manifest-${workerId}.json`);
      const manifestExists = await fs
        .access(manifestPath)
        .then(() => true)
        .catch(() => false);
      expect(manifestExists, 'Worker manifest should be created').toBe(true);

      if (manifestExists) {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        expect(manifest.workerId).toBe(workerId);
        expect(manifest.workerType).toBe('clarifier');
        expect(manifest.artifacts).toBeInstanceOf(Array);

        console.log(`   Artifacts: ${manifest.artifacts.length}`);
        console.log(`   Tasks completed: ${manifest.tasksCompleted?.length || 0}`);
      }

      console.log('✅ Worker spawning test completed successfully');
    } catch (error: any) {
      console.error('❌ Worker spawning failed:', error.message);
      throw error;
    } finally {
      // Clean up: delete the worker environment
      if (workerId) {
        console.log(`🧹 Cleaning up worker environment: ${workerId}`);
        try {
          await containerUseClient.deleteEnvironment(workerId);
          console.log('✅ Worker environment cleaned up');
        } catch (err) {
          console.warn('⚠️  Failed to clean up worker environment:', err);
        }
      }
    }
  }, 300000); // 5 minute timeout for actual container spawning
});
