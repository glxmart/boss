import path from 'path';
import { execa } from 'execa';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateClaudeFolder(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Detect which IDE is available and only generate that folder
  const ideFolder = await detectIDE();
  await generateIDEFolder(projectPath, ideFolder);
}

async function detectIDE(): Promise<'.claude' | '.cursor'> {
  const os = await import('os');
  const fs = await import('fs-extra');
  // Use process.env.HOME if available (for testing), otherwise fall back to os.homedir()
  const homeDir = process.env.HOME || os.homedir();

  // Check for Claude Code config directory first (default/preferred)
  const claudeCodeDir = path.join(homeDir, '.config', 'claude-code');
  if (await fs.pathExists(claudeCodeDir)) {
    return '.claude';
  }

  // Check for Cursor config directory
  const cursorDir = path.join(homeDir, '.cursor');
  if (await fs.pathExists(cursorDir)) {
    return '.cursor';
  }

  // Check for CLI commands as fallback
  try {
    await execa('claude', ['--version'], { reject: false });
    return '.claude';
  } catch {
    try {
      await execa('cursor', ['--version'], { reject: false });
      return '.cursor';
    } catch {
      // Neither detected, default to Claude Code
      return '.claude';
    }
  }
}

async function generateIDEFolder(
  projectPath: string,
  folderName: '.claude' | '.cursor'
): Promise<void> {
  const idePath = path.join(projectPath, folderName);

  // Create directory structure
  await ensureDirectory(path.join(idePath, 'rules'));
  await ensureDirectory(path.join(idePath, 'commands'));
  await ensureDirectory(path.join(idePath, 'agents'));
  await ensureDirectory(path.join(idePath, 'skills'));

  // Generate rule files
  await generateCodeStyleRule(idePath);
  await generateTestingRule(idePath);
  await generateSecurityRule(idePath);
  await generateBossWorkflowRule(idePath);

  // Generate commands file
  await generateBossCommands(idePath);

  // Generate settings.json (optional)
  await generateSettings(idePath);

  // Generate settings.local.json for auto-approving common commands
  await generateSettingsLocal(idePath);
}

async function generateCodeStyleRule(claudePath: string): Promise<void> {
  const content = await loadTemplate('claude-folder/rules/code-style.md');
  await writeFile(path.join(claudePath, 'rules', 'code-style.md'), content);
}

async function generateTestingRule(claudePath: string): Promise<void> {
  const content = await loadTemplate('claude-folder/rules/testing.md');
  await writeFile(path.join(claudePath, 'rules', 'testing.md'), content);
}

async function generateSecurityRule(claudePath: string): Promise<void> {
  const content = await loadTemplate('claude-folder/rules/security.md');
  await writeFile(path.join(claudePath, 'rules', 'security.md'), content);
}

async function generateBossWorkflowRule(claudePath: string): Promise<void> {
  const content = await loadTemplate('claude-folder/rules/boss-workflow.md');
  await writeFile(path.join(claudePath, 'rules', 'boss-workflow.md'), content);
}

async function generateBossCommands(claudePath: string): Promise<void> {
  const content = await loadTemplate('claude-folder/commands/boss-commands.md');
  await writeFile(path.join(claudePath, 'commands', 'boss-commands.md'), content);
}

async function generateSettings(claudePath: string): Promise<void> {
  const settings = {
    'spec-kit': {
      enabled: true,
      path: '.specify',
    },
  };

  await writeFile(path.join(claudePath, 'settings.json'), JSON.stringify(settings, null, 2));
}

async function generateSettingsLocal(claudePath: string): Promise<void> {
  // Load settings.local.json template
  const content = await loadTemplate('claude-folder/settings.local.json');
  await writeFile(path.join(claudePath, 'settings.local.json'), content);
}
