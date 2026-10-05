import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const MIGRATIONS = resolve(import.meta.dirname, '../../src/shared/database/migrations');

/** Refuses anything that does not look like a disposable test database. */
export function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!/test/i.test(name)) {
    throw new Error(
      `Refusing to run integration tests against database "${name}": name must contain "test".`,
    );
  }
}

/** Applies the reviewed migrations to the test database once per run. */
export default async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (url === undefined) throw new Error('TEST_DATABASE_URL is required');
  assertTestDatabase(url);
  const journal = resolve(MIGRATIONS, 'meta/_journal.json');
  const entries: unknown = existsSync(journal)
    ? (JSON.parse(readFileSync(journal, 'utf8')) as { entries?: unknown }).entries
    : undefined;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('No reviewed migrations found yet (B1.3/B1.4 gate).');
  }
  const pool = new pg.Pool({ connectionString: url });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: MIGRATIONS });
  } finally {
    await pool.end();
  }
}
