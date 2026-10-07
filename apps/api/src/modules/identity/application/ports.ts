import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { AccountStatus, OnboardingStatus, OnboardingStep } from '../domain/account.js';
import type { RevocationReason } from '../domain/session-policy.js';

// ---------------------------------------------------------------- shared types

export interface DeviceContext {
  readonly platform: 'ios' | 'android';
  readonly appVersion: string;
  readonly osVersion: string;
  readonly installId: string;
}

export interface Clock {
  now(): Date;
}

export interface EventLogger {
  log(event: Record<string, unknown>): void;
  warn(event: Record<string, unknown>): void;
}

// ---------------------------------------------------------------- persistence

export interface UserRecord {
  readonly id: string;
  readonly accountStatus: AccountStatus;
  readonly onboardingStatus: OnboardingStatus;
  readonly onboardingStep: OnboardingStep;
}

export interface NewUser {
  readonly phoneE164: string;
  readonly phoneVerifiedAt: Date;
  /** `YYYY-MM-DD`; already age-checked by the caller. */
  readonly dateOfBirth: string;
  readonly accountStatus: AccountStatus;
  readonly onboardingStatus: OnboardingStatus;
  readonly onboardingStep: OnboardingStep;
}

export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenFamilyId: string;
  readonly device: DeviceContext;
  readonly createdAt: Date;
  readonly lastUsedAt: Date | null;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly revocationReason: RevocationReason | null;
  readonly replacedBySessionId: string | null;
  readonly rotatedAt: Date | null;
}

export interface NewSession {
  readonly userId: string;
  readonly tokenFamilyId: string;
  readonly refreshTokenHash: string;
  readonly device: DeviceContext;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface LockedSession {
  readonly session: SessionRecord;
  readonly accountStatus: AccountStatus;
}

export interface AuthSessionView {
  readonly sessionId: string;
  readonly userId: string;
  readonly tokenFamilyId: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly lastUsedAt: Date | null;
  readonly accountStatus: AccountStatus;
}

/** Identity-private facts for the self projection; never leave the module raw. */
export interface SelfAccountFacts extends UserRecord {
  readonly phoneE164: string;
  /** YYYY-MM-DD */
  readonly dateOfBirth: string;
}

export interface OnboardingState {
  readonly status: OnboardingStatus;
  readonly step: OnboardingStep;
}

/** Onboarding state read under the user row lock, with the account status. */
export interface LockedOnboarding extends OnboardingState {
  readonly accountStatus: AccountStatus;
}

export interface AuditEntry {
  readonly actorType: 'USER' | 'SYSTEM';
  readonly actorId: string | null;
  readonly actionCode: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly reasonCode: string | null;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export class PhoneAlreadyRegisteredError extends Error {
  override readonly name = 'PhoneAlreadyRegisteredError';
}

/** Identity-owned persistence (users, user_sessions, audit_events writes). */
export interface IdentityRepository {
  /** Excludes DELETED accounts (matches the unique phone index). */
  findUserByPhone(phoneE164: string): Promise<UserRecord | undefined>;
  findUserById(userId: string): Promise<UserRecord | undefined>;
  /** @throws PhoneAlreadyRegisteredError on the unique-phone constraint. */
  insertUser(user: NewUser): Promise<UserRecord>;

  insertSession(session: NewSession): Promise<SessionRecord>;
  /** Non-locking lookup used for pre-transaction rate limiting. */
  findSessionFamilyByTokenHash(refreshTokenHash: string): Promise<string | undefined>;
  /** Row-locks the session (FOR UPDATE) and reads the owner's status in one query. */
  lockSessionByTokenHash(refreshTokenHash: string): Promise<LockedSession | undefined>;
  lockSessionById(sessionId: string): Promise<LockedSession | undefined>;
  familyStartedAt(tokenFamilyId: string): Promise<Date>;

  markRotated(sessionId: string, successorId: string, at: Date): Promise<void>;
  markSuperseded(sessionId: string, successorId: string, at: Date): Promise<void>;
  markReplayReplaced(sessionId: string, successorId: string, at: Date): Promise<void>;
  relinkSuccessor(sessionId: string, successorId: string): Promise<void>;
  revokeFamily(tokenFamilyId: string, reason: RevocationReason, at: Date): Promise<number>;
  revokeAllForUser(userId: string, reason: RevocationReason, at: Date): Promise<number>;

  /** Session + owner status in one indexed query (per-request authentication). */
  findAuthSession(sessionId: string): Promise<AuthSessionView | undefined>;
  /** Records first use; no-op when already recorded. */
  markSessionUsed(sessionId: string, at: Date): Promise<void>;

  appendAudit(entry: AuditEntry): Promise<void>;

  findSelfAccountFacts(userId: string): Promise<SelfAccountFacts | undefined>;
  /** Row-locks the user (FOR UPDATE): serializes profile/onboarding writes per user. */
  lockOnboarding(userId: string): Promise<LockedOnboarding | undefined>;
  updateOnboarding(userId: string, state: OnboardingState, at: Date): Promise<void>;
}

export interface IdentityStore {
  readonly repository: IdentityRepository;
  transaction<T>(work: (repository: IdentityRepository) => Promise<T>): Promise<T>;
  /** Identity repository bound to a cross-module transaction (UnitOfWork). */
  forTransaction(tx: TransactionContext): IdentityRepository;
}

// ---------------------------------------------------------------- providers

export type PhoneCheckResult = 'approved' | 'incorrect' | 'expired' | 'max_attempts';

export class PhoneVerificationError extends Error {
  override readonly name = 'PhoneVerificationError';

  constructor(
    readonly kind: 'invalid_phone' | 'throttled' | 'unavailable',
    options?: { cause?: unknown },
  ) {
    super(kind, options);
  }
}

/**
 * ADR-009 / ADR-030. Verifies possession of a phone number only; Project
 * Connect owns accounts and sessions. Implementations: fake (now), Twilio
 * Verify (later, separately approved).
 */
export interface PhoneVerificationProvider {
  /** @throws PhoneVerificationError */
  start(input: { readonly phoneE164: string; readonly channel: 'sms' }): Promise<void>;
  /** @throws PhoneVerificationError */
  check(input: { readonly phoneE164: string; readonly code: string }): Promise<PhoneCheckResult>;
}

export interface AccessTokenClaims {
  readonly userId: string;
  readonly sessionId: string;
}

export interface AccessTokenService {
  issue(claims: AccessTokenClaims): Promise<{ token: string; expiresAt: Date }>;
  /** Returns undefined for any invalid, expired or foreign token. */
  verify(token: string): Promise<AccessTokenClaims | undefined>;
}

export const IDENTITY_STORE = Symbol('IDENTITY_STORE');
export const PHONE_VERIFICATION_PROVIDER = Symbol('PHONE_VERIFICATION_PROVIDER');
export const ACCESS_TOKEN_SERVICE = Symbol('ACCESS_TOKEN_SERVICE');
export const CLOCK = Symbol('CLOCK');
