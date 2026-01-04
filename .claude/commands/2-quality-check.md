# Quality Check

Run comprehensive quality validation on your code.

> **💡 Powered by**: [`workflow-management`](.claude/skills/workflow-management/SKILL.md) + [`quality-gates`](.claude/skills/quality-gates/SKILL.md) skills

## What This Does

Validates your changes meet quality standards:

1. **Build** - TypeScript compilation
2. **Lint** - ESLint validation
3. **Type Check** - TypeScript types
4. **Tests** - Unit and integration tests
5. **Security** - Secret detection and vulnerabilities

## Usage

**Invoke with:** "Run quality check" or "Validate code"

Executes: `.claude/skills/workflow-management/tools/2-quality-check.sh`

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
