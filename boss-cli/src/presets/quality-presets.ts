import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile, writeFile } from '../utils/file-system.js';
import type { QualityPreset } from '../types/index.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function applyQualityPreset(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  // Load preset YAML
  const presetPath = path.join(__dirname, `${quality}.yaml`);
  const fs = await import('fs-extra');
  
  let preset: any = {};
  if (await fs.pathExists(presetPath)) {
    const content = await readFile(presetPath);
    preset = yaml.load(content) as any;
  } else {
    // Use default preset
    preset = getDefaultPreset(quality);
  }

  // Update .boss/config.yaml with quality gates
  const configPath = path.join(projectPath, '.boss', 'config.yaml');
  const configContent = await readFile(configPath);
  const config = yaml.load(configContent) as any;

  config.quality = {
    preset: quality,
    gates: preset.gates || {}
  };

  await writeFile(configPath, yaml.dump(config, { indent: 2 }));
}

function getDefaultPreset(quality: QualityPreset): any {
  const presets: Record<QualityPreset, any> = {
    'startup': {
      gates: {
        coverage: 60,
        lint: true,
        typecheck: true,
        test: true
      }
    },
    'production': {
      gates: {
        coverage: 80,
        mutation: 80,
        lint: true,
        typecheck: true,
        test: true,
        security: true
      }
    },
    'enterprise': {
      gates: {
        coverage: 90,
        mutation: 80,
        lint: true,
        typecheck: true,
        test: true,
        security: true,
        dependency_check: true
      }
    }
  };
  return presets[quality];
}

