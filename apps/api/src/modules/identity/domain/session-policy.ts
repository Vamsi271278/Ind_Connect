/**
 * Refresh-token rotation policy (P4). Pure decision logic; persistence applies
 * the outcome. Treat every input as potentially hostile.
 */

export const REVOCATION_REASONS = [
  'ROTATED',
  'SUPERSEDED',
  'REPLAY_REPLACED',
  'LOGOUT',
  'LOGOUT_ALL',
  'REUSE_DETECTED',
  'ACCOUNT_ACTION',
] as const;
export type RevocationReason = (typeof REVOCATION_REASONS)[number];

export interface PresentedSession {
  readonly installId: string;
  readonly expiresAt: Date;
  readonly familyStartedAt: Date;
  readonly revokedAt: Date | null;
  readonly revocationReason: RevocationReason | null;
  readonly rotatedAt: Date | null;
}

export interface SuccessorSession {
  readonly installId: string;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
}

export interface RefreshPolicy {
  readonly graceMs: number;
  readonly familyMaxMs: number;
}

export type RefreshDecision =
  | { readonly kind: 'rotate' }
  | { readonly kind: 'grace_retry' }
  | { readonly kind: 'reuse_detected' }
  | { readonly kind: 'invalid' };

export function decideRefresh(input: {
  readonly presented: PresentedSession;
  readonly successor: SuccessorSession | undefined;
  readonly presentedInstallId: string;
  readonly now: Date;
  readonly policy: RefreshPolicy;
}): RefreshDecision {
  const { presented, successor, presentedInstallId, now, policy } = input;
  const nowMs = now.getTime();
  const familyExpired = nowMs >= presented.familyStartedAt.getTime() + policy.familyMaxMs;

  if (presented.revokedAt === null) {
    // A live token presented from a different install is treated as stolen.
    if (presented.installId !== presentedInstallId) return { kind: 'reuse_detected' };
    if (nowMs >= presented.expiresAt.getTime() || familyExpired) return { kind: 'invalid' };
    return { kind: 'rotate' };
  }

  if (presented.revocationReason === 'ROTATED') {
    // A rotated token is normally a replay. The single exception is a retry of
    // a refresh whose response was lost: same family (implied: the successor
    // is this row's own replacement), same install, within the grace window,
    // and the successor never used.
    const withinGrace =
      presented.rotatedAt !== null && nowMs - presented.rotatedAt.getTime() <= policy.graceMs;
    const isLostResponseRetry =
      withinGrace &&
      !familyExpired &&
      presentedInstallId === presented.installId &&
      successor !== undefined &&
      successor.installId === presented.installId &&
      successor.lastUsedAt === null &&
      successor.revokedAt === null;
    return isLostResponseRetry ? { kind: 'grace_retry' } : { kind: 'reuse_detected' };
  }

  // Logged out, superseded, replaced or already revoked for cause.
  return { kind: 'invalid' };
}

/** Rolling expiry capped by the family's absolute maximum lifetime. */
export function nextRefreshExpiry(input: {
  readonly now: Date;
  readonly familyStartedAt: Date;
  readonly rollingMs: number;
  readonly familyMaxMs: number;
}): Date {
  const rolling = input.now.getTime() + input.rollingMs;
  const cap = input.familyStartedAt.getTime() + input.familyMaxMs;
  return new Date(Math.min(rolling, cap));
}
