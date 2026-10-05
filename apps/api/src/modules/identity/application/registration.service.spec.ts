import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  createIdentityHarness,
  device,
  FAKE_CODE,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';

const PHONE = '+12145550123';
const IP = '198.51.100.20';

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('RegistrationService', () => {
  let h: IdentityHarness;
  let registrationToken: string;

  beforeEach(async () => {
    h = createIdentityHarness();
    await h.otp.request({ phone: PHONE, installId: device().installId, ip: IP });
    const verified = await h.otp.verify({
      phone: PHONE,
      code: FAKE_CODE,
      device: device(),
      ip: IP,
      idempotencyKey: randomUUID(),
    });
    if (verified.result !== 'registration_required') throw new Error('expected new phone');
    registrationToken = verified.registrationToken;
  });

  const register = (
    dateOfBirth: string,
    idempotencyKey = randomUUID(),
    token = registrationToken,
  ) =>
    h.registration.register({
      registrationToken: token,
      dateOfBirth,
      device: device(),
      ip: IP,
      idempotencyKey,
    });

  it('creates a pending account at the NAME step with a session and an audit event', async () => {
    const result = await register('1995-06-15');
    expect(result.account).toMatchObject({
      accountStatus: 'PENDING_VERIFICATION',
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: 'NAME',
    });
    expect(h.store.state.users).toHaveLength(1);
    expect(h.store.state.users[0]).toMatchObject({ phoneE164: PHONE, dateOfBirth: '1995-06-15' });
    expect(h.store.state.sessions).toHaveLength(1);
    expect(h.store.state.audit).toEqual([
      expect.objectContaining({ actionCode: 'USER_REGISTERED', actorId: result.account.id }),
    ]);
    const claims = await h.accessTokens.verify(result.session.tokens.accessToken);
    expect(claims).toEqual({ userId: result.account.id, sessionId: result.session.sessionId });
  });

  it('persists nothing for an under-18 attempt and burns the token', async () => {
    // Harness clock: 2026-10-05 12:00Z. Born 2008-10-06 → 17.
    expect(await errorCode(register('2008-10-06'))).toBe('AGE_NOT_ELIGIBLE');
    expect(h.store.state.users).toHaveLength(0);
    expect(h.store.state.sessions).toHaveLength(0);
    expect(h.store.state.audit).toHaveLength(0);
    // No identifier of any kind is logged for the rejection.
    expect(h.logger.events.filter((e) => e.event === 'registration.age_rejected')).toEqual([
      { level: 'info', event: 'registration.age_rejected' },
    ]);
    expect(JSON.stringify(h.logger.events)).not.toContain('2008-10-06');
    expect(h.ephemeral.dump()).not.toContain('2008-10-06');
    // Single use: correcting the date requires verifying the phone again.
    expect(await errorCode(register('1990-01-01'))).toBe('REGISTRATION_TOKEN_INVALID');
  });

  it('accepts an applicant on their 18th birthday', async () => {
    await expect(register('2008-10-05')).resolves.toBeDefined();
  });

  it('rejects implausible dates without consuming the token', async () => {
    expect(await errorCode(register('2030-01-01'))).toBe('VALIDATION_FAILED');
    expect(await errorCode(register('1899-12-31'))).toBe('VALIDATION_FAILED');
    expect(await errorCode(register('2001-02-29'))).toBe('VALIDATION_FAILED');
    await expect(register('1990-01-01')).resolves.toBeDefined();
  });

  it('is single-use', async () => {
    await register('1990-01-01');
    expect(await errorCode(register('1990-01-01'))).toBe('REGISTRATION_TOKEN_INVALID');
    expect(h.store.state.users).toHaveLength(1);
  });

  describe('retry safety (Idempotency-Key)', () => {
    it('replays a lost response: one account, the unused session replaced', async () => {
      const key = randomUUID();
      const first = await register('1990-01-01', key);
      const retry = await register('1990-01-01', key);

      expect(retry.account.id).toBe(first.account.id);
      expect(h.store.state.users).toHaveLength(1);
      expect(retry.session.sessionId).not.toBe(first.session.sessionId);
      expect(h.store.session(first.session.sessionId).revocationReason).toBe('REPLAY_REPLACED');
      await expect(
        h.sessions.refresh(retry.session.tokens.refreshToken, device()),
      ).resolves.toBeDefined();
    });

    it('does not re-issue once the session has been used', async () => {
      const key = randomUUID();
      const first = await register('1990-01-01', key);
      await h.sessions.refresh(first.session.tokens.refreshToken, device());
      expect(await errorCode(register('1990-01-01', key))).toBe('REPLAY_UNAVAILABLE');
    });

    it('replays an underage rejection deterministically and persists nothing', async () => {
      const key = randomUUID();
      expect(await errorCode(register('2010-01-01', key))).toBe('AGE_NOT_ELIGIBLE');
      expect(await errorCode(register('2010-01-01', key))).toBe('AGE_NOT_ELIGIBLE');
      expect(h.store.state.users).toHaveLength(0);
    });

    it('rejects the same key with a different date of birth', async () => {
      const key = randomUUID();
      await register('1990-01-01', key);
      expect(await errorCode(register('1991-01-01', key))).toBe('IDEMPOTENCY_KEY_REUSED');
    });

    it('lets a concurrent duplicate fail cleanly while the first is in progress', async () => {
      const key = randomUUID();
      const [a, b] = await Promise.allSettled([
        register('1990-01-01', key),
        register('1990-01-01', key),
      ]);
      const outcomes = [a, b].map((r) =>
        r.status === 'fulfilled'
          ? 'ok'
          : r.reason instanceof ApplicationError
            ? r.reason.code
            : 'other',
      );
      expect(outcomes.sort()).toEqual(['REQUEST_IN_PROGRESS', 'ok']);
      expect(h.store.state.users).toHaveLength(1);
    });
  });

  it('maps a phone-uniqueness race to PHONE_ALREADY_REGISTERED', async () => {
    await h.signUp('+12145550111');
    await h.otp
      .request({ phone: '+12145550111', installId: device().installId, ip: IP })
      .catch(() => undefined);
    // Forge a second ticket for the same, now-registered number.
    const ticketToken = 'b'.repeat(43);
    const { sha256Hex } = await import('../../../shared/crypto/crypto.js');
    await h.ephemeral.set(
      `registration:${sha256Hex(ticketToken)}`,
      JSON.stringify({ phoneE164: '+12145550111', phoneVerifiedAt: new Date().toISOString() }),
      60_000,
    );
    expect(await errorCode(register('1990-01-01', randomUUID(), ticketToken))).toBe(
      'PHONE_ALREADY_REGISTERED',
    );
    expect(h.store.state.users).toHaveLength(1);
  });
});
