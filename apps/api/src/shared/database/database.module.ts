import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { DrizzleUnitOfWork } from './drizzle-unit-of-work.js';
import * as schema from './schema/index.js';
import { UNIT_OF_WORK, type UnitOfWork } from './unit-of-work.js';

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Either the pool-backed database or an open transaction. */
export type DbExecutor = Database | Transaction;

export const DATABASE = Symbol('DATABASE');
export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [APP_CONFIG],
      // Connections are opened lazily on first query.
      useFactory: (config: AppConfig) =>
        new pg.Pool({
          connectionString: config.database.url.reveal(),
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30_000,
          statement_timeout: 10_000,
        }),
    },
    {
      provide: DATABASE,
      inject: [PG_POOL],
      useFactory: (pool: pg.Pool): Database => drizzle({ client: pool, schema }),
    },
    {
      provide: UNIT_OF_WORK,
      inject: [DATABASE],
      useFactory: (db: Database): UnitOfWork => new DrizzleUnitOfWork(db),
    },
  ],
  exports: [DATABASE, PG_POOL, UNIT_OF_WORK],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
