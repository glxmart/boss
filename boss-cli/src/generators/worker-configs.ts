import path from 'path';
import { promises as fsPromises } from 'fs';
import { execa } from 'execa';
import { writeFile, ensureDirectory, copyDirectory } from '../utils/file-system.js';
import { loadTemplate, discoverWorkers, getAssetPath } from '../utils/template-loader.js';
import type { ProjectConfig } from '../types/index.js';

const WORKER_PHASES: Record<string, string> = {
  'architect': 'Phase 1: Constitution',
  'clarifier': 'Phase 2: Clarification',
  'spec-writer': 'Phase 3: Specification',
  'planner': 'Phase 4: Planning & Phase 6: Task Breakdown',
  'reviewer': 'Phase 5: Validation',
  'developer-frontend': 'Phase 7: Implementation',
  'developer-backend': 'Phase 7: Implementation',
  'developer-fullstack': 'Phase 7: Implementation',
  'consolidator': 'Phase 8: Consolidation'
};

export async function generateWorkerConfigs(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Dynamically discover workers from assets/worker-configs/
  const workers = await discoverWorkers();
  
  for (const worker of workers) {
    const workerPath = path.join(projectPath, '.boss', 'workers', worker);
    await ensureDirectory(workerPath);

    // Generate prompt.md
    await generateWorkerPrompt(workerPath, worker, config);

    // Generate container-config.json
    await generateWorkerContainerConfig(workerPath, worker);

    // Generate CLAUDE.md
    await generateWorkerClaudeMD(workerPath, worker, config);

    // Detect which IDE is available and only generate that folder
    const ideFolder = await detectIDE();
    await generateWorkerIDEFolder(workerPath, worker, ideFolder);
  }
}

async function generateWorkerPrompt(
  workerPath: string,
  workerName: string,
  config: ProjectConfig
): Promise<void> {
  const phase = WORKER_PHASES[workerName] || 'Unknown Phase';
  const workerRoleDescription = getWorkerRoleDescription(workerName);
  const artifactRequirements = getArtifactRequirements(workerName);
  
  const prompt = await loadTemplate(`worker-configs/${workerName}/prompt.md`, {
    workerName,
    phase,
    workerRoleDescription,
    artifactRequirements,
    config
  });

  await writeFile(path.join(workerPath, 'prompt.md'), prompt);
}

function getWorkerRoleDescription(workerName: string): string {
  const descriptions: Record<string, string> = {
    'architect': 'Create constitution.md with governing principles. Enforce Test-First, BDD, and Documentation as NON-NEGOTIABLE.',
    'clarifier': 'Gather business requirements through conversation. Ask business questions (not technical). Document user personas and workflows.',
    'spec-writer': 'Create spec.md with user stories in Given/When/Then format (BDD format). Include acceptance criteria and edge cases.',
    'planner': 'Create plan.md, data-model.md, contracts/. Plan BDD test strategy and documentation structure. Create tasks.md with [P] markers.',
    'reviewer': 'Validate plan against constitution. Check TDD/BDD/Documentation compliance. Verify BDD layer and documentation requirements.',
    'developer-frontend': 'Implement frontend features following TDD + BDD. Create BDD tests and feature documentation.',
    'developer-backend': 'Implement backend features following TDD + BDD. Create API documentation and feature documentation.',
    'developer-fullstack': 'Implement fullstack features following TDD + BDD. Create comprehensive tests and documentation.',
    'consolidator': 'Merge all worker branches. Create quickstart.md and checklist.md. Validate documentation completeness.'
  };
  return descriptions[workerName] || 'Execute assigned tasks following BOSS methodology.';
}

function getArtifactRequirements(workerName: string): string {
  const requirements: Record<string, string> = {
    'architect': '- `.specify/memory/constitution.md` - Must include Architectural Principles, Development Methodology, Testing Standards, Documentation Standards',
    'clarifier': '- `.specify/specs/000-requirements/clarification.md` - Business questions, user personas, workflows',
    'spec-writer': '- `.specify/specs/001-feature/spec.md` - User stories in Given/When/Then format',
    'planner': '- `.specify/specs/001-feature/plan.md`, `data-model.md`, `contracts/` - Technical approach\n- `.specify/specs/001-feature/tasks.md` - Task breakdown with [P] markers',
    'reviewer': '- `.specify/specs/001-feature/validation-report.md` - Constitution compliance check',
    'developer-frontend': '- `src/` - Implementation code\n- `tests/` - BDD tests\n- `docs/` - Feature documentation',
    'developer-backend': '- `src/` - Implementation code\n- `tests/` - BDD tests\n- `docs/` - API and feature documentation',
    'developer-fullstack': '- `src/` - Implementation code\n- `tests/` - BDD tests\n- `docs/` - Comprehensive documentation',
    'consolidator': '- `.specify/specs/001-feature/quickstart.md` - Setup guide\n- `.specify/specs/001-feature/checklist.md` - Quality checklist'
  };
  return requirements[workerName] || '- Complete assigned tasks following Spec-Kit format';
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

async function generateWorkerContainerConfig(
  workerPath: string,
  workerName: string
): Promise<void> {
  const configContent = await loadTemplate(`worker-configs/${workerName}/container-config.json`, {
    workerName
  });
  // Parse and stringify to ensure valid JSON after interpolation
  const config = JSON.parse(configContent);
  await writeFile(
    path.join(workerPath, 'container-config.json'),
    JSON.stringify(config, null, 2)
  );
}

async function generateWorkerClaudeMD(
  workerPath: string,
  workerName: string,
  config: ProjectConfig
): Promise<void> {
  const workerRoleDescription = getWorkerRoleDescription(workerName);
  
  const claudeMD = await loadTemplate(`worker-configs/${workerName}/CLAUDE.md`, {
    workerName,
    workerRoleDescription,
    config
  });
  
  await writeFile(path.join(workerPath, 'CLAUDE.md'), claudeMD);
}

async function generateWorkerIDEFolder(
  workerPath: string,
  workerName: string,
  folderName: '.claude' | '.cursor'
): Promise<void> {
  const idePath = path.join(workerPath, folderName);
  await ensureDirectory(path.join(idePath, 'commands'));
  await ensureDirectory(path.join(idePath, 'skills'));
  await ensureDirectory(path.join(idePath, 'agents'));

  // Copy any existing files from assets (if they exist)
  // Assets use .claude/ as the source, but we copy to both .claude/ and .cursor/
  const fs = await import('fs-extra');
  const assetClaudePath = getAssetPath(`worker-configs/${workerName}/.claude`);

  if (await fs.pathExists(assetClaudePath)) {
    // Copy commands, skills, and agents files if they exist
    for (const subfolder of ['commands', 'skills', 'agents']) {
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

