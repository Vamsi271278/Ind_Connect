import { randomUUID } from 'node:crypto';

import { generateOpaqueToken, sha256Hex } from '../../../shared/crypto/crypto.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import { type AccountStatus, canUseSelfService } from '../domain/account.js';
import { decideRefresh, nextRefreshExpiry } from '../domain/session-policy.js';
import type { RateLimiter, RateRule } from './ephemeral/rate-limiter.js';
import type {
  AccessTokenService,
  Clock,
  DeviceContext,
  EventLogger,
  IdentityRepository,
  IdentityStore,
} from './ports.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SessionSettings {
  readonly refreshRollingDays: number;
  readonly familyMaxDays: number;
  readonly refreshGraceSeconds: number;
  readonly refreshesPerFamilyPerHour: number;
}

export interface IssuedTokens {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: string;
}

export interface IssuedSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly tokens: IssuedTokens;
}

export interface AuthContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly tokenFamilyId: string;
  readonly accountStatus: AccountStatus;
}

export type AccountStatusRequirement = 'self_service' | 'any';

/** Outcomes that must commit before an error is surfaced (never rolled back). */
type RefreshTransactionResult =
  | { readonly kind: 'issued'; readonly session: IssuedSession }
  | { readonly kind: 'failed'; readonly code: 'SESSION_INVALID' | 'ACCOUNT_NOT_ACTIVE' };

export class SessionService {
  private readonly refreshRule: RateRule;

  constructor(
    private readonly store: IdentityStore,
    private readonly accessTokens: AccessTokenService,
    private readonly rateLimiter: RateLimiter,
    private readonly clock: Clock,
    private readonly settings: SessionSettings,
    private readonly logger: EventLogger,
  ) {
    this.refreshRule = {
      name: 'refresh_family_hour',
      limit: settings.refreshesPerFamilyPerHour,
      windowMs: 60 * 60 * 1000,
    };
  }

  private get rollingMs(): number {
    return this.settings.refreshRollingDays * DAY_MS;
  }

  private get familyMaxMs(): number {
    return this.settings.familyMaxDays * DAY_MS;
  }

  /** Starts a new token family (a sign-in) inside the caller's transaction. */
  async startSession(
    repository: IdentityRepository,
    userId: string,
    device: DeviceContext,
  ): Promise<IssuedSession> {
    const now = this.clock.now();
    const refreshToken = generateOpaqueToken();
    const expiresAt = nextRefreshExpiry({
      now,
      familyStartedAt: now,
      rollingMs: this.rollingMs,
      familyMaxMs: this.familyMaxMs,
    });
    const row = await repository.insertSession({
      userId,
      tokenFamilyId: randomUUID(),
      refreshTokenHash: sha256Hex(refreshToken),
      device,
      createdAt: now,
      expiresAt,
    });
    return this.issue(row.id, userId, refreshToken, expiresAt);
  }

  private async issue(
    sessionId: string,
    userId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<IssuedSession> {
    const access = await this.accessTokens.issue({ userId, sessionId });
    return {
      sessionId,
      userId,
      tokens: {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt.toISOString(),
        refreshToken,
        refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      },
    };
  }

  /** Creates the successor row of `predecessor` in the same family. */
  private async insertSuccessor(
    repository: IdentityRepository,
    predecessor: { readonly userId: string; readonly tokenFamilyId: string },
    device: DeviceContext,
    now: Date,
  ): Promise<{ readonly id: string; readonly refreshToken: string; readonly expiresAt: Date }> {
    const familyStartedAt = await repository.familyStartedAt(predecessor.tokenFamilyId);
    const refreshToken = generateOpaqueToken();
    const expiresAt = nextRefreshExpiry({
      now,
      familyStartedAt,
      rollingMs: this.rollingMs,
      familyMaxMs: this.familyMaxMs,
    });
    const row = await repository.insertSession({
      userId: predecessor.userId,
      tokenFamilyId: predecessor.tokenFamilyId,
      refreshTokenHash: sha256Hex(refreshToken),
      device,
      createdAt: now,
      expiresAt,
    });
    return { id: row.id, refreshToken, expiresAt };
  }

  async refresh(refreshToken: string, device: DeviceContext): Promise<IssuedSession> {
    const tokenHash = sha256Hex(refreshToken);

    const familyId = await this.store.repository.findSessionFamilyByTokenHash(tokenHash);
    if (familyId === undefined) throw new ApplicationError('SESSION_INVALID');
    const limit = await this.rateLimiter.hit(this.refreshRule, familyId);
    if (!limit.allowed) {
      throw new ApplicationError('RATE_LIMITED', { retryAfterSeconds: limit.retryAfterSeconds });
    }

    const result = await this.store.transaction(
      async (repository): Promise<RefreshTransactionResult> => {
        const now = this.clock.now();
        const locked = await repository.lockSessionByTokenHash(tokenHash);
        if (locked === undefined) return { kind: 'failed', code: 'SESSION_INVALID' };
        const { session, accountStatus } = locked;

        const successor =
          session.replacedBySessionId === null
            ? undefined
            : (await repository.lockSessionById(session.replacedBySessionId))?.session;

        const decision = decideRefresh({
          presented: {
            installId: session.device.installId,
            expiresAt: session.expiresAt,
            familyStartedAt: await repository.familyStartedAt(session.tokenFamilyId),
            revokedAt: session.revokedAt,
            revocationReason: session.revocationReason,
            rotatedAt: session.rotatedAt,
          },
          successor:
            successor === undefined
              ? undefined
              : {
                  installId: successor.device.installId,
                  lastUsedAt: successor.lastUsedAt,
                  revokedAt: successor.revokedAt,
                },
          presentedInstallId: device.installId,
          now,
          policy: {
            graceMs: this.settings.refreshGraceSeconds * 1000,
            familyMaxMs: this.familyMaxMs,
          },
        });

        if (decision.kind === 'invalid') return { kind: 'failed', code: 'SESSION_INVALID' };

        if (decision.kind === 'reuse_detected') {
          const revoked = await repository.revokeFamily(
            session.tokenFamilyId,
            'REUSE_DETECTED',
            now,
          );
          await repository.appendAudit({
            actorType: 'SYSTEM',
            actorId: null,
            actionCode: 'SESSION_REUSE_DETECTED',
            entityType: 'session_family',
            entityId: session.tokenFamilyId,
            reasonCode: 'REUSE_DETECTED',
            metadata: { userId: session.userId, sessionsRevoked: revoked },
          });
          return { kind: 'failed', code: 'SESSION_INVALID' };
        }

        if (!canUseSelfService(accountStatus))
          return { kind: 'failed', code: 'ACCOUNT_NOT_ACTIVE' };

        const next = await this.insertSuccessor(repository, session, device, now);
        if (decision.kind === 'rotate') {
          await repository.markRotated(session.id, next.id, now);
        } else {
          // grace_retry: the unused successor is superseded; the presented
          // (rotated) row now points at the replacement. rotated_at is kept,
          // so the grace window cannot be extended by further retries.
          if (successor !== undefined) await repository.markSuperseded(successor.id, next.id, now);
          await repository.relinkSuccessor(session.id, next.id);
        }
        return {
          kind: 'issued',
          session: await this.issue(next.id, session.userId, next.refreshToken, next.expiresAt),
        };
      },
    );

    if (result.kind === 'failed') {
      if (result.code === 'SESSION_INVALID') {
        this.logger.warn({ event: 'session.refresh_rejected', tokenFamilyId: familyId });
      }
      throw new ApplicationError(result.code);
    }
    this.logger.log({ event: 'session.refreshed', tokenFamilyId: familyId });
    return result.session;
  }

  /**
   * Replay recovery for a lost sign-in response: the previously issued session
   * is replaced only if it was never used. Anything else means the response was
   * received (or the session already ended), so no new credentials are minted.
   */
  async replaceUnusedSession(sessionId: string, device: DeviceContext): Promise<IssuedSession> {
    const result = await this.store.transaction(
      async (repository): Promise<IssuedSession | 'unavailable' | 'inactive'> => {
        const now = this.clock.now();
        const locked = await repository.lockSessionById(sessionId);
        if (locked === undefined) return 'unavailable';
        const { session, accountStatus } = locked;
        const neverUsed =
          session.revokedAt === null &&
          session.lastUsedAt === null &&
          session.replacedBySessionId === null &&
          session.device.installId === device.installId &&
          now < session.expiresAt;
        if (!neverUsed) return 'unavailable';
        if (!canUseSelfService(accountStatus)) return 'inactive';

        const next = await this.insertSuccessor(repository, session, device, now);
        await repository.markReplayReplaced(session.id, next.id, now);
        return this.issue(next.id, session.userId, next.refreshToken, next.expiresAt);
      },
    );
    if (result === 'unavailable') throw new ApplicationError('REPLAY_UNAVAILABLE');
    if (result === 'inactive') throw new ApplicationError('ACCOUNT_NOT_ACTIVE');
    return result;
  }

  /**
   * Ends the sign-in that `refreshToken` belongs to. Always succeeds from the
   * caller's view, so it cannot be used to probe token validity.
   */
  async logout(refreshToken: string): Promise<void> {
    const familyId = await this.store.transaction(async (repository) => {
      const locked = await repository.lockSessionByTokenHash(sha256Hex(refreshToken));
      if (locked === undefined) return undefined;
      await repository.revokeFamily(locked.session.tokenFamilyId, 'LOGOUT', this.clock.now());
      return locked.session.tokenFamilyId;
    });
    if (familyId !== undefined)
      this.logger.log({ event: 'session.logout', tokenFamilyId: familyId });
  }

  async logoutAll(auth: AuthContext): Promise<void> {
    await this.store.transaction(async (repository) => {
      const revoked = await repository.revokeAllForUser(
        auth.userId,
        'LOGOUT_ALL',
        this.clock.now(),
      );
      await repository.appendAudit({
        actorType: 'USER',
        actorId: auth.userId,
        actionCode: 'USER_LOGOUT_ALL',
        entityType: 'user',
        entityId: auth.userId,
        reasonCode: null,
        metadata: { sessionsRevoked: revoked },
      });
    });
    this.logger.log({ event: 'session.logout_all', userId: auth.userId });
  }

  /**
   * Authenticates a bearer access token. The token proves identity only; the
   * session's revocation state and the account's status are re-read from
   * PostgreSQL on every request (ADR-044), so revocation is immediate.
   */
  async authenticate(
    accessToken: string,
    requirement: AccountStatusRequirement,
  ): Promise<AuthContext> {
    const claims = await this.accessTokens.verify(accessToken);
    if (claims === undefined) throw new ApplicationError('AUTH_REQUIRED');

    const view = await this.store.repository.findAuthSession(claims.sessionId);
    const now = this.clock.now();
    if (
      view === undefined ||
      view.userId !== claims.userId ||
      view.revokedAt !== null ||
      now >= view.expiresAt
    ) {
      throw new ApplicationError('AUTH_REQUIRED');
    }
    if (requirement === 'self_service' && !canUseSelfService(view.accountStatus)) {
      throw new ApplicationError('ACCOUNT_NOT_ACTIVE');
    }
    if (view.lastUsedAt === null) await this.store.repository.markSessionUsed(view.sessionId, now);

    return {
      userId: view.userId,
      sessionId: view.sessionId,
      tokenFamilyId: view.tokenFamilyId,
      accountStatus: view.accountStatus,
    };
  }
}
