import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from './api-client';
import { ApiResponseError, NetworkError, SessionEndedError } from './api-error';
import { SessionManager } from './session';
import { STORAGE_KEYS } from './storage';
import { apiError, DEVICE, json, MemoryStore, tokens } from './test-support';

const INSTALL_ID = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-10-05T12:00:00Z');

const me = {
  id: '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f',
  accountStatus: 'PENDING_VERIFICATION',
  onboarding: { status: 'IN_PROGRESS', step: 'NAME' },
  profile: { firstName: null, genderCode: null, genderSelfDescription: null },
  phoneMasked: '+1 ••• ••• 0123',
  age: 31,
  location: null,
  activeIntents: [],
  datingEnabled: false,
  languages: [],
  interests: [],
};

/**
 * Fake API: /users/me accepts only `access-2`; /auth/refresh answers with
 * the configured behavior and counts calls.
 */
function setup(refreshBehavior: 'ok' | 'invalid' | 'network') {
  const calls = { refresh: 0, me: [] as (string | null)[] };
  const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
    const headers = new Headers(init.headers);
    if (url.endsWith('/api/v1/auth/refresh')) {
      calls.refresh += 1;
      await new Promise((resolve) => setTimeout(resolve, 5)); // overlap concurrent callers
      if (refreshBehavior === 'invalid') return apiError(401, 'SESSION_INVALID');
      if (refreshBehavior === 'network') throw new TypeError('Network request failed');
      return json(200, { data: { session: tokens(2, NOW) } });
    }
    if (url.endsWith('/api/v1/users/me')) {
      calls.me.push(headers.get('Authorization'));
      return headers.get('Authorization') === 'Bearer access-2'
        ? json(200, { data: me })
        : apiError(401, 'AUTH_REQUIRED');
    }
    if (url.endsWith('/api/v1/app/bootstrap')) return apiError(503, 'SERVICE_UNAVAILABLE');
    throw new Error(`unexpected ${url}`);
  });

  const store = new MemoryStore();
  store.values.set(STORAGE_KEYS.installId, INSTALL_ID);
  const client = new ApiClient({
    baseUrl: 'http://api.test',
    fetch: fetchImpl as unknown as typeof fetch,
    correlationId: () => 'corr-test-0001',
    timeoutMs: 1000,
  });
  const session = new SessionManager({
    store,
    refresh: async (refreshToken, device) => (await client.refresh(refreshToken, device)).session,
    logout: (refreshToken) => client.logout(refreshToken),
    device: () => Promise.resolve(DEVICE),
    now: () => NOW,
  });
  client.attachSession(session);
  return { client, session, store, calls, fetchImpl };
}

describe('ApiClient + single-flight refresh', () => {
  it('fan-in: 3 auth failures → exactly 1 refresh → each request retried once and succeeds', async () => {
    const { client, session, calls } = setup('ok');
    await session.establish(tokens(1, NOW)); // access-1 is rejected by the server

    const results = await Promise.all([client.getMe(), client.getMe(), client.getMe()]);

    expect(results.map((r) => r.id)).toEqual([me.id, me.id, me.id]);
    expect(calls.refresh).toBe(1);
    expect(calls.me.filter((h) => h === 'Bearer access-1')).toHaveLength(3);
    expect(calls.me.filter((h) => h === 'Bearer access-2')).toHaveLength(3);
  });

  it('refresh SESSION_INVALID: cleared exactly once, install ID retained, no refresh loop', async () => {
    const { client, session, store, calls } = setup('invalid');
    await session.establish(tokens(1, NOW));

    const results = await Promise.allSettled([client.getMe(), client.getMe(), client.getMe()]);

    expect(
      results.every((r) => r.status === 'rejected' && r.reason instanceof SessionEndedError),
    ).toBe(true);
    expect(calls.refresh).toBe(1);
    expect(store.deletes).toEqual([STORAGE_KEYS.refreshToken]);
    expect(store.values.get(STORAGE_KEYS.installId)).toBe(INSTALL_ID);
    expect(session.getStatus().kind).toBe('unauthenticated');

    await expect(client.getMe()).rejects.toBeInstanceOf(SessionEndedError);
    expect(calls.refresh).toBe(1); // still one: no loop
  });

  it('transient refresh failure keeps the stored refresh token', async () => {
    const { client, session, store } = setup('network');
    await session.establish(tokens(1, NOW));
    await expect(client.getMe()).rejects.toBeInstanceOf(NetworkError);
    expect(store.values.get(STORAGE_KEYS.refreshToken)).toBe(tokens(1, NOW).refreshToken);
    expect(store.deletes).toEqual([]);
  });

  it('a temporary bootstrap failure is an error, never a logout', async () => {
    const { client, session, store } = setup('ok');
    await session.establish(tokens(2, NOW));
    await expect(client.getBootstrap()).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    expect(session.getStatus().kind).toBe('authenticated');
    expect(store.values.has(STORAGE_KEYS.refreshToken)).toBe(true);
  });

  it('sends correlation and idempotency headers; rejects contract-violating responses', async () => {
    const seen: Headers[] = [];
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetch: ((_url: string, init: RequestInit) => {
        seen.push(new Headers(init.headers));
        return Promise.resolve(
          json(200, { data: { result: 'authenticated', session: {}, account: {} } }),
        );
      }) as unknown as typeof fetch,
      correlationId: () => 'corr-test-0002',
      timeoutMs: 1000,
    });
    await expect(
      client.verifyOtp({ phone: '+12145550123', code: '123456', device: DEVICE }, 'key-0001'),
    ).rejects.toBeInstanceOf(NetworkError);
    expect(seen[0]?.get('Idempotency-Key')).toBe('key-0001');
    expect(seen[0]?.get('X-Correlation-ID')).toBe('corr-test-0002');
  });

  it('maps error envelopes to typed errors with retry hints', async () => {
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetch: () =>
        Promise.resolve(
          json(429, {
            error: {
              code: 'RATE_LIMITED',
              message: 'x',
              correlationId: 'c',
              details: { retryAfterSeconds: 20 },
            },
          }),
        ),
      correlationId: () => 'corr-test-0003',
      timeoutMs: 1000,
    });
    await expect(client.requestOtp('+12145550123', INSTALL_ID)).rejects.toEqual(
      new ApiResponseError(429, 'RATE_LIMITED', 20),
    );
  });
});
