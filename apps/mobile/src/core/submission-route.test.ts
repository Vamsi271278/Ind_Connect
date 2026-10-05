import type { BootstrapResponse } from '@project-connect/api-contracts';
import { describe, expect, it, vi } from 'vitest';

import { ApiResponseError, NetworkError } from './api-error';
import { isBelowVersion, resolveAppRoute } from './app-route';
import { createSubmission } from './submission';

describe('createSubmission (idempotency keys)', () => {
  it('reuses the same key for network retries of one submission', async () => {
    let n = 0;
    const submission = createSubmission(() => `key-${String((n += 1))}`, { delayMs: () => 0 });
    const operation = vi
      .fn<(key: string) => Promise<string>>()
      .mockRejectedValueOnce(new NetworkError('offline'))
      .mockRejectedValueOnce(new ApiResponseError(503, 'SERVICE_UNAVAILABLE', undefined))
      .mockResolvedValueOnce('ok');
    await expect(submission.run(operation)).resolves.toBe('ok');
    expect(operation.mock.calls.map(([key]) => key)).toEqual(['key-1', 'key-1', 'key-1']);
  });

  it('a new user submission gets a new key', () => {
    let n = 0;
    const next = () => `key-${String((n += 1))}`;
    expect(createSubmission(next).idempotencyKey).not.toBe(createSubmission(next).idempotencyKey);
  });

  it('does not retry business rejections', async () => {
    const submission = createSubmission(() => 'key-1', { delayMs: () => 0 });
    const operation = vi
      .fn()
      .mockRejectedValue(new ApiResponseError(422, 'OTP_INCORRECT', undefined));
    await expect(submission.run(operation)).rejects.toMatchObject({ code: 'OTP_INCORRECT' });
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

const bootstrap = (overrides: Partial<BootstrapResponse> = {}) =>
  ({
    kind: 'ready',
    data: {
      maintenanceMode: false,
      minimumSupportedVersion: '1.0.0',
      featureFlags: {},
      account: null,
      ...overrides,
    },
  }) as const;

const account = (status: string, onboardingStatus: string) =>
  ({ status, onboardingStatus, onboardingStep: 'NAME' }) as BootstrapResponse['account'];

describe('resolveAppRoute', () => {
  const route = (
    session: Parameters<typeof resolveAppRoute>[0]['session'],
    b: Parameters<typeof resolveAppRoute>[0]['bootstrap'],
  ) => resolveAppRoute({ session, bootstrap: b, appVersion: '1.0.0' });

  it('routes by session and bootstrap account state', () => {
    expect(route({ kind: 'unauthenticated' }, bootstrap())).toBe('auth');
    expect(
      route(
        { kind: 'authenticated' },
        bootstrap({ account: account('PENDING_VERIFICATION', 'IN_PROGRESS') }),
      ),
    ).toBe('onboarding');
    expect(
      route({ kind: 'authenticated' }, bootstrap({ account: account('ACTIVE', 'COMPLETE') })),
    ).toBe('app');
    expect(
      route({ kind: 'authenticated' }, bootstrap({ account: account('SUSPENDED', 'COMPLETE') })),
    ).toBe('restricted');
    expect(route({ kind: 'restricted' }, bootstrap())).toBe('restricted');
  });

  it('never treats account: null as logout while a session exists', () => {
    expect(route({ kind: 'authenticated' }, bootstrap({ account: null }))).toBe('unavailable');
  });

  it('keeps the user on a retryable state during outages', () => {
    expect(route({ kind: 'unavailable' }, bootstrap())).toBe('unavailable');
    expect(route({ kind: 'authenticated' }, { kind: 'error' })).toBe('unavailable');
    expect(route({ kind: 'initializing' }, bootstrap())).toBe('loading');
    expect(route({ kind: 'authenticated' }, { kind: 'loading' })).toBe('loading');
  });

  it('gates on maintenance and minimum version before anything else', () => {
    expect(route({ kind: 'authenticated' }, bootstrap({ maintenanceMode: true }))).toBe(
      'maintenance',
    );
    expect(
      resolveAppRoute({
        session: { kind: 'unauthenticated' },
        bootstrap: bootstrap({ minimumSupportedVersion: '1.2.0' }),
        appVersion: '1.1.9',
      }),
    ).toBe('update-required');
    expect(isBelowVersion('1.10.0', '1.9.0')).toBe(false);
    expect(isBelowVersion('1.0', '1.0.1')).toBe(true);
  });
});
