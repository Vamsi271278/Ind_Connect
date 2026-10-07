import { defineConfig } from 'vitest/config';

// Pure, React-Native-free client logic only (Phase-2 B2-D4). No component
// test runner: screens are covered by Maestro later (ADR-054).
export default defineConfig({
  test: {
    root: './',
    include: ['src/core/**/*.test.ts'],
    environment: 'node',
  },
});
