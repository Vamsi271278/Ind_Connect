import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { useSyncExternalStore } from 'react';

import { type AppRoute, type BootstrapState, resolveAppRoute } from '@/core/app-route';
import type { SessionStatus } from '@/core/session';
import { appVersion } from '@/platform/device';

import { api, queryClient, queryKeys, session } from './services';

interface AppState {
  readonly route: AppRoute;
  readonly session: SessionStatus;
  readonly bootstrap: BootstrapState;
  /** Retry after an outage: restores the session (if pending) and bootstrap. */
  readonly retry: () => void;
  readonly signOut: () => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

/**
 * Centralized session/bootstrap state (B2.2). Exactly one place decides the
 * route; screens consume `useAppState()` and never inspect credentials.
 */
function AppStateProvider({ children }: { readonly children: ReactNode }) {
  const status = useSyncExternalStore(
    useCallback((listener: () => void) => session.subscribe(listener), []),
    () => session.getStatus(),
  );

  useEffect(() => {
    void session.restore();
  }, []);

  const bootstrapQuery = useQuery({
    queryKey: queryKeys.bootstrap(status.kind),
    queryFn: () => api.getBootstrap(),
    enabled: status.kind !== 'initializing',
  });

  const { status: queryStatus, data } = bootstrapQuery;
  const bootstrap = useMemo<BootstrapState>(() => {
    if (queryStatus === 'success') return { kind: 'ready', data };
    return queryStatus === 'error' ? { kind: 'error' } : { kind: 'loading' };
  }, [queryStatus, data]);

  const { refetch } = bootstrapQuery;
  const retry = useCallback(() => {
    if (session.getStatus().kind === 'unavailable') void session.restore();
    void refetch();
  }, [refetch]);

  const signOut = useCallback(() => session.signOut(), []);

  const route = resolveAppRoute({ session: status, bootstrap, appVersion });

  const value = useMemo<AppState>(
    () => ({ route, session: status, bootstrap, retry, signOut }),
    [route, status, bootstrap, retry, signOut],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>{children}</AppStateProvider>
    </QueryClientProvider>
  );
}

export function useAppState(): AppState {
  const value = useContext(AppStateContext);
  if (value === undefined) throw new Error('useAppState must be used inside AppProviders');
  return value;
}
