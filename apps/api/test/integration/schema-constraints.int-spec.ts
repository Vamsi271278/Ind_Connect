import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DrizzleIdentityStore } from '../../src/modules/identity/infrastructure/persistence/drizzle-identity.store.js';
import type { Database } from '../../src/shared/database/database.module.js';
import * as schema from '../../src/shared/database/schema/index.js';
import { resetDatabase } from '../support/integration-db.js';

const { users, userSessions, userProfiles, genderOptions } = schema;

let pool: pg.Pool;
let db: Database;

beforeAll(() => {
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
});
afterAll(async () => {
  await pool.end();
});
beforeEach(async () => {
  await resetDatabase(db);
});

/** PostgreSQL SQLSTATE of a failed statement (through Drizzle's wrapper). */
async function sqlState(work: Promise<unknown>): Promise<string | undefined> {
  try {
    await work;
    return undefined;
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const source = typeof cause === 'object' && cause !== null ? cause : error;
    return typeof source === 'object' && source !== null && 'code' in source
      ? String(source.code)
      : 'unknown';
  }
}

const userValues = (
  overrides: Partial<typeof users.$inferInsert> = {},
): typeof users.$inferInsert => ({
  phoneE164: '+12145550123',
  phoneVerifiedAt: new Date(),
  dateOfBirth: '1990-01-01',
  onboardingStatus: 'IN_PROGRESS',
  onboardingStep: 'NAME',
  ...overrides,
});

describe('users', () => {
  it('defaults to PENDING_VERIFICATION and not discoverable', async () => {
    const [row] = await db.insert(users).values(userValues()).returning();
    expect(row).toMatchObject({ accountStatus: 'PENDING_VERIFICATION', discoverable: false });
  });

  it('allows one account per phone, and a BANNED account keeps blocking the number', async () => {
    await db.insert(users).values(userValues({ accountStatus: 'BANNED' }));
    expect(await sqlState(db.insert(users).values(userValues()))).toBe('23505');
  });

  it('keeps a SUSPENDED account reserving its number', async () => {
    await db.insert(users).values(userValues({ accountStatus: 'SUSPENDED' }));
    expect(await sqlState(db.insert(users).values(userValues()))).toBe('23505');
  });

  it('frees the number only once the previous account is DELETED', async () => {
    await db.insert(users).values(userValues({ accountStatus: 'DELETED' }));
    await expect(db.insert(users).values(userValues())).resolves.toBeDefined();
  });

  it('enforces E.164 format and known status/step values', async () => {
    expect(await sqlState(db.insert(users).values(userValues({ phoneE164: '2145550123' })))).toBe(
      '23514',
    );
    expect(await sqlState(db.insert(users).values(userValues({ accountStatus: 'GODMODE' })))).toBe(
      '23514',
    );
    expect(await sqlState(db.insert(users).values(userValues({ onboardingStep: 'SKIP' })))).toBe(
      '23514',
    );
  });

  describe('age >= 18 at creation, evaluated against created_at (deterministic)', () => {
    // created_at 2026-10-05 12:00Z → UTC-12 date 2026-10-05.
    const createdAt = new Date('2026-10-05T12:00:00Z');

    it('accepts exactly 18 and rejects one day short', async () => {
      await expect(
        db.insert(users).values(userValues({ dateOfBirth: '2008-10-05', createdAt })),
      ).resolves.toBeDefined();
      expect(
        await sqlState(
          db
            .insert(users)
            .values(
              userValues({ phoneE164: '+12145550124', dateOfBirth: '2008-10-06', createdAt }),
            ),
        ),
      ).toBe('23514');
    });

    it('uses the UTC-12 calendar date (no early eligibility)', async () => {
      // 08:00Z on Oct 5 is still Oct 4 at UTC-12.
      const early = new Date('2026-10-05T08:00:00Z');
      expect(
        await sqlState(
          db.insert(users).values(userValues({ dateOfBirth: '2008-10-05', createdAt: early })),
        ),
      ).toBe('23514');
    });

    it('qualifies Feb 29 births on Mar 1 in common years', async () => {
      const feb28 = new Date('2026-02-28T12:00:00Z');
      const mar1 = new Date('2026-03-01T12:00:00Z');
      expect(
        await sqlState(
          db.insert(users).values(userValues({ dateOfBirth: '2008-02-29', createdAt: feb28 })),
        ),
      ).toBe('23514');
      await expect(
        db.insert(users).values(userValues({ dateOfBirth: '2008-02-29', createdAt: mar1 })),
      ).resolves.toBeDefined();
    });
  });
});

describe('user_sessions', () => {
  const sessionValues = (
    userId: string,
    overrides: Partial<typeof userSessions.$inferInsert> = {},
  ) => ({
    userId,
    tokenFamilyId: randomUUID(),
    refreshTokenHash: 'a'.repeat(64),
    deviceContext: { platform: 'ios', appVersion: '1', osVersion: '1', installId: randomUUID() },
    expiresAt: new Date(Date.now() + 86_400_000),
    ...overrides,
  });

  it('requires an existing user and a well-formed unique token hash', async () => {
    expect(await sqlState(db.insert(userSessions).values(sessionValues(randomUUID())))).toBe(
      '23503',
    );
    const [user] = await db.insert(users).values(userValues()).returning({ id: users.id });
    if (user === undefined) throw new Error('no user');
    expect(
      await sqlState(
        db.insert(userSessions).values(sessionValues(user.id, { refreshTokenHash: 'XYZ' })),
      ),
    ).toBe('23514');
    await db.insert(userSessions).values(sessionValues(user.id));
    expect(await sqlState(db.insert(userSessions).values(sessionValues(user.id)))).toBe('23505');
  });

  it('keeps revocation and rotation lineage consistent', async () => {
    const [user] = await db.insert(users).values(userValues()).returning({ id: users.id });
    if (user === undefined) throw new Error('no user');
    const now = new Date();
    const hash = () => randomUUID().replaceAll('-', '').padEnd(64, '0');
    // revoked_at without a reason
    expect(
      await sqlState(
        db
          .insert(userSessions)
          .values(sessionValues(user.id, { refreshTokenHash: hash(), revokedAt: now })),
      ),
    ).toBe('23514');
    // ROTATED without rotated_at
    expect(
      await sqlState(
        db.insert(userSessions).values(
          sessionValues(user.id, {
            refreshTokenHash: hash(),
            revokedAt: now,
            revocationReason: 'ROTATED',
          }),
        ),
      ),
    ).toBe('23514');
    // rotated without a successor link
    expect(
      await sqlState(
        db.insert(userSessions).values(
          sessionValues(user.id, {
            refreshTokenHash: hash(),
            revokedAt: now,
            revocationReason: 'ROTATED',
            rotatedAt: now,
          }),
        ),
      ),
    ).toBe('23514');
    // unknown reason
    expect(
      await sqlState(
        db.insert(userSessions).values(
          sessionValues(user.id, {
            refreshTokenHash: hash(),
            revokedAt: now,
            revocationReason: 'BECAUSE',
          }),
        ),
      ),
    ).toBe('23514');
  });
});

describe('user_profiles and gender_options', () => {
  it('seeds the five canonical gender codes', async () => {
    const rows = await db
      .select({ code: genderOptions.code })
      .from(genderOptions)
      .orderBy(genderOptions.displayOrder);
    expect(rows.map((r) => r.code)).toEqual([
      'WOMAN',
      'MAN',
      'NON_BINARY',
      'SELF_DESCRIBE',
      'PREFER_NOT_TO_SAY',
    ]);
  });

  it('allows a self-description only with SELF_DESCRIBE and rejects unknown codes', async () => {
    const [user] = await db.insert(users).values(userValues()).returning({ id: users.id });
    if (user === undefined) throw new Error('no user');
    expect(
      await sqlState(
        db
          .insert(userProfiles)
          .values({ userId: user.id, genderCode: 'MAN', genderSelfDescription: 'x' }),
      ),
    ).toBe('23514');
    // NULL-safety regression: FALSE OR NULL would be NULL, and a NULL CHECK passes.
    expect(
      await sqlState(
        db
          .insert(userProfiles)
          .values({ userId: user.id, genderCode: null, genderSelfDescription: 'x' }),
      ),
    ).toBe('23514');
    expect(
      await sqlState(db.insert(userProfiles).values({ userId: user.id, genderCode: 'ROBOT' })),
    ).toBe('23503');
    await expect(
      db
        .insert(userProfiles)
        .values({ userId: user.id, genderCode: 'SELF_DESCRIBE', genderSelfDescription: 'Fluid' }),
    ).resolves.toBeDefined();
  });
});

describe('transactions', () => {
  it('rolls back a registration that fails part-way (no partial state)', async () => {
    const store = new DrizzleIdentityStore(db);
    await expect(
      store.transaction(async (repository) => {
        await repository.insertUser({
          phoneE164: '+12145550199',
          phoneVerifiedAt: new Date(),
          dateOfBirth: '1990-01-01',
          accountStatus: 'PENDING_VERIFICATION',
          onboardingStatus: 'IN_PROGRESS',
          onboardingStep: 'NAME',
        });
        throw new Error('simulated failure after insert');
      }),
    ).rejects.toThrow('simulated failure');
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phoneE164, '+12145550199'));
    expect(rows).toHaveLength(0);
  });
});
