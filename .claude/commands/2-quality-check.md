# Quality Check

Run comprehensive quality validation on your code.

> **TIP**: This command uses the [`workflow-management`](.claude/skills/workflow-management/SKILL.md) + [`quality-gates`](.claude/skills/quality-gates/SKILL.md) skills.

## What This Does

1. **Build** - TypeScript compilation (`pnpm build`)
2. **Lint** - ESLint validation (`pnpm lint`)
3. **Type Check** - TypeScript strict mode (`tsc --noEmit`)
4. **Tests** - Unit and integration tests (`pnpm test`)
5. **Security** - Secret detection and vulnerability scan

## Usage

**Invoke with:** `/2-quality-check` or "Run quality check"

Execute directly (no arguments needed):

```bash
.claude/skills/workflow-management/tools/2-quality-check.sh
```

### Exit Codes

| Code | Meaning                   |
| ---- | ------------------------- |
| `0`  | All checks passed         |
| `1`  | One or more checks failed |

## Expected Result

```
🔍 Running Quality Checks

📦 Building packages...
✅ Build passed

🔧 Running lint check...
✅ Lint passed

📝 Running type check...
✅ Type check passed

🧪 Running tests...
✅ Tests passed

🔒 Running security checks...
✅ Security checks passed

✅ All quality checks passed!
```

## If Checks Fail

```bash
# Fix build errors
pnpm build

# Auto-fix lint issues
pnpm lint --fix

# Run tests with details
pnpm test
```

## Next Steps

1. `/3-create-changeset` - Create version bump
2. `/4-create-pr` - Submit pull request

## Documentation

- [workflow-management skill](.claude/skills/workflow-management/SKILL.md)
- [quality-gates skill](.claude/skills/quality-gates/SKILL.md)
