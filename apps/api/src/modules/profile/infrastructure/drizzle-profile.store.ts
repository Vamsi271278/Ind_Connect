import { eq } from 'drizzle-orm';

import type { Database, DbExecutor } from '../../../shared/database/database.module.js';
import { executorOf } from '../../../shared/database/drizzle-unit-of-work.js';
import { userProfiles } from '../../../shared/database/schema/index.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import { GENDER_CODES, type GenderCode, type ProfileState } from '../domain/profile.js';
import type { ProfileRepository, ProfileStore } from '../application/ports.js';

const toGenderCode = (value: string | null): GenderCode | null => {
  if (value === null) return null;
  const code = GENDER_CODES.find((candidate) => candidate === value);
  if (code === undefined) throw new Error('user_profiles.gender_code outside known codes');
  return code;
};

class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly db: DbExecutor) {}

  async findProfile(userId: string): Promise<ProfileState | undefined> {
    const [row] = await this.db
      .select({
        firstName: userProfiles.firstName,
        genderCode: userProfiles.genderCode,
        genderSelfDescription: userProfiles.genderSelfDescription,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return row === undefined ? undefined : { ...row, genderCode: toGenderCode(row.genderCode) };
  }

  async upsertProfile(userId: string, state: ProfileState, at: Date): Promise<void> {
    await this.db
      .insert(userProfiles)
      .values({ userId, ...state, createdAt: at, updatedAt: at })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { ...state, updatedAt: at },
      });
  }
}

export class DrizzleProfileStore implements ProfileStore {
  readonly repository: ProfileRepository;

  constructor(db: Database) {
    this.repository = new DrizzleProfileRepository(db);
  }

  forTransaction(tx: TransactionContext): ProfileRepository {
    return new DrizzleProfileRepository(executorOf(tx));
  }
}
