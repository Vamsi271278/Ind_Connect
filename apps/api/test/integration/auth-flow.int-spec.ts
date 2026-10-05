import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  errorEnvelopeSchema,
  otpVerifyResponseSchema,
  refreshResponseSchema,
  registrationResponseSchema,
} from '@project-connect/api-contracts';
import { count, eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { DATABASE, type Database } from '../../src/shared/database/database.module.js';
import { auditEvents, userSessions, users } from '../../src/shared/database/schema/index.js';
import { resetDatabase, resetRedis } from '../support/integration-db.js';
import { createTestApp } from '../support/test-app.js';

const CODE = process.env.OTP_FAKE_CODE ?? '';
const device = (installId = randomUUID()) => ({
  platform: 'ios',
  appVersion: '1.0.0',
  osVersion: '18.2',
  installId,
});
const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;
const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;
const parseVerify = (body: unknown) => otpVerifyResponseSchema.parse(dataOf(body));
const parseRegistration = (body: unknown) => registrationResponseSchema.parse(dataOf(body));
const parseRefresh = (body: unknown) => refreshResponseSchema.parse(dataOf(body));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let app: NestExpressApplication;
let logs: string[];
let close: () => Promise<void>;
let db: Database;

beforeAll(async () => {
  ({ app, logs, close } = await createTestApp());
  db = app.get<Database>(DATABASE);
  // Redis connects in the background; wait until the API can use it.
  for (let i = 0; i < 50; i += 1) {
    const probe = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone: '+12145559999', installId: randomUUID() });
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
  logs.length = 0;
});

const api = () => request(app.getHttpServer());

function requestCode(phone: string, installId = randomUUID()) {
  return api().post('/api/v1/auth/otp/request').send({ phone, installId });
}

function verify(phone: string, dev = device(), key = randomUUID(), code = CODE) {
  return api()
    .post('/api/v1/auth/otp/verify')
    .set('Idempotency-Key', key)
    .send({ phone, code, device: dev });
}

function register(
  registrationToken: string,
  dateOfBirth: string,
  dev = device(),
  key = randomUUID(),
) {
  return api()
    .post('/api/v1/auth/registrations')
    .set('Idempotency-Key', key)
    .send({ registrationToken, dateOfBirth, device: dev });
}

async function signUp(phone: string, dev = device()) {
  await requestCode(phone, dev.installId).expect(202);
  const verified = parseVerify((await verify(phone, dev).expect(200)).body);
  if (verified.result !== 'registration_required') throw new Error('expected new phone');
  return parseRegistration(
    (await register(verified.registrationToken, '1992-03-04', dev).expect(201)).body,
  );
}

const userCount = async () => (await db.select({ n: count() }).from(users))[0]?.n ?? 0;

describe('registration → OTP → account', () => {
  it('creates a pending account at NAME with a working session', async () => {
    const result = await signUp('+12145550101');
    expect(result.account).toMatchObject({
      accountStatus: 'PENDING_VERIFICATION',
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: 'NAME',
    });
    const [row] = await db.select().from(users).where(eq(users.id, result.account.userId));
    expect(row).toMatchObject({
      phoneE164: '+12145550101',
      dateOfBirth: '1992-03-04',
      discoverable: false,
    });
    const audits = await db.select().from(auditEvents);
    expect(audits.map((a) => a.actionCode)).toEqual(['USER_REGISTERED']);
  });

  it('signs an existing account back in without creating another', async () => {
    const first = await signUp('+12145550102');
    await sleep(0);
    await resetRedis(process.env.REDIS_URL ?? ''); // clear the resend cooldown
    await requestCode('+12145550102').expect(202);
    const again = parseVerify((await verify('+12145550102').expect(200)).body);
    expect(again.result).toBe('authenticated');
    if (again.result === 'authenticated') expect(again.account.userId).toBe(first.account.userId);
    expect(await userCount()).toBe(1);
  });

  it('answers OTP requests identically for registered and unregistered numbers', async () => {
    await signUp('+12145550103');
    await resetRedis(process.env.REDIS_URL ?? '');
    const known = await requestCode('+12145550103');
    const unknown = await requestCode('+12145550104');
    expect(known.status).toBe(unknown.status);
    expect(known.body).toEqual(unknown.body);
  });

  it('persists nothing for an under-18 attempt', async () => {
    await requestCode('+12145550105').expect(202);
    const verified = parseVerify((await verify('+12145550105').expect(200)).body);
    if (verified.result !== 'registration_required') throw new Error('expected new phone');
    const tooYoung = new Date();
    tooYoung.setUTCFullYear(tooYoung.getUTCFullYear() - 17);
    const response = await register(
      verified.registrationToken,
      tooYoung.toISOString().slice(0, 10),
    ).expect(422);
    expect(errorCodeOf(response.body)).toBe('AGE_NOT_ELIGIBLE');
    expect(await userCount()).toBe(0);
    expect((await db.select({ n: count() }).from(userSessions))[0]?.n).toBe(0);
    expect((await db.select({ n: count() }).from(auditEvents))[0]?.n).toBe(0);
  });

  it('rejects protected fields at the boundary', async () => {
    const response = await api()
      .post('/api/v1/auth/registrations')
      .set('Idempotency-Key', randomUUID())
      .send({
        registrationToken: 'a'.repeat(43),
        dateOfBirth: '1990-01-01',
        device: device(),
        accountStatus: 'ACTIVE',
      })
      .expect(400);
    expect(errorCodeOf(response.body)).toBe('VALIDATION_FAILED');
  });
});

describe('retry safety', () => {
  it('replays a lost verify response; the first session is revoked and useless', async () => {
    const dev = device();
    await signUp('+12145550110', dev);
    await resetRedis(process.env.REDIS_URL ?? '');
    await requestCode('+12145550110', dev.installId).expect(202);
    const key = randomUUID();
    const first = parseVerify((await verify('+12145550110', dev, key).expect(200)).body);
    const retry = parseVerify((await verify('+12145550110', dev, key).expect(200)).body);
    if (first.result !== 'authenticated' || retry.result !== 'authenticated')
      throw new Error('expected sessions');
    expect(retry.session.refreshToken).not.toBe(first.session.refreshToken);

    const stale = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.session.refreshToken, device: dev });
    expect(errorCodeOf(stale.body)).toBe('SESSION_INVALID');
    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: retry.session.refreshToken, device: dev })
      .expect(200);
  });

  it('replays a lost registration response without creating a second account', async () => {
    const dev = device();
    await requestCode('+12145550111', dev.installId).expect(202);
    const verified = parseVerify((await verify('+12145550111', dev).expect(200)).body);
    if (verified.result !== 'registration_required') throw new Error('expected new phone');
    const key = randomUUID();
    const first = parseRegistration(
      (await register(verified.registrationToken, '1990-01-01', dev, key).expect(201)).body,
    );
    const retry = parseRegistration(
      (await register(verified.registrationToken, '1990-01-01', dev, key).expect(201)).body,
    );
    expect(retry.account.userId).toBe(first.account.userId);
    expect(await userCount()).toBe(1);

    const changed = await register(verified.registrationToken, '1991-01-01', dev, key).expect(409);
    expect(errorCodeOf(changed.body)).toBe('IDEMPOTENCY_KEY_REUSED');
  });
});

describe('sessions', () => {
  const refresh = (refreshToken: string, dev: ReturnType<typeof device>) =>
    api().post('/api/v1/auth/refresh').send({ refreshToken, device: dev });

  it('rotates, detects reuse after the grace window, and revokes the whole family', async () => {
    const dev = device();
    const { session } = await signUp('+12145550120', dev);
    const next = parseRefresh((await refresh(session.refreshToken, dev).expect(200)).body);

    await sleep(2500); // REFRESH_GRACE_SECONDS=2 in integration env
    expect(errorCodeOf((await refresh(session.refreshToken, dev).expect(401)).body)).toBe(
      'SESSION_INVALID',
    );
    expect(errorCodeOf((await refresh(next.session.refreshToken, dev).expect(401)).body)).toBe(
      'SESSION_INVALID',
    );
    const audits = await db.select().from(auditEvents);
    expect(audits.map((a) => a.actionCode)).toContain('SESSION_REUSE_DETECTED');
  });

  it('allows a lost-response retry within the grace window from the same install', async () => {
    const dev = device();
    const { session } = await signUp('+12145550121', dev);
    const lost = parseRefresh((await refresh(session.refreshToken, dev).expect(200)).body);
    const retried = parseRefresh((await refresh(session.refreshToken, dev).expect(200)).body);
    expect(retried.session.refreshToken).not.toBe(lost.session.refreshToken);
    await refresh(retried.session.refreshToken, dev).expect(200);
  });

  it('serializes concurrent refreshes of one token: no double rotation, family intact', async () => {
    const dev = device();
    const { session } = await signUp('+12145550122', dev);
    const responses = await Promise.all([
      refresh(session.refreshToken, dev),
      refresh(session.refreshToken, dev),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 200]);
    const live = await db.select().from(userSessions);
    expect(live.filter((s) => s.revokedAt === null)).toHaveLength(1);
  });

  it('logout revokes the session; logout-all revokes every session; revoked tokens fail at once', async () => {
    const dev = device();
    const a = await signUp('+12145550123', dev);
    await api()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: a.session.refreshToken })
      .expect(204);
    expect(errorCodeOf((await refresh(a.session.refreshToken, dev).expect(401)).body)).toBe(
      'SESSION_INVALID',
    );

    await resetRedis(process.env.REDIS_URL ?? '');
    await requestCode('+12145550123', dev.installId).expect(202);
    const b = parseVerify((await verify('+12145550123', dev).expect(200)).body);
    if (b.result !== 'authenticated') throw new Error('expected session');
    await api()
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${b.session.accessToken}`)
      .expect(204);
    const again = await api()
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${b.session.accessToken}`)
      .expect(401);
    expect(errorCodeOf(again.body)).toBe('AUTH_REQUIRED');
    const rows = await db.select().from(userSessions);
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
    const logoutAll = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.actionCode, 'USER_LOGOUT_ALL'));
    expect(logoutAll).toHaveLength(1);
    expect(logoutAll[0]).toMatchObject({ actorType: 'USER', entityType: 'user' });
    expect(logoutAll[0]?.correlationId).toBeTruthy();
  });
});

describe('observability hygiene', () => {
  it('never logs phones, OTP codes, tokens or dates of birth', async () => {
    const { session } = await signUp('+12145550130');
    const all = logs.join('\n');
    for (const secret of [
      '2145550130',
      CODE,
      session.refreshToken,
      session.accessToken,
      '1992-03-04',
    ]) {
      expect(all).not.toContain(secret);
    }
  });
});
