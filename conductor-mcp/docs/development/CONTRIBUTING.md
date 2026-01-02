# Contributing to Conductor MCP

Thank you for your interest in contributing to Conductor MCP!

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **container-use CLI**: `npm install -g container-use`
- **Git**
- **TypeScript** knowledge

### Initial Setup

```bash
# Clone repository
git clone https://github.com/boss-cli/conductor-mcp.git
cd conductor-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for local development
npm link
```

### Project Structure

```
conductor-mcp/
├── src/                       # Source code
│   ├── types.ts              # Type definitions
│   ├── server.ts             # MCP server setup
│   ├── tools.ts              # Tool definitions and handlers
│   ├── bin.ts                # CLI entry point
│   ├── index.ts              # Main exports
│   ├── config/
│   │   ├── worker-loader.ts  # Load worker configs
│   │   └── container-mapper.ts # Map to Container-Use format
│   ├── lifecycle/
│   │   ├── state-tracker.ts  # Track active workers
│   │   ├── environment-manager.ts # Configure containers
│   │   └── worker-spawner.ts # Orchestrate spawning
│   ├── orchestration/
│   │   ├── container-use-client.ts # Container-Use interface
│   │   └── task-executor.ts  # Execute tasks
│   └── utils/
│       ├── error-handler.ts  # Error handling
│       └── logger.ts         # Structured logging
├── worker-configs/           # Worker configurations
│   └── [worker-type]/
│       ├── metadata.json
│       ├── prompt.md
│       ├── CLAUDE.md
│       ├── container-config.json
│       └── .claude/
├── tests/                    # Test files
├── docs/                     # Documentation
└── schemas/                  # JSON schemas
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the [Code Style](#code-style) guidelines.

### 3. Write Tests

```bash
# Create test file
touch tests/unit/your-feature.test.ts

# Run tests
npm test

# Run specific test
npm test -- tests/unit/your-feature.test.ts

# Watch mode
npm test -- --watch
```

### 4. Build

```bash
npm run build
```

### 5. Commit

```bash
git add .
git commit -m "feat: your feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Style

### TypeScript

- Use **strict mode**
- Prefer `interface` over `type` for object shapes
- Use `const` for variables that don't change
- Document public APIs with JSDoc comments
- Use meaningful variable names

**Example**:
```typescript
/**
 * Spawns a worker with full environment setup
 *
 * @param input - Spawn worker input parameters
 * @returns Promise resolving to spawn result
 */
export async function spawnWorker(
  input: SpawnWorkerInput
): Promise<SpawnWorkerOutput> {
  // Implementation
}
```

### File Organization

- One main export per file
- Group related functionality
- Keep files focused and small (<300 lines)
- Use barrel exports (`index.ts`)

### Error Handling

```typescript
// Use structured errors
throw new ConductorError({
  category: 'WORKER_CONFIG_NOT_FOUND',
  message: `Worker config not found: ${workerType}`,
  retryable: false,
  details: { workerType }
});
```

### Logging

```typescript
// Use structured logging
logger.info('Worker spawned successfully', {
  workerId,
  workerType,
  branch
});
```

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── worker-loader.test.ts
│   ├── environment-manager.test.ts
│   └── task-executor.test.ts
├── integration/
│   ├── spawn-worker.test.ts
│   └── parallel-workers.test.ts
└── fixtures/
    └── worker-configs/
        └── test-worker/
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { loadWorkerConfig } from '../src/config/worker-loader';

describe('loadWorkerConfig', () => {
  it('should load worker config from built-in directory', async () => {
    const config = await loadWorkerConfig('architect');

    expect(config.workerType).toBe('architect');
    expect(config.metadata).toBeDefined();
    expect(config.prompt).toBeDefined();
    expect(config.claudeMd).toBeDefined();
  });

  it('should prioritize project override over built-in', async () => {
    const config = await loadWorkerConfig('architect', './tests/fixtures');

    expect(config.source).toBe('project-override');
  });

  it('should throw error for non-existent worker type', async () => {
    await expect(
      loadWorkerConfig('non-existent')
    ).rejects.toThrow('Worker config not found');
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Adding New Features

### Adding a New Worker Type

1. **Create worker config directory**:
   ```bash
   mkdir -p worker-configs/new-worker/.claude/{agents,commands,skills}
   ```

2. **Create configuration files**:
   ```bash
   touch worker-configs/new-worker/metadata.json
   touch worker-configs/new-worker/prompt.md
   touch worker-configs/new-worker/CLAUDE.md
   touch worker-configs/new-worker/container-config.json
   ```

3. **Update types**:
   ```typescript
   // src/types.ts
   export type WorkerType =
     | 'architect'
     | 'new-worker'  // Add here
     | ...;
   ```

4. **Write tests**:
   ```typescript
   // tests/unit/new-worker.test.ts
   describe('new-worker', () => {
     it('should load new-worker config', async () => {
       const config = await loadWorkerConfig('new-worker');
       expect(config).toBeDefined();
     });
   });
   ```

5. **Document**:
   - Update [README.md](../../README.md) worker types table
   - Add to [API Tools](../api/TOOLS.md) documentation

### Adding a New Tool

1. **Define tool schema**:
   ```typescript
   // src/tools.ts
   const newToolSchema = {
     name: 'new_tool',
     description: 'Description of what this tool does',
     inputSchema: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: '...' }
       },
       required: ['param1']
     }
   };
   ```

2. **Implement handler**:
   ```typescript
   async function handleNewTool(
     input: NewToolInput
   ): Promise<NewToolOutput> {
     // Implementation
   }
   ```

3. **Register tool**:
   ```typescript
   // src/server.ts
   server.setRequestHandler(ListToolsRequestSchema, async () => ({
     tools: [
       // ... existing tools
       newToolSchema
     ]
   }));

   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     if (request.params.name === 'new_tool') {
       return handleNewTool(request.params.arguments);
     }
     // ... other tools
   });
   ```

4. **Write tests**:
   ```typescript
   describe('new_tool', () => {
     it('should execute successfully', async () => {
       const result = await handleNewTool({
         param1: 'value'
       });
       expect(result.success).toBe(true);
     });
   });
   ```

5. **Document**:
   - Add to [API Tools](../api/TOOLS.md)
   - Update [README.md](../../README.md) if it's a core tool

## Documentation

### Writing Documentation

- Use clear, concise language
- Include code examples
- Explain "why" not just "how"
- Keep examples up-to-date
- Link related documentation

### Documentation Structure

See [INDEX.md](../../INDEX.md) for complete documentation map.

### Updating Documentation

When making changes:

1. **Update relevant docs** - Don't just update code
2. **Check all references** - Search for mentions of changed features
3. **Update examples** - Ensure examples still work
4. **Update INDEX.md** - If adding new docs

## Pull Request Process

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages follow Conventional Commits
- [ ] No merge conflicts with main

### PR Description

Include:

1. **What**: What does this PR do?
2. **Why**: Why is this change needed?
3. **How**: How does it work?
4. **Testing**: How did you test it?
5. **Breaking Changes**: Any breaking changes?

**Example**:
```markdown
## What
Adds support for custom worker metadata schemas

## Why
Projects need to extend worker metadata with custom fields

## How
- Added schema validation framework
- Updated worker-loader to validate metadata.json
- Added tests for custom schemas

## Testing
- Unit tests for schema validation
- Integration tests with custom worker configs
- Manual testing with test project

## Breaking Changes
None
```

### Review Process

1. **Automated checks** - CI runs tests and builds
2. **Code review** - Maintainer reviews code
3. **Address feedback** - Make requested changes
4. **Approval** - Maintainer approves PR
5. **Merge** - PR merged to main

## Release Process

Maintainers handle releases:

1. **Update version**: `npm version [patch|minor|major]`
2. **Update CHANGELOG.md**
3. **Create git tag**: `git tag v0.x.0`
4. **Push**: `git push && git push --tags`
5. **Publish**: `npm publish`
6. **Create GitHub release**

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Features**: Open a GitHub Issue with `[Feature Request]`
- **Security**: Email security@boss-cli.dev

## Resources

- [Architecture Overview](../architecture/OVERVIEW.md)
- [API Tools](../api/TOOLS.md)
- [Worker Configuration](../architecture/WORKER-CONFIG.md)
- [Manifest Protocol](../architecture/MANIFEST-PROTOCOL.md)
- [Design Documents](../design/)

---

Thank you for contributing to Conductor MCP!
