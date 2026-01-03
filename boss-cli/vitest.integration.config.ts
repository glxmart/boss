import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
    setupFiles: ['tests/setup.ts'],
    // Run tests sequentially to avoid git index file conflicts
    // Vitest 4 moved poolOptions to top-level
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Vitest 4 syntax (but keep poolOptions for backward compatibility)
    singleFork: true,
    // Also disable parallelization at file level
    fileParallelism: false,
  },
});
