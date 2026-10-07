import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';

describe('BootstrapService', () => {
  let h: IdentityHarness;
  let accessToken: string;
  let refreshToken: string;

  beforeEach(async () => {
    h = createIdentityHarness();
    const registered = await h.signUp('+12145550123');
    accessToken = registered.session.tokens.accessToken;
    refreshToken = registered.session.tokens.refreshToken;
  });

  const publicState = {
    maintenanceMode: false,
    minimumSupportedVersion: '1.0.0',
    featureFlags: { dating_enabled: false },
  };

  it('answers anonymously with the public state and account: null', async () => {
    expect(await h.bootstrap.getBootstrap(undefined)).toEqual({ ...publicState, account: null });
  });

  it('includes the account state for a valid access token', async () => {
    expect(await h.bootstrap.getBootstrap(accessToken)).toEqual({
      ...publicState,
      account: {
        status: 'PENDING_VERIFICATION',
        onboardingStatus: 'IN_PROGRESS',
        onboardingStep: 'NAME',
      },
    });
  });

  it('returns account: null (never an error) for invalid, expired and revoked tokens', async () => {
    expect((await h.bootstrap.getBootstrap('not.a.jwt')).account).toBeNull();
    h.clock.advance(16 * 60 * 1000);
    expect((await h.bootstrap.getBootstrap(accessToken)).account).toBeNull();

    const g = createIdentityHarness();
    const other = await g.signUp('+12145550199');
    await g.sessions.logout(other.session.tokens.refreshToken);
    expect((await g.bootstrap.getBootstrap(other.session.tokens.accessToken)).account).toBeNull();
    expect(refreshToken).toBeDefined();
  });

  it('still reports restricted accounts so the client can route them', async () => {
    const userId = h.store.state.users[0]?.id ?? '';
    h.store.setAccountStatus(userId, 'SUSPENDED');
    expect((await h.bootstrap.getBootstrap(accessToken)).account?.status).toBe('SUSPENDED');
  });

  it('stays available when the identity store fails', async () => {
    vi.spyOn(h.selfAccount, 'getAccountState').mockRejectedValueOnce(new Error('db down'));
    expect(await h.bootstrap.getBootstrap(accessToken)).toEqual({ ...publicState, account: null });
  });
});
