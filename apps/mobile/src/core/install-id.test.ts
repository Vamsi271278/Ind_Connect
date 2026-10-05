import { randomUUID } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { createInstallIdProvider } from './install-id';
import { STORAGE_KEYS } from './storage';
import { MemoryStore } from './test-support';

describe('install ID (D11)', () => {
  it('generates a UUID v4 once and persists it', async () => {
    const store = new MemoryStore();
    const generate = vi.fn(() => randomUUID());
    const id = await createInstallIdProvider(store, generate)();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(store.values.get(STORAGE_KEYS.installId)).toBe(id);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('returns the same ID across app launches (new provider, same storage)', async () => {
    const store = new MemoryStore();
    const first = await createInstallIdProvider(store, () => randomUUID())();
    const generate = vi.fn(() => randomUUID());
    const afterRestart = await createInstallIdProvider(store, generate)();
    expect(afterRestart).toBe(first);
    expect(generate).not.toHaveBeenCalled();
  });

  it('shares one generation between concurrent first-launch callers', async () => {
    const store = new MemoryStore();
    const generate = vi.fn(() => randomUUID());
    const provider = createInstallIdProvider(store, generate);
    const ids = await Promise.all([provider(), provider(), provider()]);
    expect(new Set(ids).size).toBe(1);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('regenerates only when no usable value is stored', async () => {
    const store = new MemoryStore();
    await store.set(STORAGE_KEYS.installId, 'corrupted');
    const id = await createInstallIdProvider(store, () => randomUUID())();
    expect(id).not.toBe('corrupted');
    expect(store.values.get(STORAGE_KEYS.installId)).toBe(id);
  });

  it('refuses a generator that does not produce a UUID v4 (no weak fallback)', async () => {
    await expect(createInstallIdProvider(new MemoryStore(), () => 'not-random')()).rejects.toThrow(
      /UUID v4/,
    );
  });
});
