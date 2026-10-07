import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  cityListResponseSchema,
  errorEnvelopeSchema,
  myLocationResponseSchema,
  otpVerifyResponseSchema,
  registrationResponseSchema,
} from '@project-connect/api-contracts';
import { eq, inArray, sql } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ONBOARDING_PROGRESS } from '../../src/modules/identity/api/tokens.js';
import type { OnboardingProgressService } from '../../src/modules/identity/application/onboarding-progress.service.js';
import { DATABASE, type Database } from '../../src/shared/database/database.module.js';
import { cities, metros, userLocations, users } from '../../src/shared/database/schema/index.js';
import { resetDatabase, resetRedis } from '../support/integration-db.js';
import { createTestApp } from '../support/test-app.js';

const CODE = process.env.OTP_FAKE_CODE ?? '';
const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;
const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const APPROVED_DFW_CITIES = [
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
];

let app: NestExpressApplication;
let close: () => Promise<void>;
let logs: string[];
let db: Database;
/** Test-only reference rows for non-selectable states; removed in afterAll. */
const fixture = { metroIds: [] as string[], cityIds: {} as Record<string, string> };

beforeAll(async () => {
  ({ app, close, logs } = await createTestApp());
  db = app.get<Database>(DATABASE);
  for (let i = 0; i < 50; i += 1) {
    const probe = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone: '+12145559998', installId: randomUUID() });
    if (probe.status !== 503) break;
    await sleep(100);
  }

  const [dfw] = await db.select({ id: metros.id }).from(metros).where(eq(metros.code, 'DFW'));
  if (dfw === undefined) throw new Error('DFW seed missing');
  const [waitlistMetro] = await db
    .insert(metros)
    .values({
      code: 'ZZTEST',
      name: 'Test Waitlist Metro',
      countryCode: 'US',
      timezone: 'America/Chicago',
      launchStatus: 'WAITLIST',
    })
    .returning({ id: metros.id });
  if (waitlistMetro === undefined) throw new Error('fixture metro');
  fixture.metroIds.push(waitlistMetro.id);
  const rows = await db
    .insert(cities)
    .values([
      {
        metroId: dfw.id,
        name: 'ZZ Waitlist',
        stateRegion: 'TX',
        countryCode: 'US',
        launchStatus: 'WAITLIST',
      },
      {
        metroId: dfw.id,
        name: 'ZZ Future',
        stateRegion: 'TX',
        countryCode: 'US',
        launchStatus: 'FUTURE',
      },
      {
        metroId: dfw.id,
        name: 'ZZ Disabled',
        stateRegion: 'TX',
        countryCode: 'US',
        launchStatus: 'DISABLED',
      },
      {
        metroId: waitlistMetro.id,
        name: 'ZZ Active In Waitlist Metro',
        stateRegion: 'TX',
        countryCode: 'US',
        launchStatus: 'ACTIVE',
      },
    ])
    .returning({ id: cities.id, name: cities.name });
  for (const row of rows) fixture.cityIds[row.name] = row.id;
});
afterAll(async () => {
  await resetDatabase(db);
  await db.delete(cities).where(inArray(cities.id, Object.values(fixture.cityIds)));
  await db.delete(metros).where(inArray(metros.id, fixture.metroIds));
  await close();
});
beforeEach(async () => {
  await resetDatabase(db);
  await resetRedis(process.env.REDIS_URL ?? '');
});

const api = () => request(app.getHttpServer());

async function signUp(phone: string) {
  const installId = randomUUID();
  const device = { platform: 'android', appVersion: '1.0.0', osVersion: '15', installId };
  await api().post('/api/v1/auth/otp/request').send({ phone, installId }).expect(202);
  const verified = otpVerifyResponseSchema.parse(
    dataOf(
      (
        await api()
          .post('/api/v1/auth/otp/verify')
          .set('Idempotency-Key', randomUUID())
          .send({ phone, code: CODE, device })
          .expect(200)
      ).body,
    ),
  );
  if (verified.result !== 'registration_required') throw new Error('expected new phone');
  const registered = registrationResponseSchema.parse(
    dataOf(
      (
        await api()
          .post('/api/v1/auth/registrations')
          .set('Idempotency-Key', randomUUID())
          .send({
            registrationToken: verified.registrationToken,
            dateOfBirth: '1992-03-04',
            device,
          })
          .expect(201)
      ).body,
    ),
  );
  return { userId: registered.account.userId, bearer: `Bearer ${registered.session.accessToken}` };
}

/** Signs up and completes NAME + GENDER, parking the user at LOCATION. */
async function signUpAtLocation(phone: string) {
  const user = await signUp(phone);
  await api()
    .patch('/api/v1/users/me/profile')
    .set('Authorization', user.bearer)
    .send({ firstName: 'Ananya', genderCode: 'WOMAN' })
    .expect(200);
  return user;
}

const patchLocation = (bearer: string, body: object) =>
  api().patch('/api/v1/users/me/location').set('Authorization', bearer).send(body);

const cityId = async (name: string) => {
  const [row] = await db.select({ id: cities.id }).from(cities).where(eq(cities.name, name));
  if (row === undefined) throw new Error(`no city ${name}`);
  return row.id;
};
const stepOf = async (userId: string) =>
  (await db.select({ step: users.onboardingStep }).from(users).where(eq(users.id, userId)))[0]
    ?.step;
const locationRows = (userId: string) =>
  db.select().from(userLocations).where(eq(userLocations.userId, userId));

describe('GET /locations/cities', () => {
  it('requires authentication', async () => {
    const response = await api().get('/api/v1/locations/cities').expect(401);
    expect(errorCodeOf(response.body)).toBe('AUTH_REQUIRED');
  });

  it('returns exactly the approved selectable DFW cities, by name, without coordinates', async () => {
    const { bearer } = await signUp('+12145550401');
    const response = await api()
      .get('/api/v1/locations/cities')
      .set('Authorization', bearer)
      .expect(200);
    const { cities: list } = cityListResponseSchema.parse(dataOf(response.body));
    expect(list.map((c) => c.name)).toEqual(APPROVED_DFW_CITIES);
    for (const city of list) {
      expect(city).toMatchObject({
        stateRegion: 'TX',
        countryCode: 'US',
        launchStatus: 'ACTIVE',
        metro: { code: 'DFW', name: 'Dallas–Fort Worth' },
      });
    }
    const raw = JSON.stringify(response.body);
    for (const key of ['latitude', 'longitude', 'centroid', 'timezone', 'neighborhood']) {
      expect(raw).not.toContain(key);
    }
  });
});

describe('PATCH /users/me/location', () => {
  it('rejects a user still at NAME or GENDER and stores nothing', async () => {
    const { userId, bearer } = await signUp('+12145550402');
    const atName = await patchLocation(bearer, { cityId: await cityId('Frisco') }).expect(409);
    expect(errorCodeOf(atName.body)).toBe('ONBOARDING_STEP_NOT_REACHED');

    await api()
      .patch('/api/v1/users/me/profile')
      .set('Authorization', bearer)
      .send({ firstName: 'Ravi' })
      .expect(200);
    expect(await stepOf(userId)).toBe('GENDER');
    const atGender = await patchLocation(bearer, { cityId: await cityId('Frisco') }).expect(409);
    expect(errorCodeOf(atGender.body)).toBe('ONBOARDING_STEP_NOT_REACHED');

    expect(await locationRows(userId)).toHaveLength(0);
    expect(await stepOf(userId)).toBe('GENDER');
  });

  it('at LOCATION: stores the server-derived manual location and advances to INTENT', async () => {
    const { userId, bearer } = await signUpAtLocation('+12145550403');
    const frisco = await cityId('Frisco');
    const response = await patchLocation(bearer, { cityId: frisco }).expect(200);
    const body = myLocationResponseSchema.parse(dataOf(response.body));
    expect(body).toMatchObject({
      location: { city: { id: frisco, name: 'Frisco', metro: { code: 'DFW' } } },
      onboarding: { status: 'IN_PROGRESS', step: 'INTENT' },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/latitude|longitude|precision|source/i);

    const [dfw] = await db.select().from(metros).where(eq(metros.code, 'DFW'));
    const rows = await locationRows(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      cityId: frisco,
      metroId: dfw?.id,
      countryCode: 'US',
      precisionType: 'MANUAL_CITY',
      source: 'MANUAL',
    });
    expect(await stepOf(userId)).toBe('INTENT');
  });

  it('after INTENT: the city changes in place and onboarding never rewinds', async () => {
    const { userId, bearer } = await signUpAtLocation('+12145550404');
    await patchLocation(bearer, { cityId: await cityId('Frisco') }).expect(200);
    const second = await patchLocation(bearer, { cityId: await cityId('Fort Worth') }).expect(200);
    expect(myLocationResponseSchema.parse(dataOf(second.body)).onboarding.step).toBe('INTENT');

    const rows = await locationRows(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.cityId).toBe(await cityId('Fort Worth'));
    expect(await stepOf(userId)).toBe('INTENT');
  });

  it('allows a completed ACTIVE account to edit its city without touching onboarding', async () => {
    const { userId, bearer } = await signUp('+12145550405');
    await db
      .update(users)
      .set({ accountStatus: 'ACTIVE', onboardingStatus: 'COMPLETE', onboardingStep: 'COMPLETE' })
      .where(eq(users.id, userId));
    await patchLocation(bearer, { cityId: await cityId('Plano') }).expect(200);
    expect(await stepOf(userId)).toBe('COMPLETE');
  });

  it('rejects client-supplied derived, precise or unknown fields', async () => {
    const { userId, bearer } = await signUpAtLocation('+12145550406');
    const id = await cityId('Plano');
    for (const body of [
      { cityId: id, metroId: randomUUID() },
      { cityId: id, countryCode: 'IN' },
      { cityId: id, precisionType: 'DEVICE' },
      { cityId: id, source: 'GPS' },
      { cityId: id, latitude: 33.1, longitude: -96.8 },
      { cityId: id, launchStatus: 'ACTIVE' },
      { cityName: 'Plano' },
      { cityId: 'Plano' },
      {},
    ]) {
      expect(errorCodeOf((await patchLocation(bearer, body).expect(400)).body)).toBe(
        'VALIDATION_FAILED',
      );
    }
    expect(await locationRows(userId)).toHaveLength(0);
    expect(await stepOf(userId)).toBe('LOCATION');
  });

  it('rejects WAITLIST / FUTURE / DISABLED cities, a non-ACTIVE metro and unknown ids', async () => {
    const { userId, bearer } = await signUpAtLocation('+12145550407');
    for (const id of [...Object.values(fixture.cityIds), randomUUID()]) {
      expect(errorCodeOf((await patchLocation(bearer, { cityId: id }).expect(422)).body)).toBe(
        'CITY_NOT_AVAILABLE',
      );
    }
    expect(await locationRows(userId)).toHaveLength(0);
    expect(await stepOf(userId)).toBe('LOCATION');
  });

  it('rejects a suspended account', async () => {
    const { bearer, userId } = await signUpAtLocation('+12145550408');
    await db.update(users).set({ accountStatus: 'SUSPENDED' }).where(eq(users.id, userId));
    const response = await patchLocation(bearer, { cityId: await cityId('Plano') }).expect(403);
    expect(errorCodeOf(response.body)).toBe('ACCOUNT_NOT_ACTIVE');
    expect(await locationRows(userId)).toHaveLength(0);
  });

  it('rolls back the location write when the onboarding update fails (one transaction)', async () => {
    const { userId, bearer } = await signUpAtLocation('+12145550409');
    const onboarding = app.get<OnboardingProgressService>(ONBOARDING_PROGRESS);
    const spy = vi
      .spyOn(onboarding, 'recordLocationProgress')
      .mockRejectedValueOnce(new Error('simulated'));
    try {
      const response = await patchLocation(bearer, { cityId: await cityId('Plano') }).expect(500);
      expect(errorCodeOf(response.body)).toBe('INTERNAL_ERROR');
    } finally {
      spy.mockRestore();
    }
    expect(await locationRows(userId)).toHaveLength(0);
    expect(await stepOf(userId)).toBe('LOCATION');
  });

  it('serializes concurrent saves: one current row, onboarding advanced once', async () => {
    const { userId, bearer } = await signUpAtLocation('+12145550410');
    const [a, b] = await Promise.all([
      patchLocation(bearer, { cityId: await cityId('Frisco') }),
      patchLocation(bearer, { cityId: await cityId('Plano') }),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(await locationRows(userId)).toHaveLength(1);
    expect(await stepOf(userId)).toBe('INTENT');
  });

  it('never writes city identifiers or names into logs', async () => {
    const { bearer } = await signUpAtLocation('+12145550411');
    const plano = await cityId('Plano');
    logs.length = 0;
    await patchLocation(bearer, { cityId: plano }).expect(200);
    const dump = logs.join('\n');
    expect(dump).not.toContain(plano);
    expect(dump).not.toContain('Plano');
  });

  it('keeps no location history: user_locations is the only location table', async () => {
    const result = await db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name LIKE '%location%'`,
    );
    expect(result.rows.map((r) => r.table_name)).toEqual(['user_locations']);
  });
});
