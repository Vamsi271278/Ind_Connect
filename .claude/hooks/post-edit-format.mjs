#!/usr/bin/env node
/**
 * Project Connect PostToolUse formatting helper.
 *
 * Intentionally does NOT run `prettier --write .`.
 * It extracts a likely edited file path from the hook payload and formats only
 * supported files when project tooling is available. Any inability to format is
 * non-blocking; CI remains authoritative.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    process.exit(0);
  }

  const candidates = [
    payload?.tool_input?.file_path,
    payload?.tool_input?.path,
    payload?.file_path,
    payload?.path,
  ].filter((v) => typeof v === 'string' && v.length > 0);

  if (candidates.length === 0) process.exit(0);

  const repoRoot =
    process.env.CLAUDE_PROJECT_DIR ||
    process.env.CLAUDE_PROJECT_ROOT ||
    process.cwd();

  let file = candidates[0];
  if (!path.isAbsolute(file)) file = path.resolve(repoRoot, file);

  const allowedExt = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.json', '.md', '.yaml', '.yml', '.css', '.scss'
  ]);

  if (!allowedExt.has(path.extname(file).toLowerCase())) process.exit(0);
  if (!fs.existsSync(path.resolve(repoRoot, 'package.json'))) process.exit(0);
  if (!fs.existsSync(file)) process.exit(0);

  const rel = path.relative(repoRoot, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0); // outside repo
  if (rel.split(/[\\/]/).includes('node_modules')) process.exit(0);

  // Run the repository's locally installed Prettier directly with Node: no shell
  // (avoids Windows cmd quoting/metacharacter issues with file paths) and no
  // package download. If Prettier is not installed yet, do nothing.
  const prettierBin = path.resolve(repoRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (!fs.existsSync(prettierBin)) process.exit(0);

  spawnSync(process.execPath, [prettierBin, '--write', '--ignore-unknown', file], {
    cwd: repoRoot,
    stdio: 'ignore',
    timeout: 20000,
  });

  process.exit(0);
});
