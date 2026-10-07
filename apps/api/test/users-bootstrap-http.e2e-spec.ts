import type { NestExpressApplication } from '@nestjs/platform-express';
import { bootstrapResponseSchema, errorEnvelopeSchema } from '@project-connect/api-contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createTestApp } from './support/test-app.js';

const errorCodeOf = (body: unknown) => errorEnvelopeSchema.parse(body).error.code;
const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;

// Signed with an unrelated key: must never be honored.
const FORGED =
  'eyJhbGciOiJFZERTQSIsInR5cCI6ImF0K2p3dCJ9.eyJzdWIiOiIwYjVmN2Y0ZS0zYzFkLTRhOGUtOWY2Yi0xYTJiM2M0ZDVlNmYiLCJzaWQiOiI5ZThkN2M2Yi01YTRmLTRlM2QtOGMyYi0xYTBmOWU4ZDdjNmIifQ.' +
  'A'.repeat(86);

describe('bootstrap and users HTTP surface (e2e, no infrastructure)', () => {
  let app: NestExpressApplication;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, close } = await createTestApp());
  });

  afterAll(async () => {
    await close();
  });

  it('GET /api/v1/app/bootstrap is public and returns the ADR-076 shape', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/app/bootstrap').expect(200);
    expect(bootstrapResponseSchema.parse(dataOf(response.body))).toEqual({
      maintenanceMode: false,
      minimumSupportedVersion: '0.0.0',
      // The evaluated Dating kill switch is always reported (off by default).
      featureFlags: { dating_enabled: false },
      account: null,
    });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('returns account: null — not an error — for invalid or forged tokens', async () => {
    for (const authorization of ['Bearer garbage', `Bearer ${FORGED}`, 'Basic abc']) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/app/bootstrap')
        .set('Authorization', authorization)
        .expect(200);
      expect(bootstrapResponseSchema.parse(dataOf(response.body)).account).toBeNull();
    }
  });

  it('GET /users/me and PATCH /users/me/profile require a valid access token', async () => {
    const me = await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    expect(errorCodeOf(me.body)).toBe('AUTH_REQUIRED');
    const forged = await request(app.getHttpServer())
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${FORGED}`)
      .send({ firstName: 'Ananya' })
      .expect(401);
    expect(errorCodeOf(forged.body)).toBe('AUTH_REQUIRED');
  });
});
