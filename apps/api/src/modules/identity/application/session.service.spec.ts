import { beforeEach, describe, expect, it } from 'vitest';

import {
  createIdentityHarness,
  device,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { DAY, SECOND } from '../../../../test/support/manual-clock.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { IssuedSession } from './session.service.js';

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('SessionService', () => {
  let h: IdentityHarness;
  let initial: IssuedSession;
  let userId: string;

  beforeEach(async () => {
    h = createIdentityHarness();
    const registered = await h.signUp('+12145550123');
    initial = registered.session;
    userId = registered.account.id;
  });

  const familyRows = () => h.store.state.sessions.filter((s) => s.userId === userId);

  describe('refresh rotation', () => {
    it('rotates: new row in the same family, old row ROTATED and linked forward', async () => {
      const next = await h.sessions.refresh(initial.tokens.refreshToken, device());
      const old = h.store.session(initial.sessionId);
      const created = h.store.session(next.sessionId);

      expect(next.tokens.refreshToken).not.toBe(initial.tokens.refreshToken);
      expect(created.tokenFamilyId).toBe(old.tokenFamilyId);
      expect(old).toMatchObject({
        revocationReason: 'ROTATED',
        replacedBySessionId: next.sessionId,
      });
      expect(old.rotatedAt).toEqual(h.clock.now());
      expect(old.lastUsedAt).toEqual(h.clock.now());
      expect(created.revokedAt).toBeNull();
    });

    it('caps the rolling expiry at the 90-day family maximum', async () => {
      let current = initial;
      for (let hop = 0; hop < 4; hop += 1) {
        h.clock.advance(20 * DAY);
        current = await h.sessions.refresh(current.tokens.refreshToken, device());
      }
      const familyStart = h.store.session(initial.sessionId).createdAt.getTime();
      expect(new Date(current.tokens.refreshTokenExpiresAt).getTime()).toBe(familyStart + 90 * DAY);
      h.clock.set(new Date(familyStart + 90 * DAY));
      expect(await errorCode(h.sessions.refresh(current.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
    });

    it('rejects an expired refresh token', async () => {
      h.clock.advance(30 * DAY);
      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
    });

    it('rejects an unknown token without revealing anything', async () => {
      expect(await errorCode(h.sessions.refresh('z'.repeat(43), device()))).toBe('SESSION_INVALID');
    });
  });

  describe('reuse detection', () => {
    it('revokes the whole family when a rotated token is replayed after the grace window', async () => {
      const next = await h.sessions.refresh(initial.tokens.refreshToken, device());
      h.clock.advance(31 * SECOND);

      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
      expect(h.store.session(next.sessionId).revocationReason).toBe('REUSE_DETECTED');
      expect(familyRows().every((s) => s.revokedAt !== null)).toBe(true);
      expect(h.store.state.audit.map((a) => a.actionCode)).toContain('SESSION_REUSE_DETECTED');
      // The legitimate holder of the newest token is signed out too.
      expect(await errorCode(h.sessions.refresh(next.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
    });

    it('revokes the family when a live token is presented from another install', async () => {
      const stolen = h.sessions.refresh(
        initial.tokens.refreshToken,
        device({ installId: '22222222-2222-4222-8222-222222222222' }),
      );
      expect(await errorCode(stolen)).toBe('SESSION_INVALID');
      expect(h.store.session(initial.sessionId).revocationReason).toBe('REUSE_DETECTED');
    });

    it('revokes the family when the successor was already used, even within the grace window', async () => {
      const next = await h.sessions.refresh(initial.tokens.refreshToken, device());
      await h.sessions.authenticate(next.tokens.accessToken, 'self_service');
      h.clock.advance(5 * SECOND);
      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
      expect(h.store.session(next.sessionId).revocationReason).toBe('REUSE_DETECTED');
    });
  });

  describe('lost-response grace retry', () => {
    it('re-issues within 30s from the same install, superseding the unused successor', async () => {
      const lost = await h.sessions.refresh(initial.tokens.refreshToken, device());
      h.clock.advance(10 * SECOND);
      const retried = await h.sessions.refresh(initial.tokens.refreshToken, device());

      expect(retried.sessionId).not.toBe(lost.sessionId);
      expect(h.store.session(lost.sessionId)).toMatchObject({
        revocationReason: 'SUPERSEDED',
        replacedBySessionId: retried.sessionId,
      });
      expect(h.store.session(initial.sessionId)).toMatchObject({
        revocationReason: 'ROTATED',
        replacedBySessionId: retried.sessionId,
      });
      expect(h.store.session(retried.sessionId).revokedAt).toBeNull();
      // The lost token is dead; the new one works.
      expect(await errorCode(h.sessions.refresh(lost.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
      await expect(
        h.sessions.refresh(retried.tokens.refreshToken, device()),
      ).resolves.toBeDefined();
    });

    it('cannot extend the grace window by retrying repeatedly', async () => {
      await h.sessions.refresh(initial.tokens.refreshToken, device());
      h.clock.advance(20 * SECOND);
      await h.sessions.refresh(initial.tokens.refreshToken, device());
      h.clock.advance(20 * SECOND); // 40s after the original rotation
      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
      expect(familyRows().every((s) => s.revokedAt !== null)).toBe(true);
    });

    it('is refused from a different install', async () => {
      await h.sessions.refresh(initial.tokens.refreshToken, device());
      h.clock.advance(5 * SECOND);
      const other = device({ installId: '33333333-3333-4333-8333-333333333333' });
      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, other))).toBe(
        'SESSION_INVALID',
      );
      expect(familyRows().every((s) => s.revokedAt !== null)).toBe(true);
    });
  });

  describe('logout', () => {
    it('revokes the family; later refresh fails and the access token stops working', async () => {
      await h.sessions.logout(initial.tokens.refreshToken);
      expect(h.store.session(initial.sessionId).revocationReason).toBe('LOGOUT');
      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, device()))).toBe(
        'SESSION_INVALID',
      );
      expect(await errorCode(h.sessions.authenticate(initial.tokens.accessToken, 'any'))).toBe(
        'AUTH_REQUIRED',
      );
    });

    it('succeeds silently for unknown tokens (no validity oracle)', async () => {
      await expect(h.sessions.logout('q'.repeat(43))).resolves.toBeUndefined();
    });

    it('logout-all revokes every family for the user and is audited', async () => {
      const second = await h.store.transaction((repo) =>
        h.sessions.startSession(repo, userId, device()),
      );
      const auth = await h.sessions.authenticate(initial.tokens.accessToken, 'any');
      await h.sessions.logoutAll(auth);
      expect(familyRows().every((s) => s.revocationReason === 'LOGOUT_ALL')).toBe(true);
      expect(await errorCode(h.sessions.authenticate(second.tokens.accessToken, 'any'))).toBe(
        'AUTH_REQUIRED',
      );
      expect(h.store.state.audit.map((a) => a.actionCode)).toContain('USER_LOGOUT_ALL');
    });
  });

  describe('authenticate', () => {
    it('accepts a valid token, records first use, and returns the server-side identity', async () => {
      const auth = await h.sessions.authenticate(initial.tokens.accessToken, 'self_service');
      expect(auth).toMatchObject({
        userId,
        sessionId: initial.sessionId,
        accountStatus: 'PENDING_VERIFICATION',
      });
      expect(h.store.session(initial.sessionId).lastUsedAt).toEqual(h.clock.now());
    });

    it('rejects tampered, expired and foreign tokens', async () => {
      const [header, payload] = initial.tokens.accessToken.split('.');
      expect(
        await errorCode(h.sessions.authenticate(`${header ?? ''}.${payload ?? ''}.AAAA`, 'any')),
      ).toBe('AUTH_REQUIRED');
      const foreign = createIdentityHarness();
      const other = await foreign.signUp('+12145550199');
      expect(
        await errorCode(h.sessions.authenticate(other.session.tokens.accessToken, 'any')),
      ).toBe('AUTH_REQUIRED');
      h.clock.advance(15 * 60 * SECOND);
      expect(await errorCode(h.sessions.authenticate(initial.tokens.accessToken, 'any'))).toBe(
        'AUTH_REQUIRED',
      );
    });

    it('re-reads account status on every request (no stale authorization)', async () => {
      h.store.setAccountStatus(userId, 'SUSPENDED');
      expect(
        await errorCode(h.sessions.authenticate(initial.tokens.accessToken, 'self_service')),
      ).toBe('ACCOUNT_NOT_ACTIVE');
      await expect(
        h.sessions.authenticate(initial.tokens.accessToken, 'any'),
      ).resolves.toMatchObject({
        accountStatus: 'SUSPENDED',
      });
      expect(await errorCode(h.sessions.refresh(initial.tokens.refreshToken, device()))).toBe(
        'ACCOUNT_NOT_ACTIVE',
      );
      // A refused refresh does not rotate.
      expect(h.store.session(initial.sessionId).revokedAt).toBeNull();
    });
  });

  it('never logs or stores refresh/access tokens', async () => {
    const next = await h.sessions.refresh(initial.tokens.refreshToken, device());
    const logs = h.logger.dump();
    const ephemeral = h.ephemeral.dump();
    for (const secret of [
      initial.tokens.refreshToken,
      next.tokens.refreshToken,
      next.tokens.accessToken,
    ]) {
      expect(logs).not.toContain(secret);
      expect(ephemeral).not.toContain(secret);
    }
    expect(JSON.stringify(h.store.state.sessions)).not.toContain(next.tokens.refreshToken);
  });
});
