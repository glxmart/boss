---
'@glxmart/boss-cli': patch
---

Fix critical template bootstrap issues

Fixed nextjs-app-turbo template:
- Missing node_modules/ in .gitignore (prevented 29k+ files from being committed)
- NextAuth v5 beta type export errors (TypeScript compilation failed)
- Missing ESLint configs in all 5 packages (lint failed)
- Missing Prisma postinstall hook (TypeScript could not find @prisma/client)
- Missing skeleton test files (test:unit failed)

Fixed t3-app template:
- Incorrect .gitignore pattern (/node_modules vs node_modules/)
- Missing eslint.config.js (lint failed)
- Missing skeleton test files (test:unit failed)

E2E test improvements:
- Removed all test skips that masked known issues
- Added .gitignore validation to prevent node_modules commits
- Added Prisma client generation validation
- All templates now run full quality gates (typecheck, lint, test)

Documentation:
- Comprehensive template audit with root cause analysis
- Test coverage gap analysis (67% of combinations untested)
