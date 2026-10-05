// @ts-check
// Next.js framework layer. Composed into the repository ESLint config
// (root eslint.config.mjs), scoped to apps/admin. Not a standalone config.
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const adminNext = [...nextVitals, ...nextTs];

export default adminNext;
