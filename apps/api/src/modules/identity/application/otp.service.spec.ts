import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  device,
  FAKE_CODE,
  type IdentityHarness,
  WRONG_CODE,
} from '../../../../test/support/identity-harness.js';
import { MINUTE, SECOND } from '../../../../test/support/manual-clock.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import { PhoneVerificationError, type PhoneVerificationProvider } from './ports.js';

const PHONE = '+12145550123';
const IP = '198.51.100.20';
const INSTALL = device().installId;

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('OtpService.request', () => {
  let h: IdentityHarness;
  beforeEach(() => {
    h = createIdentityHarness();
  });

  it('responds identically for registered and unregistered numbers without reading accounts', async () => {
    await h.signUp('+12145550199');
    h.clock.advance(MINUTE);
    const lookup = vi.spyOn(h.store.repository, 'findUserByPhone');

    const known = await h.otp.request({ phone: '+12145550199', installId: INSTALL, ip: IP });
    const unknown = await h.otp.request({ phone: '+12145550123', installId: INSTALL, ip: IP });

    expect(known).toEqual(unknown);
    expect(known).toEqual({ expiresInSeconds: 300, resendAvailableInSeconds: 30 });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('enforces the 30-second resend cooldown with a retry hint', async () => {
    await h.otp.request({ phone: PHONE, installId: INSTALL, ip: IP });
    h.clock.advance(10 * SECOND);
    const error = await h.otp
      .request({ phone: PHONE, installId: INSTALL, ip: IP })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApplicationError);
    expect((error as ApplicationError).code).toBe('RATE_LIMITED');
    expect((error as ApplicationError).details?.retryAfterSeconds).toBe(20);

    h.clock.advance(21 * SECOND);
    await expect(
      h.otp.request({ phone: PHONE, installId: INSTALL, ip: IP }),
    ).resolves.toBeDefined();
  });

  it('limits sends per phone per hour', async () => {
    for (let i = 0; i < 5; i += 1) {
      await h.otp.request({ phone: PHONE, installId: randomUUID(), ip: `198.51.100.${String(i)}` });
      h.clock.advance(31 * SECOND);
    }
    expect(
      await errorCode(
        h.otp.request({ phone: PHONE, installId: randomUUID(), ip: '198.51.100.99' }),
      ),
    ).toBe('RATE_LIMITED');
  });

  it('limits sends per device and per IP across different numbers', async () => {
    for (let i = 0; i < 10; i += 1) {
      await h.otp.request({
        phone: `+1214555${String(1000 + i)}`,
        installId: INSTALL,
        ip: `203.0.113.${String(i)}`,
      });
    }
    expect(
      await errorCode(
        h.otp.request({ phone: '+12145552000', installId: INSTALL, ip: '203.0.113.200' }),
      ),
    ).toBe('RATE_LIMITED');

    const g = createIdentityHarness();
    for (let i = 0; i < 20; i += 1) {
      await g.otp.request({
        phone: `+1214555${String(3000 + i)}`,
        installId: randomUUID(),
        ip: IP,
      });
    }
    expect(
      await errorCode(g.otp.request({ phone: '+12145554000', installId: randomUUID(), ip: IP })),
    ).toBe('RATE_LIMITED');
  });

  it('applies the configured country policy and rejects malformed numbers', async () => {
    const restricted = createIdentityHarness({
      countryPolicy: { mode: 'allowlist', countries: new Set(['IN']) },
    });
    expect(
      await errorCode(restricted.otp.request({ phone: PHONE, installId: INSTALL, ip: IP })),
    ).toBe('PHONE_COUNTRY_NOT_SUPPORTED');
    await expect(
      restricted.otp.request({ phone: '+919876543210', installId: INSTALL, ip: IP }),
    ).resolves.toBeDefined();
    expect(
      await errorCode(h.otp.request({ phone: '2145550123', installId: INSTALL, ip: IP })),
    ).toBe('PHONE_INVALID');
  });

  it('fails closed when Redis is unavailable', async () => {
    h.ephemeral.available = false;
    expect(await errorCode(h.otp.request({ phone: PHONE, installId: INSTALL, ip: IP }))).toBe(
      'OTP_UNAVAILABLE',
    );
  });

  it('releases the cooldown when the provider is unavailable so the user can retry', async () => {
    const start = vi
      .fn<PhoneVerificationProvider['start']>()
      .mockRejectedValue(new PhoneVerificationError('unavailable'));
    const provider: PhoneVerificationProvider = { start, check: vi.fn() };
    const g = createIdentityHarness({ provider });
    expect(await errorCode(g.otp.request({ phone: PHONE, installId: INSTALL, ip: IP }))).toBe(
      'OTP_UNAVAILABLE',
    );
    expect(start).toHaveBeenCalledTimes(2); // one transient retry
    start.mockResolvedValue(undefined);
    await expect(
      g.otp.request({ phone: PHONE, installId: INSTALL, ip: IP }),
    ).resolves.toBeDefined();
  });

  it('never logs or stores the raw phone number', async () => {
    await h.otp.request({ phone: PHONE, installId: INSTALL, ip: IP });
    expect(h.logger.dump()).not.toContain('2145550123');
    expect(h.ephemeral.dump()).not.toContain('2145550123');
    expect(h.ephemeral.dump()).not.toContain(IP);
  });
});

describe('OtpService.verify', () => {
  let h: IdentityHarness;
  beforeEach(async () => {
    h = createIdentityHarness();
    await h.otp.request({ phone: PHONE, installId: INSTALL, ip: IP });
  });

  const verify = (code: string, idempotencyKey = randomUUID(), dev = device()) =>
    h.otp.verify({ phone: PHONE, code, device: dev, ip: IP, idempotencyKey });

  it('returns a registration token for a new number and stores no code or token', async () => {
    const result = await verify(FAKE_CODE);
    expect(result.result).toBe('registration_required');
    if (result.result !== 'registration_required') return;
    expect(result.registrationToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(h.ephemeral.dump()).not.toContain(result.registrationToken);
    expect(h.ephemeral.dump()).not.toContain(FAKE_CODE);
    expect(h.logger.dump()).not.toContain(FAKE_CODE);
  });

  it('signs in an existing account without creating a new one', async () => {
    const created = await h.signUp('+12145550177');
    h.clock.advance(MINUTE);
    await h.otp.request({ phone: '+12145550177', installId: INSTALL, ip: IP });
    const result = await h.otp.verify({
      phone: '+12145550177',
      code: FAKE_CODE,
      device: device(),
      ip: IP,
      idempotencyKey: randomUUID(),
    });
    expect(result.result).toBe('authenticated');
    if (result.result !== 'authenticated') return;
    expect(result.account.id).toBe(created.account.id);
    expect(h.store.state.users).toHaveLength(1);
  });

  it('rejects wrong codes and locks the challenge after five attempts', async () => {
    for (let i = 0; i < 4; i += 1)
      expect(await errorCode(verify(WRONG_CODE))).toBe('OTP_INCORRECT');
    expect(await errorCode(verify(WRONG_CODE))).toBe('OTP_ATTEMPTS_EXCEEDED');
    // The challenge is gone: even the right code no longer works.
    expect(await errorCode(verify(FAKE_CODE))).toBe('OTP_EXPIRED');
  });

  it('rejects an expired code', async () => {
    h.clock.advance(5 * MINUTE + SECOND);
    expect(await errorCode(verify(FAKE_CODE))).toBe('OTP_EXPIRED');
  });

  it('refuses sign-in for accounts that cannot self-serve (fail closed)', async () => {
    const created = await h.signUp('+12145550166');
    h.store.setAccountStatus(created.account.id, 'SUSPENDED');
    h.clock.advance(MINUTE);
    await h.otp.request({ phone: '+12145550166', installId: INSTALL, ip: IP });
    const code = await errorCode(
      h.otp.verify({
        phone: '+12145550166',
        code: FAKE_CODE,
        device: device(),
        ip: IP,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(code).toBe('ACCOUNT_NOT_ACTIVE');
  });

  describe('retry safety (Idempotency-Key)', () => {
    it('replays a lost registration_required response with a fresh token; the first is void', async () => {
      const key = randomUUID();
      const first = await verify(FAKE_CODE, key);
      const retry = await verify(FAKE_CODE, key);
      if (first.result !== 'registration_required' || retry.result !== 'registration_required') {
        throw new Error('expected registration_required');
      }
      expect(retry.registrationToken).not.toBe(first.registrationToken);

      const register = (token: string) =>
        h.registration.register({
          registrationToken: token,
          dateOfBirth: '1990-01-01',
          device: device(),
          ip: IP,
          idempotencyKey: randomUUID(),
        });
      expect(await errorCode(register(first.registrationToken))).toBe('REGISTRATION_TOKEN_INVALID');
      await expect(register(retry.registrationToken)).resolves.toBeDefined();
    });

    it('replays a lost sign-in by revoking the unused session and issuing a replacement', async () => {
      await h.signUp('+12145550155');
      h.clock.advance(MINUTE);
      await h.otp.request({ phone: '+12145550155', installId: INSTALL, ip: IP });
      const key = randomUUID();
      const call = () =>
        h.otp.verify({
          phone: '+12145550155',
          code: FAKE_CODE,
          device: device(),
          ip: IP,
          idempotencyKey: key,
        });

      const verifiedBefore = h.analyticsProvider.names().filter((n) => n === 'otp_verified').length;
      const first = await call();
      const retry = await call();
      if (first.result !== 'authenticated' || retry.result !== 'authenticated')
        throw new Error('expected sessions');

      // otp_verified fires once for the operation, never again on replay.
      expect(h.analyticsProvider.names().filter((n) => n === 'otp_verified').length).toBe(
        verifiedBefore + 1,
      );
      expect(retry.session.sessionId).not.toBe(first.session.sessionId);
      expect(h.store.session(first.session.sessionId)).toMatchObject({
        revocationReason: 'REPLAY_REPLACED',
        replacedBySessionId: retry.session.sessionId,
      });
      expect(h.store.session(retry.session.sessionId).revokedAt).toBeNull();
      await expect(
        h.sessions.refresh(first.session.tokens.refreshToken, device()),
      ).rejects.toMatchObject({
        code: 'SESSION_INVALID',
      });
    });

    it('refuses to mint new credentials once the original session was used', async () => {
      await h.signUp('+12145550144');
      h.clock.advance(MINUTE);
      await h.otp.request({ phone: '+12145550144', installId: INSTALL, ip: IP });
      const key = randomUUID();
      const call = () =>
        h.otp.verify({
          phone: '+12145550144',
          code: FAKE_CODE,
          device: device(),
          ip: IP,
          idempotencyKey: key,
        });
      const first = await call();
      if (first.result !== 'authenticated') throw new Error('expected session');
      await h.sessions.authenticate(first.session.tokens.accessToken, 'self_service');

      expect(await errorCode(call())).toBe('REPLAY_UNAVAILABLE');
    });

    it('replays a terminal error without spending another attempt', async () => {
      const key = randomUUID();
      expect(await errorCode(verify(WRONG_CODE, key))).toBe('OTP_INCORRECT');
      expect(await errorCode(verify(WRONG_CODE, key))).toBe('OTP_INCORRECT');
      // Only one attempt was consumed: the right code still works.
      await expect(verify(FAKE_CODE)).resolves.toMatchObject({ result: 'registration_required' });
    });

    it('rejects the same key with a different payload', async () => {
      const key = randomUUID();
      await verify(WRONG_CODE, key).catch(() => undefined);
      expect(await errorCode(verify(FAKE_CODE, key))).toBe('IDEMPOTENCY_KEY_REUSED');
      expect(await errorCode(verify(WRONG_CODE, key, device({ appVersion: '9.9.9' })))).toBe(
        'IDEMPOTENCY_KEY_REUSED',
      );
    });

    it('keeps OTPs, tokens and phones out of idempotency state; the phone lives only in the expiring ticket', async () => {
      const key = randomUUID();
      const result = await verify(FAKE_CODE, key);
      if (result.result !== 'registration_required')
        throw new Error('expected registration_required');
      const entries = [...h.ephemeral.entries.entries()];

      const idempotency = JSON.stringify(entries.filter(([k]) => k.startsWith('idempotency:')));
      for (const secret of [FAKE_CODE, '2145550123', result.registrationToken]) {
        expect(idempotency).not.toContain(secret);
      }
      expect(h.ephemeral.dump()).not.toContain(FAKE_CODE);
      expect(h.ephemeral.dump()).not.toContain(result.registrationToken);

      const withPhone = entries.filter(([, entry]) => entry.value.includes('2145550123'));
      expect(withPhone.map(([k]) => k.split(':')[0])).toEqual(['registration']);
      const ttl = (withPhone[0]?.[1].expiresAtMs ?? Infinity) - h.clock.now().getTime();
      expect(ttl).toBeLessThanOrEqual(600_000);
    });
  });
});
