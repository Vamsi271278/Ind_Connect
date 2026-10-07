import { STORAGE_KEYS, type KeyValueStore } from './storage';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuidV4 = (value: string): boolean => UUID_V4.test(value);

/**
 * D11 installation identifier: a UUID v4 generated once per installation and
 * persisted in secure storage. Reused across launches, sign-in and logout;
 * regenerated only when no usable stored value exists. It identifies the
 * installation for device context — it is not a credential or secret.
 *
 * `generate` is the expo-crypto-backed wrapper in the app; there is no
 * Math.random fallback anywhere.
 */
export function createInstallIdProvider(store: KeyValueStore, generate: () => string) {
  let pending: Promise<string> | undefined;

  const load = async (): Promise<string> => {
    const stored = await store.get(STORAGE_KEYS.installId);
    if (stored !== null && isUuidV4(stored)) return stored;

    const created = generate();
    if (!isUuidV4(created)) throw new Error('Install ID generator did not return a UUID v4');
    await store.set(STORAGE_KEYS.installId, created);
    return created;
  };

  /** Concurrent first-launch callers share one load, so only one ID is ever created. */
  return (): Promise<string> => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}
