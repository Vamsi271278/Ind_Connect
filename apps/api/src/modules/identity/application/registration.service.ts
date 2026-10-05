import type { KeyedHasher } from '../../../shared/crypto/crypto.js';
import { sha256Hex } from '../../../shared/crypto/crypto.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import { FIRST_STEP_AFTER_REGISTRATION } from '../domain/account.js';
import { assessAge, formatCalendarDate, parseCalendarDate } from '../domain/age.js';
import type { IdempotencyRecords, OperationOutcome } from './ephemeral/idempotency-records.js';
import type { RateLimiter, RateRule } from './ephemeral/rate-limiter.js';
import type { RegistrationTokens } from './ephemeral/registration-tokens.js';
import { runIdempotent } from './idempotent-operation.js';
import {
  type Clock,
  type DeviceContext,
  type EventLogger,
  type IdentityStore,
  PhoneAlreadyRegisteredError,
  type UserRecord,
} from './ports.js';
import type { IssuedSession, SessionService } from './session.service.js';

export interface RegistrationOutcome {
  readonly session: IssuedSession;
  readonly account: UserRecord;
}

export interface RegistrationServiceDependencies {
  readonly registrationTokens: RegistrationTokens;
  readonly idempotency: IdempotencyRecords;
  readonly rateLimiter: RateLimiter;
  readonly store: IdentityStore;
  readonly sessions: SessionService;
  readonly hasher: KeyedHasher;
  readonly clock: Clock;
  readonly logger: EventLogger;
}

/**
 * Creates an account from a verified phone (registration token) and a date of
 * birth. The server is the final age authority: an under-18 attempt persists
 * nothing — no user row, no session, no log identifier.
 */
export class RegistrationService {
  private readonly ipRule: RateRule;

  constructor(
    private readonly deps: RegistrationServiceDependencies,
    settings: { readonly perIpPerHour: number },
  ) {
    this.ipRule = {
      name: 'registration_ip_hour',
      limit: settings.perIpPerHour,
      windowMs: 60 * 60 * 1000,
    };
  }

  async register(input: {
    readonly registrationToken: string;
    readonly dateOfBirth: string;
    readonly device: DeviceContext;
    readonly ip: string;
    readonly idempotencyKey: string;
  }): Promise<RegistrationOutcome> {
    const dateOfBirth = parseCalendarDate(input.dateOfBirth);
    // Implausible input (future, pre-1900) is rejected before the token is
    // touched, so a typo does not burn the verified phone.
    if (
      dateOfBirth === undefined ||
      assessAge(dateOfBirth, this.deps.clock.now()) === 'implausible'
    ) {
      throw new ApplicationError('VALIDATION_FAILED', {
        issues: [{ path: 'dateOfBirth', code: 'invalid_date' }],
      });
    }

    const limit = await this.deps.rateLimiter.hit(
      this.ipRule,
      this.deps.hasher.hash('ip', input.ip),
    );
    if (!limit.allowed) {
      throw new ApplicationError('RATE_LIMITED', { retryAfterSeconds: limit.retryAfterSeconds });
    }

    const tokenHash = sha256Hex(input.registrationToken);
    const fingerprint = this.deps.hasher.hash(
      'fingerprint:registration',
      JSON.stringify([tokenHash, input.dateOfBirth, input.device]),
    );

    return runIdempotent(this.deps.idempotency, 'registration', input.idempotencyKey, fingerprint, {
      execute: async (): Promise<{ value: RegistrationOutcome; outcome: OperationOutcome }> => {
        const ticket = await this.deps.registrationTokens.consume(tokenHash);
        if (ticket === undefined) throw new ApplicationError('REGISTRATION_TOKEN_INVALID');

        const assessment = assessAge(dateOfBirth, this.deps.clock.now());
        if (assessment !== 'eligible') {
          // Deliberately no identifiers: nothing about an under-18 attempt is kept.
          this.deps.logger.log({ event: 'registration.age_rejected' });
          throw new ApplicationError(
            assessment === 'underage' ? 'AGE_NOT_ELIGIBLE' : 'VALIDATION_FAILED',
          );
        }

        let created: RegistrationOutcome;
        try {
          created = await this.deps.store.transaction(async (repository) => {
            const account = await repository.insertUser({
              phoneE164: ticket.phoneE164,
              phoneVerifiedAt: new Date(ticket.phoneVerifiedAt),
              dateOfBirth: formatCalendarDate(dateOfBirth),
              accountStatus: 'PENDING_VERIFICATION',
              onboardingStatus: 'IN_PROGRESS',
              onboardingStep: FIRST_STEP_AFTER_REGISTRATION,
            });
            const session = await this.deps.sessions.startSession(
              repository,
              account.id,
              input.device,
            );
            await repository.appendAudit({
              actorType: 'USER',
              actorId: account.id,
              actionCode: 'USER_REGISTERED',
              entityType: 'user',
              entityId: account.id,
              reasonCode: null,
            });
            return { session, account };
          });
        } catch (error) {
          if (error instanceof PhoneAlreadyRegisteredError) {
            throw new ApplicationError('PHONE_ALREADY_REGISTERED');
          }
          throw error;
        }

        this.deps.logger.log({ event: 'registration.completed', userId: created.account.id });
        return {
          value: created,
          outcome: { type: 'session', sessionId: created.session.sessionId },
        };
      },

      replay: async (outcome, handle) => {
        if (outcome.type !== 'session') throw new ApplicationError('REPLAY_UNAVAILABLE');
        const session = await this.deps.sessions.replaceUnusedSession(
          outcome.sessionId,
          input.device,
        );
        await this.deps.idempotency
          .complete(handle, { type: 'session', sessionId: session.sessionId })
          .catch(() => undefined);
        const account = await this.deps.store.repository.findUserById(session.userId);
        if (account === undefined) throw new ApplicationError('REPLAY_UNAVAILABLE');
        return { session, account };
      },
    });
  }
}
