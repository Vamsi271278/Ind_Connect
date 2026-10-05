/** Secure key/value storage port (SecureStore in the app, in-memory in tests). */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Persisted keys. The install ID and the refresh credential are deliberately
 * separate: logout clears the credential and never the installation identity.
 */
export const STORAGE_KEYS = {
  installId: 'pc.installId',
  refreshToken: 'pc.session.refreshToken',
} as const;
