import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  otpVerifyResponseSchema,
  registrationResponseSchema,
} from '@project-connect/api-contracts';
import request from 'supertest';
import { z } from 'zod';

const dataOf = (body: unknown): unknown => z.object({ data: z.unknown() }).parse(body).data;

/** Full HTTP sign-up (OTP request → verify → register) against a running test app. */
export async function signUpOverHttp(app: NestExpressApplication, phone: string) {
  const api = () => request(app.getHttpServer());
  const installId = randomUUID();
  const device = { platform: 'android', appVersion: '1.0.0', osVersion: '15', installId };
  await api().post('/api/v1/auth/otp/request').send({ phone, installId }).expect(202);
  const verified = otpVerifyResponseSchema.parse(
    dataOf(
      (
        await api()
          .post('/api/v1/auth/otp/verify')
          .set('Idempotency-Key', randomUUID())
          .send({ phone, code: process.env.OTP_FAKE_CODE ?? '', device })
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

/** Waits until the app's Redis connection is ready (OTP request stops returning 503). */
export async function waitForApp(app: NestExpressApplication): Promise<void> {
  for (let i = 0; i < 50; i += 1) {
    const probe = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone: '+12145559998', installId: randomUUID() });
    if (probe.status !== 503) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
