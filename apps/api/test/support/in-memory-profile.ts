import type {
  ProfileRepository,
  ProfileStore,
} from '../../src/modules/profile/application/ports.js';
import type { ProfileState } from '../../src/modules/profile/domain/profile.js';
import type { TransactionContext, UnitOfWork } from '../../src/shared/database/unit-of-work.js';
import type { InMemoryIdentityStore } from './in-memory-identity-store.js';
import type { InMemoryLocationStore } from './in-memory-location.js';

export class InMemoryProfileStore implements ProfileStore {
  rows = new Map<string, ProfileState>();

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

/**
 * Test UnitOfWork over the in-memory stores: snapshots them all and restores them
 * if the work throws, so cross-module atomicity is observable in unit tests.
 * (Real atomicity is proven against PostgreSQL in the integration suite.)
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(
    private readonly identity: InMemoryIdentityStore,
    private readonly profiles: InMemoryProfileStore,
    private readonly locations?: InMemoryLocationStore,
  ) {}

  async run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const identitySnapshot = structuredClone(this.identity.state);
    const profileSnapshot = structuredClone(this.profiles.rows);
    const locationSnapshot = structuredClone(this.locations?.rows);
    try {
      return await work({ kind: 'transaction' });
    } catch (error) {
      this.identity.state = identitySnapshot;
      this.profiles.rows = profileSnapshot;
      if (this.locations !== undefined && locationSnapshot !== undefined) {
        this.locations.rows = locationSnapshot;
      }
      throw error;
    }
  }
}
