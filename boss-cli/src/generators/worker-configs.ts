import path from 'path';
import { promises as fsPromises } from 'fs';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import { loadTemplate, discoverWorkers, getAssetPath } from '../utils/template-loader.js';
import type { ProjectConfig } from '../types/index.js';

// NOTE: Worker phases and metadata are now defined in conductor-mcp/worker-configs/*/metadata.json
// Boss-cli only generates worker-specific CLAUDE.md and IDE folders

export async function generateWorkerConfigs(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Dynamically discover workers from assets/worker-configs/
  const workers = await discoverWorkers();

  for (const worker of workers) {
    const workerPath = path.join(projectPath, '.boss', 'workers', worker);
    await ensureDirectory(workerPath);

    // NOTE: prompt.md, container-config.json, and metadata.json are conductor's responsibility
    // They live in conductor-mcp/worker-configs/ and are read by conductor when spawning workers

    // Generate CLAUDE.md (worker-specific instructions)
    await generateWorkerClaudeMD(workerPath, worker, config);

    // Generate .claude folder for worker-specific configuration
    // NOTE: Both Claude Code and Cursor accept .claude configuration (CLAUDE.md, commands, skills)
    // No need for separate .cursor folder - Cursor is compatible with Claude config format
    await generateWorkerIDEFolder(workerPath, worker, '.claude');
  }
}

// NOTE: Worker role descriptions and artifact requirements are now defined in conductor-mcp/worker-configs/*/metadata.json
// These functions are no longer needed as conductor owns the worker specifications


async function generateWorkerClaudeMD(
  workerPath: string,
  workerName: string,
  config: ProjectConfig
): Promise<void> {
  // Worker-specific CLAUDE.md with minimal templating
  const claudeMD = await loadTemplate(`worker-configs/${workerName}/CLAUDE.md`, {
    workerName,
    config
  });

  await writeFile(path.join(workerPath, 'CLAUDE.md'), claudeMD);
}

async function copyRelevantSpecKitCommands(
  idePath: string,
  workerName: string
): Promise<void> {
  // Copy ONLY the spec-kit commands relevant to this worker
  // Based on primaryCommand field in worker's metadata.json
  // NOTE: BOSS-specific commands (boss-commands.md) stay with BOSS only

  const fs = await import('fs-extra');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Load worker metadata to get primaryCommand
  const conductorMetadataPath = path.join(__dirname, '../../../conductor-mcp/worker-configs', workerName, 'metadata.json');

  let primaryCommands: string[] = [];
  try {
    const metadataContent = await fsPromises.readFile(conductorMetadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    if (metadata.primaryCommand) {
      // Handle both string and array formats
      primaryCommands = Array.isArray(metadata.primaryCommand)
        ? metadata.primaryCommand
        : [metadata.primaryCommand];
    }
  } catch (error) {
    // If metadata doesn't exist or has no primaryCommand, this worker gets no spec-kit commands
    return;
  }

  if (primaryCommands.length === 0) {
    return;
  }

  // Map /speckit.XXX to XXX.md
  const commandFiles = primaryCommands.map(cmd => {
    const match = cmd.match(/\/speckit\.(\w+)/);
    return match ? `${match[1]}.md` : null;
  }).filter(Boolean) as string[];

  // Copy only the relevant spec-kit command files
  const specKitCommandsPath = path.join(__dirname, '../../templates/spec-kit/templates/commands');
  for (const commandFile of commandFiles) {
    const sourceFile = path.join(specKitCommandsPath, commandFile);
    const destFile = path.join(idePath, 'commands', commandFile);

    if (await fs.pathExists(sourceFile)) {
      await fs.copy(sourceFile, destFile);
    }
  }
}

async function generateWorkerIDEFolder(
  workerPath: string,
  workerName: string,
  folderName: '.claude' | '.cursor'
): Promise<void> {
  const idePath = path.join(workerPath, folderName);
  await ensureDirectory(path.join(idePath, 'commands'));
  await ensureDirectory(path.join(idePath, 'skills'));

  // NOTE: No 'agents' folder - workers are already isolated agents running in containers
  // The worker itself IS the agent, so agent-specific config is redundant

  const fs = await import('fs-extra');

  // Step 1: Copy only relevant Spec-Kit commands for this worker
  // Based on primaryCommand field in worker's metadata.json
  // BOSS-specific commands (boss-commands.md) are NOT copied to workers
  await copyRelevantSpecKitCommands(idePath, workerName);

  // Step 2: Copy worker-specific configuration files from assets (if they exist)
  // Both Claude Code and Cursor use .claude configuration format
  const assetClaudePath = getAssetPath(`worker-configs/${workerName}/.claude`);

  if (await fs.pathExists(assetClaudePath)) {
    // Copy commands and skills files if they exist
    // (No agents folder - workers are already isolated agents)
    for (const subfolder of ['commands', 'skills']) {
      const assetSubfolder = path.join(assetClaudePath, subfolder);
      const destSubfolder = path.join(idePath, subfolder);
      
      if (await fs.pathExists(assetSubfolder)) {
        const files = await fsPromises.readdir(assetSubfolder);
        for (const file of files) {
          if (file !== '.gitkeep' && file !== '.DS_Store') {
            const assetFilePath = path.join(assetSubfolder, file);
            const stat = await fsPromises.stat(assetFilePath);
            if (stat.isFile()) {
              try {
                const content = await loadTemplate(
                  `worker-configs/${workerName}/.claude/${subfolder}/${file}`,
                  { workerName }
                );
                await writeFile(path.join(destSubfolder, file), content);
              } catch (error) {
                // If template loading fails, just copy the file directly
                await fs.copy(assetFilePath, path.join(destSubfolder, file));
              }
            }
          }
        }
      }
    }
  }
}

