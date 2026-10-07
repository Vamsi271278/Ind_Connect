// Generates (or, with --check, verifies) the committed OpenAPI 3.1 artifact
// from the built contracts. CI runs --check: any drift between the Zod
// contracts and openapi.json fails the build.
//
// Usage (from packages/api-contracts, after `pnpm build`):
//   node scripts/openapi.ts           write openapi.json
//   node scripts/openapi.ts --check   exit 1 if openapi.json is stale

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildOpenApiDocument } from '../dist/index.js';

const target = resolve(import.meta.dirname, '../openapi.json');
const rendered = `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`;

if (process.argv.includes('--check')) {
  let committed = '';
  try {
    committed = readFileSync(target, 'utf8');
  } catch {
    // missing file is drift
  }
  if (committed !== rendered) {
    process.stderr.write(
      'openapi.json is out of date. Run `pnpm --filter @project-connect/api-contracts openapi:generate` and commit it.\n',
    );
    process.exit(1);
  }
  process.stdout.write('openapi.json is up to date.\n');
} else {
  writeFileSync(target, rendered);
  process.stdout.write(`Wrote ${target}\n`);
}
