# Worker Configuration Architecture

## Problem

Currently, all 15 worker types have identical `container-config.json` files with only minor differences (e.g., network access rules). This creates:
- **Duplication:** Same config repeated 15 times
- **Maintenance burden:** Updates require changing 15 files
- **Error-prone:** Easy to create inconsistencies
- **Inflexible:** Hard to customize individual workers

## Solution: Centralized Base Config with Inheritance

### Architecture

```
worker-configs/
├── _base/
│   └── container-config.json        # Base config for ALL workers
│
├── architect/
│   ├── metadata.json                # Worker specification (required)
│   └── container-config.json        # Optional: overrides only
│
├── developer-fullstack/
│   ├── metadata.json
│   └── container-config.json        # Optional: custom network rules
│
├── security-engineer/
│   ├── metadata.json
│   └── container-config.json        # Optional: additional tools/network
│
└── ... (other workers)
```

### Config Loading Strategy

```typescript
function loadWorkerConfig(workerType: string): ContainerConfig {
  // 1. Load base config (required)
  const baseConfig = loadJSON('worker-configs/_base/container-config.json');

  // 2. Load worker-specific config (optional)
  const workerConfigPath = `worker-configs/${workerType}/container-config.json`;
  const workerConfig = fileExists(workerConfigPath)
    ? loadJSON(workerConfigPath)
    : {};

  // 3. Deep merge: worker overrides base
  const merged = deepMerge(baseConfig, workerConfig);

  // 4. Validate merged config
  return validateContainerConfig(merged);
}
```

### Deep Merge Rules

```typescript
// Arrays: Replace (not concat)
base:   { network: { allowed_hosts: ["api.anthropic.com"] } }
worker: { network: { allowed_hosts: ["github.com"] } }
result: { network: { allowed_hosts: ["github.com"] } }  // Worker REPLACES

// Objects: Merge recursively
base:   { environment_variables: { NODE_ENV: "production", IS_SANDBOX: "1" } }
worker: { environment_variables: { CUSTOM_VAR: "value" } }
result: { environment_variables: { NODE_ENV: "production", IS_SANDBOX: "1", CUSTOM_VAR: "value" } }

// Primitives: Override
base:   { base_image: "ubuntu:24.04" }
worker: { base_image: "node:22-slim" }
result: { base_image: "node:22-slim" }  // Worker OVERRIDES
```

### Special Merge Strategies

#### Array Merging (Additive)
For cases where you want to ADD to base arrays instead of replacing:

```typescript
// Use special _merge_strategy field
base: {
  network: {
    allowed_hosts: ["api.anthropic.com", "claude.ai"]
  }
}

worker: {
  network: {
    _merge_strategy: "append",  // Special directive
    allowed_hosts: ["github.com", "registry.npmjs.org"]
  }
}

result: {
  network: {
    allowed_hosts: [
      "api.anthropic.com",      // from base
      "claude.ai",              // from base
      "github.com",             // from worker
      "registry.npmjs.org"      // from worker
    ]
  }
}
```

#### Command Merging
```typescript
// Base provides foundation
base: {
  setup_commands: [
    "apt-get update",
    "apt-get install -y git curl"
  ],
  install_commands: [
    "npm install -g pnpm"
  ]
}

// Worker adds to it
worker: {
  setup_commands: {
    _merge_strategy: "append",
    _commands: ["apt-get install -y python3"]  // Add Python for specific worker
  }
}

result: {
  setup_commands: [
    "apt-get update",
    "apt-get install -y git curl",
    "apt-get install -y python3"
  ]
}
```

## Base Configuration

**File:** `worker-configs/_base/container-config.json`

```json
{
  "$schema": "./container-config.schema.json",
  "base_image": "boss/worker-base:1.0.0",
  "setup_commands": [],
  "install_commands": [],
  "environment_variables": {
    "IS_SANDBOX": "1",
    "WORKER_ROLE": "${workerName}",
    "NODE_ENV": "production",
    "SPEC_KIT_MODE": "true",
    "SPEC_KIT_PATH": ".specify",
    "PATH": "/usr/local/bin:/usr/bin:/bin:/workdir/.specify/scripts",
    "CLAUDE_CONFIG_DIR": "/workdir/.boss/workers/${workerName}/.claude"
  },
  "secrets": [],
  "network": {
    "allowed_hosts": [
      "api.anthropic.com",
      "claude.ai",
      "registry.npmjs.org",
      "github.com"
    ]
  }
}
```

## Worker-Specific Overrides

### Example 1: Developer (No Overrides)

**File:** `worker-configs/developer-fullstack/container-config.json` - **DOESN'T EXIST**

When no override file exists, uses 100% base config.

### Example 2: Security Engineer (Additional Network Access)

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

Result: Base config + these network hosts (replaces array).

### Example 3: DevOps Engineer (Additional Tools)

**File:** `worker-configs/devops-engineer/container-config.json`

```json
{
  "setup_commands": [
    "apt-get update",
    "apt-get install -y bash git curl build-essential docker.io kubectl"
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

Result: Custom setup commands, merged env vars, custom network rules.

### Example 4: Technical Writer (Minimal Dependencies)

**File:** `worker-configs/technical-writer/container-config.json`

```json
{
  "network": {
    "allowed_hosts": [
      "api.anthropic.com",
      "claude.ai",
      "github.com"
    ]
  }
}
```

Result: Minimal network access (documentation doesn't need npm registry).

## Implementation

### 1. Config Loader (`conductor-mcp/src/config/worker-loader.ts`)

```typescript
import fs from 'fs';
import path from 'path';
import { merge } from 'lodash';

interface ContainerConfig {
  base_image: string;
  setup_commands: string[];
  install_commands: string[];
  environment_variables: Record<string, string>;
  secrets: string[];
  network: {
    allowed_hosts: string[];
  };
}

const BASE_CONFIG_PATH = 'worker-configs/_base/container-config.json';

export function loadContainerConfig(workerType: string): ContainerConfig {
  // Load base config
  const basePath = path.join(process.cwd(), BASE_CONFIG_PATH);
  if (!fs.existsSync(basePath)) {
    throw new Error(`Base container config not found: ${basePath}`);
  }
  const baseConfig: ContainerConfig = JSON.parse(fs.readFileSync(basePath, 'utf-8'));

  // Load worker-specific config (if exists)
  const workerPath = path.join(
    process.cwd(),
    'worker-configs',
    workerType,
    'container-config.json'
  );

  if (!fs.existsSync(workerPath)) {
    // No override, return base config
    return baseConfig;
  }

  const workerConfig: Partial<ContainerConfig> = JSON.parse(
    fs.readFileSync(workerPath, 'utf-8')
  );

  // Deep merge: worker overrides base
  const merged = merge({}, baseConfig, workerConfig);

  return merged;
}
```

### 2. Schema Validation (`container-config.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Container Configuration",
  "description": "Configuration for worker container environment",
  "type": "object",
  "properties": {
    "base_image": {
      "type": "string",
      "description": "Docker image to use as base"
    },
    "setup_commands": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Commands to run during container setup"
    },
    "install_commands": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Commands to run after copying project code"
    },
    "environment_variables": {
      "type": "object",
      "additionalProperties": { "type": "string" },
      "description": "Environment variables to set"
    },
    "secrets": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Secrets to load from container-use secrets"
    },
    "network": {
      "type": "object",
      "properties": {
        "allowed_hosts": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Network hosts allowed for outbound connections"
        }
      },
      "required": ["allowed_hosts"]
    }
  },
  "required": ["base_image", "environment_variables", "network"]
}
```

### 3. Tests

```typescript
// tests/unit/config/worker-loader.test.ts

describe('loadContainerConfig', () => {
  it('should load base config when no worker override exists', () => {
    const config = loadContainerConfig('architect');
    expect(config.base_image).toBe('boss/worker-base:1.0.0');
    expect(config.network.allowed_hosts).toContain('api.anthropic.com');
  });

  it('should merge worker overrides with base config', () => {
    const config = loadContainerConfig('security-engineer');
    expect(config.network.allowed_hosts).toContain('nvd.nist.gov');
    expect(config.environment_variables.IS_SANDBOX).toBe('1'); // from base
  });

  it('should allow worker to override base image', () => {
    const config = loadContainerConfig('python-worker');
    expect(config.base_image).toBe('python:3.11'); // overridden
  });

  it('should throw error if base config missing', () => {
    expect(() => loadContainerConfig('nonexistent')).toThrow();
  });
});
```

## Migration Strategy

### Phase 1: Create Base Config
1. Create `worker-configs/_base/` directory
2. Add `container-config.json` with common settings
3. Add `README.md` explaining the base config

### Phase 2: Update Loader
1. Modify `worker-loader.ts` to implement merge logic
2. Add tests for merge behavior
3. Validate with existing configs (no changes yet)

### Phase 3: Migrate Workers
1. Identify workers that need NO customization → delete their config files
2. Identify workers that need customization → create minimal override files
3. Test each worker type

### Phase 4: Validate
1. Run integration tests with all worker types
2. Verify spawned containers have correct configs
3. Document worker-specific customizations

## Benefits

✅ **DRY:** Base config defined once
✅ **Maintainable:** Change base config, all workers inherit
✅ **Flexible:** Workers can override anything
✅ **Type-safe:** Schema validation on merged config
✅ **Clear:** Worker files only show what's different
✅ **Scalable:** Easy to add new workers (just metadata.json)

## Future Enhancements

### Config Profiles

```
worker-configs/
├── _base/
│   ├── container-config.json           # Default base
│   ├── container-config.dev.json       # Development profile
│   └── container-config.production.json # Production profile
```

### Worker Groups

```
worker-configs/
├── _base/
│   └── container-config.json
├── _groups/
│   ├── developers.json     # Shared config for all developer types
│   └── reviewers.json      # Shared config for reviewers
```

Inheritance chain: `base → group → worker`

### Environment-Specific Overrides

```typescript
loadContainerConfig(workerType, environment = 'production')
// Loads: base → base.{env} → worker → worker.{env}
```

## Related Documentation

- Container-Use Config: https://container-use.com/environment-configuration
- Optimization Plan: /Users/joe/code-glx/boss/OPTIMIZATION_PLAN.md
- Worker Metadata Schema: /Users/joe/code-glx/boss/conductor-mcp/schemas/worker-metadata.schema.json
