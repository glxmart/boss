---
'@glxmart/boss-cli': patch
'@glxmart/conductor-mcp': patch
---

Fix linting errors and improve type safety across codebase

Massive type safety improvements fixing 179 ESLint errors:
- Replaced all `any` types with proper type definitions
- Created centralized MCP result type definitions
- Fixed unsafe member access patterns throughout codebase
- Added comprehensive type guards and assertions

Enhanced error handling and debugging:
- Improved error message propagation in container creation failures
- Better error context preservation through exception wrapping
- More descriptive error messages for troubleshooting

Test infrastructure improvements:
- Fixed test assertions to match updated type signatures
- Added graceful skipping for e2e tests when Docker images unavailable
- Improved error reporting in test failures
