import { execa } from 'execa';
import { logger } from '../utils/logger.js';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export async function doctorCommand(): Promise<void> {
  logger.section('🏥 BOSS Doctor - System Health Check');

  const checks: CheckResult[] = [];

  // Check Docker
  checks.push(await checkDocker());

  // Check Node.js
  checks.push(await checkNode());

  // Check pnpm
  checks.push(await checkPnpm());

  // Check 1Password CLI
  checks.push(await check1Password());

  // Check Container-Use CLI
  checks.push(await checkContainerUse());

  // Check Claude Code/Cursor
  checks.push(await checkClaudeCode());

  // Check Git
  checks.push(await checkGit());

  // Check ports
  checks.push(await checkPort(5432, 'PostgreSQL'));
  checks.push(await checkPort(6333, 'Qdrant'));
  checks.push(await checkPort(8080, 'Embeddings Service'));

  // Check MCP configs
  checks.push(await checkMCPConfig());

  // Display results
  console.log('\n');
  for (const check of checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
    const color = check.status === 'pass' ? 'green' : check.status === 'fail' ? 'red' : 'yellow';
    logger[check.status === 'pass' ? 'success' : check.status === 'fail' ? 'error' : 'warning'](
      `${icon} ${check.name}: ${check.message}`
    );
  }

  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;

  console.log('\n');
  if (failed === 0 && warnings === 0) {
    logger.success('All checks passed! ✅');
  } else {
    logger.warning(`${failed} failed, ${warnings} warnings`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

async function checkDocker(): Promise<CheckResult> {
  try {
    await execa('docker', ['--version']);
    try {
      await execa('docker', ['ps']);
      return { name: 'Docker', status: 'pass', message: 'Running' };
    } catch {
      return { name: 'Docker', status: 'warning', message: 'Installed but not running' };
    }
  } catch {
    return { name: 'Docker', status: 'fail', message: 'Not installed or not in PATH' };
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
      return { name: 'Node.js', status: 'fail', message: `v${version} (>= 22 required)` };
    }
  } catch {
    return { name: 'Node.js', status: 'fail', message: 'Not installed or not in PATH' };
  }
}

async function checkPnpm(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('pnpm', ['--version']);
    return { name: 'pnpm', status: 'pass', message: `v${stdout}` };
  } catch {
    return { name: 'pnpm', status: 'fail', message: 'Not installed or not in PATH' };
  }
}

async function check1Password(): Promise<CheckResult> {
  try {
    await execa('op', ['--version']);
    try {
      await execa('op', ['account', 'list']);
      return { name: '1Password CLI', status: 'pass', message: 'Installed and authenticated' };
    } catch {
      return { name: '1Password CLI', status: 'warning', message: 'Installed but not authenticated (run: op signin)' };
    }
  } catch {
    return { name: '1Password CLI', status: 'fail', message: 'Not installed or not in PATH' };
  }
}

async function checkContainerUse(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('container-use', ['--version']);
    return { name: 'Container-Use CLI', status: 'pass', message: `v${stdout.trim()}` };
  } catch {
    return { name: 'Container-Use CLI', status: 'fail', message: 'Not installed (run: npm install -g container-use)' };
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
      return { name: 'Claude Code/Cursor', status: 'warning', message: 'Not found in PATH (may be installed but not in PATH)' };
    }
  }
}

async function checkGit(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('git', ['--version']);
    return { name: 'Git', status: 'pass', message: stdout.trim() };
  } catch {
    return { name: 'Git', status: 'fail', message: 'Not installed or not in PATH' };
  }
}

async function checkPort(port: number, service: string): Promise<CheckResult> {
  try {
    const { execa } = await import('execa');
    // Try to check if port is in use (platform-specific)
    if (process.platform === 'darwin' || process.platform === 'linux') {
      try {
        await execa('lsof', ['-i', `:${port}`]);
        return { name: `Port ${port} (${service})`, status: 'warning', message: 'Port is in use' };
      } catch {
        return { name: `Port ${port} (${service})`, status: 'pass', message: 'Available' };
      }
    } else {
      return { name: `Port ${port} (${service})`, status: 'warning', message: 'Port check not available on this platform' };
    }
  } catch {
    return { name: `Port ${port} (${service})`, status: 'warning', message: 'Unable to check port' };
  }
}

async function checkMCPConfig(): Promise<CheckResult> {
  const os = await import('os');
  const path = await import('path');
  const fs = await import('fs-extra');
  
  const configPaths = [
    path.join(os.homedir(), '.config', 'claude-code', 'mcp-servers.json'),
    path.join(os.homedir(), '.cursor', 'mcp-servers.json')
  ];

  for (const configPath of configPaths) {
    if (await fs.pathExists(configPath)) {
      return { name: 'MCP Config', status: 'pass', message: `Found: ${configPath}` };
    }
  }

  return { name: 'MCP Config', status: 'warning', message: 'Not found (will be created during bootstrap)' };
}

