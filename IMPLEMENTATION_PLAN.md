# BOSS CLI Template Overhaul - Implementation Plan

## Executive Summary

Transform boss-cli from maintaining **custom embedded templates** to leveraging **battle-tested external templates** with a minimal BOSS overlay. This requires significant refactoring of the template system, CLI UX, and Docker generation.

---

## Gap Analysis Summary

| Area                     | Current State             | SPEC Requirement                   | Priority |
| ------------------------ | ------------------------- | ---------------------------------- | -------- |
| Command name             | `boss bootstrap`          | `boss init`                        | Medium   |
| Template approach        | 4 embedded templates      | 6 external templates               | **High** |
| Template selection       | Direct list               | Category → Template flow           | **High** |
| Docker                   | Single docker-compose.yml | Distroless multi-stage Dockerfiles | **High** |
| renovate.json            | Not generated             | Required                           | Medium   |
| template-version.json    | Not generated             | Required                           | Low      |
| Pre-bootstrap validation | Directory only            | Template availability check        | Medium   |

---

## Implementation Phases

### Phase 1: CLI Command Restructuring

**Goal**: Rename command and add category-based template selection

**Files to modify**:

- `boss-cli/src/index.ts` - Rename `bootstrap` to `init`
- `boss-cli/src/commands/bootstrap.ts` → `boss-cli/src/commands/init.ts`
- `boss-cli/src/utils/prompts.ts` - Add category selection flow

**Changes**:

1. Rename `bootstrap` command to `init` (keep `bootstrap` as alias for backwards compat)
2. Add template categories object:
   ```typescript
   const TEMPLATE_CATEGORIES = {
     fullstack: ['t3-prisma', 't3-drizzle'],
     backend: ['nestjs-typeorm', 'fastify-native', 'spring-boot-jpa'],
     frontend: ['astro-portfolio'],
   };
   ```
3. Update interactive flow: Category → Template → Name → Confirmation
4. Update `--template` flag to accept new template names

---

### Phase 2: External Template Integration

**Goal**: Replace embedded templates with external template execution

**New file to create**:

- `boss-cli/src/generators/external-templates.ts` - External template runner

**Files to modify**:

- `boss-cli/src/generators/template-loader.ts` - Refactor for external templates
- `boss-cli/src/commands/init.ts` - Call external template generators

**Template Executors (Phase A - Node.js)**:

| Template        | External Command                                                   | Post-processing                    |
| --------------- | ------------------------------------------------------------------ | ---------------------------------- |
| t3-prisma       | `pnpm create t3-app@latest --prisma --tailwind --trpc --nextAuth`  | Add shadcn, pino, error boundaries |
| t3-drizzle      | `pnpm create t3-app@latest --drizzle --tailwind --trpc --nextAuth` | Add shadcn, pino, error boundaries |
| nestjs-typeorm  | `git clone brocoders/nestjs-boilerplate`                           | Add pino, global exception filters |
| fastify-native  | `pnpm create fastify`                                              | Add Prisma, TypeBox, pino          |
| astro-portfolio | `pnpm create astro -- --template portfolio`                        | Add React integration, Tailwind    |

**Deferred (Phase B - Java)**:
| spring-boot-jpa | `jhipster generate-blueprint` | Strip gateway/registry, add GraalVM profile |

**Implementation steps**:

1. Create `TemplateExecutor` interface
2. Implement executor for each template type
3. Add pre-bootstrap template availability validation
4. Generate `.boss/template-version.json` with pinned version

---

### Phase 3: Dockerfile Generation

**Goal**: Generate template-specific multi-stage Dockerfiles with distroless runtime

**New file to create**:

- `boss-cli/src/generators/dockerfile.ts` - Dockerfile generator

**Dockerfile templates**:

**Node.js templates (t3-_, nestjs-_, fastify-\*)**:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM gcr.io/distroless/nodejs22-debian12
COPY --from=builder /app/dist /app
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app
CMD ["server.js"]
```

**Astro templates (static output)**:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage - nginx for static files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

**Java templates - DEFERRED to Phase B**

**Implementation steps**:

1. Create Dockerfile templates per category (node, java, astro)
2. Update docker-compose.yml generator to include app service
3. Add health check endpoints configuration
4. Generate `.dockerignore` files

---

### Phase 4: BOSS Overlay Refinements

**Goal**: Align overlay with SPEC structure

**Files to modify**:

- `boss-cli/src/generators/boss-config.ts` - Add template-version.json
- `boss-cli/src/generators/claude-md.ts` - Make generic (not template-specific)

**New file to create**:

- `boss-cli/assets/renovate/renovate.json` - Renovate configuration template

**Changes**:

1. Generate `.boss/template-version.json`:
   ```json
   {
     "template": "t3-prisma",
     "version": "7.32.0",
     "generatedAt": "2024-01-15T10:30:00Z",
     "source": "create-t3-app"
   }
   ```
2. Generate `renovate.json` for dependency automation
3. Simplify CLAUDE.md to be generic across all templates
4. Ensure `.boss/worker-manifests/` directory is created

---

### Phase 5: Post-Template Enhancements

**Goal**: Apply BOSS-specific enhancements after external template generation

**New file to create**:

- `boss-cli/src/generators/enhancements.ts` - Post-generation enhancements

**Enhancements per template**:

| Template          | Enhancements                                                  |
| ----------------- | ------------------------------------------------------------- |
| t3-prisma/drizzle | shadcn/ui v4, t3-env, error boundaries, pino logging          |
| spring-boot-jpa   | Minimal preset, remove gateway, GraalVM profile               |
| nestjs-typeorm    | Pino logger integration, global exception filters             |
| fastify-native    | Prisma integration, TypeBox validation, global error handlers |
| astro-portfolio   | @astrojs/react, Tailwind CSS                                  |

**Implementation steps**:

1. Create enhancement functions per template
2. Install additional dependencies
3. Generate configuration files
4. Add health check endpoints (/health, /ready)

---

### Phase 6: Doctor Command Enhancements

**Goal**: Align doctor command with SPEC requirements

**File to modify**:

- `boss-cli/src/commands/doctor.ts`

**Validation checks to add**:

1. BOSS overlay integrity (all required files exist)
2. Dependencies installed correctly (check node_modules, pom.xml deps)
3. Docker configuration valid (docker-compose.yml syntax, Dockerfile exists)
4. Git repository initialized (has .git/, has commits)
5. Quality gates configured (husky hooks, eslint config exists)

**Implementation steps**:

1. Add `validateOverlay()` function
2. Add `validateDependencies()` function
3. Add `validateDocker()` function
4. Add `validateQualityGates()` function
5. Improve error messages with remediation suggestions

---

### Phase 7: Quality Gates Alignment

**Goal**: Ensure quality gates match SPEC requirements

**Files to modify**:

- `boss-cli/src/generators/quality-gates.ts`
- `boss-cli/assets/git-hooks/*`

**Changes**:

1. Ensure TypeScript strict mode configuration:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true
     }
   }
   ```
2. Generate ESLint configuration per template
3. Configure Husky/Lefthook pre-commit hooks
4. Add test running in pre-push hooks

---

### Phase 8: Cleanup (Part of Phase 1)

**Goal**: Remove legacy templates immediately (complete replacement strategy)

**Directories to remove**:

- `boss-cli/templates/nextjs-turbo-monorepo/`
- `boss-cli/templates/t3-app/`
- `boss-cli/templates/api-service-fastify/`
- `boss-cli/templates/blank/`

**Keep**:

- `boss-cli/templates/spec-kit/` - Still used for Spec-Kit structure

**Files to update**:

- `boss-cli/src/utils/prompts.ts` - Replace with new template choices
- Remove template-related assets no longer needed

---

## File Changes Summary

### New Files

| File                                   | Purpose                     |
| -------------------------------------- | --------------------------- |
| `src/commands/init.ts`                 | Renamed from bootstrap.ts   |
| `src/generators/external-templates.ts` | External template execution |
| `src/generators/dockerfile.ts`         | Dockerfile generation       |
| `src/generators/enhancements.ts`       | Post-template enhancements  |
| `assets/renovate/renovate.json`        | Renovate configuration      |
| `assets/dockerfiles/node.Dockerfile`   | Node.js Dockerfile template |
| `assets/dockerfiles/java.Dockerfile`   | Java Dockerfile template    |
| `assets/dockerfiles/astro.Dockerfile`  | Astro Dockerfile template   |

### Modified Files

| File                               | Changes                           |
| ---------------------------------- | --------------------------------- |
| `src/index.ts`                     | Rename command, add alias         |
| `src/utils/prompts.ts`             | Category selection, new templates |
| `src/utils/validators.ts`          | Validate new template names       |
| `src/generators/boss-config.ts`    | Add template-version.json         |
| `src/generators/claude-md.ts`      | Make generic                      |
| `src/generators/docker-compose.ts` | Add app service                   |
| `src/commands/doctor.ts`           | Add overlay/quality validation    |

### Deleted Files (Immediate - Phase 1)

| Directory                          | Reason                                   |
| ---------------------------------- | ---------------------------------------- |
| `templates/nextjs-turbo-monorepo/` | Replaced by t3-prisma                    |
| `templates/t3-app/`                | Replaced by create-t3-app                |
| `templates/api-service-fastify/`   | Replaced by fastify-native               |
| `templates/blank/`                 | No longer needed                         |
| `templates/spec-kit/`              | Keep - still used for Spec-Kit structure |

---

## Definition of Done

Per template:

- [ ] Template generates without errors
- [ ] Project builds successfully
- [ ] Docker container runs correctly
- [ ] All included example tests pass
- [ ] Quality gates (lint, type, test) pass
- [ ] Health endpoints (/health, /ready) work
- [ ] BOSS overlay complete (.boss/, .claude/, .mcp.json, renovate.json)
- [ ] Manual testing of full bootstrap flow

---

## Priority Order

**Phase A - Initial Release (Node.js focus)**:

1. **t3-prisma** (primary use case, most common)
2. **t3-drizzle** (variant of T3)
3. **fastify-native** (simplest backend)
4. **nestjs-typeorm** (brocoders integration)
5. **astro-portfolio** (static site, simplest frontend)

**Phase B - Future Release (Java support)**: 6. **spring-boot-jpa** (JHipster, deferred to v2)

---

## Risk Mitigation

| Risk                               | Mitigation                                         |
| ---------------------------------- | -------------------------------------------------- |
| External template unavailable      | **Fail fast** with clear error + remediation steps |
| External template breaking changes | Pin versions, test in CI                           |
| Network failures during generation | Pre-validate connectivity, clear error messages    |
| Distroless debugging               | Keep Alpine alternative for dev                    |
| Command rename confusion           | Keep `bootstrap` as alias for `init`               |

---

## Error Handling Strategy

When external template execution fails:

1. **Validate early**: Check template source availability before starting
2. **Fail immediately**: Abort with descriptive error message
3. **Provide remediation**: Show exact steps to resolve (install pnpm, check network, etc.)
4. **No fallbacks**: No embedded fallback templates - keeps system simple and predictable

Example error:

```
Error: Template source unavailable

Cannot reach create-t3-app (npm registry).

Possible causes:
  - Network connectivity issue
  - npm registry down
  - Firewall blocking npm

Run 'pnpm ping' to verify npm connectivity.
```

---

## Testing Strategy

1. **Unit tests**: Each generator function
2. **Integration tests**: Full bootstrap flow per template
3. **E2E tests**: Docker build and run verification
4. **Manual testing**: Complete developer workflow

---

## Migration Path

**Complete replacement strategy** (no backwards compat for old templates):

1. `boss bootstrap` continues to work (aliased to `init`)
2. Old templates removed immediately - clean break
3. Documentation fully updated for new templates
4. Clear migration guide for users with existing projects bootstrapped from old templates

**Breaking changes**:

- `nextjs-app-turbo` → Use `t3-prisma` instead
- `t3-app` → Use `t3-prisma` or `t3-drizzle`
- `api-service-fastify` → Use `fastify-native`
- `blank` → Removed (use t3-prisma with minimal config)

---

## Implementation Notes

- Focus on Node.js templates first (5 templates in Phase A)
- Java/Spring Boot (spring-boot-jpa) deferred to future release
- Each phase can be implemented independently
- Start with t3-prisma as proof of concept
