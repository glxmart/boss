# Conductor MCP Changelog

## v0.3.0 - Schema-Based Manifest Management (2026-01-02)

### 🚀 Revolutionary Change: Conductor Controls Manifest via JSON Schema

**Problem**: Workers were manually writing JSON to manifest files, which was error-prone and unreliable.

**Previous Approach** (flawed):
```typescript
// ❌ Hoping workers update manifest correctly
echo 'Do work and update .boss/worker-manifest.json' | claude-code --print
// Workers might forget, make JSON errors, use wrong format, etc.
```

**New Schema-Based Approach** (reliable):
```typescript
// ✅ Conductor controls manifest via validated JSON output
echo 'Do work' | claude-code --print \
  --output-format json \
  --json-schema '${workerResultSchema}'

// Parse validated output
const workerResult = JSON.parse(stdout);

// Conductor updates manifest
manifest.artifacts = workerResult.artifacts;
writeManifest(manifest);
```

**Implementation**:
- Added `WorkerResult` type in `types.ts` for schema definition
- Added `executeTaskWithSchema()` method in `task-executor.ts`
- Updated `worker-spawner.ts` to use schema-based execution
- Updated `ask_worker` tool to use schema-based approach
- Updated worker CLAUDE.md templates with schema instructions
- Workers no longer manually write JSON files

**Benefits**:
- ✅ Guaranteed valid manifest format (schema validation)
- ✅ No worker JSON errors (Claude validates before output)
- ✅ Consistent data structure across all workers
- ✅ Simpler for workers (just return structured data)
- ✅ Conductor has full control over manifest management

**Breaking Changes**:
- Workers must return JSON matching WorkerResult schema
- Old approach of manually updating manifest files is deprecated

---

## v0.2.0 - Critical Architecture Fixes (2026-01-02)

### 🔧 Critical Fix: CLAUDE.md File Path

**Problem**: Workers were inheriting BOSS's configuration instead of getting worker-specific context.

**Root Cause**: Conductor wrote to `/workdir/.claude/CLAUDE.md` (user-specific global config) instead of `/workdir/CLAUDE.md` (project-level context).

**Fix**:
- Changed file path in `environment-manager.ts:72` from `.claude/CLAUDE.md` to root `CLAUDE.md`
- Workers now receive project-level context that Claude Code reads during execution
- Workers are now fully specialized agents with complete BOSS knowledge

**Impact**: Workers can now operate as autonomous specialists without needing extensive prompting from BOSS.

---

### 🏗️ Architecture Change: Worker Configs Now in Conductor Package

**Problem**: Worker configurations were owned by BOSS CLI, making Conductor dependent on BOSS for worker definitions.

**Root Cause**: Design oversight - Conductor loads and uses worker configs but didn't own them.

**Fix**:
- Moved `boss-cli/assets/worker-configs/` → `conductor-mcp/worker-configs/`
- Updated `worker-loader.ts` to load from conductor package first, then check for project overrides
- Added `worker-configs` to `package.json` files array for npm publishing
- Updated `package.json` to include worker-configs in distribution

**Config Loading Priority**:
1. Project override: `.boss/workers/[type]/` (if exists)
2. Conductor built-in: `conductor-mcp/worker-configs/[type]/`

**Impact**:
- Conductor is now a standalone, self-contained package
- `npm install @boss/conductor-mcp` gets everything needed
- Projects can customize worker configs while using sensible defaults
- Single source of truth for worker definitions

---

### 📋 New Feature: Worker Manifest Protocol

**Problem**: BOSS had to guess what workers did by checking git diff or asking questions.

**Solution**: Structured communication protocol via `.boss/worker-manifest.json`

**Implementation**:

#### 1. Manifest Schema (`types.ts`)
```typescript
interface WorkerManifest {
  workerId: string;
  workerType: WorkerType;
  status: WorkerStatus;
  startedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;
  artifacts: WorkerArtifact[];      // Files created/modified
  decisions: WorkerDecision[];      // Key decisions made
  issues: WorkerIssue[];            // Problems encountered
  recommendations: string[];        // Next steps for BOSS
  tasksCompleted: string[];         // Task descriptions
}
```

#### 2. Conductor Writes Initial Manifest
- `environment-manager.ts` creates `.boss/worker-manifest.json` template when spawning workers
- Initial status: "running"
- Empty arrays for artifacts, decisions, issues, recommendations

#### 3. Workers Update Manifest
- Workers instructed via CLAUDE.md to update manifest as they work
- Add artifacts when creating/modifying files
- Document decisions with rationale and impact
- Report issues with severity and suggested actions
- Provide recommendations for BOSS

#### 4. BOSS Reads Manifest
- `get_worker_status` tool reads manifest via `task-executor.ts:getWorkerManifest()`
- Returns structured data to BOSS without asking worker
- Includes tasks completed, decisions, issues, recommendations

**Communication Flow**:
```
BOSS → Worker: Task prompt (what to do)
Worker → BOSS: Manifest file (what was done)
```

**Impact**:
- No more "what did you do?" questions from BOSS
- Structured, machine-readable communication
- Workers document work in real-time
- BOSS gets complete picture without asking

---

### 📚 Enhancement: Comprehensive Worker CLAUDE.md Template

**Problem**: Workers lacked full knowledge of BOSS project structure and methodology.

**Solution**: Enhanced CLAUDE.md template with complete BOSS context.

**Template Includes**:

1. **Manifest Protocol Instructions**
   - When to update manifest
   - Example JSON structure
   - Completion checklist

2. **Complete BOSS Project Structure**
   ```
   /workdir/
   ├── .boss/                        # BOSS metadata
   │   ├── project-config.json       # DO NOT MODIFY
   │   └── worker-manifest.json      # UPDATE THIS!
   ├── .specify/                     # Spec-Kit structure
   │   ├── memory/constitution.md
   │   └── specs/001-feature/
   ├── src/                          # Implementation
   ├── tests/                        # Tests
   └── docs/                         # Documentation
   ```

3. **BOSS Methodology**
   - Test-First Development (NON-NEGOTIABLE)
   - BDD Layer (NON-NEGOTIABLE)
   - Documentation Standards (NON-NEGOTIABLE)
   - Constitution Compliance

4. **Container Environment Constraints**
   - What workers CAN do (read/write files, run tests)
   - What workers CANNOT do (git commands, modify project-config)
   - Branch information

5. **Communication Patterns**
   - BOSS won't ask questions
   - Workers are autonomous
   - Document everything in manifest

**Impact**:
- Workers are fully specialized agents from spawn
- Know exact file paths and locations
- Understand BOSS methodology deeply
- Require minimal prompting from BOSS

---

## Files Modified

### Core Changes
- `src/lifecycle/environment-manager.ts` - Fixed CLAUDE.md path, added manifest template
- `src/config/worker-loader.ts` - Load from conductor package, project override support
- `src/orchestration/task-executor.ts` - Added `getWorkerManifest()` method
- `src/tools.ts` - Updated `get_worker_status` to read manifest
- `src/types.ts` - Added `WorkerManifest`, `WorkerArtifact`, `WorkerDecision`, `WorkerIssue` types

### Package Configuration
- `package.json` - Added `worker-configs` to files array

### Worker Configs
- Moved `boss-cli/assets/worker-configs/` → `conductor-mcp/worker-configs/`
- Enhanced `worker-configs/architect/CLAUDE.md` with comprehensive template
  (Template can be replicated for other 14 worker types)

### Documentation
- Created this CHANGELOG.md

---

## Migration Notes

### For BOSS CLI
The next step is to update BOSS CLI to remove worker config generation since Conductor now owns these configs:

1. Remove `src/generators/worker-configs.ts` usage from bootstrap
2. Update documentation to reference Conductor's built-in configs
3. Optionally: Add command to copy conductor configs to `.boss/workers/` for customization

### For Projects
No migration needed. Conductor will:
1. Use built-in worker configs from conductor package
2. Check for project overrides in `.boss/workers/`
3. Fall back to built-in if no override exists

---

## Testing Checklist

- [x] Conductor builds successfully (`npm run build`)
- [ ] Spawn architect worker and verify:
  - [ ] CLAUDE.md written to `/workdir/CLAUDE.md` (not `.claude/CLAUDE.md`)
  - [ ] Worker manifest created at `/workdir/.boss/worker-manifest.json`
  - [ ] Worker knows BOSS project structure
  - [ ] Worker updates manifest as it works
- [ ] Call `get_worker_status` and verify manifest data returned
- [ ] Verify worker configs loaded from conductor package (not `.boss/workers/`)
- [ ] Test project override by creating `.boss/workers/architect/` with custom config

---

## Next Steps

1. **Update BOSS CLI** to remove worker config generation
2. **Replicate enhanced CLAUDE.md template** to other 14 worker types
3. **Test complete BOSS→Conductor→Worker flow** with actual worker spawn
4. **Document manifest protocol** in BOSS-GUIDE.md
5. **Update README.md** with new architecture details

---

## Breaking Changes

- Worker configs moved from BOSS CLI to Conductor package
- `GetWorkerStatusOutput` now includes optional `manifest` field
- Worker CLAUDE.md path changed from `.claude/CLAUDE.md` to `CLAUDE.md` (root)

---

## Version Bump Recommendation

Given the critical fixes and architecture changes, recommend:
- Current: `0.1.0`
- New: `0.2.0` (minor version bump for new features and breaking changes)
