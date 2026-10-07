import { Logger, Module } from '@nestjs/common';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { ANALYTICS, type AnalyticsTracker } from '../../shared/analytics/analytics.js';
import { KeyedHasher } from '../../shared/crypto/crypto.js';
import { type Database, DATABASE } from '../../shared/database/database.module.js';
import { EPHEMERAL_STORE, type EphemeralStore } from '../../shared/redis/ephemeral-store.js';
import { AccessTokenGuard } from './api/auth.guard.js';
import { AuthController } from './api/auth.controller.js';
import {
  ONBOARDING_PROGRESS,
  OTP_SERVICE,
  REGISTRATION_SERVICE,
  SELF_ACCOUNT_QUERY,
  SESSION_SERVICE,
} from './api/tokens.js';
import { IdempotencyRecords } from './application/ephemeral/idempotency-records.js';
import { OtpChallenges } from './application/ephemeral/otp-challenges.js';
import { RateLimiter } from './application/ephemeral/rate-limiter.js';
import { RegistrationTokens } from './application/ephemeral/registration-tokens.js';
import { OnboardingProgressService } from './application/onboarding-progress.service.js';
import { OtpService } from './application/otp.service.js';
import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService,
  CLOCK,
  type Clock,
  IDENTITY_STORE,
  type IdentityStore,
  PHONE_VERIFICATION_PROVIDER,
  type PhoneVerificationProvider,
} from './application/ports.js';
import { RegistrationService } from './application/registration.service.js';
import { SelfAccountQuery } from './application/self-account.query.js';
import { SessionService } from './application/session.service.js';
import { FakePhoneVerificationProvider } from './infrastructure/otp/fake-phone-verification.provider.js';
import { DrizzleIdentityStore } from './infrastructure/persistence/drizzle-identity.store.js';
import { systemClock } from './infrastructure/system-clock.js';
import { JoseAccessTokenService } from './infrastructure/tokens/jose-access-token.service.js';

const KEYED_HASHER = Symbol('KEYED_HASHER');
const RATE_LIMITER = Symbol('RATE_LIMITER');
const IDEMPOTENCY_RECORDS = Symbol('IDEMPOTENCY_RECORDS');
const REGISTRATION_TOKENS = Symbol('REGISTRATION_TOKENS');
const OTP_CHALLENGES = Symbol('OTP_CHALLENGES');

const logger = new Logger('Identity');

/**
 * Identity: phone verification, account creation and sessions. Application
 * services are framework-free classes assembled here.
 */
@Module({
  controllers: [AuthController],
  providers: [
    { provide: CLOCK, useValue: systemClock },
    {
      provide: KEYED_HASHER,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => new KeyedHasher(config.phone.hashPepper),
    },
    {
      provide: IDENTITY_STORE,
      inject: [DATABASE],
      useFactory: (db: Database): IdentityStore => new DrizzleIdentityStore(db),
    },
    {
      provide: PHONE_VERIFICATION_PROVIDER,
      inject: [APP_CONFIG, CLOCK],
      useFactory: (config: AppConfig, clock: Clock): PhoneVerificationProvider => {
        // Only the fake provider exists until the Twilio adapter is approved.
        return new FakePhoneVerificationProvider(
          config.otp.fakeCode,
          { codeTtlMs: config.otp.codeTtlSeconds * 1000, maxAttempts: config.otp.maxAttempts },
          clock,
          config.nodeEnv,
        );
      },
    },
    {
      provide: ACCESS_TOKEN_SERVICE,
      inject: [APP_CONFIG, CLOCK],
      useFactory: (config: AppConfig, clock: Clock): AccessTokenService =>
        new JoseAccessTokenService(
          {
            issuer: config.tokens.issuer,
            audience: config.tokens.audience,
            privateKey: config.tokens.privateKey,
            keyId: config.tokens.keyId,
            ttlSeconds: config.tokens.accessTtlSeconds,
          },
          clock,
        ),
    },
    {
      provide: RATE_LIMITER,
      inject: [EPHEMERAL_STORE],
      useFactory: (store: EphemeralStore) => new RateLimiter(store),
    },
    {
      provide: IDEMPOTENCY_RECORDS,
      inject: [EPHEMERAL_STORE, APP_CONFIG],
      useFactory: (store: EphemeralStore, config: AppConfig) =>
        new IdempotencyRecords(store, {
          ttlMs: config.idempotency.ttlSeconds * 1000,
          lockMs: config.idempotency.lockSeconds * 1000,
        }),
    },
    {
      provide: REGISTRATION_TOKENS,
      inject: [EPHEMERAL_STORE, APP_CONFIG],
      useFactory: (store: EphemeralStore, config: AppConfig) =>
        new RegistrationTokens(store, config.registration.tokenTtlSeconds * 1000),
    },
    {
      provide: OTP_CHALLENGES,
      inject: [EPHEMERAL_STORE, APP_CONFIG],
      useFactory: (store: EphemeralStore, config: AppConfig) =>
        new OtpChallenges(store, {
          codeTtlMs: config.otp.codeTtlSeconds * 1000,
          cooldownMs: config.otp.resendCooldownSeconds * 1000,
        }),
    },
    {
      provide: SESSION_SERVICE,
      inject: [IDENTITY_STORE, ACCESS_TOKEN_SERVICE, RATE_LIMITER, CLOCK, APP_CONFIG],
      useFactory: (
        store: IdentityStore,
        tokens: AccessTokenService,
        rateLimiter: RateLimiter,
        clock: Clock,
        config: AppConfig,
      ) =>
        new SessionService(
          store,
          tokens,
          rateLimiter,
          clock,
          {
            refreshRollingDays: config.tokens.refreshRollingDays,
            familyMaxDays: config.tokens.familyMaxDays,
            refreshGraceSeconds: config.tokens.refreshGraceSeconds,
            refreshesPerFamilyPerHour: config.refresh.perFamilyPerHour,
          },
          logger,
        ),
    },
    {
      provide: OTP_SERVICE,
      inject: [
        PHONE_VERIFICATION_PROVIDER,
        OTP_CHALLENGES,
        RATE_LIMITER,
        REGISTRATION_TOKENS,
        IDEMPOTENCY_RECORDS,
        IDENTITY_STORE,
        SESSION_SERVICE,
        KEYED_HASHER,
        CLOCK,
        APP_CONFIG,
        ANALYTICS,
      ],
      useFactory: (
        provider: PhoneVerificationProvider,
        challenges: OtpChallenges,
        rateLimiter: RateLimiter,
        registrationTokens: RegistrationTokens,
        idempotency: IdempotencyRecords,
        store: IdentityStore,
        sessions: SessionService,
        hasher: KeyedHasher,
        clock: Clock,
        config: AppConfig,
        analytics: AnalyticsTracker,
      ) =>
        new OtpService(
          {
            provider,
            challenges,
            rateLimiter,
            registrationTokens,
            idempotency,
            store,
            sessions,
            hasher,
            countryPolicy: config.phone.countryPolicy,
            clock,
            logger,
            analytics,
          },
          {
            codeTtlSeconds: config.otp.codeTtlSeconds,
            maxAttempts: config.otp.maxAttempts,
            resendCooldownSeconds: config.otp.resendCooldownSeconds,
            providerTimeoutMs: config.otp.providerTimeoutMs,
            sendsPerPhonePerHour: config.otp.sendsPerPhonePerHour,
            sendsPerPhonePerDay: config.otp.sendsPerPhonePerDay,
            sendsPerIpPerHour: config.otp.sendsPerIpPerHour,
            sendsPerDevicePerHour: config.otp.sendsPerDevicePerHour,
            verifiesPerIpPerHour: config.otp.verifiesPerIpPerHour,
            registrationTokenTtlSeconds: config.registration.tokenTtlSeconds,
          },
        ),
    },
    {
      provide: REGISTRATION_SERVICE,
      inject: [
        REGISTRATION_TOKENS,
        IDEMPOTENCY_RECORDS,
        RATE_LIMITER,
        IDENTITY_STORE,
        SESSION_SERVICE,
        KEYED_HASHER,
        CLOCK,
        APP_CONFIG,
      ],
      useFactory: (
        registrationTokens: RegistrationTokens,
        idempotency: IdempotencyRecords,
        rateLimiter: RateLimiter,
        store: IdentityStore,
        sessions: SessionService,
        hasher: KeyedHasher,
        clock: Clock,
        config: AppConfig,
      ) =>
        new RegistrationService(
          { registrationTokens, idempotency, rateLimiter, store, sessions, hasher, clock, logger },
          { perIpPerHour: config.registration.perIpPerHour },
        ),
    },
    {
      provide: ONBOARDING_PROGRESS,
      inject: [IDENTITY_STORE, CLOCK],
      useFactory: (store: IdentityStore, clock: Clock) =>
        new OnboardingProgressService(store, clock),
    },
    {
      provide: SELF_ACCOUNT_QUERY,
      inject: [IDENTITY_STORE, CLOCK],
      useFactory: (store: IdentityStore, clock: Clock) => new SelfAccountQuery(store, clock),
    },
    AccessTokenGuard,
  ],
  // Identity's public surface for other modules. Persistence stays private.
  exports: [SESSION_SERVICE, ONBOARDING_PROGRESS, SELF_ACCOUNT_QUERY, AccessTokenGuard],
})
export class IdentityModule {}
