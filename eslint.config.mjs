// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
      'import-x/no-cycle': 'error',
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
    files: ['apps/api/**/*.ts', 'apps/worker/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
);
