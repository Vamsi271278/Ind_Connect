// Applies reviewed Drizzle migrations to a LOCAL database (P3 / ADR-047).
// Explicit operator action only — the API never migrates at startup, and
// production migrations run through the deployment pipeline, not this script.
//
// Usage (from apps/api): pnpm db:migrate   (reads DATABASE_URL, e.g. from .env)

import { resolve } from 'node:path';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const url = process.env.DATABASE_URL;
if (url === undefined || url === '') {
  process.stderr.write('DATABASE_URL is required.\n');
  process.exit(1);
}

const host = new URL(url).hostname;
if (!LOCAL_HOSTS.has(host)) {
  process.stderr.write(
    `Refusing to migrate non-local host "${host}". Production migrations run through deployment.\n`,
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
try {
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: resolve(import.meta.dirname, '../src/shared/database/migrations'),
  });
  process.stdout.write('Migrations applied.\n');
} finally {
  await pool.end();
}
