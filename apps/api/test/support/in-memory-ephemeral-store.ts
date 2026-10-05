import type { Clock } from '../../src/modules/identity/application/ports.js';
import { EphemeralStoreUnavailableError } from '../../src/shared/errors/application-error.js';
import type { EphemeralStore } from '../../src/shared/redis/ephemeral-store.js';

interface Entry {
  value: string;
  expiresAtMs: number | undefined;
}

/**
 * Test double for EphemeralStore with clock-driven expiry. Redis semantics
 * (atomic Lua) are verified separately against real Redis in integration tests.
 */
export class InMemoryEphemeralStore implements EphemeralStore {
  readonly entries = new Map<string, Entry>();
  available = true;

  constructor(private readonly clock: Clock) {}

  private live(key: string): Entry | undefined {
    if (!this.available) throw new EphemeralStoreUnavailableError('simulated outage');
    const entry = this.entries.get(key);
    if (entry?.expiresAtMs !== undefined && this.clock.now().getTime() >= entry.expiresAtMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  private expiry(ttlMs: number): number {
    return this.clock.now().getTime() + ttlMs;
  }

  hitWindow(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }> {
    const entry = this.live(key) ?? { value: '0', expiresAtMs: this.expiry(windowMs) };
    entry.value = String(Number(entry.value) + 1);
    this.entries.set(key, entry);
    const ttlMs = (entry.expiresAtMs ?? this.expiry(windowMs)) - this.clock.now().getTime();
    return Promise.resolve({ count: Number(entry.value), ttlMs });
  }

  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    if (this.live(key) !== undefined) return Promise.resolve(false);
    this.entries.set(key, { value, expiresAtMs: this.expiry(ttlMs) });
    return Promise.resolve(true);
  }

  set(key: string, value: string, ttlMs: number): Promise<void> {
    this.live(key);
    this.entries.set(key, { value, expiresAtMs: this.expiry(ttlMs) });
    return Promise.resolve();
  }

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(this.live(key)?.value);
  }

  getDelete(key: string): Promise<string | undefined> {
    const value = this.live(key)?.value;
    this.entries.delete(key);
    return Promise.resolve(value);
  }

  delete(key: string): Promise<void> {
    this.live(key);
    this.entries.delete(key);
    return Promise.resolve();
  }

  ttlMs(key: string): Promise<number | undefined> {
    const entry = this.live(key);
    if (entry?.expiresAtMs === undefined) return Promise.resolve(undefined);
    return Promise.resolve(entry.expiresAtMs - this.clock.now().getTime());
  }

  incrementIfExists(key: string): Promise<number | undefined> {
    const entry = this.live(key);
    if (entry === undefined) return Promise.resolve(undefined);
    entry.value = String(Number(entry.value) + 1);
    return Promise.resolve(Number(entry.value));
  }

  replaceIfEquals(key: string, expected: string, next: string, ttlMs: number): Promise<boolean> {
    if (this.live(key)?.value !== expected) return Promise.resolve(false);
    this.entries.set(key, { value: next, expiresAtMs: this.expiry(ttlMs) });
    return Promise.resolve(true);
  }

  deleteIfEquals(key: string, expected: string): Promise<boolean> {
    if (this.live(key)?.value !== expected) return Promise.resolve(false);
    this.entries.delete(key);
    return Promise.resolve(true);
  }

  /** Every stored key and value, for "nothing sensitive stored" assertions. */
  dump(): string {
    return JSON.stringify([...this.entries.entries()]);
  }
}
