import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import { loadTemplate } from '../utils/template-loader.js';
import type { QualityPreset, Template } from '../types/index.js';
import { QUALITY_PRESETS } from '../utils/prompts.js';

/**
 * Template to TypeScript config mapping
 */
const TEMPLATE_TSCONFIG_MAP: Record<Template, string> = {
  't3-prisma': 'nextjs',
  't3-drizzle': 'nextjs',
  'nestjs-typeorm': 'nestjs',
  'fastify-native': 'fastify',
  'astro-portfolio': 'astro',
};

/**
 * Template to ESLint config mapping
 */
const TEMPLATE_ESLINT_MAP: Record<Template, string> = {
  't3-prisma': 'nextjs',
  't3-drizzle': 'nextjs',
  'nestjs-typeorm': 'nestjs',
  'fastify-native': 'fastify',
  'astro-portfolio': 'astro',
};

/**
 * ESLint dependencies per template
 */
const ESLINT_DEPENDENCIES: Record<string, string[]> = {
  base: [
    '@eslint/js',
    'typescript-eslint',
    'eslint-config-prettier',
    'eslint',
    'prettier',
    'lint-staged',
  ],
  nextjs: ['eslint-plugin-react', 'eslint-plugin-react-hooks', '@next/eslint-plugin-next'],
  nestjs: [],
  fastify: [],
  astro: ['eslint-plugin-astro', 'eslint-plugin-react', 'eslint-plugin-react-hooks'],
};

export interface QualityGatesOptions {
  template: Template;
  quality: QualityPreset;
}

/**
 * Generate all quality gates configuration files
 *
 * This generates:
 * - .boss/quality-gates/config.yaml - Quality gates configuration
 * - tsconfig.json - TypeScript strict configuration
 * - eslint.config.mjs - ESLint flat configuration
 * - .prettierrc - Prettier configuration
 * - .prettierignore - Prettier ignore file
 * - .lintstagedrc.json - Lint-staged configuration
 */
export async function generateQualityGates(
  projectPath: string,
  quality: QualityPreset,
  template?: Template
): Promise<void> {
  const preset = QUALITY_PRESETS[quality];

  // Ensure quality gates directory exists
  await ensureDirectory(path.join(projectPath, '.boss', 'quality-gates'));

  // Generate quality gates config
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

  // Generate TypeScript config if template is provided
  if (template) {
    await generateTypeScriptConfig(projectPath, template);
  }

  // Generate ESLint config if template is provided
  if (template) {
    await generateESLintConfig(projectPath, template);
  }

  // Generate Prettier config
  await generatePrettierConfig(projectPath);

  // Generate lint-staged config
  await generateLintStagedConfig(projectPath);
}

/**
 * Generate TypeScript strict mode configuration based on template
 */
export async function generateTypeScriptConfig(
  projectPath: string,
  template: Template
): Promise<void> {
  const configType = TEMPLATE_TSCONFIG_MAP[template];
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');

  // Don't overwrite existing tsconfig.json (external templates create their own)
  if (await fs.pathExists(tsconfigPath)) {
    // Instead, we'll merge strict settings into the existing config
    await mergeTypeScriptStrictSettings(tsconfigPath);
    return;
  }

  // Load template-specific tsconfig
  const tsconfigContent = await loadTemplate(`quality-gates/tsconfig/${configType}.json`);
  await writeFile(tsconfigPath, tsconfigContent);
}

/**
 * Merge BOSS strict TypeScript settings into existing tsconfig.json
 */
async function mergeTypeScriptStrictSettings(tsconfigPath: string): Promise<void> {
  try {
    const content = await fs.readFile(tsconfigPath, 'utf8');
    const tsconfig = JSON.parse(content);

    // Ensure compilerOptions exists
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }

    // Add/override strict settings
    const strictSettings = {
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      forceConsistentCasingInFileNames: true,
    };

    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      ...strictSettings,
    };

    await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  } catch {
    // If we can't parse the existing tsconfig, leave it as is
    // The doctor command will catch any issues
  }
}

/**
 * Generate ESLint flat configuration based on template
 */
export async function generateESLintConfig(projectPath: string, template: Template): Promise<void> {
  const configType = TEMPLATE_ESLINT_MAP[template];
  const eslintConfigPath = path.join(projectPath, 'eslint.config.mjs');

  // Don't overwrite existing ESLint config
  if (await fs.pathExists(eslintConfigPath)) {
    return;
  }

  // Check for other ESLint config formats
  const otherConfigs = [
    'eslint.config.js',
    'eslint.config.cjs',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
  ];

  for (const config of otherConfigs) {
    if (await fs.pathExists(path.join(projectPath, config))) {
      return; // Don't create if any ESLint config exists
    }
  }

  // Load template-specific ESLint config
  const eslintContent = await loadTemplate(`quality-gates/eslint/${configType}.mjs`);
  await writeFile(eslintConfigPath, eslintContent);
}

/**
 * Generate Prettier configuration
 */
export async function generatePrettierConfig(projectPath: string): Promise<void> {
  const prettierrcPath = path.join(projectPath, '.prettierrc');
  const prettierignorePath = path.join(projectPath, '.prettierignore');

  // Don't overwrite existing Prettier config
  const prettierConfigs = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    'prettier.config.js',
    'prettier.config.mjs',
    'prettier.config.cjs',
  ];

  let hasPrettierConfig = false;
  for (const config of prettierConfigs) {
    if (await fs.pathExists(path.join(projectPath, config))) {
      hasPrettierConfig = true;
      break;
    }
  }

  if (!hasPrettierConfig) {
    const prettierContent = await loadTemplate('quality-gates/prettier/prettierrc.json');
    await writeFile(prettierrcPath, prettierContent);
  }

  // Always create/update .prettierignore if it doesn't exist
  if (!(await fs.pathExists(prettierignorePath))) {
    const prettierignoreContent = await loadTemplate('quality-gates/prettier/prettierignore');
    await writeFile(prettierignorePath, prettierignoreContent);
  }
}

/**
 * Generate lint-staged configuration
 */
export async function generateLintStagedConfig(projectPath: string): Promise<void> {
  const lintstagedrcPath = path.join(projectPath, '.lintstagedrc.json');

  // Don't overwrite existing lint-staged config
  const lintstagedConfigs = [
    '.lintstagedrc',
    '.lintstagedrc.json',
    '.lintstagedrc.js',
    '.lintstagedrc.cjs',
    '.lintstagedrc.mjs',
    '.lintstagedrc.yml',
    '.lintstagedrc.yaml',
    'lint-staged.config.js',
    'lint-staged.config.mjs',
    'lint-staged.config.cjs',
  ];

  for (const config of lintstagedConfigs) {
    if (await fs.pathExists(path.join(projectPath, config))) {
      return;
    }
  }

  // Also check package.json for lint-staged config
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg['lint-staged']) {
        return;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const lintstagedContent = await loadTemplate('quality-gates/lint-staged/lintstagedrc.json');
  await writeFile(lintstagedrcPath, lintstagedContent);
}

/**
 * Get the list of ESLint dependencies needed for a template
 */
export function getESLintDependencies(template: Template): string[] {
  const configType = TEMPLATE_ESLINT_MAP[template];
  return [...ESLINT_DEPENDENCIES.base, ...(ESLINT_DEPENDENCIES[configType] || [])];
}

/**
 * Get the quality preset configuration
 */
export function getQualityPresetConfig(
  quality: QualityPreset
): (typeof QUALITY_PRESETS)[QualityPreset] {
  return QUALITY_PRESETS[quality];
}
