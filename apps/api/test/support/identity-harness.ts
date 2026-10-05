import { generateKeyPairSync, randomUUID } from 'node:crypto';

import type { CountryPolicy } from '../../src/config/app-config.js';
import { Secret } from '../../src/config/secret.js';
import { IdempotencyRecords } from '../../src/modules/identity/application/ephemeral/idempotency-records.js';
import { OtpChallenges } from '../../src/modules/identity/application/ephemeral/otp-challenges.js';
import { RateLimiter } from '../../src/modules/identity/application/ephemeral/rate-limiter.js';
import { RegistrationTokens } from '../../src/modules/identity/application/ephemeral/registration-tokens.js';
import {
  OtpService,
  type OtpSettings,
} from '../../src/modules/identity/application/otp.service.js';
import type {
  DeviceContext,
  EventLogger,
  PhoneVerificationProvider,
} from '../../src/modules/identity/application/ports.js';
import { RegistrationService } from '../../src/modules/identity/application/registration.service.js';
import { SessionService } from '../../src/modules/identity/application/session.service.js';
import { FakePhoneVerificationProvider } from '../../src/modules/identity/infrastructure/otp/fake-phone-verification.provider.js';
import { JoseAccessTokenService } from '../../src/modules/identity/infrastructure/tokens/jose-access-token.service.js';
import { KeyedHasher } from '../../src/shared/crypto/crypto.js';
import { InMemoryEphemeralStore } from './in-memory-ephemeral-store.js';
import { InMemoryIdentityStore } from './in-memory-identity-store.js';
import { ManualClock } from './manual-clock.js';

export const FAKE_CODE = '246810';
export const WRONG_CODE = '135791';

export class CapturingLogger implements EventLogger {
  readonly events: Record<string, unknown>[] = [];

  log(event: Record<string, unknown>): void {
    this.events.push({ level: 'info', ...event });
  }

  warn(event: Record<string, unknown>): void {
    this.events.push({ level: 'warn', ...event });
  }

  dump(): string {
    return JSON.stringify(this.events);
  }
}

export const OTP_SETTINGS: OtpSettings = {
  codeTtlSeconds: 300,
  maxAttempts: 5,
  resendCooldownSeconds: 30,
  providerTimeoutMs: 1000,
  sendsPerPhonePerHour: 5,
  sendsPerPhonePerDay: 10,
  sendsPerIpPerHour: 20,
  sendsPerDevicePerHour: 10,
  verifiesPerIpPerHour: 30,
  registrationTokenTtlSeconds: 600,
};

export const device = (overrides: Partial<DeviceContext> = {}): DeviceContext => ({
  platform: 'ios',
  appVersion: '1.0.0',
  osVersion: '18.2',
  installId: '11111111-1111-4111-8111-111111111111',
  ...overrides,
});

/** Assembles the real application services over in-memory ports. */
export function createIdentityHarness(
  options: {
    readonly countryPolicy?: CountryPolicy;
    readonly provider?: PhoneVerificationProvider;
    readonly settings?: Partial<OtpSettings>;
  } = {},
) {
  const clock = new ManualClock('2026-10-05T12:00:00.000Z');
  const ephemeral = new InMemoryEphemeralStore(clock);
  const store = new InMemoryIdentityStore();
  const logger = new CapturingLogger();
  const settings = { ...OTP_SETTINGS, ...options.settings };
  const hasher = new KeyedHasher(new Secret('test-pepper-0123456789abcdef0123456789'));
  const rateLimiter = new RateLimiter(ephemeral);
  const idempotency = new IdempotencyRecords(ephemeral, { ttlMs: 3_600_000, lockMs: 30_000 });
  const registrationTokens = new RegistrationTokens(
    ephemeral,
    settings.registrationTokenTtlSeconds * 1000,
  );
  const challenges = new OtpChallenges(ephemeral, {
    codeTtlMs: settings.codeTtlSeconds * 1000,
    cooldownMs: settings.resendCooldownSeconds * 1000,
  });
  const provider =
    options.provider ??
    new FakePhoneVerificationProvider(
      new Secret(FAKE_CODE),
      { codeTtlMs: settings.codeTtlSeconds * 1000, maxAttempts: settings.maxAttempts },
      clock,
      'test',
    );
  const { privateKey } = generateKeyPairSync('ed25519');
  const accessTokens = new JoseAccessTokenService(
    { issuer: 'pc-test', audience: 'pc-mobile-test', privateKey, keyId: 'test-1', ttlSeconds: 900 },
    clock,
  );
  const sessions = new SessionService(
    store,
    accessTokens,
    rateLimiter,
    clock,
    {
      refreshRollingDays: 30,
      familyMaxDays: 90,
      refreshGraceSeconds: 30,
      refreshesPerFamilyPerHour: 120,
    },
    logger,
  );
  const otp = new OtpService(
    {
      provider,
      challenges,
      rateLimiter,
      registrationTokens,
      idempotency,
      store,
      sessions,
      hasher,
      countryPolicy: options.countryPolicy ?? { mode: 'all' },
      clock,
      logger,
    },
    settings,
  );
  const registration = new RegistrationService(
    { registrationTokens, idempotency, rateLimiter, store, sessions, hasher, clock, logger },
    { perIpPerHour: 20 },
  );

  /** Full sign-up: request → verify → register. */
  async function signUp(phone: string, dateOfBirth = '1995-06-15', dev = device()) {
    await otp.request({ phone, installId: dev.installId, ip: '203.0.113.7' });
    const verified = await otp.verify({
      phone,
      code: FAKE_CODE,
      device: dev,
      ip: '203.0.113.7',
      idempotencyKey: randomUUID(),
    });
    if (verified.result !== 'registration_required') throw new Error('expected new phone');
    return registration.register({
      registrationToken: verified.registrationToken,
      dateOfBirth,
      device: dev,
      ip: '203.0.113.7',
      idempotencyKey: randomUUID(),
    });
  }

  return {
    clock,
    ephemeral,
    store,
    logger,
    hasher,
    accessTokens,
    sessions,
    otp,
    registration,
    signUp,
  };
}

export type IdentityHarness = ReturnType<typeof createIdentityHarness>;
