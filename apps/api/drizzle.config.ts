import { defineConfig } from 'drizzle-kit';

// Migration authoring only (P3): `drizzle-kit generate` output is reviewed
// before it is applied. Migrations never run at API startup (ADR-047).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/schema/index.ts',
  out: './src/shared/database/migrations',
  strict: true,
  verbose: true,
});
