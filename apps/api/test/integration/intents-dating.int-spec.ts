import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  datingConsentResponseSchema,
  errorEnvelopeSchema,
  intentOptionsResponseSchema,
  myIntentsResponseSchema,
  selfUserSchema,
} from '@project-connect/api-contracts';
import { and, eq, isNull } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { DATING_INTENT_WRITER } from '../../src/modules/profile/api/tokens.js';
import type { DatingIntentWriter } from '../../src/modules/profile/application/intent.service.js';
import { DATABASE, type Database } from '../../src/shared/database/database.module.js';
import {
  cities,
  datingConsents,
  userIntents,
  users,
} from '../../src/shared/database/schema/index.js';
import { signUpOverHttp, waitForApp } from '../support/http-signup.js';
import { resetDatabase, resetRedis } from '../support/integration-db.js';
import { createTestApp } from '../support/test-app.js';

const VERSION = 'dating-draft-2026-10-v0';
const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;
const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;

/** Boots the real app with the Dating kill switch set as given. */
async function bootApp(datingEnabled: boolean) {
  process.env.DATING_ENABLED = String(datingEnabled);
  if (datingEnabled) process.env.DATING_POLICY_VERSION = VERSION;
  else delete process.env.DATING_POLICY_VERSION;
  const booted = await createTestApp();
  await waitForApp(booted.app);
  return booted;
}

let app: NestExpressApplication;
let close: () => Promise<void>;
let db: Database;

beforeAll(async () => {
  ({ app, close } = await bootApp(true));
  db = app.get<Database>(DATABASE);
});
afterAll(async () => {
  await close();
});
beforeEach(async () => {
  await resetDatabase(db);
  await resetRedis(process.env.REDIS_URL ?? '');
});

const api = (target: NestExpressApplication = app) => request(target.getHttpServer());

/** Signs up and completes NAME, GENDER and LOCATION, parking the user at INTENT. */
async function signUpAtIntent(phone: string, target: NestExpressApplication = app) {
  const user = await signUpOverHttp(target, phone);
  await api(target)
    .patch('/api/v1/users/me/profile')
    .set('Authorization', user.bearer)
    .send({ firstName: 'Ananya', genderCode: 'WOMAN' })
    .expect(200);
  const [plano] = await db.select({ id: cities.id }).from(cities).where(eq(cities.name, 'Plano'));
  await api(target)
    .patch('/api/v1/users/me/location')
    .set('Authorization', user.bearer)
    .send({ cityId: plano?.id })
    .expect(200);
  return user;
}

const putIntents = (bearer: string, intents: string[], target?: NestExpressApplication) =>
  api(target).put('/api/v1/users/me/intents').set('Authorization', bearer).send({ intents });
const putConsent = (bearer: string, policyVersion = VERSION, target?: NestExpressApplication) =>
  api(target)
    .put('/api/v1/users/me/dating/consent')
    .set('Authorization', bearer)
    .send({ policyVersion });
const deleteConsent = (bearer: string, target?: NestExpressApplication) =>
  api(target).delete('/api/v1/users/me/dating/consent').set('Authorization', bearer);

const stepOf = async (userId: string) =>
  (await db.select({ step: users.onboardingStep }).from(users).where(eq(users.id, userId)))[0]
    ?.step;
const activeIntentsOf = async (userId: string) =>
  (
    await db
      .select({ code: userIntents.intentCode })
      .from(userIntents)
      .where(and(eq(userIntents.userId, userId), eq(userIntents.active, true)))
  )
    .map((r) => r.code)
    .sort();
const consentsOf = (userId: string) =>
  db.select().from(datingConsents).where(eq(datingConsents.userId, userId));

/** The invariant: DATING active ⇔ exactly one active consent. */
async function expectInvariant(userId: string) {
  const datingActive = (await activeIntentsOf(userId)).includes('DATING');
  const active = await db
    .select({ id: datingConsents.id })
    .from(datingConsents)
    .where(and(eq(datingConsents.userId, userId), isNull(datingConsents.revokedAt)));
  expect(active.length).toBeLessThanOrEqual(1);
  expect(datingActive).toBe(active.length === 1);
}

describe('GET /profile/intents (Dating on)', () => {
  it('lists the four top-level options and the served policy version, never sub-intents', async () => {
    const { bearer } = await signUpOverHttp(app, '+12145550501');
    const body = intentOptionsResponseSchema.parse(
      dataOf(
        (await api().get('/api/v1/profile/intents').set('Authorization', bearer).expect(200)).body,
      ),
    );
    expect(body.options.map((o) => o.code)).toEqual([
      'FRIENDSHIP',
      'ACTIVITIES',
      'NETWORKING',
      'DATING',
    ]);
    expect(body.dating).toEqual({ policyVersion: VERSION });
  });
});

describe('PUT /users/me/intents', () => {
  it('is rejected before INTENT and stores nothing', async () => {
    const { userId, bearer } = await signUpOverHttp(app, '+12145550502');
    expect(errorCodeOf((await putIntents(bearer, ['FRIENDSHIP']).expect(409)).body)).toBe(
      'ONBOARDING_STEP_NOT_REACHED',
    );
    expect(await activeIntentsOf(userId)).toEqual([]);
  });

  it('at INTENT saves and advances to LANGUAGE; later edits never rewind', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550503');
    const first = myIntentsResponseSchema.parse(
      dataOf((await putIntents(bearer, ['FRIENDSHIP', 'NETWORKING']).expect(200)).body),
    );
    expect(first).toEqual({
      activeIntents: ['FRIENDSHIP', 'NETWORKING'],
      onboarding: { status: 'IN_PROGRESS', step: 'LANGUAGE' },
    });
    await putIntents(bearer, ['ACTIVITIES']).expect(200);
    expect(await activeIntentsOf(userId)).toEqual(['ACTIVITIES']);
    expect(await stepOf(userId)).toBe('LANGUAGE');
    // Deselected rows are kept as inactive history.
    const rows = await db.select().from(userIntents).where(eq(userIntents.userId, userId));
    expect(
      rows
        .filter((r) => !r.active)
        .map((r) => r.intentCode)
        .sort(),
    ).toEqual(['FRIENDSHIP', 'NETWORKING']);
  });

  it('never accepts DATING, sub-intents or extra fields; requires at least one intent', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550504');
    for (const intents of [['DATING'], ['CASUAL_DATING'], ['FRIENDSHIP', 'FRIENDSHIP']]) {
      expect(errorCodeOf((await putIntents(bearer, intents).expect(400)).body)).toBe(
        'VALIDATION_FAILED',
      );
    }
    expect(errorCodeOf((await putIntents(bearer, []).expect(422)).body)).toBe('INTENT_REQUIRED');
    expect(await stepOf(userId)).toBe('INTENT');
    expect(await activeIntentsOf(userId)).toEqual([]);
  });
});

describe('PUT/DELETE /users/me/dating/consent', () => {
  it('opt-in records consent and activates DATING atomically; repeat is idempotent', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550505');
    const response = await putConsent(bearer).expect(200);
    expect(datingConsentResponseSchema.parse(dataOf(response.body))).toEqual({
      datingEnabled: true,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/policy|consentedAt|source/i);
    await putConsent(bearer).expect(200);

    const consents = await consentsOf(userId);
    expect(consents).toHaveLength(1);
    expect(consents[0]).toMatchObject({
      policyVersion: VERSION,
      source: 'ONBOARDING',
      revokedAt: null,
    });
    expect(await activeIntentsOf(userId)).toEqual(['DATING']);
    await expectInvariant(userId);
    // DATING alone satisfies the intent minimum.
    await putIntents(bearer, []).expect(200);
    expect(await stepOf(userId)).toBe('LANGUAGE');
  });

  it('rejects opt-in before INTENT and a stale policy version', async () => {
    const early = await signUpOverHttp(app, '+12145550506');
    expect(errorCodeOf((await putConsent(early.bearer).expect(409)).body)).toBe(
      'ONBOARDING_STEP_NOT_REACHED',
    );
    const ready = await signUpAtIntent('+12145550507');
    expect(errorCodeOf((await putConsent(ready.bearer, 'dating-old-v0').expect(409)).body)).toBe(
      'DATING_POLICY_OUTDATED',
    );
    for (const user of [early, ready]) {
      expect(await consentsOf(user.userId)).toHaveLength(0);
      await expectInvariant(user.userId);
    }
  });

  it('opt-out revokes and deactivates atomically, keeps history and is idempotent', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550508');
    await putConsent(bearer).expect(200);
    await putIntents(bearer, []).expect(200);
    await deleteConsent(bearer).expect(204);
    await deleteConsent(bearer).expect(204);

    const consents = await consentsOf(userId);
    expect(consents).toHaveLength(1);
    expect(consents[0]?.revokedAt).not.toBeNull();
    // Dating was the only intent: zero intents allowed, onboarding not rewound.
    expect(await activeIntentsOf(userId)).toEqual([]);
    expect(await stepOf(userId)).toBe('LANGUAGE');
    await expectInvariant(userId);

    // Opting in again appends a new record; history stays.
    await putConsent(bearer).expect(200);
    expect(await consentsOf(userId)).toHaveLength(2);
    await expectInvariant(userId);
  });

  it('a suspended account cannot opt in but can always opt out', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550509');
    await putConsent(bearer).expect(200);
    await db.update(users).set({ accountStatus: 'SUSPENDED' }).where(eq(users.id, userId));
    expect(errorCodeOf((await putConsent(bearer).expect(403)).body)).toBe('ACCOUNT_NOT_ACTIVE');
    await deleteConsent(bearer).expect(204);
    expect(await activeIntentsOf(userId)).toEqual([]);
    await expectInvariant(userId);
  });

  it('rolls back the consent when activating DATING fails (never consent without DATING)', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550510');
    const writer = app.get<DatingIntentWriter>(DATING_INTENT_WRITER);
    const spy = vi.spyOn(writer, 'activateDating').mockRejectedValueOnce(new Error('simulated'));
    try {
      expect(errorCodeOf((await putConsent(bearer).expect(500)).body)).toBe('INTERNAL_ERROR');
    } finally {
      spy.mockRestore();
    }
    expect(await consentsOf(userId)).toHaveLength(0);
    await expectInvariant(userId);
  });

  it('rolls back the revocation when deactivating DATING fails (never DATING without consent)', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550511');
    await putConsent(bearer).expect(200);
    const writer = app.get<DatingIntentWriter>(DATING_INTENT_WRITER);
    const spy = vi.spyOn(writer, 'deactivateDating').mockRejectedValueOnce(new Error('simulated'));
    try {
      await deleteConsent(bearer).expect(500);
    } finally {
      spy.mockRestore();
    }
    expect((await consentsOf(userId))[0]?.revokedAt).toBeNull();
    expect(await activeIntentsOf(userId)).toEqual(['DATING']);
    await expectInvariant(userId);
  });
});

describe('withdrawal under clock skew', () => {
  it('still succeeds when the consent was recorded by a server whose clock ran ahead', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550518');
    // Recorded "in the future" relative to this server's clock (another task ahead by 1 min).
    const ahead = new Date(Date.now() + 60_000);
    await db.insert(datingConsents).values({
      userId,
      policyVersion: VERSION,
      source: 'ONBOARDING',
      consentedAt: ahead,
    });
    await db
      .insert(userIntents)
      .values({ userId, intentCode: 'DATING', active: true, selectedAt: ahead });
    await deleteConsent(bearer).expect(204);
    expect(await activeIntentsOf(userId)).toEqual([]);
    expect((await consentsOf(userId))[0]?.revokedAt?.getTime()).toBeGreaterThanOrEqual(
      ahead.getTime(),
    );
    await expectInvariant(userId);
  });
});

describe('concurrency', () => {
  it('parallel opt-ins create exactly one consent', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550512');
    const results = await Promise.all([putConsent(bearer), putConsent(bearer), putConsent(bearer)]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(await consentsOf(userId)).toHaveLength(1);
    await expectInvariant(userId);
  });

  it('racing opt-in and opt-out always end in a consistent state', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550513');
    for (let round = 0; round < 5; round += 1) {
      const results = await Promise.all([putConsent(bearer), deleteConsent(bearer)]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 204]);
      await expectInvariant(userId);
    }
  });

  it('racing intent saves and an opt-in keep both changes and advance once', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550514');
    const results = await Promise.all([
      putIntents(bearer, ['FRIENDSHIP']),
      putConsent(bearer),
      putIntents(bearer, ['FRIENDSHIP', 'ACTIVITIES']),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    const active = await activeIntentsOf(userId);
    expect(active).toContain('DATING');
    expect(active).toContain('FRIENDSHIP');
    expect(await stepOf(userId)).toBe('LANGUAGE');
    await expectInvariant(userId);
  });
});

describe('GET /users/me self projection', () => {
  it('restores saved city and intents with a dating boolean only', async () => {
    const { bearer } = await signUpAtIntent('+12145550515');
    await putConsent(bearer).expect(200);
    await putIntents(bearer, ['FRIENDSHIP']).expect(200);
    const response = await api().get('/api/v1/users/me').set('Authorization', bearer).expect(200);
    const me = selfUserSchema.parse(dataOf(response.body));
    expect(me).toMatchObject({
      location: { city: { name: 'Plano', metro: { code: 'DFW' } } },
      activeIntents: ['FRIENDSHIP', 'DATING'],
      datingEnabled: true,
    });
    const raw = JSON.stringify(response.body);
    for (const forbidden of [
      VERSION,
      'policyVersion',
      'consentedAt',
      'revokedAt',
      'ONBOARDING',
      'latitude',
    ]) {
      expect(raw).not.toContain(forbidden);
    }
  });
});

describe('kill switch off', () => {
  let offApp: NestExpressApplication;
  let closeOff: () => Promise<void>;

  beforeAll(async () => {
    ({ app: offApp, close: closeOff } = await bootApp(false));
  });
  afterAll(async () => {
    await closeOff();
  });

  it('hides DATING and the policy version from the options', async () => {
    const { bearer } = await signUpOverHttp(offApp, '+12145550516');
    const body = intentOptionsResponseSchema.parse(
      dataOf(
        (await api(offApp).get('/api/v1/profile/intents').set('Authorization', bearer).expect(200))
          .body,
      ),
    );
    expect(body.options.map((o) => o.code)).toEqual(['FRIENDSHIP', 'ACTIVITIES', 'NETWORKING']);
    expect(body.dating).toBeNull();
  });

  it('rejects opt-in, but opt-out of an earlier consent still works', async () => {
    const { userId, bearer } = await signUpAtIntent('+12145550517', offApp);
    expect(errorCodeOf((await putConsent(bearer, VERSION, offApp).expect(403)).body)).toBe(
      'DATING_NOT_ELIGIBLE',
    );
    expect(await consentsOf(userId)).toHaveLength(0);

    // Consent given while the switch was on (simulated directly), then switched off.
    const now = new Date();
    await db.insert(datingConsents).values({
      id: randomUUID(),
      userId,
      policyVersion: VERSION,
      source: 'ONBOARDING',
      consentedAt: now,
    });
    await db
      .insert(userIntents)
      .values({ userId, intentCode: 'DATING', active: true, selectedAt: now });
    await deleteConsent(bearer, offApp).expect(204);
    expect(await activeIntentsOf(userId)).toEqual([]);
    await expectInvariant(userId);
  });
});
