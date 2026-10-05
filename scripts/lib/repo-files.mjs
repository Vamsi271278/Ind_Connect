// @ts-check
// Repository file discovery shared by the CI guard scripts.

import { readdirSync } from 'node:fs';
import path from 'node:path';

/** Generated output, dependency and cache directories that are never repository-controlled. */
export const GENERATED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.expo',
  '.turbo',
]);

/**
 * Walks the repository, skipping generated directories and symlinks. `.git`
 * directories are recorded but never descended into.
 *
 * @param {string} root absolute repository root
 * @returns {{ files: string[], dirs: string[] }} repository-relative POSIX paths
 */
export function walkRepository(root) {
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const dirs = [];

  /** @param {string} rel */
  const visit = (rel) => {
    const abs = rel === '' ? root : path.join(root, rel);
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (GENERATED_DIRS.has(entry.name)) continue;
        dirs.push(childRel);
        if (entry.name !== '.git') visit(childRel);
      } else if (entry.isFile()) {
        files.push(childRel);
      }
    }
  };

  visit('');
  return { files, dirs };
}

/**
 * @param {string} relPath repository-relative POSIX path
 * @returns {string}
 */
export function baseName(relPath) {
  const index = relPath.lastIndexOf('/');
  return index === -1 ? relPath : relPath.slice(index + 1);
}
