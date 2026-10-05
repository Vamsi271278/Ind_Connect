/**
 * Narrow interface over ephemeral key/value state (Redis; ADR-007). Every
 * operation is atomic. Nothing stored here is authoritative: PostgreSQL is.
 *
 * Implementations throw `EphemeralStoreUnavailableError` when the backing
 * store is unreachable, so callers fail closed.
 */
export interface EphemeralStore {
  /**
   * Fixed-window counter: increments `key` and guarantees it expires
   * `windowMs` after the first hit in the window — atomically.
   */
  hitWindow(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }>;

  /** Sets `key` only if absent. Returns false if it already existed. */
  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean>;

  set(key: string, value: string, ttlMs: number): Promise<void>;

  get(key: string): Promise<string | undefined>;

  /** Reads and deletes `key` in one step (single-use values). */
  getDelete(key: string): Promise<string | undefined>;

  delete(key: string): Promise<void>;

  /** Remaining TTL in ms, or undefined when the key does not exist. */
  ttlMs(key: string): Promise<number | undefined>;

  /** Increments an existing counter, preserving its TTL. Undefined if absent. */
  incrementIfExists(key: string): Promise<number | undefined>;

  /** Replaces `key` only if it currently equals `expected`. */
  replaceIfEquals(key: string, expected: string, next: string, ttlMs: number): Promise<boolean>;

  /** Deletes `key` only if it currently equals `expected`. */
  deleteIfEquals(key: string, expected: string): Promise<boolean>;
}

export const EPHEMERAL_STORE = Symbol('EPHEMERAL_STORE');
