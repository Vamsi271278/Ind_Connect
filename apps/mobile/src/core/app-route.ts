import type { BootstrapResponse } from '@project-connect/api-contracts';

import type { SessionStatus } from './session';

export type AppRoute =
  | 'loading'
  | 'unavailable'
  | 'maintenance'
  | 'update-required'
  | 'auth'
  | 'restricted'
  | 'onboarding'
  | 'app';

export type BootstrapState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'ready'; readonly data: BootstrapResponse };

const SELF_SERVICE = new Set(['ACTIVE', 'PENDING_VERIFICATION']);

/** Compares dotted numeric versions; true when `current` is older than `minimum`. */
export function isBelowVersion(current: string, minimum: string): boolean {
  const a = current.split('.').map(Number);
  const b = minimum.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

/**
 * The single, central routing decision. Screens consume the result; they never
 * inspect SecureStore or tokens themselves. Client routing is UX only — the
 * server remains the authority for every protected action.
 *
 * `account: null` from bootstrap NEVER means "logged out" on its own: with a
 * live session it means account state is temporarily unknown (→ unavailable).
 */
export function resolveAppRoute(input: {
  readonly session: SessionStatus;
  readonly bootstrap: BootstrapState;
  readonly appVersion: string;
}): AppRoute {
  const { session, bootstrap } = input;
  if (session.kind === 'initializing' || bootstrap.kind === 'loading') return 'loading';
  if (bootstrap.kind === 'error') return 'unavailable';

  const { data } = bootstrap;
  if (data.maintenanceMode) return 'maintenance';
  if (isBelowVersion(input.appVersion, data.minimumSupportedVersion)) return 'update-required';

  switch (session.kind) {
    case 'unavailable':
      return 'unavailable';
    case 'restricted':
      return 'restricted';
    case 'unauthenticated':
      return 'auth';
    case 'authenticated': {
      if (data.account === null) return 'unavailable';
      if (!SELF_SERVICE.has(data.account.status)) return 'restricted';
      return data.account.onboardingStatus === 'COMPLETE' ? 'app' : 'onboarding';
    }
  }
}
