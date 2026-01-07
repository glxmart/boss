import path from 'path';
import type { Template, ProjectConfig, PackageJson } from '../types/index.js';
import { writeFile, readFile, pathExists } from '../utils/file-system.js';
import { loadTemplate as loadAssetTemplate, getAssetPath } from '../utils/template-loader.js';
import { copyFile } from '../utils/file-system.js';

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
 * Enhancement result for tracking what was applied
 */
export interface EnhancementResult {
  template: Template;
  enhancementsApplied: string[];
  dependenciesAdded: string[];
  filesCreated: string[];
}

/**
 * Apply template-specific enhancements after external template generation
 *
 * Enhancements are BOSS-specific additions that enhance the base template:
 * - Health check endpoints (/health, /ready)
 * - Structured logging (pino)
 * - Error handling (error boundaries, global exception filters)
 * - Additional integrations (shadcn/ui, t3-env, etc.)
 */
export async function applyTemplateEnhancements(
  projectPath: string,
  template: Template,
  config: ProjectConfig
): Promise<EnhancementResult> {
  const result: EnhancementResult = {
    template,
    enhancementsApplied: [],
    dependenciesAdded: [],
    filesCreated: [],
  };

  switch (template) {
    case 't3-prisma':
    case 't3-drizzle':
      await applyT3Enhancements(projectPath, config, result);
      break;
    case 'nestjs-typeorm':
      await applyNestJSEnhancements(projectPath, config, result);
      break;
    case 'fastify-native':
      await applyFastifyEnhancements(projectPath, config, result);
      break;
    case 'astro-portfolio':
      await applyAstroEnhancements(projectPath, config, result);
      break;
    // spring-boot-jpa is deferred to Phase B
    default:
      // No enhancements for unknown templates
      break;
  }

  return result;
}

/**
 * T3 Stack enhancements:
 * - Error boundaries for React components
 * - Pino for structured logging
 * - Health check API route
 * - shadcn/ui configuration (components added later by user)
 * - t3-env configuration
 */
async function applyT3Enhancements(
  projectPath: string,
  _config: ProjectConfig,
  result: EnhancementResult
): Promise<void> {
  const fs = await getFs();

  // 1. Add error boundary component
  const componentsDir = path.join(projectPath, 'src', 'components');
  await fs.ensureDir(componentsDir);

  const errorBoundaryContent = await loadAssetTemplate('enhancements/t3/error-boundary.tsx');
  const errorBoundaryPath = path.join(componentsDir, 'error-boundary.tsx');
  if (!(await pathExists(errorBoundaryPath))) {
    await writeFile(errorBoundaryPath, errorBoundaryContent);
    result.filesCreated.push('src/components/error-boundary.tsx');
    result.enhancementsApplied.push('React error boundary component');
  }

  // 2. Add health check API route
  const apiDir = path.join(projectPath, 'src', 'app', 'api', 'health');
  await fs.ensureDir(apiDir);

  const healthRouteContent = await loadAssetTemplate('enhancements/t3/health-route.ts');
  const healthRoutePath = path.join(apiDir, 'route.ts');
  if (!(await pathExists(healthRoutePath))) {
    await writeFile(healthRoutePath, healthRouteContent);
    result.filesCreated.push('src/app/api/health/route.ts');
    result.enhancementsApplied.push('Health check API endpoint (/api/health)');
  }

  // 3. Add pino logger utility
  const libDir = path.join(projectPath, 'src', 'lib');
  await fs.ensureDir(libDir);

  const loggerContent = await loadAssetTemplate('enhancements/t3/logger.ts');
  const loggerPath = path.join(libDir, 'logger.ts');
  if (!(await pathExists(loggerPath))) {
    await writeFile(loggerPath, loggerContent);
    result.filesCreated.push('src/lib/logger.ts');
    result.enhancementsApplied.push('Pino structured logger');
  }

  // 4. Add t3-env configuration
  const envConfigContent = await loadAssetTemplate('enhancements/t3/env.ts');
  const envConfigPath = path.join(libDir, 'env.ts');
  if (!(await pathExists(envConfigPath))) {
    await writeFile(envConfigPath, envConfigContent);
    result.filesCreated.push('src/lib/env.ts');
    result.enhancementsApplied.push('t3-env configuration');
  }

  // 5. Add shadcn/ui configuration (components.json)
  const shadcnConfigContent = await loadAssetTemplate('enhancements/t3/components.json');
  const shadcnConfigPath = path.join(projectPath, 'components.json');
  if (!(await pathExists(shadcnConfigPath))) {
    await writeFile(shadcnConfigPath, shadcnConfigContent);
    result.filesCreated.push('components.json');
    result.enhancementsApplied.push('shadcn/ui configuration');
  }

  // 6. Add enhancement dependencies to package.json
  await addDependencies(projectPath, {
    dependencies: {
      pino: '^9.0.0',
      'pino-pretty': '^11.0.0',
      '@t3-oss/env-nextjs': '^0.11.0',
      zod: '^3.23.0',
    },
  });
  result.dependenciesAdded.push('pino', 'pino-pretty', '@t3-oss/env-nextjs', 'zod');
}

/**
 * NestJS enhancements:
 * - Pino logger integration
 * - Global exception filter
 * - Health check endpoint
 */
async function applyNestJSEnhancements(
  projectPath: string,
  _config: ProjectConfig,
  result: EnhancementResult
): Promise<void> {
  const fs = await getFs();

  // 1. Add pino logger module
  const commonDir = path.join(projectPath, 'src', 'common');
  await fs.ensureDir(commonDir);

  const loggerContent = await loadAssetTemplate('enhancements/nestjs/logger.service.ts');
  const loggerPath = path.join(commonDir, 'logger.service.ts');
  if (!(await pathExists(loggerPath))) {
    await writeFile(loggerPath, loggerContent);
    result.filesCreated.push('src/common/logger.service.ts');
    result.enhancementsApplied.push('Pino logger service');
  }

  // 2. Add global exception filter
  const filtersDir = path.join(projectPath, 'src', 'common', 'filters');
  await fs.ensureDir(filtersDir);

  const exceptionFilterContent = await loadAssetTemplate(
    'enhancements/nestjs/all-exceptions.filter.ts'
  );
  const exceptionFilterPath = path.join(filtersDir, 'all-exceptions.filter.ts');
  if (!(await pathExists(exceptionFilterPath))) {
    await writeFile(exceptionFilterPath, exceptionFilterContent);
    result.filesCreated.push('src/common/filters/all-exceptions.filter.ts');
    result.enhancementsApplied.push('Global exception filter');
  }

  // 3. Add health check controller
  const healthDir = path.join(projectPath, 'src', 'health');
  await fs.ensureDir(healthDir);

  const healthControllerContent = await loadAssetTemplate(
    'enhancements/nestjs/health.controller.ts'
  );
  const healthControllerPath = path.join(healthDir, 'health.controller.ts');
  if (!(await pathExists(healthControllerPath))) {
    await writeFile(healthControllerPath, healthControllerContent);
    result.filesCreated.push('src/health/health.controller.ts');
    result.enhancementsApplied.push('Health check endpoint (/health, /ready)');
  }

  const healthModuleContent = await loadAssetTemplate('enhancements/nestjs/health.module.ts');
  const healthModulePath = path.join(healthDir, 'health.module.ts');
  if (!(await pathExists(healthModulePath))) {
    await writeFile(healthModulePath, healthModuleContent);
    result.filesCreated.push('src/health/health.module.ts');
  }

  // 4. Add enhancement dependencies to package.json
  await addDependencies(projectPath, {
    dependencies: {
      pino: '^9.0.0',
      'pino-pretty': '^11.0.0',
      'pino-http': '^10.0.0',
      '@nestjs/terminus': '^10.0.0',
    },
  });
  result.dependenciesAdded.push('pino', 'pino-pretty', 'pino-http', '@nestjs/terminus');
}

/**
 * Fastify enhancements:
 * - Prisma integration
 * - TypeBox validation setup
 * - Global error handler
 * - Health check route
 */
async function applyFastifyEnhancements(
  projectPath: string,
  _config: ProjectConfig,
  result: EnhancementResult
): Promise<void> {
  const fs = await getFs();

  // 1. Add Prisma client setup
  const libDir = path.join(projectPath, 'src', 'lib');
  await fs.ensureDir(libDir);

  const prismaClientContent = await loadAssetTemplate('enhancements/fastify/prisma.ts');
  const prismaClientPath = path.join(libDir, 'prisma.ts');
  if (!(await pathExists(prismaClientPath))) {
    await writeFile(prismaClientPath, prismaClientContent);
    result.filesCreated.push('src/lib/prisma.ts');
    result.enhancementsApplied.push('Prisma client singleton');
  }

  // 2. Add global error handler plugin
  const pluginsDir = path.join(projectPath, 'src', 'plugins');
  await fs.ensureDir(pluginsDir);

  const errorHandlerContent = await loadAssetTemplate('enhancements/fastify/error-handler.ts');
  const errorHandlerPath = path.join(pluginsDir, 'error-handler.ts');
  if (!(await pathExists(errorHandlerPath))) {
    await writeFile(errorHandlerPath, errorHandlerContent);
    result.filesCreated.push('src/plugins/error-handler.ts');
    result.enhancementsApplied.push('Global error handler plugin');
  }

  // 3. Add health check routes
  const routesDir = path.join(projectPath, 'src', 'routes');
  await fs.ensureDir(routesDir);

  const healthRoutesContent = await loadAssetTemplate('enhancements/fastify/health.ts');
  const healthRoutesPath = path.join(routesDir, 'health.ts');
  if (!(await pathExists(healthRoutesPath))) {
    await writeFile(healthRoutesPath, healthRoutesContent);
    result.filesCreated.push('src/routes/health.ts');
    result.enhancementsApplied.push('Health check routes (/health, /ready)');
  }

  // 4. Add TypeBox schemas example
  const schemasDir = path.join(projectPath, 'src', 'schemas');
  await fs.ensureDir(schemasDir);

  const schemasContent = await loadAssetTemplate('enhancements/fastify/common-schemas.ts');
  const schemasPath = path.join(schemasDir, 'common.ts');
  if (!(await pathExists(schemasPath))) {
    await writeFile(schemasPath, schemasContent);
    result.filesCreated.push('src/schemas/common.ts');
    result.enhancementsApplied.push('TypeBox schema examples');
  }

  // 5. Add Prisma schema if not present
  const prismaDir = path.join(projectPath, 'prisma');
  await fs.ensureDir(prismaDir);

  const prismaSchemaContent = await loadAssetTemplate('enhancements/fastify/schema.prisma');
  const prismaSchemaPath = path.join(prismaDir, 'schema.prisma');
  if (!(await pathExists(prismaSchemaPath))) {
    await writeFile(prismaSchemaPath, prismaSchemaContent);
    result.filesCreated.push('prisma/schema.prisma');
    result.enhancementsApplied.push('Prisma schema');
  }

  // 6. Add enhancement dependencies to package.json
  await addDependencies(projectPath, {
    dependencies: {
      '@prisma/client': '^6.0.0',
      '@sinclair/typebox': '^0.34.0',
    },
    devDependencies: {
      prisma: '^6.0.0',
    },
  });
  result.dependenciesAdded.push('@prisma/client', '@sinclair/typebox', 'prisma');

  // 7. Add Prisma scripts to package.json
  await addPackageJsonScripts(projectPath, {
    'db:generate': 'prisma generate',
    'db:migrate': 'prisma migrate dev',
    'db:push': 'prisma db push',
    'db:studio': 'prisma studio',
  });
}

/**
 * Astro enhancements:
 * - React integration (@astrojs/react)
 * - Tailwind CSS integration
 */
async function applyAstroEnhancements(
  projectPath: string,
  _config: ProjectConfig,
  result: EnhancementResult
): Promise<void> {
  const fs = await getFs();

  // 1. Update astro.config.mjs to include React and Tailwind
  const astroConfigContent = await loadAssetTemplate('enhancements/astro/astro.config.mjs');
  const astroConfigPath = path.join(projectPath, 'astro.config.mjs');
  // Always overwrite to ensure integrations are configured
  await writeFile(astroConfigPath, astroConfigContent);
  result.filesCreated.push('astro.config.mjs');
  result.enhancementsApplied.push('Astro config with React and Tailwind');

  // 2. Add Tailwind configuration
  const tailwindConfigContent = await loadAssetTemplate('enhancements/astro/tailwind.config.mjs');
  const tailwindConfigPath = path.join(projectPath, 'tailwind.config.mjs');
  if (!(await pathExists(tailwindConfigPath))) {
    await writeFile(tailwindConfigPath, tailwindConfigContent);
    result.filesCreated.push('tailwind.config.mjs');
    result.enhancementsApplied.push('Tailwind CSS configuration');
  }

  // 3. Add global CSS with Tailwind directives
  const stylesDir = path.join(projectPath, 'src', 'styles');
  await fs.ensureDir(stylesDir);

  const globalCssContent = await loadAssetTemplate('enhancements/astro/global.css');
  const globalCssPath = path.join(stylesDir, 'global.css');
  if (!(await pathExists(globalCssPath))) {
    await writeFile(globalCssPath, globalCssContent);
    result.filesCreated.push('src/styles/global.css');
    result.enhancementsApplied.push('Global CSS with Tailwind directives');
  }

  // 4. Add example React component (island)
  const componentsDir = path.join(projectPath, 'src', 'components');
  await fs.ensureDir(componentsDir);

  const counterContent = await loadAssetTemplate('enhancements/astro/counter.tsx');
  const counterPath = path.join(componentsDir, 'Counter.tsx');
  if (!(await pathExists(counterPath))) {
    await writeFile(counterPath, counterContent);
    result.filesCreated.push('src/components/Counter.tsx');
    result.enhancementsApplied.push('Example React island component');
  }

  // 5. Add enhancement dependencies to package.json
  await addDependencies(projectPath, {
    dependencies: {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
      '@astrojs/react': '^3.0.0',
      '@astrojs/tailwind': '^5.0.0',
      tailwindcss: '^3.4.0',
    },
    devDependencies: {
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
    },
  });
  result.dependenciesAdded.push(
    'react',
    'react-dom',
    '@astrojs/react',
    '@astrojs/tailwind',
    'tailwindcss'
  );
}

/**
 * Add dependencies to package.json
 */
async function addDependencies(
  projectPath: string,
  deps: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!(await pathExists(packageJsonPath))) {
    return;
  }

  const content = await readFile(packageJsonPath);
  let packageJson: PackageJson;

  try {
    packageJson = JSON.parse(content) as PackageJson;
  } catch {
    return;
  }

  // Add dependencies (don't overwrite existing)
  if (deps.dependencies) {
    packageJson.dependencies = packageJson.dependencies || {};
    for (const [key, value] of Object.entries(deps.dependencies)) {
      if (!packageJson.dependencies[key]) {
        packageJson.dependencies[key] = value;
      }
    }
  }

  // Add devDependencies (don't overwrite existing)
  if (deps.devDependencies) {
    packageJson.devDependencies = packageJson.devDependencies || {};
    for (const [key, value] of Object.entries(deps.devDependencies)) {
      if (!packageJson.devDependencies[key]) {
        packageJson.devDependencies[key] = value;
      }
    }
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Add scripts to package.json
 */
async function addPackageJsonScripts(
  projectPath: string,
  scripts: Record<string, string>
): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!(await pathExists(packageJsonPath))) {
    return;
  }

  const content = await readFile(packageJsonPath);
  let packageJson: PackageJson;

  try {
    packageJson = JSON.parse(content) as PackageJson;
  } catch {
    return;
  }

  packageJson.scripts = packageJson.scripts || {};
  for (const [key, value] of Object.entries(scripts)) {
    if (!packageJson.scripts[key]) {
      packageJson.scripts[key] = value;
    }
  }

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
