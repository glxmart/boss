# Base Worker Configuration

This directory contains the **base container configuration** that all BOSS workers inherit from.

## Purpose

Instead of duplicating configuration across 15+ worker types, we define common settings once here. Workers can override specific settings in their own `container-config.json` files.

## What's in the Base Config

### Docker Image
```json
"base_image": "boss/worker-base:1.0.0"
```
Pre-built image with Node.js, pnpm, claude-code, and system dependencies.

### Environment Variables
```json
"environment_variables": {
  "IS_SANDBOX": "1",
  "WORKER_ROLE": "${workerName}",
  "NODE_ENV": "production",
  "SPEC_KIT_MODE": "true",
  "SPEC_KIT_PATH": ".specify",
  "PATH": "/usr/local/bin:/usr/bin:/bin:/workdir/.specify/scripts",
  "CLAUDE_CONFIG_DIR": "/workdir/.boss/workers/${workerName}/.claude"
}
```

### Network Access
```json
"network": {
  "allowed_hosts": [
    "api.anthropic.com",
    "claude.ai",
    "registry.npmjs.org",
    "github.com"
  ]
}
```

Default network access for all workers. Workers can override to add/remove hosts.

## When to Override

Create a worker-specific `container-config.json` when you need to:

1. **Add network access** - Worker needs access to additional APIs/services
2. **Add tools** - Worker needs additional system packages or global npm packages
3. **Custom environment** - Worker needs special environment variables
4. **Different base image** - Worker needs different runtime (e.g., Python instead of Node)

## Examples

### No Override Needed (Most Workers)
If a worker doesn't have special needs, **don't create a config file**. It will automatically use the base config.

Workers using 100% base config:
- `architect`
- `clarifier`
- `spec-writer`
- `planner`
- `reviewer`
- `developer-frontend`
- `developer-backend`
- `developer-fullstack`
- `code-reviewer`
- `tester`
- `product-owner`
- `technical-writer`
- `consolidator`

### Override: Additional Network Access

**File:** `worker-configs/security-engineer/container-config.json`
```json
{
  "network": {
    "allowed_hosts": [
      "api.anthropic.com",
      "claude.ai",
      "registry.npmjs.org",
      "github.com",
      "nvd.nist.gov",
      "cve.mitre.org",
      "snyk.io"
    ]
  }
}
```

Security engineer needs access to vulnerability databases.

### Override: Additional Tools

**File:** `worker-configs/devops-engineer/container-config.json`
```json
{
  "setup_commands": [
    "apt-get update",
    "apt-get install -y docker.io kubectl helm"
  ],
  "environment_variables": {
    "KUBECONFIG": "/workdir/.kube/config",
    "DOCKER_BUILDKIT": "1"
  },
  "network": {
    "allowed_hosts": [
      "api.anthropic.com",
      "claude.ai",
      "registry.npmjs.org",
      "github.com",
      "hub.docker.com",
      "k8s.io",
      "registry.k8s.io"
    ]
  }
}
```

DevOps engineer needs Docker and Kubernetes tools.

## How Merging Works

The system uses **deep merge** with worker config overriding base:

```typescript
// Loader pseudocode
const baseConfig = loadJSON('_base/container-config.json');
const workerConfig = loadJSON('{worker-type}/container-config.json');
const merged = deepMerge(baseConfig, workerConfig);
```

### Merge Rules

**Objects:** Merged recursively
```
base:   { env: { A: "1", B: "2" } }
worker: { env: { B: "3", C: "4" } }
result: { env: { A: "1", B: "3", C: "4" } }
```

**Arrays:** Worker replaces base
```
base:   { hosts: ["a.com", "b.com"] }
worker: { hosts: ["c.com"] }
result: { hosts: ["c.com"] }
```

**Primitives:** Worker overrides
```
base:   { base_image: "node:22" }
worker: { base_image: "python:3.11" }
result: { base_image: "python:3.11" }
```

## Validation

All configs (base + merged) are validated against `container-config.schema.json`.

## Updating the Base Config

When updating the base config:

1. **Edit this file** - Make changes to `container-config.json`
2. **Test thoroughly** - Changes affect ALL workers
3. **Document changes** - Update this README
4. **Version bump** - Consider if this requires a new base image version

## Migration from Old Configs

**Before:** Each worker had identical configs
```
worker-configs/
├── architect/container-config.json       (duplicate)
├── developer/container-config.json       (duplicate)
├── security/container-config.json        (duplicate)
└── ... (15 identical files)
```

**After:** Base config + overrides only
```
worker-configs/
├── _base/container-config.json           (single source of truth)
├── security-engineer/
│   └── container-config.json             (override: network access)
└── devops-engineer/
    └── container-config.json             (override: tools + network)
```

## Benefits

- ✅ **DRY:** Define common config once
- ✅ **Maintainable:** Update base, all workers inherit
- ✅ **Clear:** Worker files only show differences
- ✅ **Flexible:** Full override capability when needed
- ✅ **Type-safe:** Schema validation on merged config

## See Also

- [Config Architecture](./CONFIG_ARCHITECTURE.md) - Detailed design document
- [Container-Use Docs](https://container-use.com/environment-configuration)
- [Worker Metadata Schema](../schemas/worker-metadata.schema.json)
