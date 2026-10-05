// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import adminNext from './apps/admin/eslint.next.mjs';
import mobileExpo from './apps/mobile/eslint.expo.mjs';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.turbo/**',
      'docs/**',
    ],
  },

  js.configs.recommended,

  // Framework layers, scoped per app. They come before the repository strict
  // TypeScript rules so repository policy wins on any overlapping rule.
  { basePath: 'apps/admin', ignores: ['next-env.d.ts', 'out/**'] },
  { name: 'project-connect/admin-next', basePath: 'apps/admin', extends: [adminNext] },
  { basePath: 'apps/mobile', ignores: ['expo-env.d.ts'] },
  { name: 'project-connect/mobile-expo', basePath: 'apps/mobile', extends: [mobileExpo] },
  // packages/ui is React Native code consumed by mobile: same framework rules.
  { name: 'project-connect/ui-expo', basePath: 'packages/ui', extends: [mobileExpo] },

  tseslint.configs.strictTypeChecked,

  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'import-x': importX },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Cycles inside third-party packages are not ours to police, and following
      // imports into node_modules makes import-x parse react-native's Flow sources.
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
    },
  },

  // Architecture boundaries (editor-time layer; scripts/check-architecture.mjs is the CI layer).
  {
    files: ['apps/api/src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', 'drizzle-orm', 'drizzle-orm/*', 'pg', 'redis', '@aws-sdk/*'],
              message:
                'Domain layer must not depend on frameworks, ORM, AWS SDK, Redis or provider SDKs (ADR-071).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}', 'apps/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@project-connect/api', '@project-connect/worker', '**/apps/*/**'],
              message: 'Applications must not import other applications (CLAUDE.md §9).',
            },
          ],
        },
      ],
    },
  },
  {
    // node:test describe/it return promises that the runner itself awaits.
    files: ['scripts/**/*.test.mjs'],
    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['describe', 'it', 'test', 'suite'] },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts', 'apps/worker/**/*.ts'],
    rules: {
      'no-console': 'error',
      // Nest modules are decorated, intentionally empty classes.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
);
