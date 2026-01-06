import path from 'path';
import { copyDirectory, writeFile, readFile } from '../utils/file-system.js';
import { loadTemplate as loadAssetTemplate } from '../utils/template-loader.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Template, ProjectConfig, PackageJson } from '../types/index.js';
import { TEMPLATES } from '../utils/prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// New template system - external templates
// Phase 1: Minimal template generation (placeholder until Phase 2 external template execution)
// Phase 2 will implement actual external template execution via `externalCommand`
const EXTERNAL_TEMPLATES: Template[] = [
  't3-prisma',
  't3-drizzle',
  'nestjs-typeorm',
  'fastify-native',
  'astro-portfolio',
];

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

/**
 * Copies files from a source directory, handling underscore-prefixed dotfiles.
 * Files starting with '_' are copied with the underscore removed (e.g., _gitignore -> .gitignore).
 */
async function copyBaseFiles(srcDir: string, destDir: string): Promise<void> {
  const fs = await getFs();
  const files = await fs.readdir(srcDir);

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destFile = file.startsWith('_') ? file.slice(1) : file;
    const destPath = path.join(destDir, destFile);

    const stat = await fs.stat(srcPath);
    if (stat.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

/**
 * Replaces template variables in a file (e.g., {{PROJECT_NAME}}).
 * Throws an error if any unreplaced placeholders remain after processing.
 */
async function processTemplateVariables(
  filePath: string,
  replacements: Record<string, string>
): Promise<void> {
  const fs = await getFs();
  if (!(await fs.pathExists(filePath))) {
    return;
  }

  let content = await fs.readFile(filePath, 'utf8');
  const originalContent = content;

  // Replace all known variables
  for (const [variable, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
  }

  // Check for any remaining unreplaced placeholders
  const unreplacedPlaceholders = content.match(/\{\{[A-Z_]+\}\}/g);
  if (unreplacedPlaceholders && unreplacedPlaceholders.length > 0) {
    throw new Error(
      `Failed to replace all template variables in ${filePath}. ` +
        `Unreplaced placeholders: ${unreplacedPlaceholders.join(', ')}. ` +
        `Available replacements: ${Object.keys(replacements).join(', ')}`
    );
  }

  // Only write if content changed (optimization)
  if (content !== originalContent) {
    await fs.writeFile(filePath, content);
  }
}

export async function loadTemplate(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  // New template system: All templates use external generators (Phase 2)
  // For Phase 1, we create minimal templates as placeholders
  // The external template execution (create-t3-app, create-fastify, etc.) will be
  // implemented in Phase 2 via the external-templates.ts generator

  if (EXTERNAL_TEMPLATES.includes(template)) {
    // Phase 1: Create minimal template as placeholder
    // Phase 2 will replace this with actual external template execution
    await createMinimalTemplate(projectPath, template, config);
  } else {
    // Fallback for any unknown templates
    await createMinimalTemplate(projectPath, template, config);
  }

  await ensureEnvInGitignore(projectPath);
}

async function loadT3Template(
  projectPath: string,
  templatePath: string,
  config: ProjectConfig
): Promise<void> {
  const fs = await getFs();
  const basePath = path.join(templatePath, 'base');
  const extrasPath = path.join(templatePath, 'extras');

  // Copy base template files
  if (await fs.pathExists(basePath)) {
    await copyBaseFiles(basePath, projectPath);
  }

  // Copy extras (T3 optional features)
  if (await fs.pathExists(extrasPath)) {
    await copyBaseFiles(path.join(extrasPath, 'config'), projectPath);
    await copyDirectoryIfExists(path.join(extrasPath, 'src'), path.join(projectPath, 'src'));
    await copyDirectoryIfExists(path.join(extrasPath, 'prisma'), path.join(projectPath, 'prisma'));
  }

  // Update package.json with project name and pnpm configuration
  await updatePackageJson(path.join(projectPath, 'package.json'), config.name);
}

/**
 * Copies a directory if it exists, creating the destination if needed.
 */
async function copyDirectoryIfExists(src: string, dest: string): Promise<void> {
  const fs = await getFs();
  if (await fs.pathExists(src)) {
    await fs.ensureDir(dest);
    await copyDirectory(src, dest);
  }
}

/**
 * Updates package.json with the project name and ensures pnpm esbuild configuration.
 */
async function updatePackageJson(packageJsonPath: string, projectName: string): Promise<void> {
  const fs = await getFs();
  if (!(await fs.pathExists(packageJsonPath))) {
    return;
  }

  let packageJson: PackageJson;
  try {
    const content = await fs.readFile(packageJsonPath, 'utf8');
    packageJson = JSON.parse(content) as PackageJson;
  } catch (error) {
    throw new Error(
      `Failed to parse package.json at ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  packageJson.name = projectName;

  // Ensure pnpm configuration for esbuild
  packageJson.pnpm = packageJson.pnpm || {};
  packageJson.pnpm.onlyBuiltDependencies = packageJson.pnpm.onlyBuiltDependencies || [];
  if (!packageJson.pnpm.onlyBuiltDependencies.includes('esbuild')) {
    packageJson.pnpm.onlyBuiltDependencies.push('esbuild');
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function loadMonorepoTemplate(
  projectPath: string,
  templatePath: string,
  config: ProjectConfig
): Promise<void> {
  const fs = await getFs();
  const basePath = path.join(templatePath, 'base');
  const extrasPath = path.join(templatePath, 'extras');

  // Copy base monorepo structure
  if (await fs.pathExists(basePath)) {
    await copyBaseFiles(basePath, projectPath);
  }

  // Copy extras (Kamal configs, scripts, etc.)
  if (await fs.pathExists(extrasPath)) {
    await copyDirectoryIfExists(
      path.join(extrasPath, 'config', 'kamal'),
      path.join(projectPath, 'config', 'kamal')
    );
    await copyDockerignoreIfExists(extrasPath, projectPath);
    await copyScriptsWithExecutablePermissions(extrasPath, projectPath);

    // Copy template-specific GitHub workflows (override defaults)
    const templateWorkflowsPath = path.join(extrasPath, 'boss-cli', 'assets', 'github-workflows');
    if (await fs.pathExists(templateWorkflowsPath)) {
      await copyDirectoryIfExists(
        templateWorkflowsPath,
        path.join(projectPath, '.github', 'workflows')
      );
    }
  }

  // Process all template variables
  const templateVariables = {
    PROJECT_NAME: config.name,
    GITHUB_USERNAME: config.githubOrg || 'your-github-username',
    DOMAIN: `${config.name}.com`,
    PRODUCTION_IP: 'your-production-server-ip',
  };

  const filesToProcess = [
    'package.json',
    'apps/web/package.json',
    'apps/admin/package.json',
    'apps/web/app/layout.tsx',
    'apps/web/app/page.tsx',
    'apps/admin/app/layout.tsx',
    'config/kamal/deploy.yml',
    'docker/Dockerfile.web',
  ];

  for (const file of filesToProcess) {
    try {
      await processTemplateVariables(path.join(projectPath, file), templateVariables);
    } catch (error) {
      throw new Error(
        `Failed to process template variables in ${file}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

async function copyDockerignoreIfExists(extrasPath: string, projectPath: string): Promise<void> {
  const fs = await getFs();
  const dockerignore = path.join(extrasPath, 'config', 'docker', '.dockerignore');
  if (await fs.pathExists(dockerignore)) {
    await fs.copy(dockerignore, path.join(projectPath, '.dockerignore'));
  }
}

async function copyScriptsWithExecutablePermissions(
  extrasPath: string,
  projectPath: string
): Promise<void> {
  const fs = await getFs();
  const scriptsPath = path.join(extrasPath, 'scripts');

  if (!(await fs.pathExists(scriptsPath))) {
    return;
  }

  const destScriptsPath = path.join(projectPath, 'scripts');
  await fs.ensureDir(destScriptsPath);
  await copyDirectory(scriptsPath, destScriptsPath);

  // Make scripts executable
  const scripts = await fs.readdir(destScriptsPath);
  await Promise.all(
    scripts.map(async (script: string) => {
      const scriptPath = path.join(destScriptsPath, script);
      try {
        await fs.chmod(scriptPath, 0o755);
      } catch (error) {
        throw new Error(
          `Failed to make script executable: ${scriptPath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })
  );
}

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
