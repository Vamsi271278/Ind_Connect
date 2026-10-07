import type { Database, Transaction } from './database.module.js';
import type { TransactionContext, UnitOfWork } from './unit-of-work.js';

class DrizzleTransactionContext implements TransactionContext {
  readonly kind = 'transaction';

  constructor(readonly executor: Transaction) {}
}

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Database) {}

  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(new DrizzleTransactionContext(tx)));
  }
}

/** Infrastructure-only: unwraps the Drizzle transaction behind a context. */
export function executorOf(tx: TransactionContext): Transaction {
  if (tx instanceof DrizzleTransactionContext) return tx.executor;
  throw new Error('TransactionContext was not created by DrizzleUnitOfWork');
}
