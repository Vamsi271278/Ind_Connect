import { deviceContextSchema } from '@project-connect/api-contracts';
import { and, eq, isNull, min, ne, sql } from 'drizzle-orm';

import type { Database, DbExecutor } from '../../../../shared/database/database.module.js';
import { executorOf } from '../../../../shared/database/drizzle-unit-of-work.js';
import type { TransactionContext } from '../../../../shared/database/unit-of-work.js';
import { auditEvents, userSessions, users } from '../../../../shared/database/schema/index.js';
import { currentCorrelationId } from '../../../../shared/observability/request-context.js';
import {
  type AccountStatus,
  isAccountStatus,
  isOnboardingStatus,
  isOnboardingStep,
} from '../../domain/account.js';
import { REVOCATION_REASONS, type RevocationReason } from '../../domain/session-policy.js';
import {
  type AuditEntry,
  type AuthSessionView,
  type IdentityRepository,
  type IdentityStore,
  type LockedSession,
  type NewSession,
  type NewUser,
  type OnboardingState,
  PhoneAlreadyRegisteredError,
  type SelfAccountFacts,
  type SessionRecord,
  type UserRecord,
} from '../../application/ports.js';

type UserRow = typeof users.$inferSelect;
type SessionRow = typeof userSessions.$inferSelect;

const UNIQUE_VIOLATION = '23505';
const PHONE_UNIQUE_CONSTRAINT = 'users_phone_e164_not_deleted_uq';

/** Rows come from our own constraints; anything else is data corruption. */
class PersistenceInvariantError extends Error {
  override readonly name = 'PersistenceInvariantError';
}

function toAccountStatus(value: string): AccountStatus {
  if (!isAccountStatus(value)) throw new PersistenceInvariantError('account_status');
  return value;
}

function toUser(
  row: Pick<UserRow, 'id' | 'accountStatus' | 'onboardingStatus' | 'onboardingStep'>,
): UserRecord {
  if (!isOnboardingStatus(row.onboardingStatus) || !isOnboardingStep(row.onboardingStep)) {
    throw new PersistenceInvariantError('onboarding state');
  }
  return {
    id: row.id,
    accountStatus: toAccountStatus(row.accountStatus),
    onboardingStatus: row.onboardingStatus,
    onboardingStep: row.onboardingStep,
  };
}

function toRevocationReason(value: string | null): RevocationReason | null {
  if (value === null) return null;
  const reason = REVOCATION_REASONS.find((candidate) => candidate === value);
  if (reason === undefined) throw new PersistenceInvariantError('revocation_reason');
  return reason;
}

function toSession(row: SessionRow): SessionRecord {
  const device = deviceContextSchema.safeParse(row.deviceContext);
  if (!device.success) throw new PersistenceInvariantError('device_context');
  return {
    id: row.id,
    userId: row.userId,
    tokenFamilyId: row.tokenFamilyId,
    device: device.data,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    revocationReason: toRevocationReason(row.revocationReason),
    replacedBySessionId: row.replacedBySessionId,
    rotatedAt: row.rotatedAt,
  };
}

function isPhoneUniqueViolation(error: unknown): boolean {
  const candidates = [error, error instanceof Error ? error.cause : undefined];
  return candidates.some(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'code' in candidate &&
      candidate.code === UNIQUE_VIOLATION &&
      'constraint' in candidate &&
      candidate.constraint === PHONE_UNIQUE_CONSTRAINT,
  );
}

const userColumns = {
  id: users.id,
  accountStatus: users.accountStatus,
  onboardingStatus: users.onboardingStatus,
  onboardingStep: users.onboardingStep,
};

export class DrizzleIdentityRepository implements IdentityRepository {
  constructor(private readonly db: DbExecutor) {}

  async findUserByPhone(phoneE164: string): Promise<UserRecord | undefined> {
    const [row] = await this.db
      .select(userColumns)
      .from(users)
      .where(and(eq(users.phoneE164, phoneE164), ne(users.accountStatus, 'DELETED')))
      .limit(1);
    return row === undefined ? undefined : toUser(row);
  }

  async findUserById(userId: string): Promise<UserRecord | undefined> {
    const [row] = await this.db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row === undefined ? undefined : toUser(row);
  }

  async insertUser(user: NewUser): Promise<UserRecord> {
    try {
      const [row] = await this.db
        .insert(users)
        .values({
          phoneE164: user.phoneE164,
          phoneVerifiedAt: user.phoneVerifiedAt,
          dateOfBirth: user.dateOfBirth,
          accountStatus: user.accountStatus,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep,
        })
        .returning(userColumns);
      if (row === undefined) throw new PersistenceInvariantError('insert returned no row');
      return toUser(row);
    } catch (error) {
      if (isPhoneUniqueViolation(error)) throw new PhoneAlreadyRegisteredError();
      throw error;
    }
  }

  async insertSession(session: NewSession): Promise<SessionRecord> {
    const [row] = await this.db
      .insert(userSessions)
      .values({
        userId: session.userId,
        tokenFamilyId: session.tokenFamilyId,
        refreshTokenHash: session.refreshTokenHash,
        deviceContext: session.device,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })
      .returning();
    if (row === undefined) throw new PersistenceInvariantError('insert returned no row');
    return toSession(row);
  }

  async findSessionFamilyByTokenHash(refreshTokenHash: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ tokenFamilyId: userSessions.tokenFamilyId })
      .from(userSessions)
      .where(eq(userSessions.refreshTokenHash, refreshTokenHash))
      .limit(1);
    return row?.tokenFamilyId;
  }

  private async lockOne(condition: ReturnType<typeof eq>): Promise<LockedSession | undefined> {
    const [row] = await this.db
      .select({ session: userSessions, accountStatus: users.accountStatus })
      .from(userSessions)
      .innerJoin(users, eq(users.id, userSessions.userId))
      .where(condition)
      .for('update', { of: userSessions })
      .limit(1);
    return row === undefined
      ? undefined
      : { session: toSession(row.session), accountStatus: toAccountStatus(row.accountStatus) };
  }

  lockSessionByTokenHash(refreshTokenHash: string): Promise<LockedSession | undefined> {
    return this.lockOne(eq(userSessions.refreshTokenHash, refreshTokenHash));
  }

  lockSessionById(sessionId: string): Promise<LockedSession | undefined> {
    return this.lockOne(eq(userSessions.id, sessionId));
  }

  async familyStartedAt(tokenFamilyId: string): Promise<Date> {
    const [row] = await this.db
      .select({ startedAt: min(userSessions.createdAt) })
      .from(userSessions)
      .where(eq(userSessions.tokenFamilyId, tokenFamilyId));
    if (row?.startedAt == null) throw new PersistenceInvariantError('empty session family');
    return row.startedAt;
  }

  async markRotated(sessionId: string, successorId: string, at: Date): Promise<void> {
    await this.db
      .update(userSessions)
      .set({
        revokedAt: at,
        revocationReason: 'ROTATED',
        rotatedAt: at,
        replacedBySessionId: successorId,
        lastUsedAt: sql`coalesce(${userSessions.lastUsedAt}, ${at})`,
      })
      .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt)));
  }

  private async revokeWithSuccessor(
    sessionId: string,
    successorId: string,
    reason: 'SUPERSEDED' | 'REPLAY_REPLACED',
    at: Date,
  ): Promise<void> {
    await this.db
      .update(userSessions)
      .set({ revokedAt: at, revocationReason: reason, replacedBySessionId: successorId })
      .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt)));
  }

  markSuperseded(sessionId: string, successorId: string, at: Date): Promise<void> {
    return this.revokeWithSuccessor(sessionId, successorId, 'SUPERSEDED', at);
  }

  markReplayReplaced(sessionId: string, successorId: string, at: Date): Promise<void> {
    return this.revokeWithSuccessor(sessionId, successorId, 'REPLAY_REPLACED', at);
  }

  async relinkSuccessor(sessionId: string, successorId: string): Promise<void> {
    await this.db
      .update(userSessions)
      .set({ replacedBySessionId: successorId })
      .where(eq(userSessions.id, sessionId));
  }

  async revokeFamily(tokenFamilyId: string, reason: RevocationReason, at: Date): Promise<number> {
    const rows = await this.db
      .update(userSessions)
      .set({ revokedAt: at, revocationReason: reason })
      .where(and(eq(userSessions.tokenFamilyId, tokenFamilyId), isNull(userSessions.revokedAt)))
      .returning({ id: userSessions.id });
    return rows.length;
  }

  async revokeAllForUser(userId: string, reason: RevocationReason, at: Date): Promise<number> {
    const rows = await this.db
      .update(userSessions)
      .set({ revokedAt: at, revocationReason: reason })
      .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)))
      .returning({ id: userSessions.id });
    return rows.length;
  }

  async findAuthSession(sessionId: string): Promise<AuthSessionView | undefined> {
    const [row] = await this.db
      .select({
        sessionId: userSessions.id,
        userId: userSessions.userId,
        tokenFamilyId: userSessions.tokenFamilyId,
        expiresAt: userSessions.expiresAt,
        revokedAt: userSessions.revokedAt,
        lastUsedAt: userSessions.lastUsedAt,
        accountStatus: users.accountStatus,
      })
      .from(userSessions)
      .innerJoin(users, eq(users.id, userSessions.userId))
      .where(eq(userSessions.id, sessionId))
      .limit(1);
    return row === undefined
      ? undefined
      : { ...row, accountStatus: toAccountStatus(row.accountStatus) };
  }

  async markSessionUsed(sessionId: string, at: Date): Promise<void> {
    await this.db
      .update(userSessions)
      .set({ lastUsedAt: at })
      .where(and(eq(userSessions.id, sessionId), isNull(userSessions.lastUsedAt)));
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    await this.db.insert(auditEvents).values({
      actorType: entry.actorType,
      actorId: entry.actorId,
      actionCode: entry.actionCode,
      entityType: entry.entityType,
      entityId: entry.entityId,
      reasonCode: entry.reasonCode,
      correlationId: currentCorrelationId() ?? null,
      metadata: entry.metadata ?? null,
    });
  }

  async findSelfAccountFacts(userId: string): Promise<SelfAccountFacts | undefined> {
    const [row] = await this.db
      .select({ ...userColumns, phoneE164: users.phoneE164, dateOfBirth: users.dateOfBirth })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row === undefined
      ? undefined
      : { ...toUser(row), phoneE164: row.phoneE164, dateOfBirth: row.dateOfBirth };
  }

  async lockOnboarding(userId: string): Promise<OnboardingState | undefined> {
    const [row] = await this.db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, userId))
      .for('update')
      .limit(1);
    if (row === undefined) return undefined;
    const user = toUser(row);
    return { status: user.onboardingStatus, step: user.onboardingStep };
  }

  async updateOnboarding(userId: string, state: OnboardingState, at: Date): Promise<void> {
    await this.db
      .update(users)
      .set({ onboardingStatus: state.status, onboardingStep: state.step, updatedAt: at })
      .where(eq(users.id, userId));
  }
}

export class DrizzleIdentityStore implements IdentityStore {
  readonly repository: IdentityRepository;

  constructor(private readonly db: Database) {
    this.repository = new DrizzleIdentityRepository(db);
  }

  transaction<T>(work: (repository: IdentityRepository) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(new DrizzleIdentityRepository(tx)));
  }

  forTransaction(tx: TransactionContext): IdentityRepository {
    return new DrizzleIdentityRepository(executorOf(tx));
  }
}
