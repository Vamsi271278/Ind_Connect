import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  bootstrapResponseSchema,
  errorEnvelopeSchema,
  otpVerifyResponseSchema,
  registrationResponseSchema,
  selfUserSchema,
} from '@project-connect/api-contracts';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ONBOARDING_PROGRESS } from '../../src/modules/identity/api/tokens.js';
import type { OnboardingProgressService } from '../../src/modules/identity/application/onboarding-progress.service.js';
import { DATABASE, type Database } from '../../src/shared/database/database.module.js';
import { userProfiles, users } from '../../src/shared/database/schema/index.js';
import { resetDatabase, resetRedis } from '../support/integration-db.js';
import { createTestApp } from '../support/test-app.js';

const CODE = process.env.OTP_FAKE_CODE ?? '';
const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;
const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let app: NestExpressApplication;
let close: () => Promise<void>;
let db: Database;

beforeAll(async () => {
  ({ app, close } = await createTestApp());
  db = app.get<Database>(DATABASE);
  for (let i = 0; i < 50; i += 1) {
    const probe = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone: '+12145559998', installId: randomUUID() });
    if (probe.status !== 503) break;
    await sleep(100);
  }
});
afterAll(async () => {
  await close();
});
beforeEach(async () => {
  await resetDatabase(db);
  await resetRedis(process.env.REDIS_URL ?? '');
});

const api = () => request(app.getHttpServer());

async function signUp(phone: string, dateOfBirth = '1992-03-04') {
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
          .send({ registrationToken: verified.registrationToken, dateOfBirth, device })
          .expect(201)
      ).body,
    ),
  );
  return { ...registered, bearer: `Bearer ${registered.session.accessToken}` };
}

const patch = (bearer: string, body: object) =>
  api().patch('/api/v1/users/me/profile').set('Authorization', bearer).send(body);

const stepOf = async (userId: string) =>
  (await db.select({ step: users.onboardingStep }).from(users).where(eq(users.id, userId)))[0]
    ?.step;

describe('GET /users/me', () => {
  it('returns the self projection with masked phone and computed age only', async () => {
    const { account, bearer } = await signUp('+12145550301');
    const response = await api().get('/api/v1/users/me').set('Authorization', bearer).expect(200);
    const me = selfUserSchema.parse(dataOf(response.body));
    expect(me).toMatchObject({
      id: account.userId,
      accountStatus: 'PENDING_VERIFICATION',
      onboarding: { status: 'IN_PROGRESS', step: 'NAME' },
      profile: { firstName: null, genderCode: null, genderSelfDescription: null },
      phoneMasked: '+1 ••• ••• 0301',
    });
    expect(me.age).toBeGreaterThanOrEqual(33);
    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain('1992-03-04');
    expect(raw).not.toContain('2145550301');
  });
});

describe('PATCH /users/me/profile', () => {
  it('drives NAME → GENDER → LOCATION and never rewinds', async () => {
    const { account, bearer } = await signUp('+12145550302');
    expect(
      selfUserSchema.parse(
        dataOf((await patch(bearer, { firstName: ' Ananya ' }).expect(200)).body),
      ),
    ).toMatchObject({ onboarding: { step: 'GENDER' }, profile: { firstName: 'Ananya' } });

    const missingText = await patch(bearer, { genderCode: 'SELF_DESCRIBE' }).expect(400);
    expect(errorCodeOf(missingText.body)).toBe('VALIDATION_FAILED');
    expect(await stepOf(account.userId)).toBe('GENDER');

    await patch(bearer, {
      genderCode: 'SELF_DESCRIBE',
      genderSelfDescription: 'Genderfluid',
    }).expect(200);
    expect(await stepOf(account.userId)).toBe('LOCATION');

    await patch(bearer, { genderCode: 'MAN' }).expect(200);
    await patch(bearer, { firstName: 'Ravi' }).expect(200);
    const [row] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, account.userId));
    expect(row).toMatchObject({
      firstName: 'Ravi',
      genderCode: 'MAN',
      genderSelfDescription: null,
    });
    expect(await stepOf(account.userId)).toBe('LOCATION');
  });

  it('rejects protected, unknown and deferred fields', async () => {
    const { bearer } = await signUp('+12145550303');
    for (const body of [
      { firstName: 'A', accountStatus: 'ACTIVE' },
      { lastName: 'Rao' },
      { dateOfBirth: '1980-01-01' },
      {},
    ]) {
      expect(errorCodeOf((await patch(bearer, body).expect(400)).body)).toBe('VALIDATION_FAILED');
    }
  });

  it('serializes concurrent updates per user (no lost update)', async () => {
    const { account, bearer } = await signUp('+12145550304');
    const [a, b] = await Promise.all([
      patch(bearer, { firstName: 'Meera' }),
      patch(bearer, { genderCode: 'WOMAN' }),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    const [row] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, account.userId));
    expect(row).toMatchObject({ firstName: 'Meera', genderCode: 'WOMAN' });
    expect(await stepOf(account.userId)).toBe('LOCATION');
  });

  it('rolls back the profile write when the onboarding update fails (one transaction)', async () => {
    const { account, bearer } = await signUp('+12145550305');
    const onboarding = app.get<OnboardingProgressService>(ONBOARDING_PROGRESS);
    const spy = vi
      .spyOn(onboarding, 'recordProfileProgress')
      .mockRejectedValueOnce(new Error('simulated'));
    try {
      expect(errorCodeOf((await patch(bearer, { firstName: 'Ananya' }).expect(500)).body)).toBe(
        'INTERNAL_ERROR',
      );
    } finally {
      spy.mockRestore();
    }
    const rows = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, account.userId));
    expect(rows).toHaveLength(0);
    expect(await stepOf(account.userId)).toBe('NAME');
  });
});

describe('GET /app/bootstrap with real sessions', () => {
  it('populates account for a valid token and returns null once the session is revoked', async () => {
    const { bearer } = await signUp('+12145550306');
    const signedIn = bootstrapResponseSchema.parse(
      dataOf(
        (await api().get('/api/v1/app/bootstrap').set('Authorization', bearer).expect(200)).body,
      ),
    );
    expect(signedIn.account).toEqual({
      status: 'PENDING_VERIFICATION',
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: 'NAME',
    });

    await api().post('/api/v1/auth/logout-all').set('Authorization', bearer).expect(204);
    const revoked = bootstrapResponseSchema.parse(
      dataOf(
        (await api().get('/api/v1/app/bootstrap').set('Authorization', bearer).expect(200)).body,
      ),
    );
    expect(revoked.account).toBeNull();
  });
});
