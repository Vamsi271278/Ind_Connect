import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { errorEnvelopeSchema } from '@project-connect/api-contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './support/test-app.js';

const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;

// HTTP-surface behavior that needs no infrastructure. The test environment
// points PostgreSQL and Redis at an unreachable port, so anything reaching them
// must fail closed. Full flows run in test/integration against real services.

const device = {
  platform: 'android',
  appVersion: '1.0.0',
  osVersion: '15',
  installId: randomUUID(),
};

describe('auth HTTP surface (e2e, no infrastructure)', () => {
  let app: NestExpressApplication;
  let logs: string[];
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, logs, close } = await createTestApp());
  });

  afterAll(async () => {
    await close();
  });

  const post = (path: string) => request(app.getHttpServer()).post(`/api/v1${path}`);

  it('returns the stable error envelope with a correlation ID and no-store', async () => {
    const response = await post('/auth/otp/request')
      .set('X-Correlation-ID', 'test-correlation-0001')
      .send({ phone: '2145550123', installId: randomUUID() })
      .expect(400);

    expect(errorEnvelopeSchema.parse(response.body)).toEqual({
      error: {
        code: 'PHONE_INVALID',
        message: 'Enter a valid mobile number.',
        correlationId: 'test-correlation-0001',
      },
    });
    expect(response.headers['x-correlation-id']).toBe('test-correlation-0001');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects protected and unknown fields (mass assignment) with issue paths only', async () => {
    const response = await post('/auth/registrations')
      .set('Idempotency-Key', randomUUID())
      .send({
        registrationToken: 'a'.repeat(43),
        dateOfBirth: '1990-01-01',
        device,
        accountStatus: 'ACTIVE',
      })
      .expect(400);
    expect(errorCodeOf(response.body)).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(response.body)).not.toContain('ACTIVE');
  });

  it('requires an Idempotency-Key on retry-sensitive endpoints', async () => {
    for (const path of ['/auth/otp/verify', '/auth/registrations']) {
      const response = await post(path).send({}).expect(400);
      expect(errorCodeOf(response.body)).toBe('IDEMPOTENCY_KEY_REQUIRED');
    }
    const malformed = await post('/auth/otp/verify')
      .set('Idempotency-Key', 'not-a-uuid')
      .send({})
      .expect(400);
    expect(errorCodeOf(malformed.body)).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('fails closed with OTP_UNAVAILABLE when Redis is unreachable', async () => {
    const response = await post('/auth/otp/request')
      .send({ phone: '+1 214 555 0123', installId: randomUUID() })
      .expect(503);
    expect(errorCodeOf(response.body)).toBe('OTP_UNAVAILABLE');
  });

  it('requires a bearer access token for logout-all', async () => {
    const missing = await post('/auth/logout-all').expect(401);
    expect(errorCodeOf(missing.body)).toBe('AUTH_REQUIRED');
    const forged = await post('/auth/logout-all')
      .set('Authorization', 'Bearer abc.def.ghi')
      .expect(401);
    expect(errorCodeOf(forged.body)).toBe('AUTH_REQUIRED');
  });

  it('maps malformed JSON, oversized bodies and unknown routes to safe envelopes', async () => {
    const malformed = await post('/auth/refresh')
      .set('Content-Type', 'application/json')
      .send('{"refreshToken":')
      .expect(400);
    expect(errorCodeOf(malformed.body)).toBe('VALIDATION_FAILED');

    const oversized = await post('/auth/refresh').send({ refreshToken: 'x'.repeat(20_000) });
    expect(oversized.status).toBe(400);
    expect(errorCodeOf(oversized.body)).toBe('VALIDATION_FAILED');

    const unknown = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);
    expect(errorCodeOf(unknown.body)).toBe('NOT_FOUND');
  });

  it('never writes phone numbers or request secrets to logs', async () => {
    await post('/auth/otp/request').send({ phone: '+1 214 555 0177', installId: randomUUID() });
    const all = logs.join('\n');
    expect(all).not.toContain('2145550177');
    expect(all).not.toContain('555 0177');
    expect(all).toContain('"event":"http.request"');
  });
});
