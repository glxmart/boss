import path from 'path';
import { execa } from 'execa';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { logger } from '../utils/logger.js';

export interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  remediation?: string;
}

export interface DoctorOptions {
  projectDir?: string;
  skipSystemChecks?: boolean;
  skipProjectChecks?: boolean;
}

/**
 * BOSS Doctor Command - System and Project Health Check
 *
 * Validates:
 * 1. System prerequisites (Docker, Node.js, pnpm, etc.)
 * 2. BOSS overlay integrity (all required files exist)
 * 3. Dependencies installed correctly
 * 4. Docker configuration valid
 * 5. Git repository initialized
 * 6. Quality gates configured
 */
export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  const { projectDir, skipSystemChecks = false, skipProjectChecks = false } = options;

  logger.section('🏥 BOSS Doctor - System Health Check');

  const checks: CheckResult[] = [];

  // System checks (global prerequisites)
  if (!skipSystemChecks) {
    logger.info('\n📦 System Prerequisites\n');

    checks.push(await checkDocker());
    checks.push(await checkNode());
    checks.push(await checkPnpm());
    checks.push(await check1Password());
    checks.push(await checkContainerUse());
    checks.push(await checkClaudeCode());
    checks.push(await checkGit());
    checks.push(await checkPort(5432, 'PostgreSQL'));
    checks.push(await checkPort(6333, 'Qdrant'));
    checks.push(await checkPort(8080, 'Embeddings Service'));
    checks.push(await checkMCPConfig());

    displayCheckResults(checks);
  }

  // Project checks (if projectDir specified or in a BOSS project)
  if (!skipProjectChecks) {
    const targetDir = projectDir || process.cwd();
    const isBossProject = await fs.pathExists(path.join(targetDir, '.boss'));

    if (isBossProject) {
      logger.info('\n📁 Project Validation\n');

      const projectChecks: CheckResult[] = [];
      projectChecks.push(await validateOverlay(targetDir));
      projectChecks.push(await validateDependencies(targetDir));
      projectChecks.push(await validateDocker(targetDir));
      projectChecks.push(await validateGitRepository(targetDir));
      projectChecks.push(await validateQualityGates(targetDir));

      displayCheckResults(projectChecks);
      checks.push(...projectChecks);
    } else if (projectDir) {
      logger.warning(`\nDirectory ${targetDir} is not a BOSS project (missing .boss directory)`);
    }
  }

  // Summary
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;
  const passed = checks.filter((c) => c.status === 'pass').length;

  console.log('\n');
  logger.section('📊 Summary');
  console.log(`  ✓ ${passed} passed`);
  if (warnings > 0) console.log(`  ⚠ ${warnings} warnings`);
  if (failed > 0) console.log(`  ✗ ${failed} failed`);

  if (failed === 0 && warnings === 0) {
    logger.success('\nAll checks passed! ✅');
  } else if (failed === 0) {
    logger.warning(`\n${warnings} warning(s) found. System is functional but may need attention.`);
  } else {
    logger.error(`\n${failed} check(s) failed. Please address the issues above.`);
    displayRemediations(checks);
    process.exit(1);
  }
}

function displayCheckResults(checks: CheckResult[]): void {
  for (const check of checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
    logger[check.status === 'pass' ? 'success' : check.status === 'fail' ? 'error' : 'warning'](
      `${icon} ${check.name}: ${check.message}`
    );
  }
}

function displayRemediations(checks: CheckResult[]): void {
  const failedWithRemediation = checks.filter((c) => c.status === 'fail' && c.remediation);

  if (failedWithRemediation.length > 0) {
    console.log('\n');
    logger.section('🔧 Remediation Steps');
    for (const check of failedWithRemediation) {
      console.log(`\n  ${check.name}:`);
      console.log(`    ${check.remediation}`);
    }
  }
}

// ============================================================================
// System Checks
// ============================================================================

async function checkDocker(): Promise<CheckResult> {
  try {
    await execa('docker', ['--version']);
    try {
      await execa('docker', ['ps']);
      return { name: 'Docker', status: 'pass', message: 'Running' };
    } catch {
      return {
        name: 'Docker',
        status: 'warning',
        message: 'Installed but not running',
        remediation: 'Start Docker Desktop or run: sudo systemctl start docker',
      };
    }
  } catch {
    return {
      name: 'Docker',
      status: 'fail',
      message: 'Not installed or not in PATH',
      remediation: 'Install Docker: https://docs.docker.com/get-docker/',
    };
  }
}

async function checkNode(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('node', ['--version']);
    const version = stdout.replace('v', '');
    const major = parseInt(version.split('.')[0], 10);
    if (major >= 22) {
      return { name: 'Node.js', status: 'pass', message: `v${version} (>= 22 required)` };
    } else {
      return {
        name: 'Node.js',
        status: 'fail',
        message: `v${version} (>= 22 required)`,
        remediation: 'Update Node.js: nvm install 22 && nvm use 22',
      };
    }
  } catch {
    return {
      name: 'Node.js',
      status: 'fail',
      message: 'Not installed or not in PATH',
      remediation: 'Install Node.js: https://nodejs.org or via nvm',
    };
  }
}

async function checkPnpm(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('pnpm', ['--version']);
    return { name: 'pnpm', status: 'pass', message: `v${stdout.trim()}` };
  } catch {
    return {
      name: 'pnpm',
      status: 'fail',
      message: 'Not installed or not in PATH',
      remediation: 'Install pnpm: npm install -g pnpm',
    };
  }
}

async function check1Password(): Promise<CheckResult> {
  try {
    await execa('op', ['--version']);
    try {
      await execa('op', ['account', 'list']);
      return { name: '1Password CLI', status: 'pass', message: 'Installed and authenticated' };
    } catch {
      return {
        name: '1Password CLI',
        status: 'warning',
        message: 'Installed but not authenticated',
        remediation: 'Authenticate with: op signin',
      };
    }
  } catch {
    return {
      name: '1Password CLI',
      status: 'fail',
      message: 'Not installed or not in PATH',
      remediation: 'Install 1Password CLI: brew install --cask 1password-cli',
    };
  }
}

async function checkContainerUse(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('container-use', ['--version']);
    return { name: 'Container-Use CLI', status: 'pass', message: `v${stdout.trim()}` };
  } catch {
    return {
      name: 'Container-Use CLI',
      status: 'fail',
      message: 'Not installed',
      remediation: 'Install Container-Use: npm install -g container-use',
    };
  }
}

async function checkClaudeCode(): Promise<CheckResult> {
  try {
    await execa('claude', ['--version']);
    return { name: 'Claude Code', status: 'pass', message: 'Installed' };
  } catch {
    try {
      await execa('cursor', ['--version']);
      return { name: 'Cursor', status: 'pass', message: 'Installed' };
    } catch {
      return {
        name: 'Claude Code/Cursor',
        status: 'warning',
        message: 'Not found in PATH (may be installed but not in PATH)',
        remediation: 'Install Claude Code: npm install -g @anthropic-ai/claude-code',
      };
    }
  }
}

async function checkGit(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('git', ['--version']);
    return { name: 'Git', status: 'pass', message: stdout.trim() };
  } catch {
    return {
      name: 'Git',
      status: 'fail',
      message: 'Not installed or not in PATH',
      remediation: 'Install Git: https://git-scm.com/downloads',
    };
  }
}

async function checkPort(port: number, service: string): Promise<CheckResult> {
  if (process.platform === 'darwin' || process.platform === 'linux') {
    try {
      await execa('lsof', ['-i', `:${port}`]);
      return {
        name: `Port ${port} (${service})`,
        status: 'pass',
        message: 'Service running',
      };
    } catch {
      return {
        name: `Port ${port} (${service})`,
        status: 'warning',
        message: 'Port not in use (service may not be running)',
        remediation: `Start ${service} or run: docker-compose up -d`,
      };
    }
  }
  return {
    name: `Port ${port} (${service})`,
    status: 'warning',
    message: 'Port check not available on this platform',
  };
}

async function checkMCPConfig(): Promise<CheckResult> {
  const os = await import('os');

  const claudeCodePath = path.join(os.homedir(), '.config', 'claude-code', 'mcp-servers.json');
  if (await fs.pathExists(claudeCodePath)) {
    return { name: 'MCP Config', status: 'pass', message: `Found: ${claudeCodePath}` };
  }

  const cursorPath = path.join(os.homedir(), '.cursor', 'mcp-servers.json');
  if (await fs.pathExists(cursorPath)) {
    return { name: 'MCP Config', status: 'pass', message: `Found: ${cursorPath}` };
  }

  return {
    name: 'MCP Config',
    status: 'warning',
    message: 'Not found (will be created during bootstrap)',
    remediation: 'Run: boss init to create MCP configuration',
  };
}

// ============================================================================
// Project Validation Functions
// ============================================================================

/**
 * Validate BOSS overlay integrity
 * Checks that all required BOSS files and directories exist
 */
export async function validateOverlay(projectPath: string): Promise<CheckResult> {
  const requiredDirs = [
    '.boss',
    '.boss/workers',
    '.boss/worker-manifests',
    '.specify',
    '.container-use',
  ];

  const requiredFiles = ['.boss/config.yaml', '.boss/project-config.json'];

  const optionalFiles = ['.boss/template-version.json', 'renovate.json', '.mcp.json'];

  const missingDirs: string[] = [];
  const missingFiles: string[] = [];
  const missingOptional: string[] = [];

  // Check directories
  for (const dir of requiredDirs) {
    const fullPath = path.join(projectPath, dir);
    if (!(await fs.pathExists(fullPath))) {
      missingDirs.push(dir);
    }
  }

  // Check required files
  for (const file of requiredFiles) {
    const fullPath = path.join(projectPath, file);
    if (!(await fs.pathExists(fullPath))) {
      missingFiles.push(file);
    }
  }

  // Check optional files
  for (const file of optionalFiles) {
    const fullPath = path.join(projectPath, file);
    if (!(await fs.pathExists(fullPath))) {
      missingOptional.push(file);
    }
  }

  // Validate config.yaml syntax if it exists
  const configPath = path.join(projectPath, '.boss', 'config.yaml');
  let configError: string | null = null;
  if (await fs.pathExists(configPath)) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      yaml.load(content);
    } catch (err) {
      configError = `Invalid YAML in config.yaml: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }

  // Validate project-config.json syntax if it exists
  const projectConfigPath = path.join(projectPath, '.boss', 'project-config.json');
  let projectConfigError: string | null = null;
  if (await fs.pathExists(projectConfigPath)) {
    try {
      const content = await fs.readFile(projectConfigPath, 'utf8');
      JSON.parse(content);
    } catch (err) {
      projectConfigError = `Invalid JSON in project-config.json: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }

  // Determine result
  if (missingDirs.length > 0 || missingFiles.length > 0) {
    const missing = [...missingDirs.map((d) => `${d}/`), ...missingFiles];
    return {
      name: 'BOSS Overlay',
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
      remediation: `Run 'boss init' to regenerate missing files, or manually create: ${missing.join(', ')}`,
    };
  }

  if (configError || projectConfigError) {
    const errors = [configError, projectConfigError].filter(Boolean).join('; ');
    return {
      name: 'BOSS Overlay',
      status: 'fail',
      message: errors,
      remediation: 'Fix the syntax errors in the config files or regenerate with: boss init',
    };
  }

  if (missingOptional.length > 0) {
    return {
      name: 'BOSS Overlay',
      status: 'warning',
      message: `Complete (optional missing: ${missingOptional.join(', ')})`,
      remediation: `Optional files can be generated with: boss init --regenerate`,
    };
  }

  return {
    name: 'BOSS Overlay',
    status: 'pass',
    message: 'All required files present and valid',
  };
}

/**
 * Validate dependencies are installed correctly
 * Checks for node_modules, lock files, and correct package installation
 */
export async function validateDependencies(projectPath: string): Promise<CheckResult> {
  const nodeModulesPath = path.join(projectPath, 'node_modules');
  const packageJsonPath = path.join(projectPath, 'package.json');

  // Check package.json exists
  if (!(await fs.pathExists(packageJsonPath))) {
    return {
      name: 'Dependencies',
      status: 'warning',
      message: 'No package.json found',
      remediation: 'This may be expected for some templates. Run: pnpm init if needed.',
    };
  }

  // Check lock file exists
  const lockFiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'];
  let hasLockFile = false;
  let lockFileName = '';
  for (const lockFile of lockFiles) {
    if (await fs.pathExists(path.join(projectPath, lockFile))) {
      hasLockFile = true;
      lockFileName = lockFile;
      break;
    }
  }

  if (!hasLockFile) {
    return {
      name: 'Dependencies',
      status: 'warning',
      message: 'No lock file found (pnpm-lock.yaml, package-lock.json, yarn.lock)',
      remediation: 'Run: pnpm install to generate lock file',
    };
  }

  // Check node_modules exists
  if (!(await fs.pathExists(nodeModulesPath))) {
    return {
      name: 'Dependencies',
      status: 'fail',
      message: `Lock file found (${lockFileName}) but node_modules missing`,
      remediation: 'Run: pnpm install',
    };
  }

  // Verify dependencies are properly installed (check for common signs of corruption)
  const nodeModulesStats = await fs.stat(nodeModulesPath);
  if (!nodeModulesStats.isDirectory()) {
    return {
      name: 'Dependencies',
      status: 'fail',
      message: 'node_modules exists but is not a directory',
      remediation: 'Remove node_modules and run: pnpm install',
    };
  }

  // Check if node_modules has content
  const nodeModulesContents = await fs.readdir(nodeModulesPath);
  if (nodeModulesContents.length === 0) {
    return {
      name: 'Dependencies',
      status: 'fail',
      message: 'node_modules is empty',
      remediation: 'Run: pnpm install',
    };
  }

  return {
    name: 'Dependencies',
    status: 'pass',
    message: `Installed (${nodeModulesContents.length} packages, using ${lockFileName})`,
  };
}

/**
 * Validate Docker configuration
 * Checks Dockerfile exists, docker-compose.yml syntax is valid, .dockerignore exists
 */
export async function validateDocker(projectPath: string): Promise<CheckResult> {
  const dockerfilePath = path.join(projectPath, 'Dockerfile');
  const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
  const dockerignorePath = path.join(projectPath, '.dockerignore');

  const hasDockerfile = await fs.pathExists(dockerfilePath);
  const hasDockerCompose = await fs.pathExists(dockerComposePath);
  const hasDockerignore = await fs.pathExists(dockerignorePath);

  // Validate docker-compose.yml syntax if it exists
  let dockerComposeError: string | null = null;
  if (hasDockerCompose) {
    try {
      const content = await fs.readFile(dockerComposePath, 'utf8');
      yaml.load(content);
    } catch (err) {
      dockerComposeError = `Invalid YAML: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }

  // If neither Docker file exists, that's fine for some templates
  if (!hasDockerfile && !hasDockerCompose) {
    return {
      name: 'Docker Config',
      status: 'warning',
      message: 'No Docker configuration found',
      remediation:
        'Docker configuration is optional. Run: boss init --with-docker to add Docker support.',
    };
  }

  // Check for errors
  if (dockerComposeError) {
    return {
      name: 'Docker Config',
      status: 'fail',
      message: `docker-compose.yml ${dockerComposeError}`,
      remediation: 'Fix syntax errors in docker-compose.yml or regenerate with: boss init',
    };
  }

  // Build status message
  const present: string[] = [];
  const missing: string[] = [];

  if (hasDockerfile) present.push('Dockerfile');
  else missing.push('Dockerfile');

  if (hasDockerCompose) present.push('docker-compose.yml');
  else missing.push('docker-compose.yml');

  if (hasDockerignore) present.push('.dockerignore');
  else missing.push('.dockerignore');

  if (missing.length > 0 && missing.length < 3) {
    return {
      name: 'Docker Config',
      status: 'warning',
      message: `Present: ${present.join(', ')}. Missing: ${missing.join(', ')}`,
      remediation: `Consider adding: ${missing.join(', ')} for complete Docker support`,
    };
  }

  return {
    name: 'Docker Config',
    status: 'pass',
    message: `Valid (${present.join(', ')})`,
  };
}

/**
 * Validate Git repository is properly initialized
 * Checks for .git directory, has commits, and is not in detached HEAD state
 */
export async function validateGitRepository(projectPath: string): Promise<CheckResult> {
  const gitPath = path.join(projectPath, '.git');

  // Check .git exists
  if (!(await fs.pathExists(gitPath))) {
    return {
      name: 'Git Repository',
      status: 'fail',
      message: 'Not a git repository',
      remediation: 'Initialize git: git init && git add . && git commit -m "Initial commit"',
    };
  }

  // Check for commits
  try {
    const { stdout } = await execa('git', ['rev-list', '--count', 'HEAD'], { cwd: projectPath });
    const commitCount = parseInt(stdout.trim(), 10);

    if (commitCount === 0) {
      return {
        name: 'Git Repository',
        status: 'warning',
        message: 'Repository initialized but has no commits',
        remediation: 'Create initial commit: git add . && git commit -m "Initial commit"',
      };
    }

    // Check for remote
    let hasRemote = false;
    try {
      const { stdout: remoteStdout } = await execa('git', ['remote', '-v'], { cwd: projectPath });
      hasRemote = remoteStdout.trim().length > 0;
    } catch {
      hasRemote = false;
    }

    // Check current branch
    let currentBranch = 'unknown';
    try {
      const { stdout: branchStdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: projectPath,
      });
      currentBranch = branchStdout.trim();
    } catch {
      // May be in detached HEAD state
      currentBranch = 'detached';
    }

    const statusParts = [`${commitCount} commits`, `branch: ${currentBranch}`];
    if (hasRemote) {
      statusParts.push('remote configured');
    }

    if (!hasRemote) {
      return {
        name: 'Git Repository',
        status: 'warning',
        message: statusParts.join(', ') + ' (no remote)',
        remediation: 'Add remote: git remote add origin <repository-url>',
      };
    }

    return {
      name: 'Git Repository',
      status: 'pass',
      message: statusParts.join(', '),
    };
  } catch (err) {
    return {
      name: 'Git Repository',
      status: 'warning',
      message: 'Repository exists but could not read commit history',
      remediation: 'Check git repository integrity: git fsck',
    };
  }
}

/**
 * Validate quality gates are properly configured
 * Checks for husky hooks, ESLint, Prettier, TypeScript configs
 */
export async function validateQualityGates(projectPath: string): Promise<CheckResult> {
  const huskyPath = path.join(projectPath, '.husky');
  const lefthookPath = path.join(projectPath, 'lefthook.yml');

  // Check for git hooks (husky or lefthook)
  const hasHusky = await fs.pathExists(huskyPath);
  const hasLefthook = await fs.pathExists(lefthookPath);
  const hasGitHooks = hasHusky || hasLefthook;

  // Check for ESLint config (multiple possible file names)
  const eslintConfigs = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
  ];
  let hasEslint = false;
  for (const config of eslintConfigs) {
    if (await fs.pathExists(path.join(projectPath, config))) {
      hasEslint = true;
      break;
    }
  }
  // Also check package.json for eslintConfig
  if (!hasEslint) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const pkg = await fs.readJson(packageJsonPath);
        if (pkg.eslintConfig) {
          hasEslint = true;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }

  // Check for Prettier config
  const prettierConfigs = [
    'prettier.config.js',
    'prettier.config.mjs',
    'prettier.config.cjs',
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
  ];
  let hasPrettier = false;
  for (const config of prettierConfigs) {
    if (await fs.pathExists(path.join(projectPath, config))) {
      hasPrettier = true;
      break;
    }
  }
  // Also check package.json for prettier
  if (!hasPrettier) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const pkg = await fs.readJson(packageJsonPath);
        if (pkg.prettier) {
          hasPrettier = true;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }

  // Check for TypeScript config
  const hasTypeScript = await fs.pathExists(path.join(projectPath, 'tsconfig.json'));

  // Build results
  const present: string[] = [];
  const missing: string[] = [];

  if (hasGitHooks) present.push(hasHusky ? 'husky' : 'lefthook');
  else missing.push('git hooks');

  if (hasEslint) present.push('eslint');
  else missing.push('eslint');

  if (hasPrettier) present.push('prettier');
  else missing.push('prettier');

  if (hasTypeScript) present.push('typescript');
  else missing.push('typescript');

  // Determine status
  if (missing.length === 0) {
    return {
      name: 'Quality Gates',
      status: 'pass',
      message: `All configured (${present.join(', ')})`,
    };
  }

  if (present.length === 0) {
    return {
      name: 'Quality Gates',
      status: 'fail',
      message: 'No quality gates configured',
      remediation:
        'Run: pnpm add -D eslint prettier typescript && npx husky init to set up quality gates',
    };
  }

  return {
    name: 'Quality Gates',
    status: 'warning',
    message: `Partial (${present.join(', ')}). Missing: ${missing.join(', ')}`,
    remediation: `Consider adding: ${missing.join(', ')} for comprehensive quality gates`,
  };
}
