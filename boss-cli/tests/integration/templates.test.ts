import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bootstrapCommand } from '../../src/commands/bootstrap.js';
import { cleanupTestProject, fileExists, readProjectFile } from '../helpers/test-utils.js';
import { getTestProjectPath } from '../setup.js';
import type { Template, QualityPreset } from '../../src/types/index.js';

/**
 * Creates bootstrap options for a test project.
 */
function createTestOptions(
  projectName: string,
  template: Template = 'blank',
  quality: QualityPreset = 'production'
): {
  template: Template;
  quality: QualityPreset;
  name: string;
  nonInteractive: true;
  projectPath: string;
} {
  return {
    template,
    quality,
    name: projectName,
    nonInteractive: true,
    projectPath: getTestProjectPath(projectName),
  };
}

describe('Template Integration Tests', () => {
  beforeEach(async () => {
    // Cleanup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe('nextjs-app-turbo template (Monorepo)', () => {
    const projectName = 'test-nextjs-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate monorepo workspace configuration', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check root workspace files
      expect(await fileExists(projectName, 'package.json')).toBe(true);
      expect(await fileExists(projectName, 'pnpm-workspace.yaml')).toBe(true);
      expect(await fileExists(projectName, 'turbo.json')).toBe(true);
      expect(await fileExists(projectName, 'tsconfig.json')).toBe(true);

      // Verify root package.json is workspace config
      const rootPackageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(rootPackageJson.name).toBe(projectName);
      expect(rootPackageJson.private).toBe(true);
      // Note: pnpm uses pnpm-workspace.yaml instead of package.json workspaces field

      // Verify pnpm workspace configuration
      const workspaceYaml = await readProjectFile(projectName, 'pnpm-workspace.yaml');
      expect(workspaceYaml).toContain('apps/*');
      expect(workspaceYaml).toContain('packages/*');

      // Verify Turborepo configuration (Turborepo 2.x uses 'tasks' instead of 'pipeline')
      const turboJson = JSON.parse(await readProjectFile(projectName, 'turbo.json'));
      expect(turboJson.tasks).toBeDefined();
      expect(turboJson.tasks.build).toBeDefined();
      expect(turboJson.tasks.dev).toBeDefined();
      expect(turboJson.tasks.test).toBeDefined();
      expect(turboJson.tasks.lint).toBeDefined();
    });

    it('should generate both web and admin apps', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check web app structure
      expect(await fileExists(projectName, 'apps/web/package.json')).toBe(true);
      expect(await fileExists(projectName, 'apps/web/next.config.ts')).toBe(true);
      expect(await fileExists(projectName, 'apps/web/tsconfig.json')).toBe(true);
      expect(await fileExists(projectName, 'apps/web/app/page.tsx')).toBe(true);

      // Check admin app structure
      expect(await fileExists(projectName, 'apps/admin/package.json')).toBe(true);
      expect(await fileExists(projectName, 'apps/admin/next.config.ts')).toBe(true);
      expect(await fileExists(projectName, 'apps/admin/tsconfig.json')).toBe(true);
      expect(await fileExists(projectName, 'apps/admin/app/page.tsx')).toBe(true);

      // Verify web app package.json
      const webPackageJson = JSON.parse(
        await readProjectFile(projectName, 'apps/web/package.json')
      );
      expect(webPackageJson.name).toBe('web');
      expect(webPackageJson.dependencies.next).toBeDefined();
      expect(webPackageJson.dependencies['@repo/ui']).toBeDefined();
      expect(webPackageJson.dependencies['@repo/database']).toBeDefined();
      expect(webPackageJson.dependencies['@repo/trpc']).toBeDefined();
      expect(webPackageJson.dependencies['@repo/auth']).toBeDefined();

      // Verify admin app package.json
      const adminPackageJson = JSON.parse(
        await readProjectFile(projectName, 'apps/admin/package.json')
      );
      expect(adminPackageJson.name).toBe('admin');
      expect(adminPackageJson.dependencies.next).toBeDefined();
      expect(adminPackageJson.dependencies['@repo/ui']).toBeDefined();
    });

    it('should generate all 6 shared packages', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check ui package
      expect(await fileExists(projectName, 'packages/ui/package.json')).toBe(true);
      expect(await fileExists(projectName, 'packages/ui/src/components/ui/button.tsx')).toBe(true);
      expect(await fileExists(projectName, 'packages/ui/.storybook/main.ts')).toBe(true);

      // Check database package
      expect(await fileExists(projectName, 'packages/database/package.json')).toBe(true);
      expect(await fileExists(projectName, 'packages/database/prisma/schema.prisma')).toBe(true);

      // Check trpc package
      expect(await fileExists(projectName, 'packages/trpc/package.json')).toBe(true);
      expect(await fileExists(projectName, 'packages/trpc/src/routers/_app.ts')).toBe(true);

      // Check auth package
      expect(await fileExists(projectName, 'packages/auth/package.json')).toBe(true);
      expect(await fileExists(projectName, 'packages/auth/src/index.ts')).toBe(true);

      // Check config package
      expect(await fileExists(projectName, 'packages/config/package.json')).toBe(true);
      expect(await fileExists(projectName, 'packages/config/eslint/react-library.js')).toBe(true);
      expect(await fileExists(projectName, 'packages/config/typescript/base.json')).toBe(true);

      // Check utils package
      expect(await fileExists(projectName, 'packages/utils/package.json')).toBe(true);
      expect(await fileExists(projectName, 'packages/utils/src/string.ts')).toBe(true);
    });

    it('should verify package dependencies are correctly configured', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Verify ui package dependencies
      const uiPackageJson = JSON.parse(
        await readProjectFile(projectName, 'packages/ui/package.json')
      );
      expect(uiPackageJson.name).toBe('@repo/ui');
      expect(uiPackageJson.dependencies['@repo/utils']).toBeDefined();

      // Verify trpc package dependencies
      const trpcPackageJson = JSON.parse(
        await readProjectFile(projectName, 'packages/trpc/package.json')
      );
      expect(trpcPackageJson.name).toBe('@repo/trpc');
      expect(trpcPackageJson.dependencies['@repo/database']).toBeDefined();
      expect(trpcPackageJson.dependencies['@repo/auth']).toBeDefined();

      // Verify auth package dependencies
      const authPackageJson = JSON.parse(
        await readProjectFile(projectName, 'packages/auth/package.json')
      );
      expect(authPackageJson.name).toBe('@repo/auth');
      expect(authPackageJson.dependencies['@repo/database']).toBeDefined();

      // Verify utils package has tests
      const utilsPackageJson = JSON.parse(
        await readProjectFile(projectName, 'packages/utils/package.json')
      );
      expect(utilsPackageJson.name).toBe('@repo/utils');
      expect(utilsPackageJson.scripts.test).toBeDefined();
    });

    it('should generate Docker and deployment configurations', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check Docker files
      expect(await fileExists(projectName, 'docker/Dockerfile.web')).toBe(true);
      expect(await fileExists(projectName, 'docker/Dockerfile.admin')).toBe(true);
      expect(await fileExists(projectName, 'docker/docker-compose.yml')).toBe(true);

      // Check deployment files
      expect(await fileExists(projectName, 'config/kamal/deploy.yml')).toBe(true);
      expect(await fileExists(projectName, 'scripts/deploy.sh')).toBe(true);
      expect(await fileExists(projectName, 'scripts/setup-db.sh')).toBe(true);

      // Verify docker-compose has PostgreSQL and Redis
      const dockerCompose = await readProjectFile(projectName, 'docker/docker-compose.yml');
      expect(dockerCompose).toContain('postgres');
      expect(dockerCompose).toContain('redis');
    });

    it('should replace template variables correctly', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check that {{PROJECT_NAME}} was replaced in package.json files
      const rootPackageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(rootPackageJson.name).toBe(projectName);
      expect(rootPackageJson.name).not.toContain('{{PROJECT_NAME}}');

      // Check that variables were replaced in Kamal config
      const kamalConfig = await readProjectFile(projectName, 'config/kamal/deploy.yml');
      expect(kamalConfig).not.toContain('{{PROJECT_NAME}}');
      expect(kamalConfig).not.toContain('{{GITHUB_USERNAME}}');

      // The values should be placeholders or real values, but not the template syntax
      expect(kamalConfig).toContain('service:');
    });

    it('should generate BOSS configuration for monorepo', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check BOSS config files (YAML for readable config, JSON for status tracking)
      expect(await fileExists(projectName, '.boss/config.yaml')).toBe(true);
      expect(await fileExists(projectName, '.boss/project-config.json')).toBe(true);

      const projectConfig = JSON.parse(
        await readProjectFile(projectName, '.boss/project-config.json')
      );

      // Verify monorepo-specific config
      expect(projectConfig.project.type).toBe('monorepo');
      expect(projectConfig.project.template.stack).toBeDefined();
      expect(Array.isArray(projectConfig.project.template.stack)).toBe(true);

      // Verify all 11 stack items (stack uses simplified identifiers, not display names)
      expect(projectConfig.project.template.stack).toContain('nextjs');
      expect(projectConfig.project.template.stack).toContain('turborepo');
      expect(projectConfig.project.template.stack).toContain('typescript');
      expect(projectConfig.project.template.stack).toContain('tailwind');
      expect(projectConfig.project.template.stack).toContain('shadcn-ui');
      expect(projectConfig.project.template.stack).toContain('prisma');
      expect(projectConfig.project.template.stack).toContain('trpc');
      expect(projectConfig.project.template.stack).toContain('nextauth');
      expect(projectConfig.project.template.stack).toContain('vitest');
      expect(projectConfig.project.template.stack).toContain('storybook');
      expect(projectConfig.project.template.stack).toContain('kamal');

      // Verify we have exactly 11 stack items (no more, no less)
      expect(projectConfig.project.template.stack).toHaveLength(11);
    });

    it('should generate GitHub workflows for monorepo', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'nextjs-app-turbo'));

      // Check GitHub workflow files
      expect(await fileExists(projectName, '.github/workflows/boss-ci.yml')).toBe(true);
      expect(await fileExists(projectName, '.github/workflows/boss-gates.yml')).toBe(true);
      expect(await fileExists(projectName, '.github/CODEOWNERS')).toBe(true);

      // Verify CI workflow has monorepo-specific jobs
      const ciWorkflow = await readProjectFile(projectName, '.github/workflows/boss-ci.yml');
      expect(ciWorkflow).toContain('matrix');
      expect(ciWorkflow).toContain('web');
      expect(ciWorkflow).toContain('admin');
      expect(ciWorkflow).toContain('pnpm');
      expect(ciWorkflow).toContain('turbo');

      // Verify quality gates workflow
      const gatesWorkflow = await readProjectFile(projectName, '.github/workflows/boss-gates.yml');
      expect(gatesWorkflow).toContain('coverage');
      expect(gatesWorkflow).toContain('security');
    });
  });

  describe('api-service-fastify template', () => {
    const projectName = 'test-api-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate Fastify API project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'api-service-fastify'));

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      const packageJson = JSON.parse(await readProjectFile(projectName, 'package.json'));
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.fastify).toBeDefined();
    });
  });

  describe('blank template', () => {
    const projectName = 'test-blank-project';

    afterEach(async () => {
      await cleanupTestProject(projectName);
    });

    it('should generate minimal project structure', async () => {
      await bootstrapCommand(createTestOptions(projectName, 'blank', 'startup'));

      expect(await fileExists(projectName, 'package.json')).toBe(true);
      expect(await fileExists(projectName, 'tsconfig.json')).toBe(true);
      expect(await fileExists(projectName, 'vitest.config.ts')).toBe(true);
    });
  });
});
