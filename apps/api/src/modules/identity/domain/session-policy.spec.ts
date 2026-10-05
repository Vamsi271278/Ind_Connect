import { describe, expect, it } from 'vitest';

import {
  decideRefresh,
  nextRefreshExpiry,
  type PresentedSession,
  type SuccessorSession,
} from './session-policy.js';

const DAY = 24 * 60 * 60 * 1000;
const policy = { graceMs: 30_000, familyMaxMs: 90 * DAY };
const now = new Date('2026-10-05T12:00:00Z');
const at = (offsetMs: number) => new Date(now.getTime() + offsetMs);
const INSTALL = 'install-a';

const live: PresentedSession = {
  installId: INSTALL,
  expiresAt: at(DAY),
  familyStartedAt: at(-DAY),
  revokedAt: null,
  revocationReason: null,
  rotatedAt: null,
};

const rotated = (rotatedAgoMs: number): PresentedSession => ({
  ...live,
  revokedAt: at(-rotatedAgoMs),
  revocationReason: 'ROTATED',
  rotatedAt: at(-rotatedAgoMs),
});

const unusedSuccessor: SuccessorSession = { installId: INSTALL, lastUsedAt: null, revokedAt: null };

const decide = (
  presented: PresentedSession,
  // null = no successor (undefined would trigger the default parameter).
  successor: SuccessorSession | null = unusedSuccessor,
  presentedInstallId = INSTALL,
) =>
  decideRefresh({ presented, successor: successor ?? undefined, presentedInstallId, now, policy })
    .kind;

describe('decideRefresh', () => {
  it('rotates a live, unexpired token from its own install', () => {
    expect(decide(live, null)).toBe('rotate');
  });

  it('treats a live token presented from another install as stolen', () => {
    expect(decide(live, undefined, 'install-b')).toBe('reuse_detected');
  });

  it('rejects an expired token and an exhausted family', () => {
    expect(decide({ ...live, expiresAt: now }, null)).toBe('invalid');
    expect(decide({ ...live, familyStartedAt: at(-90 * DAY) }, null)).toBe('invalid');
  });

  it('allows a lost-response retry within the grace window', () => {
    expect(decide(rotated(10_000))).toBe('grace_retry');
    expect(decide(rotated(30_000))).toBe('grace_retry');
  });

  it('treats a rotated-token replay outside the grace window as reuse', () => {
    expect(decide(rotated(30_001))).toBe('reuse_detected');
  });

  it('denies grace if the successor was used, revoked or missing', () => {
    expect(decide(rotated(5000), { ...unusedSuccessor, lastUsedAt: at(-1000) })).toBe(
      'reuse_detected',
    );
    expect(decide(rotated(5000), { ...unusedSuccessor, revokedAt: at(-1000) })).toBe(
      'reuse_detected',
    );
    expect(decide(rotated(5000), null)).toBe('reuse_detected');
  });

  it('denies grace from a different install', () => {
    expect(decide(rotated(5000), unusedSuccessor, 'install-b')).toBe('reuse_detected');
    expect(decide(rotated(5000), { ...unusedSuccessor, installId: 'install-b' })).toBe(
      'reuse_detected',
    );
  });

  it('denies grace once the family has hit its maximum lifetime', () => {
    expect(decide({ ...rotated(5000), familyStartedAt: at(-90 * DAY) })).toBe('reuse_detected');
  });

  it('rejects tokens revoked for any other reason without escalating', () => {
    for (const reason of [
      'LOGOUT',
      'LOGOUT_ALL',
      'SUPERSEDED',
      'REPLAY_REPLACED',
      'REUSE_DETECTED',
    ] as const) {
      expect(decide({ ...live, revokedAt: at(-1000), revocationReason: reason }, null)).toBe(
        'invalid',
      );
    }
  });
});

describe('nextRefreshExpiry', () => {
  it('rolls 30 days forward but never past the 90-day family cap', () => {
    const rolling = 30 * DAY;
    expect(
      nextRefreshExpiry({ now, familyStartedAt: now, rollingMs: rolling, familyMaxMs: 90 * DAY }),
    ).toEqual(at(30 * DAY));
    expect(
      nextRefreshExpiry({
        now,
        familyStartedAt: at(-80 * DAY),
        rollingMs: rolling,
        familyMaxMs: 90 * DAY,
      }),
    ).toEqual(at(10 * DAY));
  });
});
