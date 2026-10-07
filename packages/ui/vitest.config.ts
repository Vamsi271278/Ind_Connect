import { defineConfig } from 'vitest/config';

// Pure helpers only (no React Native renderer in unit tests; screens are
// covered by Maestro later, ADR-054).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
