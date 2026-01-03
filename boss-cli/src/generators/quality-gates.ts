import path from 'path';
import { writeFile } from '../utils/file-system.js';
import type { QualityPreset } from '../types/index.js';
import { QUALITY_PRESETS } from '../utils/prompts.js';

export async function generateQualityGates(
  projectPath: string,
  quality: QualityPreset
): Promise<void> {
  const preset = QUALITY_PRESETS[quality];

  const gatesConfig = {
    preset: quality,
    gates: preset.gates,
    git_hooks: {
      pre_commit: {
        enabled: true,
        commands:
          quality === 'startup'
            ? ['lint-staged', 'typecheck']
            : ['lint-staged', 'typecheck', 'test-affected'],
      },
      commit_msg: {
        enabled: true,
        type:
          quality === 'enterprise' ? 'conventional-commits-with-ticket' : 'conventional-commits',
      },
    },
    ci: {
      enabled: true,
      checks:
        quality === 'startup'
          ? ['typecheck', 'lint', 'test']
          : quality === 'production'
            ? ['typecheck', 'lint', 'test', 'coverage', 'security-scan']
            : [
                'typecheck',
                'lint',
                'test',
                'coverage',
                'mutation-test',
                'security-scan',
                'dependency-check',
              ],
    },
  };

  await writeFile(
    path.join(projectPath, '.boss', 'quality-gates', 'config.yaml'),
    JSON.stringify(gatesConfig, null, 2)
  );
}
