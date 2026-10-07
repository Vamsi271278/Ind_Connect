import type {
  ProfileRepository,
  ProfileStore,
} from '../../src/modules/profile/application/ports.js';
import type { ProfileState } from '../../src/modules/profile/domain/profile.js';
import type { TransactionContext, UnitOfWork } from '../../src/shared/database/unit-of-work.js';
import type { InMemoryIdentityStore } from './in-memory-identity-store.js';

export class InMemoryProfileStore implements ProfileStore, Snapshottable {
  rows = new Map<string, ProfileState>();

  checkpoint(): () => void {
    const saved = structuredClone(this.rows);
    return () => {
      this.rows = saved;
    };
  }

  readonly repository: ProfileRepository = {
    findProfile: (userId) => Promise.resolve(this.rows.get(userId)),
    upsertProfile: (userId, state) => {
      this.rows.set(userId, { ...state });
      return Promise.resolve();
    },
  };

  forTransaction(): ProfileRepository {
    return this.repository;
  }
}

/** An in-memory store the test UnitOfWork can roll back: checkpoint() returns its restore. */
export interface Snapshottable {
  checkpoint(): () => void;
}

/**
 * Test UnitOfWork over the in-memory stores: snapshots them all and restores
 * them if the work throws, so cross-module atomicity is observable in unit
 * tests. (Real atomicity is proven against PostgreSQL in the integration suite.)
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(
    private readonly identity: InMemoryIdentityStore,
    private readonly stores: readonly Snapshottable[],
  ) {}

  async run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const identitySnapshot = structuredClone(this.identity.state);
    const restores = this.stores.map((store) => store.checkpoint());
    try {
      return await work({ kind: 'transaction' });
    } catch (error) {
      this.identity.state = identitySnapshot;
      for (const restore of restores) restore();
      throw error;
    }
  }
}
