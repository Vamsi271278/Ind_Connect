import { defineConfig } from 'vitest/config';

// Real PostgreSQL + Redis (ADR-053). Requires TEST_DATABASE_URL / TEST_REDIS_URL
// and the reviewed migrations. Files run serially: they share one database.
export default defineConfig({
  test: {
    root: './',
    include: ['test/integration/**/*.int-spec.ts'],
    setupFiles: ['./test/setup/integration-env.ts', './test/setup/test-env.ts'],
    globalSetup: ['./test/setup/integration-global.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
