import path from 'path';
import { writeFile, readFile } from '../utils/file-system.js';
import { loadTemplate as loadAssetTemplate } from '../utils/template-loader.js';
import type { Template, ProjectConfig, PackageJson } from '../types/index.js';
import { TEMPLATES } from '../utils/prompts.js';
import { executeExternalTemplate } from './external-templates.js';
import { applyTemplateEnhancements } from './enhancements.js';
import { logger } from '../utils/logger.js';

// New template system - external templates
// Phase 2: Actual external template execution via CLI commands
// Set BOSS_USE_EXTERNAL_TEMPLATES=false to use minimal templates (for testing)
const EXTERNAL_TEMPLATES: Template[] = [
  't3-prisma',
  't3-drizzle',
  'nestjs-typeorm',
  'fastify-native',
  'astro-portfolio',
];

/**
 * Check if external templates should be used
 * External templates are used by default in production
 * Set BOSS_USE_EXTERNAL_TEMPLATES=false to use minimal templates (for testing)
 */
function shouldUseExternalTemplates(): boolean {
  // Disable external templates in test environment by default
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return process.env.BOSS_USE_EXTERNAL_TEMPLATES === 'true';
  }
  // Enable external templates by default in production
  return process.env.BOSS_USE_EXTERNAL_TEMPLATES !== 'false';
}

// Lazy-loaded fs-extra module
type FsExtra = typeof import('fs-extra');
let fsExtra: FsExtra | null = null;

async function getFs(): Promise<FsExtra> {
  if (!fsExtra) {
    const fsModule = await import('fs-extra');
    fsExtra = fsModule.default;
  }
  return fsExtra;
}

// NOTE: Legacy functions copyBaseFiles and processTemplateVariables have been removed
// as they were part of the old embedded template system.

export async function loadTemplate(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  const useExternalTemplates = shouldUseExternalTemplates();

  if (EXTERNAL_TEMPLATES.includes(template) && useExternalTemplates) {
    // Phase 2: Execute external template via CLI commands
    const result = await executeExternalTemplate(projectPath, template, config);

    if (!result.success) {
      // If external template fails, fall back to minimal template
      logger.warning(
        `External template execution failed: ${result.error}. Falling back to minimal template.`
      );
      await createMinimalTemplate(projectPath, template, config);
    } else {
      // Phase 5: Apply template-specific enhancements
      const enhancementResult = await applyTemplateEnhancements(projectPath, template, config);
      if (enhancementResult.enhancementsApplied.length > 0) {
        logger.info(`Applied enhancements: ${enhancementResult.enhancementsApplied.join(', ')}`);
      }

      // Apply BOSS overlay on top of external template
      await applyBossOverlay(projectPath, template, config);
    }
  } else {
    // Use minimal template (for testing or when external templates are disabled)
    await createMinimalTemplate(projectPath, template, config);
  }

  await ensureEnvInGitignore(projectPath);
}

/**
 * Apply BOSS overlay on top of externally generated template
 * This adds BOSS-specific configuration and quality gates to the project
 */
async function applyBossOverlay(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  const fs = await getFs();

  // 1. Ensure package.json has BOSS-required scripts and dependencies
  await ensureBossPackageJson(projectPath, template, config);

  // 2. Add ESLint configuration if not present
  const eslintConfigPath = path.join(projectPath, 'eslint.config.js');
  if (!(await fs.pathExists(eslintConfigPath))) {
    const isReactTemplate =
      template === 't3-prisma' || template === 't3-drizzle' || template === 'astro-portfolio';
    const eslintTemplate = isReactTemplate
      ? 'template-loader/eslint.config.react.js'
      : 'template-loader/eslint.config.node.js';
    const eslintConfigContent = await loadAssetTemplate(eslintTemplate);
    await writeFile(eslintConfigPath, eslintConfigContent);
  }

  // 3. Add Prettier configuration if not present
  const prettierConfigPath = path.join(projectPath, '.prettierrc.json');
  if (!(await fs.pathExists(prettierConfigPath))) {
    const prettierConfig = {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 100,
      arrowParens: 'always',
      endOfLine: 'lf',
    };
    await writeFile(prettierConfigPath, JSON.stringify(prettierConfig, null, 2));
  }

  // 4. Add .prettierignore if not present
  const prettierIgnorePath = path.join(projectPath, '.prettierignore');
  if (!(await fs.pathExists(prettierIgnorePath))) {
    const prettierIgnore = await loadAssetTemplate('template-loader/prettierignore');
    await writeFile(prettierIgnorePath, prettierIgnore);
  }

  // 5. Ensure vitest.config.ts exists (for templates that don't have it)
  const vitestConfigPath = path.join(projectPath, 'vitest.config.ts');
  if (!(await fs.pathExists(vitestConfigPath))) {
    const coverageThreshold = getCoverageThreshold(config.quality);
    const vitestConfig = await loadAssetTemplate('template-loader/vitest.config.ts', {
      coverageThreshold,
    });
    await writeFile(vitestConfigPath, vitestConfig);
  }

  // 6. Ensure tests directory exists with at least one test
  const testsDir = path.join(projectPath, 'tests');
  if (!(await fs.pathExists(testsDir))) {
    await fs.ensureDir(testsDir);
    const testFile = await loadAssetTemplate('template-loader/index.test.ts', { config });
    await writeFile(path.join(testsDir, 'index.test.ts'), testFile);
  }
}

/**
 * Ensure package.json has BOSS-required scripts and devDependencies
 */
async function ensureBossPackageJson(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  const fs = await getFs();
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!(await fs.pathExists(packageJsonPath))) {
    // If package.json doesn't exist, create it from scratch
    const packageJson = getPackageJsonForTemplate(template, config);
    if (packageJson) {
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    return;
  }

  // Read existing package.json
  let packageJson: PackageJson;
  try {
    const content = await fs.readFile(packageJsonPath, 'utf8');
    packageJson = JSON.parse(content) as PackageJson;
  } catch {
    // If we can't parse, skip modification
    return;
  }

  // Ensure BOSS-required scripts
  packageJson.scripts = packageJson.scripts || {};
  const bossScripts: Record<string, string> = {
    prepare: 'husky',
    'lint-staged': 'lint-staged',
    'test:gates': 'vitest --coverage && npm run typecheck && npm run lint',
  };

  // Only add scripts that don't exist
  for (const [key, value] of Object.entries(bossScripts)) {
    if (!packageJson.scripts[key]) {
      packageJson.scripts[key] = value;
    }
  }

  // Ensure lint-staged configuration
  packageJson['lint-staged'] = packageJson['lint-staged'] || {
    '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
    '*.{json,md,yml,yaml}': ['prettier --write'],
  };

  // Ensure pnpm configuration
  packageJson.pnpm = packageJson.pnpm || {};
  packageJson.pnpm.onlyBuiltDependencies = packageJson.pnpm.onlyBuiltDependencies || [];
  if (!packageJson.pnpm.onlyBuiltDependencies.includes('esbuild')) {
    packageJson.pnpm.onlyBuiltDependencies.push('esbuild');
  }

  // Ensure BOSS-required devDependencies
  packageJson.devDependencies = packageJson.devDependencies || {};
  const bossDevDeps: Record<string, string> = {
    husky: '^9.0.0',
    'lint-staged': '^16.2.7',
    prettier: '^3.7.4',
    vitest: '^4.0.16',
    '@vitest/coverage-v8': '^4.0.16',
  };

  // Only add devDependencies that don't exist
  for (const [key, value] of Object.entries(bossDevDeps)) {
    if (!packageJson.devDependencies[key]) {
      packageJson.devDependencies[key] = value;
    }
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// NOTE: Legacy functions loadT3Template, loadMonorepoTemplate, and their helpers
// have been removed as they were part of the old embedded template system.
// The new system uses external templates executed via CLI commands (Phase 2).
// See: external-templates.ts for the new implementation.

async function createMinimalTemplate(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  const fs = await getFs();

  // Create package.json
  const packageJson = getPackageJsonForTemplate(template, config);
  if (packageJson) {
    await writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022'],
      moduleResolution: 'bundler',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };
  await writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // Create vitest.config.ts
  const coverageThreshold = getCoverageThreshold(config.quality);
  const vitestConfig = await loadAssetTemplate('template-loader/vitest.config.ts', {
    coverageThreshold,
  });
  await writeFile(path.join(projectPath, 'vitest.config.ts'), vitestConfig);

  // Create ESLint configuration (ESLint 9 flat config format)
  // Use React config for fullstack/frontend templates, Node config for backend
  const isReactTemplate =
    template === 't3-prisma' || template === 't3-drizzle' || template === 'astro-portfolio';
  const eslintTemplate = isReactTemplate
    ? 'template-loader/eslint.config.react.js'
    : 'template-loader/eslint.config.node.js';
  const eslintConfigContent = await loadAssetTemplate(eslintTemplate);
  await writeFile(path.join(projectPath, 'eslint.config.js'), eslintConfigContent);

  // Create Prettier configuration
  const prettierConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100,
    arrowParens: 'always',
    endOfLine: 'lf',
  };
  await writeFile(
    path.join(projectPath, '.prettierrc.json'),
    JSON.stringify(prettierConfig, null, 2)
  );

  // Ensure directories exist
  await fs.ensureDir(path.join(projectPath, 'src'));
  await fs.ensureDir(path.join(projectPath, 'tests'));

  // Create config files from templates
  const prettierIgnore = await loadAssetTemplate('template-loader/prettierignore');
  await writeFile(path.join(projectPath, '.prettierignore'), prettierIgnore);

  const gitignore = await loadAssetTemplate('template-loader/gitignore');
  await writeFile(path.join(projectPath, '.gitignore'), gitignore);

  const indexTs = await loadAssetTemplate('template-loader/index.ts', { config });
  await writeFile(path.join(projectPath, 'src', 'index.ts'), indexTs);

  const testFile = await loadAssetTemplate('template-loader/index.test.ts', { config });
  await writeFile(path.join(projectPath, 'tests', 'index.test.ts'), testFile);

  const readme = await loadAssetTemplate('template-loader/README.md', { config, template });
  await writeFile(path.join(projectPath, 'README.md'), readme);
}

function getCoverageThreshold(quality: string): number {
  switch (quality) {
    case 'startup':
      return 60;
    case 'production':
      return 80;
    default:
      return 90;
  }
}

const ENV_GITIGNORE_SECTION =
  '# Environment variables (1Password secret references)\n.env\n.env.local\n.env.*.local\n';

async function ensureEnvInGitignore(projectPath: string): Promise<void> {
  const fs = await getFs();
  const gitignorePath = path.join(projectPath, '.gitignore');

  if (!(await fs.pathExists(gitignorePath))) {
    await writeFile(gitignorePath, ENV_GITIGNORE_SECTION);
    return;
  }

  const content = await readFile(gitignorePath);

  // Check if .env patterns are already present (on their own line)
  const hasEnvPattern =
    /^\.env$/m.test(content) || /^\.env\*$/m.test(content) || /^\.env\./m.test(content);

  if (!hasEnvPattern) {
    await writeFile(gitignorePath, content.trimEnd() + '\n' + ENV_GITIGNORE_SECTION);
  }
}

function getPackageJsonForTemplate(template: Template, config: ProjectConfig): PackageJson | null {
  const base = {
    name: config.name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      prepare: 'husky',
      typecheck: 'tsc --noEmit',
      lint: 'eslint src',
      'lint:fix': 'eslint src --fix',
      format: 'prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"',
      'format:check': 'prettier --check "src/**/*.{ts,tsx,js,jsx,json,md}"',
      test: 'vitest',
      'test:unit':
        'vitest run --exclude "**/tests/{e2e,integration}/**" --exclude "**/*.{e2e,integration}.test.{ts,tsx}"',
      'test:coverage': 'vitest --coverage',
      'test:gates': 'vitest --coverage && npm run typecheck && npm run lint',
      'check:unused': 'tsc --noEmit --noUnusedLocals --noUnusedParameters || true',
      'lint-staged': 'lint-staged',
    },
    'lint-staged': {
      '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
      '*.{json,md,yml,yaml}': ['prettier --write'],
    },
    pnpm: {
      onlyBuiltDependencies: ['esbuild'],
    },
  };

  // Get template info for description
  const templateInfo = TEMPLATES[template];

  // T3 Stack templates (Prisma and Drizzle)
  if (template === 't3-prisma' || template === 't3-drizzle') {
    return {
      ...base,
      description: templateInfo?.description || 'T3 Stack application',
      scripts: {
        ...base.scripts,
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
      devDependencies: {
        '@eslint/js': '^9.39.2',
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        '@typescript-eslint/eslint-plugin': '^8.51.0',
        '@typescript-eslint/parser': '^8.51.0',
        '@vitest/coverage-v8': '^4.0.16',
        '@vitejs/plugin-react': '^4.2.0',
        eslint: '^9.39.2',
        'eslint-plugin-react': '^7.37.2',
        'eslint-plugin-react-hooks': '^5.1.0',
        globals: '^15.14.0',
        husky: '^9.0.0',
        'lint-staged': '^16.2.7',
        prettier: '^3.7.4',
        typescript: '^5.9.3',
        'typescript-eslint': '^8.51.0',
        vitest: '^4.0.16',
      },
    };
  }

  // NestJS TypeORM template
  if (template === 'nestjs-typeorm') {
    return {
      ...base,
      description: templateInfo?.description || 'NestJS API with TypeORM',
      scripts: {
        ...base.scripts,
        dev: 'nest start --watch',
        build: 'nest build',
        start: 'node dist/main.js',
        'start:prod': 'node dist/main.js',
      },
      dependencies: {
        '@nestjs/common': '^10.0.0',
        '@nestjs/core': '^10.0.0',
        '@nestjs/platform-express': '^10.0.0',
      },
      devDependencies: {
        '@eslint/js': '^9.39.2',
        '@nestjs/cli': '^10.0.0',
        '@types/node': '^20.0.0',
        '@typescript-eslint/eslint-plugin': '^8.51.0',
        '@typescript-eslint/parser': '^8.51.0',
        '@vitest/coverage-v8': '^4.0.16',
        eslint: '^9.39.2',
        globals: '^15.14.0',
        husky: '^9.0.0',
        'lint-staged': '^16.2.7',
        prettier: '^3.7.4',
        typescript: '^5.9.3',
        'typescript-eslint': '^8.51.0',
        vitest: '^4.0.16',
      },
    };
  }

  // Fastify Native template
  if (template === 'fastify-native') {
    return {
      ...base,
      description: templateInfo?.description || 'Fastify API service',
      scripts: {
        ...base.scripts,
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
      },
      dependencies: {
        fastify: '^4.24.0',
      },
      devDependencies: {
        '@eslint/js': '^9.39.2',
        '@types/node': '^20.0.0',
        '@typescript-eslint/eslint-plugin': '^8.51.0',
        '@typescript-eslint/parser': '^8.51.0',
        '@vitest/coverage-v8': '^4.0.16',
        eslint: '^9.39.2',
        globals: '^15.14.0',
        husky: '^9.0.0',
        'lint-staged': '^16.2.7',
        prettier: '^3.7.4',
        typescript: '^5.9.3',
        'typescript-eslint': '^8.51.0',
        tsx: '^4.21.0',
        vitest: '^4.0.16',
      },
    };
  }

  // Astro Portfolio template
  if (template === 'astro-portfolio') {
    return {
      ...base,
      description: templateInfo?.description || 'Astro portfolio site',
      scripts: {
        ...base.scripts,
        dev: 'astro dev',
        build: 'astro build',
        start: 'astro preview',
      },
      dependencies: {
        astro: '^4.0.0',
      },
      devDependencies: {
        '@eslint/js': '^9.39.2',
        '@types/node': '^20.0.0',
        '@typescript-eslint/eslint-plugin': '^8.51.0',
        '@typescript-eslint/parser': '^8.51.0',
        '@vitest/coverage-v8': '^4.0.16',
        eslint: '^9.39.2',
        globals: '^15.14.0',
        husky: '^9.0.0',
        'lint-staged': '^16.2.7',
        prettier: '^3.7.4',
        typescript: '^5.9.3',
        'typescript-eslint': '^8.51.0',
        vitest: '^4.0.16',
      },
    };
  }

  // Fallback: minimal template
  return {
    ...base,
    devDependencies: {
      '@eslint/js': '^9.39.2',
      '@types/node': '^20.0.0',
      '@typescript-eslint/eslint-plugin': '^8.51.0',
      '@typescript-eslint/parser': '^8.51.0',
      '@vitest/coverage-v8': '^4.0.16',
      eslint: '^9.39.2',
      globals: '^15.14.0',
      husky: '^9.0.0',
      'lint-staged': '^16.2.7',
      prettier: '^3.7.4',
      typescript: '^5.9.3',
      'typescript-eslint': '^8.51.0',
      tsx: '^4.21.0',
      vitest: '^4.0.16',
    },
  };
}
