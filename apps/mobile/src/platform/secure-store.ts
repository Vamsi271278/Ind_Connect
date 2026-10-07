// SecureStore-backed KeyValueStore: Keychain (iOS) / Keystore-encrypted
// storage (Android). The only module that imports expo-secure-store.
import * as SecureStore from 'expo-secure-store';

import type { KeyValueStore } from '@/core/storage';

// Readable after the first unlock (background refresh), never synced or
// migrated to another device via backups.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const secureStore: KeyValueStore = {
  get: (key) => SecureStore.getItemAsync(key, OPTIONS),
  set: (key, value) => SecureStore.setItemAsync(key, value, OPTIONS),
  delete: (key) => SecureStore.deleteItemAsync(key, OPTIONS),
};
