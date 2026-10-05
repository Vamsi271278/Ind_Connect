import { randomUUID } from 'node:crypto';

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
} from '../../src/modules/identity/application/ports.js';
import type { AccountStatus } from '../../src/modules/identity/domain/account.js';
import type { RevocationReason } from '../../src/modules/identity/domain/session-policy.js';

export interface StoredUser extends UserRecord {
  phoneE164: string;
  dateOfBirth: string;
  accountStatus: AccountStatus;
}

export type StoredSession = {
  -readonly [K in keyof SessionRecord]: SessionRecord[K];
};

interface State {
  users: StoredUser[];
  sessions: (StoredSession & { refreshTokenHash: string })[];
  audit: AuditEntry[];
}

/**
 * Test double for the identity persistence port. Enforces the same
 * phone-uniqueness rule as the database and rolls back on transaction failure.
 * Database behavior itself is verified against real PostgreSQL (ADR-053).
 */
export class InMemoryIdentityStore implements IdentityStore {
  state: State = { users: [], sessions: [], audit: [] };
  readonly repository: IdentityRepository = new InMemoryIdentityRepository(() => this.state);

  async transaction<T>(work: (repository: IdentityRepository) => Promise<T>): Promise<T> {
    const snapshot = structuredClone(this.state);
    try {
      return await work(this.repository);
    } catch (error) {
      this.state = snapshot;
      throw error;
    }
  }

  /** Single in-memory state: the shared transaction is the store itself. */
  forTransaction(): IdentityRepository {
    return this.repository;
  }

  session(id: string): StoredSession {
    const found = this.state.sessions.find((s) => s.id === id);
    if (found === undefined) throw new Error(`no session ${id}`);
    return found;
  }

  setAccountStatus(userId: string, status: AccountStatus): void {
    const user = this.state.users.find((u) => u.id === userId);
    if (user === undefined) throw new Error(`no user ${userId}`);
    user.accountStatus = status;
  }
}

const toRecord = (s: StoredSession): SessionRecord => ({
  id: s.id,
  userId: s.userId,
  tokenFamilyId: s.tokenFamilyId,
  device: s.device,
  createdAt: s.createdAt,
  lastUsedAt: s.lastUsedAt,
  expiresAt: s.expiresAt,
  revokedAt: s.revokedAt,
  revocationReason: s.revocationReason,
  replacedBySessionId: s.replacedBySessionId,
  rotatedAt: s.rotatedAt,
});

class InMemoryIdentityRepository implements IdentityRepository {
  constructor(private readonly state: () => State) {}

  private user(id: string): StoredUser | undefined {
    return this.state().users.find((u) => u.id === id);
  }

  private locked(session: State['sessions'][number] | undefined): LockedSession | undefined {
    if (session === undefined) return undefined;
    const user = this.user(session.userId);
    if (user === undefined) return undefined;
    return { session: toRecord(session), accountStatus: user.accountStatus };
  }

  private sessionById(id: string) {
    const found = this.state().sessions.find((s) => s.id === id);
    if (found === undefined) throw new Error(`no session ${id}`);
    return found;
  }

  findUserByPhone(phoneE164: string): Promise<UserRecord | undefined> {
    return Promise.resolve(
      this.state().users.find((u) => u.phoneE164 === phoneE164 && u.accountStatus !== 'DELETED'),
    );
  }

  findUserById(userId: string): Promise<UserRecord | undefined> {
    return Promise.resolve(this.user(userId));
  }

  insertUser(user: NewUser): Promise<UserRecord> {
    const taken = this.state().users.some(
      (u) => u.phoneE164 === user.phoneE164 && u.accountStatus !== 'DELETED',
    );
    if (taken) return Promise.reject(new PhoneAlreadyRegisteredError());
    const stored: StoredUser = { id: randomUUID(), ...user };
    this.state().users.push(stored);
    return Promise.resolve({ ...stored });
  }

  insertSession(session: NewSession): Promise<SessionRecord> {
    const stored = {
      id: randomUUID(),
      userId: session.userId,
      tokenFamilyId: session.tokenFamilyId,
      device: session.device,
      createdAt: session.createdAt,
      lastUsedAt: null,
      expiresAt: session.expiresAt,
      revokedAt: null,
      revocationReason: null,
      replacedBySessionId: null,
      rotatedAt: null,
      refreshTokenHash: session.refreshTokenHash,
    };
    this.state().sessions.push(stored);
    return Promise.resolve(toRecord(stored));
  }

  findSessionFamilyByTokenHash(refreshTokenHash: string): Promise<string | undefined> {
    return Promise.resolve(
      this.state().sessions.find((s) => s.refreshTokenHash === refreshTokenHash)?.tokenFamilyId,
    );
  }

  lockSessionByTokenHash(refreshTokenHash: string): Promise<LockedSession | undefined> {
    return Promise.resolve(
      this.locked(this.state().sessions.find((s) => s.refreshTokenHash === refreshTokenHash)),
    );
  }

  lockSessionById(sessionId: string): Promise<LockedSession | undefined> {
    return Promise.resolve(this.locked(this.state().sessions.find((s) => s.id === sessionId)));
  }

  familyStartedAt(tokenFamilyId: string): Promise<Date> {
    const times = this.state()
      .sessions.filter((s) => s.tokenFamilyId === tokenFamilyId)
      .map((s) => s.createdAt.getTime());
    if (times.length === 0) return Promise.reject(new Error('empty family'));
    return Promise.resolve(new Date(Math.min(...times)));
  }

  markRotated(sessionId: string, successorId: string, at: Date): Promise<void> {
    const s = this.sessionById(sessionId);
    if (s.revokedAt === null) {
      Object.assign(s, {
        revokedAt: at,
        revocationReason: 'ROTATED',
        rotatedAt: at,
        replacedBySessionId: successorId,
        lastUsedAt: s.lastUsedAt ?? at,
      });
    }
    return Promise.resolve();
  }

  private revokeWithSuccessor(
    sessionId: string,
    successorId: string,
    reason: RevocationReason,
    at: Date,
  ): Promise<void> {
    const s = this.sessionById(sessionId);
    if (s.revokedAt === null) {
      Object.assign(s, {
        revokedAt: at,
        revocationReason: reason,
        replacedBySessionId: successorId,
      });
    }
    return Promise.resolve();
  }

  markSuperseded(sessionId: string, successorId: string, at: Date): Promise<void> {
    return this.revokeWithSuccessor(sessionId, successorId, 'SUPERSEDED', at);
  }

  markReplayReplaced(sessionId: string, successorId: string, at: Date): Promise<void> {
    return this.revokeWithSuccessor(sessionId, successorId, 'REPLAY_REPLACED', at);
  }

  relinkSuccessor(sessionId: string, successorId: string): Promise<void> {
    this.sessionById(sessionId).replacedBySessionId = successorId;
    return Promise.resolve();
  }

  private revokeWhere(
    match: (s: StoredSession) => boolean,
    reason: RevocationReason,
    at: Date,
  ): Promise<number> {
    let count = 0;
    for (const s of this.state().sessions) {
      if (match(s) && s.revokedAt === null) {
        Object.assign(s, { revokedAt: at, revocationReason: reason });
        count += 1;
      }
    }
    return Promise.resolve(count);
  }

  revokeFamily(tokenFamilyId: string, reason: RevocationReason, at: Date): Promise<number> {
    return this.revokeWhere((s) => s.tokenFamilyId === tokenFamilyId, reason, at);
  }

  revokeAllForUser(userId: string, reason: RevocationReason, at: Date): Promise<number> {
    return this.revokeWhere((s) => s.userId === userId, reason, at);
  }

  findAuthSession(sessionId: string): Promise<AuthSessionView | undefined> {
    const s = this.state().sessions.find((candidate) => candidate.id === sessionId);
    const user = s === undefined ? undefined : this.user(s.userId);
    if (s === undefined || user === undefined) return Promise.resolve(undefined);
    return Promise.resolve({
      sessionId: s.id,
      userId: s.userId,
      tokenFamilyId: s.tokenFamilyId,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
      lastUsedAt: s.lastUsedAt,
      accountStatus: user.accountStatus,
    });
  }

  markSessionUsed(sessionId: string, at: Date): Promise<void> {
    const s = this.sessionById(sessionId);
    s.lastUsedAt ??= at;
    return Promise.resolve();
  }

  appendAudit(entry: AuditEntry): Promise<void> {
    this.state().audit.push(entry);
    return Promise.resolve();
  }

  findSelfAccountFacts(userId: string): Promise<SelfAccountFacts | undefined> {
    const user = this.user(userId);
    return Promise.resolve(user === undefined ? undefined : { ...user });
  }

  lockOnboarding(userId: string): Promise<OnboardingState | undefined> {
    const user = this.user(userId);
    return Promise.resolve(
      user === undefined ? undefined : { status: user.onboardingStatus, step: user.onboardingStep },
    );
  }

  updateOnboarding(userId: string, state: OnboardingState): Promise<void> {
    const user = this.user(userId);
    if (user !== undefined)
      Object.assign(user, { onboardingStatus: state.status, onboardingStep: state.step });
    return Promise.resolve();
  }
}
