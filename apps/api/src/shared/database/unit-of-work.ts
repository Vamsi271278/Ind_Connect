/**
 * Opaque handle to an open database transaction. Application services pass it
 * between modules (e.g. profile → identity) so cross-module writes commit
 * atomically, without any module touching another module's tables or knowing
 * the persistence technology.
 */
export interface TransactionContext {
  readonly kind: 'transaction';
}

export interface UnitOfWork {
  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
