# BOSS CLI Template Overhaul Specification

## Overview

Evolve `boss-cli` from maintaining custom templates to leveraging battle-tested external templates with a minimal BOSS overlay. This reduces maintenance burden while providing production-ready project scaffolding.

## Problem Statement

Current approach of taming open-source templates to fit our quality gates consumes excessive time with diminishing returns. We need to adopt proven templates as-is and layer our opinionated configuration on top.

---

## Templates

### Template Categories

| Category      | Templates                                             |
| ------------- | ----------------------------------------------------- |
| **Fullstack** | `t3-prisma`, `t3-drizzle`                             |
| **Backend**   | `nestjs-typeorm`, `fastify-native`, `spring-boot-jpa` |
| **Frontend**  | `astro-portfolio`                                     |

### Template Specifications

#### 1. `t3-prisma`

- **Base**: [create-t3-app](https://github.com/t3-oss/create-t3-app)
- **Stack**: Next.js + tRPC + NextAuth + Prisma + Tailwind CSS
- **Additions**:
  - shadcn/ui v4 pre-installed (button, card, dialog components)
  - NextAuth with credentials provider (basic auth ready)
  - t3-env for environment variable validation
  - Error boundaries for React components
  - Pino for structured logging

#### 2. `t3-drizzle`

- **Base**: [create-t3-app](https://github.com/t3-oss/create-t3-app) (Drizzle option)
- **Stack**: Next.js + tRPC + NextAuth + Drizzle + Tailwind CSS
- **Additions**: Same as `t3-prisma`

#### 3. `spring-boot-jpa`

- **Base**: [JHipster](https://www.jhipster.tech/) (microservice generation)
- **Stack**: Spring Boot 3.x + JPA + PostgreSQL + Maven
- **Configuration**:
  - Minimal microservice preset (no Kafka, Elasticsearch, Liquibase)
  - No gateway/registry (standalone services, external API gateway assumed)
  - GraalVM native compilation as optional build profile (`-Pnative`)
  - Logback for logging (Java standard)
- **Java Version**: 21 LTS

#### 4. `nestjs-typeorm`

- **Base**: [brocoders/nestjs-boilerplate](https://github.com/brocoders/nestjs-boilerplate)
- **Stack**: NestJS + TypeORM + PostgreSQL + JWT Auth
- **Features Retained**: All (auth, S3, mailing, file uploads)
- **Additions**:
  - Pino logger integration
  - Global exception filters

#### 5. `fastify-native`

- **Base**: Community Fastify starter with TypeScript
- **Stack**: Fastify + TypeBox schema validation + Prisma
- **API Style**: Native Fastify routes (no tRPC)
- **Additions**:
  - Pino (Fastify default)
  - Global error handlers

#### 6. `astro-portfolio`

- **Base**: [Astro portfolio template](https://astro.build/themes/)
- **Stack**: Astro + React integration (@astrojs/react)
- **Content**: Pure MDX/Markdown (no CMS)
- **Additions**:
  - React for interactive islands
  - Tailwind CSS

---

## Core Technical Decisions

### Runtime & Infrastructure

| Concern                   | Decision                                                       |
| ------------------------- | -------------------------------------------------------------- |
| **Docker Runtime**        | gcr.io/distroless/nodejs20 (smallest attack surface, no shell) |
| **Dockerfile Generation** | Self-generated multi-stage Dockerfiles (not from templates)    |
| **Database**              | PostgreSQL everywhere                                          |
| **Dev Infrastructure**    | Full docker-compose.yml with app + PostgreSQL + Redis          |
| **Health Checks**         | Standardized `/health` and `/ready` endpoints on all templates |

### JavaScript/TypeScript Defaults

| Concern               | Decision                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Node.js Version**   | 22 (latest features)                                                                        |
| **Package Manager**   | pnpm only                                                                                   |
| **Version Files**     | Both .nvmrc and .node-version                                                               |
| **TypeScript**        | Maximum strict (`strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) |
| **Testing Framework** | Template native (Jest for T3/Nest, JUnit for Java)                                          |
| **Logging**           | Pino for all Node.js templates                                                              |

### Java Defaults

| Concern          | Decision                                                    |
| ---------------- | ----------------------------------------------------------- |
| **Java Version** | 21 LTS                                                      |
| **GraalVM**      | Optional build profile (JVM default, native for production) |
| **Logging**      | Logback (Java standard)                                     |

### Quality Gates

**Enforcement**: Pre-commit hooks via Husky/Lefthook

| Check         | Tools                               |
| ------------- | ----------------------------------- |
| Linting       | ESLint (JS/TS), Spotless (Java)     |
| Type Checking | TypeScript strict, Java compilation |
| Testing       | Jest/Vitest/JUnit (template native) |

**Example Tests**: Included to demonstrate testing patterns

### Error Handling

- React error boundaries in all React-based templates
- Global exception handlers in API templates
- Error tracking infrastructure ready (no vendor lock-in)

---

## BOSS Overlay

### Structure

BOSS artifacts are kept in a **separate layer**, not merged into template code:

```
project/
├── .boss/                    # BOSS configuration
│   ├── template-version.json # Pinned template version
│   └── worker-manifests/     # Conductor worker state
├── .claude/                  # Claude Code configuration
│   ├── CLAUDE.md            # Generic (not template-specific)
│   ├── commands/            # Slash commands
│   └── settings.json        # Claude settings
├── .mcp.json                # MCP server configuration
├── renovate.json            # Dependency update automation
└── [template files...]      # Upstream template code
```

### Configuration

| Aspect               | Approach                                                    |
| -------------------- | ----------------------------------------------------------- |
| **CLAUDE.md**        | Generic for all templates (not template-specific)           |
| **Template Updates** | One-time bootstrap, no update mechanism                     |
| **Version Tracking** | Pinned to specific version in `.boss/template-version.json` |

### Generated Files

- `.claude/` directory with commands and settings
- `.boss/` directory for Conductor integration
- `.mcp.json` for MCP server configuration
- `renovate.json` for automated dependency updates
- GitHub Actions workflow (generic, works across templates)

---

## CLI User Experience

### Command Interface

```bash
# Interactive mode (default)
boss init

# With flags (skip prompts)
boss init --template t3-prisma --name my-project
```

### Interactive Flow

1. **Category Selection**: Fullstack → Backend → Frontend
2. **Template Selection**: List templates in chosen category with descriptions
3. **Project Name**: Prompt for project name (validate as npm package name)
4. **Confirmation**: Show summary, proceed on confirmation

### Validation

| Stage               | Behavior                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| **Pre-bootstrap**   | Validate template availability (GitHub/npm), fail fast if unavailable  |
| **Directory Check** | Fail with error on non-empty directory (require `--force` to override) |
| **Post-bootstrap**  | Automatic validation of generated project                              |

### Git Integration

- Auto `git init` after bootstrap
- Initial commit with all generated files
- Ready to push immediately

### Doctor Command

```bash
boss doctor
```

Validates:

- BOSS overlay integrity
- Dependencies installed correctly
- Docker configuration valid
- Git repository initialized
- Quality gates configured

---

## Implementation Plan

### Priority Order

1. `t3-prisma` (primary use case)
2. `t3-drizzle` (variant of T3)
3. `spring-boot-jpa` (JHipster-based)
4. `nestjs-typeorm` (brocoders boilerplate)
5. `fastify-native` (Fastify starter)
6. `astro-portfolio` (Astro template)

### Release Strategy

**Incremental releases**: Each template released as ready. Users get value sooner.

### Definition of Done (per template)

- [ ] Template generates without errors
- [ ] Project builds successfully
- [ ] Docker container runs correctly
- [ ] All included example tests pass
- [ ] Quality gates (lint, type, test) pass
- [ ] Documentation complete
- [ ] Manual testing of full bootstrap flow

---

## Acceptance Criteria

### Functional Requirements

1. **Template Generation**: All 6 templates generate valid, runnable projects
2. **Docker Support**: All templates include working multi-stage Dockerfiles with distroless runtime
3. **Database Ready**: PostgreSQL configured with docker-compose for local development
4. **Quality Gates**: Pre-commit hooks enforce lint, type check, and test
5. **BOSS Integration**: Claude Code configuration, MCP servers, and Conductor ready

### Non-Functional Requirements

1. **Bootstrap Speed**: Template generation completes in < 60 seconds
2. **No Network at Runtime**: Generated projects work offline after initial npm/maven install
3. **Minimal Maintenance**: External templates used as-is, only overlay maintained
4. **Deterministic**: Same inputs produce identical outputs

### CLI Requirements

1. **Interactive UX**: Guided prompts for template selection
2. **Scriptable**: All options available via CLI flags
3. **Fail Fast**: Validate inputs and availability before starting
4. **Self-Healing**: `boss doctor` identifies and reports configuration issues

---

## Template Sources

| Template        | Source Repository            | Notes                    |
| --------------- | ---------------------------- | ------------------------ |
| t3-prisma       | t3-oss/create-t3-app         | Use `--prisma` flag      |
| t3-drizzle      | t3-oss/create-t3-app         | Default (Drizzle)        |
| spring-boot-jpa | jhipster/generator-jhipster  | Microservice preset      |
| nestjs-typeorm  | brocoders/nestjs-boilerplate | Full clone               |
| fastify-native  | Community starter TBD        | Evaluate options         |
| astro-portfolio | withastro/astro              | Official portfolio theme |

---

## Open Questions (Resolved)

| Question          | Resolution                          |
| ----------------- | ----------------------------------- |
| Which ORM for T3? | Both variants (Prisma and Drizzle)  |
| GraalVM required? | Optional build profile              |
| CMS for Astro?    | No, pure MDX/Markdown               |
| Observability?    | Not included, user adds their stack |
| Template updates? | One-time bootstrap, no mechanism    |
