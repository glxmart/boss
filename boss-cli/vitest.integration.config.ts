import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
    setupFiles: ['tests/setup.ts'],
    // Run tests sequentially to avoid git index file conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});

