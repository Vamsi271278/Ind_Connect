import { describe, expect, it, vi } from 'vitest';

import { ApiResponseError, NetworkError, SessionEndedError } from './api-error';
import { SessionManager } from './session';
import { STORAGE_KEYS } from './storage';
import { DEVICE, MemoryStore, tokens } from './test-support';

const INSTALL_ID = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-10-05T12:00:00Z');

function setup(refresh: (token: string) => Promise<ReturnType<typeof tokens>>) {
  const store = new MemoryStore();
  store.values.set(STORAGE_KEYS.installId, INSTALL_ID);
  const deps = {
    store,
    refresh: vi.fn((token: string) => refresh(token)),
    logout: vi.fn(() => Promise.resolve()),
    device: () => Promise.resolve(DEVICE),
    now: () => NOW,
  };
  return { store, deps, session: new SessionManager(deps) };
}

describe('SessionManager state machine', () => {
  it('no stored refresh token → unauthenticated, without any network call', async () => {
    const { session, deps } = setup(() => Promise.resolve(tokens(1)));
    await session.restore();
    expect(session.getStatus().kind).toBe('unauthenticated');
    expect(deps.refresh).not.toHaveBeenCalled();
  });

  it('stored token + successful restore → authenticated, rotated token persisted', async () => {
    const { session, store } = setup(() => Promise.resolve(tokens(2)));
    store.values.set(STORAGE_KEYS.refreshToken, tokens(1).refreshToken);
    await session.restore();
    expect(session.getStatus().kind).toBe('authenticated');
    expect(store.values.get(STORAGE_KEYS.refreshToken)).toBe(tokens(2).refreshToken);
    await expect(session.getValidAccessToken()).resolves.toBe('access-2');
  });

  it('stored token + SESSION_INVALID → cleared once → unauthenticated; install ID kept', async () => {
    const { session, store } = setup(() =>
      Promise.reject(new ApiResponseError(401, 'SESSION_INVALID', undefined)),
    );
    store.values.set(STORAGE_KEYS.refreshToken, tokens(1).refreshToken);
    await session.restore();
    expect(session.getStatus().kind).toBe('unauthenticated');
    expect(store.values.has(STORAGE_KEYS.refreshToken)).toBe(false);
    expect(store.deletes).toEqual([STORAGE_KEYS.refreshToken]);
    expect(store.values.get(STORAGE_KEYS.installId)).toBe(INSTALL_ID);
  });

  it.each([
    ['network failure', new NetworkError('offline')],
    ['5xx', new ApiResponseError(503, 'SERVICE_UNAVAILABLE', undefined)],
    ['throttling', new ApiResponseError(429, 'RATE_LIMITED', 30)],
  ])('stored token + %s → unavailable; credential NOT destroyed', async (_label, failure) => {
    const { session, store } = setup(() => Promise.reject(failure));
    store.values.set(STORAGE_KEYS.refreshToken, tokens(1).refreshToken);
    await session.restore();
    expect(session.getStatus().kind).toBe('unavailable');
    expect(store.values.get(STORAGE_KEYS.refreshToken)).toBe(tokens(1).refreshToken);
    expect(store.deletes).toEqual([]);
  });

  it('a later successful retry recovers from unavailable without re-login', async () => {
    let fail = true;
    const { session, store } = setup(() =>
      fail ? Promise.reject(new NetworkError('offline')) : Promise.resolve(tokens(2)),
    );
    store.values.set(STORAGE_KEYS.refreshToken, tokens(1).refreshToken);
    await session.restore();
    expect(session.getStatus().kind).toBe('unavailable');
    fail = false;
    await session.restore();
    expect(session.getStatus().kind).toBe('authenticated');
  });

  it('ACCOUNT_NOT_ACTIVE → restricted; credential kept', async () => {
    const { session, store } = setup(() =>
      Promise.reject(new ApiResponseError(403, 'ACCOUNT_NOT_ACTIVE', undefined)),
    );
    store.values.set(STORAGE_KEYS.refreshToken, tokens(1).refreshToken);
    await session.restore();
    expect(session.getStatus().kind).toBe('restricted');
    expect(store.values.has(STORAGE_KEYS.refreshToken)).toBe(true);
  });

  it('sign-out revokes server-side, clears the credential, and keeps the install ID', async () => {
    const { session, store, deps } = setup(() => Promise.resolve(tokens(2)));
    await session.establish(tokens(1));
    await session.signOut();
    expect(deps.logout).toHaveBeenCalledWith(tokens(1).refreshToken);
    expect(store.values.has(STORAGE_KEYS.refreshToken)).toBe(false);
    expect(store.values.get(STORAGE_KEYS.installId)).toBe(INSTALL_ID);
    expect(session.getStatus().kind).toBe('unauthenticated');
  });

  it('sign-out still clears locally when the server call fails', async () => {
    const { session, store, deps } = setup(() => Promise.resolve(tokens(2)));
    deps.logout.mockRejectedValueOnce(new NetworkError('offline'));
    await session.establish(tokens(1));
    await session.signOut();
    expect(store.values.has(STORAGE_KEYS.refreshToken)).toBe(false);
  });

  it('after the session ends, further refreshes fail fast with no network call (no loop)', async () => {
    const { session, store, deps } = setup(() =>
      Promise.reject(new ApiResponseError(401, 'SESSION_INVALID', undefined)),
    );
    store.values.set(STORAGE_KEYS.refreshToken, tokens(1).refreshToken);
    await session.restore();
    await expect(session.refreshAccessToken()).rejects.toBeInstanceOf(SessionEndedError);
    await expect(session.refreshAccessToken()).rejects.toBeInstanceOf(SessionEndedError);
    expect(deps.refresh).toHaveBeenCalledTimes(1);
  });

  it('refreshes proactively when the access token is about to expire', async () => {
    let n = 1;
    const { session, deps } = setup(() => Promise.resolve(tokens((n += 1), NOW)));
    await session.establish({
      ...tokens(1),
      accessTokenExpiresAt: new Date(NOW + 10_000).toISOString(),
    });
    await expect(session.getValidAccessToken()).resolves.toBe('access-2');
    expect(deps.refresh).toHaveBeenCalledTimes(1);
  });
});
