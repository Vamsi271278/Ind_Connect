import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  errorEnvelopeSchema,
  interestCatalogResponseSchema,
  languageListResponseSchema,
  myInterestsResponseSchema,
  myLanguagesResponseSchema,
  selfUserSchema,
} from '@project-connect/api-contracts';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ONBOARDING_PROGRESS } from '../../src/modules/identity/api/tokens.js';
import type { OnboardingProgressService } from '../../src/modules/identity/application/onboarding-progress.service.js';
import { DATABASE, type Database } from '../../src/shared/database/database.module.js';
import {
  cities,
  interests,
  languages,
  userInterests,
  userLanguages,
  users,
} from '../../src/shared/database/schema/index.js';
import { signUpOverHttp, waitForApp } from '../support/http-signup.js';
import { resetDatabase, resetRedis } from '../support/integration-db.js';
import { createTestApp } from '../support/test-app.js';

const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;
const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;

let app: NestExpressApplication;
let close: () => Promise<void>;
let db: Database;

beforeAll(async () => {
  ({ app, close } = await createTestApp());
  await waitForApp(app);
  db = app.get<Database>(DATABASE);
});
afterAll(async () => {
  await close();
});
beforeEach(async () => {
  await resetDatabase(db);
  await resetRedis(process.env.REDIS_URL ?? '');
});

const api = () => request(app.getHttpServer());

/** Signs up and completes NAME → GENDER → LOCATION → INTENT, parking at LANGUAGE. */
async function signUpAtLanguage(phone: string) {
  const user = await signUpOverHttp(app, phone);
  const auth = { Authorization: user.bearer };
  await api()
    .patch('/api/v1/users/me/profile')
    .set(auth)
    .send({ firstName: 'Ananya', genderCode: 'WOMAN' })
    .expect(200);
  const [plano] = await db.select({ id: cities.id }).from(cities).where(eq(cities.name, 'Plano'));
  await api().patch('/api/v1/users/me/location').set(auth).send({ cityId: plano?.id }).expect(200);
  await api()
    .put('/api/v1/users/me/intents')
    .set(auth)
    .send({ intents: ['FRIENDSHIP'] })
    .expect(200);
  return user;
}

const putLanguages = (bearer: string, codes: string[]) =>
  api().put('/api/v1/users/me/languages').set('Authorization', bearer).send({ languages: codes });
const putInterests = (bearer: string, codes: string[]) =>
  api().put('/api/v1/users/me/interests').set('Authorization', bearer).send({ interests: codes });

const stepOf = async (userId: string) =>
  (await db.select({ step: users.onboardingStep }).from(users).where(eq(users.id, userId)))[0]
    ?.step;
const languagesOf = async (userId: string) =>
  (
    await db
      .select({ code: userLanguages.languageCode })
      .from(userLanguages)
      .where(eq(userLanguages.userId, userId))
  )
    .map((r) => r.code)
    .sort();
const interestsOf = async (userId: string) =>
  (
    await db
      .select({ code: interests.code })
      .from(userInterests)
      .innerJoin(interests, eq(interests.id, userInterests.interestId))
      .where(eq(userInterests.userId, userId))
  )
    .map((r) => r.code)
    .sort();

const THREE = ['BADMINTON', 'TELUGU_MOVIES', 'HIKING'];

describe('GET catalogs', () => {
  it('serves the 12 languages in screen-spec order and 6 categories / 38 interests by code', async () => {
    const { bearer } = await signUpOverHttp(app, '+12145550801');
    const langs = languageListResponseSchema.parse(
      dataOf(
        (await api().get('/api/v1/profile/languages').set('Authorization', bearer).expect(200))
          .body,
      ),
    );
    expect(langs.languages.map((l) => l.code)).toEqual([
      'en',
      'te',
      'ta',
      'kn',
      'hi',
      'ml',
      'gu',
      'pa',
      'bn',
      'mr',
      'ur',
      'or',
    ]);
    const catalog = interestCatalogResponseSchema.parse(
      dataOf(
        (await api().get('/api/v1/profile/interests').set('Authorization', bearer).expect(200))
          .body,
      ),
    );
    expect(catalog.categories.map((c) => [c.code, c.interests.length])).toEqual([
      ['SPORTS', 8],
      ['ENTERTAINMENT', 8],
      ['LIFESTYLE', 7],
      ['OUTDOORS', 3],
      ['CULTURE', 6],
      ['PROFESSIONAL', 6],
    ]);
    expect(JSON.stringify(catalog)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    expect(catalog.categories[0]?.interests.at(-1)).toEqual({
      code: 'GYM_FITNESS',
      label: 'Gym & fitness',
    });
  });
});

describe('PUT /users/me/languages', () => {
  it('is rejected before LANGUAGE', async () => {
    const { userId, bearer } = await signUpOverHttp(app, '+12145550802');
    expect(errorCodeOf((await putLanguages(bearer, ['en']).expect(409)).body)).toBe(
      'ONBOARDING_STEP_NOT_REACHED',
    );
    expect(await languagesOf(userId)).toEqual([]);
  });

  it('at LANGUAGE saves and advances to INTERESTS; later edits replace, never rewind', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550803');
    const body = myLanguagesResponseSchema.parse(
      dataOf((await putLanguages(bearer, ['te', 'en']).expect(200)).body),
    );
    expect(body).toEqual({
      languages: [
        { code: 'en', displayName: 'English' },
        { code: 'te', displayName: 'Telugu' },
      ],
      onboarding: { status: 'IN_PROGRESS', step: 'INTERESTS' },
    });
    await putLanguages(bearer, ['hi']).expect(200);
    expect(await languagesOf(userId)).toEqual(['hi']);
    expect(await stepOf(userId)).toBe('INTERESTS');
  });

  it('is atomic: an unknown or inactive code fails the save and keeps the previous set', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550804');
    await putLanguages(bearer, ['en', 'te']).expect(200);
    await db.update(languages).set({ active: false }).where(eq(languages.code, 'ur'));
    try {
      for (const codes of [['ta', 'xx'], ['ta', 'ur'], [], ['en', 'en']]) {
        expect(errorCodeOf((await putLanguages(bearer, codes).expect(400)).body)).toBe(
          'VALIDATION_FAILED',
        );
      }
    } finally {
      await db.update(languages).set({ active: true }).where(eq(languages.code, 'ur'));
    }
    expect(await languagesOf(userId)).toEqual(['en', 'te']);
  });
});

describe('PUT /users/me/interests', () => {
  it('is rejected before INTERESTS', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550805');
    expect(errorCodeOf((await putInterests(bearer, THREE).expect(409)).body)).toBe(
      'ONBOARDING_STEP_NOT_REACHED',
    );
    expect(await interestsOf(userId)).toEqual([]);
  });

  it('at INTERESTS saves by code and advances to PHOTO; minimum 3 on every save', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550806');
    await putLanguages(bearer, ['en']).expect(200);
    const body = myInterestsResponseSchema.parse(
      dataOf((await putInterests(bearer, THREE).expect(200)).body),
    );
    expect(body.onboarding).toEqual({ status: 'IN_PROGRESS', step: 'PHOTO' });
    expect(body.interests).toEqual([
      { code: 'BADMINTON', label: 'Badminton', categoryCode: 'SPORTS' },
      { code: 'TELUGU_MOVIES', label: 'Telugu movies', categoryCode: 'ENTERTAINMENT' },
      { code: 'HIKING', label: 'Hiking', categoryCode: 'OUTDOORS' },
    ]);
    expect(
      errorCodeOf((await putInterests(bearer, ['BADMINTON', 'HIKING']).expect(400)).body),
    ).toBe('VALIDATION_FAILED');
    await putInterests(bearer, ['CRICKET', 'COFFEE', 'STARTUPS', 'HIKING']).expect(200);
    expect(await interestsOf(userId)).toEqual(['COFFEE', 'CRICKET', 'HIKING', 'STARTUPS']);
    expect(await stepOf(userId)).toBe('PHOTO');
  });

  it('is atomic on an unknown or withdrawn interest', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550807');
    await putLanguages(bearer, ['en']).expect(200);
    await putInterests(bearer, THREE).expect(200);
    await db.update(interests).set({ active: false }).where(eq(interests.code, 'CAMPING'));
    try {
      for (const codes of [
        ['CRICKET', 'COFFEE', 'CHESS'],
        ['CRICKET', 'COFFEE', 'CAMPING'],
      ]) {
        expect(errorCodeOf((await putInterests(bearer, codes).expect(400)).body)).toBe(
          'VALIDATION_FAILED',
        );
      }
    } finally {
      await db.update(interests).set({ active: true }).where(eq(interests.code, 'CAMPING'));
    }
    expect(await interestsOf(userId)).toEqual([...THREE].sort());
  });

  it('rolls back the selection if the onboarding update fails (one transaction)', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550808');
    await putLanguages(bearer, ['en']).expect(200);
    const onboarding = app.get<OnboardingProgressService>(ONBOARDING_PROGRESS);
    const spy = vi
      .spyOn(onboarding, 'recordStepProgress')
      .mockRejectedValueOnce(new Error('simulated'));
    try {
      expect(errorCodeOf((await putInterests(bearer, THREE).expect(500)).body)).toBe(
        'INTERNAL_ERROR',
      );
    } finally {
      spy.mockRestore();
    }
    expect(await interestsOf(userId)).toEqual([]);
    expect(await stepOf(userId)).toBe('INTERESTS');
  });
});

describe('concurrency', () => {
  it('concurrent full-set saves never mix: the result is exactly one requested set', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550809');
    await putLanguages(bearer, ['en']).expect(200);
    const a = ['CRICKET', 'TENNIS', 'SOCCER'];
    const b = ['HIKING', 'CAMPING', 'CYCLING'];
    for (let round = 0; round < 5; round += 1) {
      const results = await Promise.all([putInterests(bearer, a), putInterests(bearer, b)]);
      expect(results.map((r) => r.status)).toEqual([200, 200]);
      const saved = await interestsOf(userId);
      expect([[...a].sort(), [...b].sort()]).toContainEqual(saved);
    }
    expect(await stepOf(userId)).toBe('PHOTO');
  });

  it('concurrent language saves advance the step exactly once', async () => {
    const { userId, bearer } = await signUpAtLanguage('+12145550810');
    const results = await Promise.all([
      putLanguages(bearer, ['en']),
      putLanguages(bearer, ['te', 'ta']),
      putLanguages(bearer, ['hi']),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(await stepOf(userId)).toBe('INTERESTS');
    expect([['en'], ['ta', 'te'], ['hi']]).toContainEqual(await languagesOf(userId));
  });
});

describe('GET /users/me', () => {
  it('restores saved languages and interests by code and label only', async () => {
    const { bearer } = await signUpAtLanguage('+12145550811');
    await putLanguages(bearer, ['te', 'en']).expect(200);
    await putInterests(bearer, THREE).expect(200);
    const response = await api().get('/api/v1/users/me').set('Authorization', bearer).expect(200);
    const me = selfUserSchema.parse(dataOf(response.body));
    expect(me.languages.map((l) => l.code)).toEqual(['en', 'te']);
    expect(me.interests).toEqual([
      { code: 'BADMINTON', label: 'Badminton', categoryCode: 'SPORTS' },
      { code: 'TELUGU_MOVIES', label: 'Telugu movies', categoryCode: 'ENTERTAINMENT' },
      { code: 'HIKING', label: 'Hiking', categoryCode: 'OUTDOORS' },
    ]);
    const ids = (
      await db.select({ id: interests.id }).from(interests).where(inArray(interests.code, THREE))
    ).map((r) => r.id);
    for (const id of ids) expect(JSON.stringify(response.body)).not.toContain(id);
  });
});
