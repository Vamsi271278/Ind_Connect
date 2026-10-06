// Composition root: the one place the app's client services are constructed.
// Screens reach them through hooks (session-provider), never by importing
// platform modules or reading SecureStore themselves.
import { QueryClient } from '@tanstack/react-query';

import { apiBaseUrl } from '@/config/env';
import { ApiClient } from '@/core/api-client';
import { isTransient, SessionEndedError } from '@/core/api-error';
import { createInstallIdProvider } from '@/core/install-id';
import { SessionManager } from '@/core/session';
import { deviceContext } from '@/platform/device';
import { generateCorrelationId, generateInstallId } from '@/platform/random';
import { secureStore } from '@/platform/secure-store';

/** Query keys. Everything under `user` belongs to the signed-in account. */
export const queryKeys = {
  bootstrap: (sessionKind: string) => ['bootstrap', sessionKind] as const,
  user: ['user'] as const,
  me: ['user', 'me'] as const,
  /** Selectable launch cities: reference data, not account data. */
  cities: ['locations', 'cities'] as const,
};

export const getInstallId = createInstallIdProvider(secureStore, generateInstallId);

export const api = new ApiClient({
  // Missing configuration surfaces as a network failure → "unavailable" state.
  baseUrl:
    apiBaseUrl?.toString().replace(/\/$/, '') ?? 'http://api-base-url-not-configured.invalid',
  fetch: (input, init) => fetch(input, init),
  correlationId: generateCorrelationId,
  timeoutMs: 15_000,
});

export const session = new SessionManager({
  store: secureStore,
  refresh: async (refreshToken, device) => (await api.refresh(refreshToken, device)).session,
  logout: (refreshToken) => api.logout(refreshToken),
  device: async () => deviceContext(await getInstallId()),
  now: () => Date.now(),
});
api.attachSession(session);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Only transient failures are retried; an ended session never is.
      retry: (failureCount, error) =>
        !(error instanceof SessionEndedError) && isTransient(error) && failureCount < 2,
    },
    // Mutations use createSubmission (stable idempotency key per submission).
    mutations: { retry: false },
  },
});

// When the session ends, drop the previous account's cached data immediately.
session.subscribe(() => {
  if (session.getStatus().kind === 'unauthenticated') {
    queryClient.removeQueries({ queryKey: queryKeys.user });
  }
});
