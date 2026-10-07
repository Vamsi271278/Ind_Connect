import type { DeviceContext, SessionTokens } from '@project-connect/api-contracts';

import { ApiResponseError, isTransient, SessionEndedError } from './api-error';
import { STORAGE_KEYS, type KeyValueStore } from './storage';

/**
 * Session state machine (B2.2):
 *
 *   no stored refresh token                  → unauthenticated
 *   stored token + successful restore         → authenticated
 *   stored token + SESSION_INVALID            → clear once → unauthenticated
 *   stored token + ACCOUNT_NOT_ACTIVE         → restricted   (credential kept)
 *   stored token + network / 5xx / throttling → unavailable  (credential kept, retry)
 *
 * A temporary outage never deletes credentials or bounces a signed-in user
 * to sign-in.
 */
export type SessionStatus =
  | { readonly kind: 'initializing' }
  | { readonly kind: 'unauthenticated' }
  | { readonly kind: 'authenticated' }
  | { readonly kind: 'restricted' }
  | { readonly kind: 'unavailable' };

export interface SessionDependencies {
  readonly store: KeyValueStore;
  /** POST /auth/refresh; throws ApiResponseError / NetworkError. */
  readonly refresh: (refreshToken: string, device: DeviceContext) => Promise<SessionTokens>;
  /** POST /auth/logout; best effort. */
  readonly logout: (refreshToken: string) => Promise<void>;
  readonly device: () => Promise<DeviceContext>;
  readonly now: () => number;
}

/** Refresh a little before expiry so requests rarely hit a 401 at all. */
const EXPIRY_SKEW_MS = 30_000;

export class SessionManager {
  private status: SessionStatus = { kind: 'initializing' };
  private accessToken: { readonly token: string; readonly expiresAtMs: number } | undefined;
  private inFlightRefresh: Promise<string> | undefined;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly deps: SessionDependencies) {}

  // ------------------------------------------------------------ observation

  getStatus(): SessionStatus {
    return this.status;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SessionStatus): void {
    if (status.kind === this.status.kind) return;
    this.status = status;
    for (const listener of this.listeners) listener();
  }

  // ------------------------------------------------------------ lifecycle

  /** App launch: restore from the stored refresh credential, if any. */
  async restore(): Promise<void> {
    const stored = await this.deps.store.get(STORAGE_KEYS.refreshToken);
    if (stored === null) {
      this.setStatus({ kind: 'unauthenticated' });
      return;
    }
    try {
      await this.refreshAccessToken();
    } catch (error) {
      if (error instanceof SessionEndedError) return; // already unauthenticated
      if (error instanceof ApiResponseError && error.code === 'ACCOUNT_NOT_ACTIVE') {
        this.setStatus({ kind: 'restricted' });
        return;
      }
      // Transient or unexpected: keep the credential; the user can retry.
      this.setStatus({ kind: 'unavailable' });
    }
  }

  /** After OTP verify / registration returned a session. */
  async establish(tokens: SessionTokens): Promise<void> {
    await this.deps.store.set(STORAGE_KEYS.refreshToken, tokens.refreshToken);
    this.accessToken = {
      token: tokens.accessToken,
      expiresAtMs: Date.parse(tokens.accessTokenExpiresAt),
    };
    this.setStatus({ kind: 'authenticated' });
  }

  /**
   * Server-side revocation first (BR-AUTH-009: local deletion alone is not
   * logout), then local clearing regardless. The install ID is untouched.
   */
  async signOut(): Promise<void> {
    const stored = await this.deps.store.get(STORAGE_KEYS.refreshToken);
    if (stored !== null) await this.deps.logout(stored).catch(() => undefined);
    await this.endSession();
  }

  // ------------------------------------------------------------ tokens

  /** A usable access token, refreshing first if it is missing or about to expire. */
  async getValidAccessToken(): Promise<string> {
    const current = this.accessToken;
    if (current !== undefined && current.expiresAtMs - EXPIRY_SKEW_MS > this.deps.now()) {
      return current.token;
    }
    return this.refreshAccessToken();
  }

  /**
   * Single-flight: concurrent callers (e.g. several requests that all got a
   * 401) share ONE refresh request — never a refresh storm.
   */
  refreshAccessToken(): Promise<string> {
    this.inFlightRefresh ??= this.performRefresh().finally(() => {
      this.inFlightRefresh = undefined;
    });
    return this.inFlightRefresh;
  }

  private async performRefresh(): Promise<string> {
    const stored = await this.deps.store.get(STORAGE_KEYS.refreshToken);
    if (stored === null) {
      await this.endSession();
      throw new SessionEndedError('No stored session');
    }
    let tokens: SessionTokens;
    try {
      tokens = await this.deps.refresh(stored, await this.deps.device());
    } catch (error) {
      if (error instanceof ApiResponseError && error.code === 'SESSION_INVALID') {
        await this.endSession();
        throw new SessionEndedError('Session invalid');
      }
      if (error instanceof ApiResponseError && error.code === 'ACCOUNT_NOT_ACTIVE') {
        this.setStatus({ kind: 'restricted' });
      } else if (isTransient(error) && this.status.kind === 'initializing') {
        this.setStatus({ kind: 'unavailable' });
      }
      throw error; // credential deliberately kept
    }
    await this.deps.store.set(STORAGE_KEYS.refreshToken, tokens.refreshToken);
    this.accessToken = {
      token: tokens.accessToken,
      expiresAtMs: Date.parse(tokens.accessTokenExpiresAt),
    };
    this.setStatus({ kind: 'authenticated' });
    return tokens.accessToken;
  }

  /** Clears local credentials exactly once; never the install ID. */
  private async endSession(): Promise<void> {
    this.accessToken = undefined;
    if (this.status.kind === 'unauthenticated') return;
    await this.deps.store.delete(STORAGE_KEYS.refreshToken);
    this.setStatus({ kind: 'unauthenticated' });
  }
}
