# Common Issues & Solutions

## Dynamic Import of fs-extra

### Problem
When using dynamic `import('fs-extra')`, you cannot access methods directly on the imported module. The error `fs.readdir is not a function` or similar will occur.

### ❌ Wrong Way
```typescript
const fs = await import('fs-extra');
await fs.readdir(path); // ❌ Error: fs.readdir is not a function
await fs.pathExists(path); // ❌ Error: fs.pathExists is not a function
```

### ✅ Correct Way
```typescript
const fsModule = await import('fs-extra');
const fs = fsModule.default; // Access the default export
await fs.readdir(path); // ✅ Works
await fs.pathExists(path); // ✅ Works
```

### Why This Happens
- Dynamic `import()` returns a module namespace object
- `fs-extra` exports its API as the default export
- You must access `module.default` to get the actual fs-extra object

### When to Use This Pattern
- Always when using `await import('fs-extra')` in async functions
- When you need to conditionally import fs-extra
- When using dynamic imports to reduce initial bundle size

### Alternative: Static Import
If you don't need dynamic imports, use static import instead:
```typescript
import fs from 'fs-extra';
await fs.readdir(path); // ✅ Works directly
```

### Related Files
- `src/commands/bootstrap.ts` - `ensureTestFileExists` function
- `src/generators/template-loader.ts` - Multiple dynamic imports
- `src/generators/specify-structure.ts` - Uses `m.default.pathExists`

### Testing
To verify the fix works:
```bash
node -e "import('fs-extra').then(m => { console.log('readdir:', typeof m.default.readdir); })"
# Should output: readdir: function
```

