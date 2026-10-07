import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { ProfileState } from '../domain/profile.js';

/** Profile-owned persistence (`user_profiles`). */
export interface ProfileRepository {
  findProfile(userId: string): Promise<ProfileState | undefined>;
  upsertProfile(userId: string, state: ProfileState, at: Date): Promise<void>;
}

export interface ProfileStore {
  readonly repository: ProfileRepository;
  forTransaction(tx: TransactionContext): ProfileRepository;
}

export const PROFILE_STORE = Symbol('PROFILE_STORE');
