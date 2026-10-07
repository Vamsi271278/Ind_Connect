import { randomUUID } from 'node:crypto';

import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DrizzleIdentityStore } from '../../src/modules/identity/infrastructure/persistence/drizzle-identity.store.js';
import type { Database } from '../../src/shared/database/database.module.js';
import * as schema from '../../src/shared/database/schema/index.js';
import { resetDatabase } from '../support/integration-db.js';

const {
  users,
  userSessions,
  userProfiles,
  genderOptions,
  metros,
  cities,
  userLocations,
  intentOptions,
  userIntents,
  datingConsents,
} = schema;

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

describe('metros / cities / user_locations', () => {
  const dfw = async () => {
    const [row] = await db.select().from(metros).where(eq(metros.code, 'DFW'));
    if (row === undefined) throw new Error('DFW seed missing');
    return row;
  };
  const city = async (name: string) => {
    const [row] = await db.select().from(cities).where(eq(cities.name, name));
    if (row === undefined) throw new Error(`no city ${name}`);
    return row;
  };
  const newUser = async (phone: string) => {
    const [row] = await db
      .insert(users)
      .values(userValues({ phoneE164: phone, onboardingStep: 'LOCATION' }))
      .returning();
    if (row === undefined) throw new Error('user insert failed');
    return row;
  };
  const manual = (
    userId: string,
    c: typeof cities.$inferSelect,
    overrides: Partial<typeof userLocations.$inferInsert> = {},
  ): typeof userLocations.$inferInsert => ({
    userId,
    cityId: c.id,
    metroId: c.metroId,
    countryCode: c.countryCode,
    precisionType: 'MANUAL_CITY',
    source: 'MANUAL',
    capturedAt: new Date(),
    ...overrides,
  });

  it('seeds the DFW metro and the 14 owner-approved ACTIVE cities', async () => {
    expect(await dfw()).toMatchObject({
      name: 'Dallas–Fort Worth',
      countryCode: 'US',
      timezone: 'America/Chicago',
      launchStatus: 'ACTIVE',
    });
    const rows = await db
      .select()
      .from(cities)
      .where(eq(cities.metroId, (await dfw()).id));
    expect(rows.map((r) => r.name).sort()).toEqual(
      [
        'Allen',
        'Arlington',
        'Carrollton',
        'Coppell',
        'Dallas',
        'Denton',
        'Fort Worth',
        'Frisco',
        'Irving',
        'Lewisville',
        'McKinney',
        'Plano',
        'Prosper',
        'Richardson',
      ].sort(),
    );
    for (const row of rows) {
      expect(row).toMatchObject({ stateRegion: 'TX', countryCode: 'US', launchStatus: 'ACTIVE' });
    }
  });

  it('stores no coordinates anywhere in the location tables', async () => {
    const result = await db.execute<{ column_name: string }>(
      sql`SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name IN ('metros', 'cities', 'user_locations')`,
    );
    const columns = result.rows.map((r) => r.column_name);
    for (const forbidden of ['latitude', 'longitude', 'location', 'geom', 'point']) {
      expect(columns).not.toContain(forbidden);
    }
  });

  it('accepts a consistent manual location, one row per user', async () => {
    const user = await newUser('+12145550601');
    await db.insert(userLocations).values(manual(user.id, await city('Frisco')));
    expect(
      await sqlState(db.insert(userLocations).values(manual(user.id, await city('Plano')))),
    ).toBe('23505');
  });

  it('rejects a metro or country that does not match the city (composite FK)', async () => {
    const user = await newUser('+12145550602');
    const frisco = await city('Frisco');
    const [other] = await db
      .insert(metros)
      .values({
        code: 'ZZFK',
        name: 'FK test',
        countryCode: 'US',
        timezone: 'UTC',
        launchStatus: 'FUTURE',
      })
      .returning();
    if (other === undefined) throw new Error('fixture metro');
    try {
      expect(
        await sqlState(
          db.insert(userLocations).values(manual(user.id, frisco, { metroId: other.id })),
        ),
      ).toBe('23503');
      expect(
        await sqlState(
          db.insert(userLocations).values(manual(user.id, frisco, { countryCode: 'IN' })),
        ),
      ).toBe('23503');
      // A city's country must match its metro's country.
      expect(
        await sqlState(
          db.insert(cities).values({
            metroId: (await dfw()).id,
            name: 'Elsewhere',
            stateRegion: 'MH',
            countryCode: 'IN',
            launchStatus: 'ACTIVE',
          }),
        ),
      ).toBe('23503');
    } finally {
      await db.delete(metros).where(eq(metros.id, other.id));
    }
  });

  it('allows only MANUAL_CITY / MANUAL in this slice', async () => {
    const user = await newUser('+12145550603');
    const frisco = await city('Frisco');
    for (const overrides of [
      { precisionType: 'DEVICE' },
      { precisionType: 'APPROXIMATE' },
      { source: 'GPS' },
      { source: 'IP_APPROXIMATION' },
    ]) {
      expect(
        await sqlState(db.insert(userLocations).values(manual(user.id, frisco, overrides))),
      ).toBe('23514');
    }
  });

  it('enforces reference-data shape: unique city per region, valid codes and statuses', async () => {
    const metroId = (await dfw()).id;
    const base = { metroId, stateRegion: 'TX', countryCode: 'US', launchStatus: 'ACTIVE' };
    expect(await sqlState(db.insert(cities).values({ ...base, name: 'Frisco' }))).toBe('23505');
    expect(await sqlState(db.insert(cities).values({ ...base, name: '  ' }))).toBe('23514');
    expect(
      await sqlState(db.insert(cities).values({ ...base, name: 'Nowhere', launchStatus: 'OPEN' })),
    ).toBe('23514');
    expect(
      await sqlState(
        db.insert(metros).values({
          code: 'dfw2',
          name: 'Lower',
          countryCode: 'US',
          timezone: 'UTC',
          launchStatus: 'ACTIVE',
        }),
      ),
    ).toBe('23514');
    expect(
      await sqlState(
        db.insert(metros).values({
          code: 'DFW',
          name: 'Duplicate',
          countryCode: 'US',
          timezone: 'UTC',
          launchStatus: 'ACTIVE',
        }),
      ),
    ).toBe('23505');
  });
});

describe('intent_options / user_intents / dating_consents', () => {
  const newUser = async (phone: string) => {
    const [row] = await db
      .insert(users)
      .values(userValues({ phoneE164: phone, onboardingStep: 'INTENT' }))
      .returning();
    if (row === undefined) throw new Error('user insert failed');
    return row;
  };
  const consent = (
    userId: string,
    overrides: Partial<typeof datingConsents.$inferInsert> = {},
  ): typeof datingConsents.$inferInsert => ({
    userId,
    policyVersion: 'dating-draft-2026-10-v0',
    source: 'ONBOARDING',
    consentedAt: new Date('2026-10-06T12:00:00Z'),
    ...overrides,
  });

  it('seeds four top-level intents and two dating sub-intents', async () => {
    const rows = await db.select().from(intentOptions);
    const shape = rows.map((r) => `${r.code}:${r.parentCode ?? '-'}`).sort();
    expect(shape).toEqual(
      [
        'ACTIVITIES:-',
        'CASUAL_DATING:DATING',
        'DATING:-',
        'FRIENDSHIP:-',
        'NETWORKING:-',
        'SERIOUS_RELATIONSHIP:DATING',
      ].sort(),
    );
    expect(rows.every((r) => r.active)).toBe(true);
  });

  it('rejects a self-parented or unknown-parent option', async () => {
    const base = { label: 'X', displayOrder: 9 };
    expect(
      await sqlState(
        db.insert(intentOptions).values({ ...base, code: 'LOOP', parentCode: 'LOOP' }),
      ),
    ).toBe('23514');
    expect(
      await sqlState(
        db.insert(intentOptions).values({ ...base, code: 'ORPHAN', parentCode: 'NOPE' }),
      ),
    ).toBe('23503');
  });

  it('keeps user_intents consistent: one row per (user, intent), active ⇔ not deselected', async () => {
    const user = await newUser('+12145550701');
    const at = new Date('2026-10-06T12:00:00Z');
    await db
      .insert(userIntents)
      .values({ userId: user.id, intentCode: 'FRIENDSHIP', active: true, selectedAt: at });
    expect(
      await sqlState(
        db
          .insert(userIntents)
          .values({ userId: user.id, intentCode: 'FRIENDSHIP', active: true, selectedAt: at }),
      ),
    ).toBe('23505');
    expect(
      await sqlState(
        db
          .insert(userIntents)
          .values({ userId: user.id, intentCode: 'ACTIVITIES', active: false, selectedAt: at }),
      ),
    ).toBe('23514');
    expect(
      await sqlState(
        db.insert(userIntents).values({
          userId: user.id,
          intentCode: 'NETWORKING',
          active: true,
          selectedAt: at,
          deselectedAt: at,
        }),
      ),
    ).toBe('23514');
    expect(
      await sqlState(
        db
          .insert(userIntents)
          .values({ userId: user.id, intentCode: 'HOOKUP', active: true, selectedAt: at }),
      ),
    ).toBe('23503');
  });

  it('allows at most one active consent per user, with unlimited revoked history', async () => {
    const user = await newUser('+12145550702');
    const revokedAt = new Date('2026-10-06T13:00:00Z');
    await db.insert(datingConsents).values(consent(user.id, { revokedAt }));
    await db.insert(datingConsents).values(consent(user.id, { revokedAt }));
    await db.insert(datingConsents).values(consent(user.id));
    expect(await sqlState(db.insert(datingConsents).values(consent(user.id)))).toBe('23505');
  });

  it('validates consent source, version format and revocation order', async () => {
    const user = await newUser('+12145550703');
    expect(
      await sqlState(db.insert(datingConsents).values(consent(user.id, { source: 'INFERRED' }))),
    ).toBe('23514');
    expect(
      await sqlState(
        db.insert(datingConsents).values(consent(user.id, { policyVersion: 'has spaces' })),
      ),
    ).toBe('23514');
    expect(
      await sqlState(
        db
          .insert(datingConsents)
          .values(consent(user.id, { revokedAt: new Date('2026-10-06T11:00:00Z') })),
      ),
    ).toBe('23514');
  });
});
