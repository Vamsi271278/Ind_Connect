import type { CountryPolicy } from '../../../config/app-config.js';
import { type KeyedHasher, generateOpaqueToken, sha256Hex } from '../../../shared/crypto/crypto.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import { canUseSelfService } from '../domain/account.js';
import type { OperationOutcome } from './ephemeral/idempotency-records.js';
import type { IdempotencyRecords } from './ephemeral/idempotency-records.js';
import type { OtpChallenges } from './ephemeral/otp-challenges.js';
import type { RateLimiter, RateRule } from './ephemeral/rate-limiter.js';
import type { RegistrationTokens } from './ephemeral/registration-tokens.js';
import { runIdempotent } from './idempotent-operation.js';
import { type ResolvedPhone, resolvePhone, withTimeout } from './phone-identity.js';
import {
  type Clock,
  type DeviceContext,
  type EventLogger,
  type IdentityStore,
  type PhoneCheckResult,
  PhoneVerificationError,
  type PhoneVerificationProvider,
  type UserRecord,
} from './ports.js';
import type { IssuedSession, SessionService } from './session.service.js';

const HOUR_MS = 60 * 60 * 1000;

export interface OtpSettings {
  readonly codeTtlSeconds: number;
  readonly maxAttempts: number;
  readonly resendCooldownSeconds: number;
  readonly providerTimeoutMs: number;
  readonly sendsPerPhonePerHour: number;
  readonly sendsPerPhonePerDay: number;
  readonly sendsPerIpPerHour: number;
  readonly sendsPerDevicePerHour: number;
  readonly verifiesPerIpPerHour: number;
  readonly registrationTokenTtlSeconds: number;
}

export type VerifyOutcome =
  | {
      readonly result: 'authenticated';
      readonly session: IssuedSession;
      readonly account: UserRecord;
    }
  | {
      readonly result: 'registration_required';
      readonly registrationToken: string;
      readonly registrationTokenExpiresInSeconds: number;
    };

export interface OtpServiceDependencies {
  readonly provider: PhoneVerificationProvider;
  readonly challenges: OtpChallenges;
  readonly rateLimiter: RateLimiter;
  readonly registrationTokens: RegistrationTokens;
  readonly idempotency: IdempotencyRecords;
  readonly store: IdentityStore;
  readonly sessions: SessionService;
  readonly hasher: KeyedHasher;
  readonly countryPolicy: CountryPolicy;
  readonly clock: Clock;
  readonly logger: EventLogger;
}

export class OtpService {
  private readonly rules: {
    readonly phoneHour: RateRule;
    readonly phoneDay: RateRule;
    readonly ipHour: RateRule;
    readonly deviceHour: RateRule;
    readonly verifyIpHour: RateRule;
  };

  constructor(
    private readonly deps: OtpServiceDependencies,
    private readonly settings: OtpSettings,
  ) {
    this.rules = {
      phoneHour: {
        name: 'otp_send_phone_hour',
        limit: settings.sendsPerPhonePerHour,
        windowMs: HOUR_MS,
      },
      phoneDay: {
        name: 'otp_send_phone_day',
        limit: settings.sendsPerPhonePerDay,
        windowMs: 24 * HOUR_MS,
      },
      ipHour: { name: 'otp_send_ip_hour', limit: settings.sendsPerIpPerHour, windowMs: HOUR_MS },
      deviceHour: {
        name: 'otp_send_device_hour',
        limit: settings.sendsPerDevicePerHour,
        windowMs: HOUR_MS,
      },
      verifyIpHour: {
        name: 'otp_verify_ip_hour',
        limit: settings.verifiesPerIpPerHour,
        windowMs: HOUR_MS,
      },
    };
  }

  private phoneHash = (e164: string) => this.deps.hasher.hash('phone', e164);
  private ipHash = (ip: string) => this.deps.hasher.hash('ip', ip);

  /**
   * Starts an OTP challenge. Never reads account data, and responds identically
   * for every accepted number: the response cannot reveal whether an account
   * exists (enumeration resistance).
   */
  async request(input: {
    readonly phone: string;
    readonly installId: string;
    readonly ip: string;
  }): Promise<{ expiresInSeconds: number; resendAvailableInSeconds: number }> {
    const phone = resolvePhone(input.phone, this.deps.countryPolicy);
    const phoneHash = this.phoneHash(phone.e164);

    try {
      const cooldown = await this.deps.challenges.acquireCooldown(phoneHash);
      if (!cooldown.ok) {
        throw new ApplicationError('RATE_LIMITED', {
          retryAfterSeconds: cooldown.retryAfterSeconds,
        });
      }
      const limit = await this.deps.rateLimiter.hitAll([
        [this.rules.phoneHour, phoneHash],
        [this.rules.phoneDay, phoneHash],
        [this.rules.ipHour, this.ipHash(input.ip)],
        [this.rules.deviceHour, this.deps.hasher.hash('install', input.installId)],
      ]);
      if (!limit.allowed) {
        throw new ApplicationError('RATE_LIMITED', { retryAfterSeconds: limit.retryAfterSeconds });
      }
    } catch (error) {
      // Rate limiting cannot be enforced without Redis: fail closed.
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError('OTP_UNAVAILABLE');
    }

    try {
      await this.startWithRetry(phone);
    } catch (error) {
      await this.deps.challenges.releaseCooldown(phoneHash).catch(() => undefined);
      if (error instanceof PhoneVerificationError && error.kind === 'invalid_phone') {
        throw new ApplicationError('PHONE_INVALID');
      }
      this.deps.logger.warn({ event: 'otp.provider_unavailable', phoneHash, operation: 'start' });
      throw new ApplicationError('OTP_UNAVAILABLE');
    }

    try {
      await this.deps.challenges.open(phoneHash);
    } catch {
      throw new ApplicationError('OTP_UNAVAILABLE');
    }

    this.deps.logger.log({ event: 'otp.requested', phoneHash, country: phone.country ?? 'XX' });
    return {
      expiresInSeconds: this.settings.codeTtlSeconds,
      resendAvailableInSeconds: this.settings.resendCooldownSeconds,
    };
  }

  /** One retry on transient provider failure (ADR-073); never on invalid input. */
  private async startWithRetry(phone: ResolvedPhone): Promise<void> {
    const attempt = () =>
      withTimeout(
        this.deps.provider.start({ phoneE164: phone.e164, channel: 'sms' }),
        this.settings.providerTimeoutMs,
      );
    try {
      await attempt();
    } catch (error) {
      if (error instanceof PhoneVerificationError && error.kind === 'invalid_phone') throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.floor(Math.random() * 200)));
      await attempt();
    }
  }

  async verify(input: {
    readonly phone: string;
    readonly code: string;
    readonly device: DeviceContext;
    readonly ip: string;
    readonly idempotencyKey: string;
  }): Promise<VerifyOutcome> {
    const phone = resolvePhone(input.phone, this.deps.countryPolicy);
    const limit = await this.deps.rateLimiter.hit(this.rules.verifyIpHour, this.ipHash(input.ip));
    if (!limit.allowed) {
      throw new ApplicationError('RATE_LIMITED', { retryAfterSeconds: limit.retryAfterSeconds });
    }

    const fingerprint = this.deps.hasher.hash(
      'fingerprint:otp-verify',
      JSON.stringify([phone.e164, input.code, input.device]),
    );
    return runIdempotent(this.deps.idempotency, 'otp-verify', input.idempotencyKey, fingerprint, {
      execute: () => this.executeVerify(phone, input.code, input.device),
      replay: (outcome, handle) => this.replayVerify(outcome, handle, input.device),
    });
  }

  private async executeVerify(
    phone: ResolvedPhone,
    code: string,
    device: DeviceContext,
  ): Promise<{ value: VerifyOutcome; outcome: OperationOutcome }> {
    const phoneHash = this.phoneHash(phone.e164);
    const { challenges } = this.deps;

    const attempts = await challenges.recordAttempt(phoneHash);
    if (attempts === undefined) throw new ApplicationError('OTP_EXPIRED');
    if (attempts > this.settings.maxAttempts) {
      await challenges.close(phoneHash);
      throw new ApplicationError('OTP_ATTEMPTS_EXCEEDED');
    }

    let result: PhoneCheckResult;
    try {
      // Never retried: a retried check could double-count or hit a consumed code.
      result = await withTimeout(
        this.deps.provider.check({ phoneE164: phone.e164, code }),
        this.settings.providerTimeoutMs,
      );
    } catch {
      this.deps.logger.warn({ event: 'otp.provider_unavailable', phoneHash, operation: 'check' });
      throw new ApplicationError('OTP_UNAVAILABLE');
    }

    if (result !== 'approved') {
      const exhausted = result === 'max_attempts' || attempts >= this.settings.maxAttempts;
      if (result === 'expired' || exhausted) await challenges.close(phoneHash);
      this.deps.logger.log({ event: 'otp.verify_failed', phoneHash, result });
      if (result === 'expired') throw new ApplicationError('OTP_EXPIRED');
      throw new ApplicationError(exhausted ? 'OTP_ATTEMPTS_EXCEEDED' : 'OTP_INCORRECT');
    }
    await challenges.close(phoneHash);

    const user = await this.deps.store.repository.findUserByPhone(phone.e164);
    if (user !== undefined) {
      if (!canUseSelfService(user.accountStatus)) throw new ApplicationError('ACCOUNT_NOT_ACTIVE');
      const session = await this.deps.store.transaction((repository) =>
        this.deps.sessions.startSession(repository, user.id, device),
      );
      this.deps.logger.log({ event: 'otp.verified', phoneHash, outcome: 'signed_in' });
      return {
        value: { result: 'authenticated', session, account: user },
        outcome: { type: 'session', sessionId: session.sessionId },
      };
    }

    const registrationToken = generateOpaqueToken();
    const tokenHash = sha256Hex(registrationToken);
    await this.deps.registrationTokens.save(tokenHash, {
      phoneE164: phone.e164,
      phoneVerifiedAt: this.deps.clock.now().toISOString(),
    });
    this.deps.logger.log({ event: 'otp.verified', phoneHash, outcome: 'registration_required' });
    return {
      value: {
        result: 'registration_required',
        registrationToken,
        registrationTokenExpiresInSeconds: this.settings.registrationTokenTtlSeconds,
      },
      outcome: { type: 'registration', tokenHash },
    };
  }

  /**
   * Lost-response recovery. A session is re-issued only if the original was
   * never used (and the original is revoked); a registration token only if the
   * original was never redeemed (the original is consumed in the process).
   */
  private async replayVerify(
    outcome: Exclude<OperationOutcome, { type: 'error' }>,
    handle: Parameters<IdempotencyRecords['complete']>[0],
    device: DeviceContext,
  ): Promise<VerifyOutcome> {
    if (outcome.type === 'session') {
      const session = await this.deps.sessions.replaceUnusedSession(outcome.sessionId, device);
      await this.deps.idempotency
        .complete(handle, { type: 'session', sessionId: session.sessionId })
        .catch(() => undefined);
      const account = await this.deps.store.repository.findUserById(session.userId);
      if (account === undefined) throw new ApplicationError('REPLAY_UNAVAILABLE');
      return { result: 'authenticated', session, account };
    }

    const ticket = await this.deps.registrationTokens.consume(outcome.tokenHash);
    if (ticket === undefined) throw new ApplicationError('REPLAY_UNAVAILABLE');
    const registrationToken = generateOpaqueToken();
    const tokenHash = sha256Hex(registrationToken);
    await this.deps.registrationTokens.save(tokenHash, ticket);
    await this.deps.idempotency
      .complete(handle, { type: 'registration', tokenHash })
      .catch(() => undefined);
    return {
      result: 'registration_required',
      registrationToken,
      registrationTokenExpiresInSeconds: this.settings.registrationTokenTtlSeconds,
    };
  }
}
