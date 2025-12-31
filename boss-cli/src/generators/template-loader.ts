import path from 'path';
import { copyDirectory, writeFile, readFile } from '../utils/file-system.js';
import { loadTemplate as loadAssetTemplate } from '../utils/template-loader.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Template, ProjectConfig } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadTemplate(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  const templatePath = path.join(__dirname, '../../templates', template);
  const fs = await import('fs-extra');

  if (await fs.pathExists(templatePath)) {
    // Special handling for T3 template (has base/ and extras/ structure)
    if (template === 't3-app') {
      await loadT3Template(projectPath, templatePath, config);
    } else {
      // Copy template files directly
      await copyDirectory(templatePath, projectPath);
    }
  } else {
    // Create minimal template structure
    await createMinimalTemplate(projectPath, template, config);
  }

  // Ensure .env is always in .gitignore (for all templates)
  await ensureEnvInGitignore(projectPath);
}

async function loadT3Template(
  projectPath: string,
  templatePath: string,
  config: ProjectConfig
): Promise<void> {
  const fs = await import('fs-extra');
  
  // Copy base template
  const basePath = path.join(templatePath, 'base');
  if (await fs.pathExists(basePath)) {
    // Copy base files, handling special files
    const baseFiles = await fs.readdir(basePath);
    for (const file of baseFiles) {
      const srcPath = path.join(basePath, file);
      const destPath = path.join(projectPath, file.startsWith('_') ? file.slice(1) : file);
      
      const stat = await fs.stat(srcPath);
      if (stat.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copy(srcPath, destPath);
      }
    }
  }

  // Copy extras (T3 optional features) - include all for BOSS
  const extrasPath = path.join(templatePath, 'extras');
  if (await fs.pathExists(extrasPath)) {
    // Copy config files
    const configPath = path.join(extrasPath, 'config');
    if (await fs.pathExists(configPath)) {
      const configFiles = await fs.readdir(configPath);
      for (const file of configFiles) {
        if (file.startsWith('_')) {
          // Files starting with _ are optional, copy without underscore
          const srcPath = path.join(configPath, file);
          const destPath = path.join(projectPath, file.slice(1));
          await fs.copy(srcPath, destPath);
        } else {
          const srcPath = path.join(configPath, file);
          const destPath = path.join(projectPath, file);
          await fs.copy(srcPath, destPath);
        }
      }
    }

    // Copy src files (merge with existing src/)
    const extrasSrcPath = path.join(extrasPath, 'src');
    if (await fs.pathExists(extrasSrcPath)) {
      await copyDirectory(extrasSrcPath, path.join(projectPath, 'src'));
    }

    // Copy prisma schemas
    const prismaPath = path.join(extrasPath, 'prisma');
    if (await fs.pathExists(prismaPath)) {
      await fs.ensureDir(path.join(projectPath, 'prisma'));
      await copyDirectory(prismaPath, path.join(projectPath, 'prisma'));
    }
  }

  // Update package.json with project name
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    packageJson.name = config.name;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

async function createMinimalTemplate(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<void> {
  // Create package.json
  const packageJson = getPackageJsonForTemplate(template, config);
  await writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

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
      resolveJsonModule: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };
  await writeFile(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create vitest.config.ts
  const coverageThreshold = config.quality === 'startup' ? 60 : config.quality === 'production' ? 80 : 90;
  const vitestConfig = await loadAssetTemplate('template-loader/vitest.config.ts', {
    coverageThreshold
  });
  await writeFile(path.join(projectPath, 'vitest.config.ts'), vitestConfig);

  // Create ESLint configuration (ESLint 9 flat config format)
  const eslintTemplate = template === 'nextjs-app-turbo' 
    ? 'template-loader/eslint.config.react.js'
    : 'template-loader/eslint.config.node.js';
  const eslintConfigContent = await loadAssetTemplate(eslintTemplate);
  await writeFile(
    path.join(projectPath, 'eslint.config.js'),
    eslintConfigContent
  );

  // Create Prettier configuration
  const prettierConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100,
    arrowParens: 'always',
    endOfLine: 'lf'
  };
  await writeFile(
    path.join(projectPath, '.prettierrc.json'),
    JSON.stringify(prettierConfig, null, 2)
  );

  // Create Prettier ignore file
  const prettierIgnore = await loadAssetTemplate('template-loader/prettierignore');
  await writeFile(path.join(projectPath, '.prettierignore'), prettierIgnore);

  // Create .gitignore
  const gitignore = await loadAssetTemplate('template-loader/gitignore');
  await writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // Create src directory structure
  const fs = await import('fs-extra');
  await fs.ensureDir(path.join(projectPath, 'src'));
  await fs.ensureDir(path.join(projectPath, 'tests'));

  // Create basic index.ts file
  const indexTs = await loadAssetTemplate('template-loader/index.ts', { config });
  await writeFile(path.join(projectPath, 'src', 'index.ts'), indexTs);

  // Create basic test file
  const testFile = await loadAssetTemplate('template-loader/index.test.ts', { config });
  await writeFile(path.join(projectPath, 'tests', 'index.test.ts'), testFile);

  // Create README
  const readme = await loadAssetTemplate('template-loader/README.md', { config, template });
  await writeFile(path.join(projectPath, 'README.md'), readme);
}

async function ensureEnvInGitignore(projectPath: string): Promise<void> {
  const fs = await import('fs-extra');
  const gitignorePath = path.join(projectPath, '.gitignore');
  
  // If .gitignore doesn't exist, create it with .env
  if (!(await fs.pathExists(gitignorePath))) {
    await writeFile(gitignorePath, '# Environment variables (1Password secret references)\n.env\n.env.local\n.env.*.local\n');
    return;
  }

  // Read existing .gitignore
  let content = await readFile(gitignorePath);
  
  // Check if .env patterns are already present (more specific check)
  // Look for .env on its own line (not as part of another word)
  const hasEnvPattern = /^\.env$/m.test(content) || /^\.env\*$/m.test(content) || /^\.env\./m.test(content);
  
  // If .env is not in gitignore, add it
  if (!hasEnvPattern) {
    // Add .env patterns if they don't exist
    const envSection = '\n# Environment variables (1Password secret references)\n.env\n.env.local\n.env.*.local\n';
    const updatedContent = content.trimEnd() + envSection;
    await writeFile(gitignorePath, updatedContent);
  }
}

function getPackageJsonForTemplate(template: Template, config: ProjectConfig): any {
  const base = {
    name: config.name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      'prepare': 'husky install',
      'typecheck': 'tsc --noEmit',
      'lint': 'eslint src',
      'lint:fix': 'eslint src --fix',
      'format': 'prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"',
      'format:check': 'prettier --check "src/**/*.{ts,tsx,js,jsx,json,md}"',
      'test': 'vitest',
      'test:unit': 'vitest run --exclude "**/tests/{e2e,integration}/**" --exclude "**/*.{e2e,integration}.test.{ts,tsx}"',
      'test:coverage': 'vitest --coverage',
      'test:gates': 'vitest --coverage && npm run typecheck && npm run lint',
      'check:unused': 'tsc --noEmit --noUnusedLocals --noUnusedParameters || true',
      'lint-staged': 'lint-staged'
    },
    'lint-staged': {
      '*.{ts,tsx,js,jsx}': [
        'eslint --fix',
        'prettier --write'
      ],
      '*.{json,md,yml,yaml}': [
        'prettier --write'
      ]
    }
  };

  if (template === 't3-app') {
    // T3 template has its own package.json, so we'll use that
    return null; // Signal to use template's package.json as-is
  }

  if (template === 'nextjs-app-turbo') {
    return {
      ...base,
      scripts: {
        ...base.scripts,
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start'
      },
      dependencies: {
        'next': '^15.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
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
        'eslint': '^9.39.2',
        'eslint-plugin-react': '^7.37.2',
        'eslint-plugin-react-hooks': '^5.1.0',
        'globals': '^15.14.0',
        'husky': '^9.0.0',
        'lint-staged': '^16.2.7',
        'prettier': '^3.7.4',
        'typescript': '^5.9.3',
        'typescript-eslint': '^8.51.0',
        'vitest': '^4.0.16'
      }
    };
  }

  if (template === 'api-service-fastify') {
    return {
      ...base,
      scripts: {
        ...base.scripts,
        'dev': 'tsx watch src/index.ts',
        'build': 'tsc',
        'start': 'node dist/index.js'
      },
      dependencies: {
        'fastify': '^4.24.0'
      },
      devDependencies: {
        '@eslint/js': '^9.39.2',
        '@types/node': '^20.0.0',
        '@typescript-eslint/eslint-plugin': '^8.51.0',
        '@typescript-eslint/parser': '^8.51.0',
        '@vitest/coverage-v8': '^4.0.16',
        'eslint': '^9.39.2',
        'globals': '^15.14.0',
        'husky': '^9.0.0',
        'lint-staged': '^16.2.7',
        'prettier': '^3.7.4',
        'typescript': '^5.9.3',
        'typescript-eslint': '^8.51.0',
        'tsx': '^4.21.0',
        'vitest': '^4.0.16'
      }
    };
  }

  // blank template
  return {
    ...base,
    devDependencies: {
      '@eslint/js': '^9.39.2',
      '@types/node': '^20.0.0',
      '@typescript-eslint/eslint-plugin': '^8.51.0',
      '@typescript-eslint/parser': '^8.51.0',
      '@vitest/coverage-v8': '^4.0.16',
      'eslint': '^9.39.2',
      'globals': '^15.14.0',
      'husky': '^9.0.0',
      'lint-staged': '^16.2.7',
      'prettier': '^3.7.4',
      'typescript': '^5.9.3',
      'typescript-eslint': '^8.51.0',
      'tsx': '^4.21.0',
      'vitest': '^4.0.16'
    }
  };
}

