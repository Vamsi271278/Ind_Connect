import { createClient, type RedisClientType } from 'redis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { EphemeralStoreUnavailableError } from '../../src/shared/errors/application-error.js';
import { RedisEphemeralStore } from '../../src/shared/redis/redis-ephemeral-store.js';
import { resetRedis } from '../support/integration-db.js';

const url = process.env.REDIS_URL ?? '';
let client: RedisClientType;
let store: RedisEphemeralStore;

beforeAll(async () => {
  client = createClient({ url, disableOfflineQueue: true });
  await client.connect();
  store = new RedisEphemeralStore(client);
});
afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  await resetRedis(url);
});

describe('RedisEphemeralStore (real Redis, ElastiCache 7.1-compatible commands)', () => {
  it('hitWindow counts and sets the expiry atomically with the first hit', async () => {
    expect(await store.hitWindow('rl:test:a', 60_000)).toMatchObject({ count: 1 });
    const second = await store.hitWindow('rl:test:a', 60_000);
    expect(second.count).toBe(2);
    expect(second.ttlMs).toBeGreaterThan(0);
    expect(await client.pTTL('pc:rl:test:a')).toBeGreaterThan(0);
  });

  it('repairs a counter that somehow exists without an expiry', async () => {
    await client.set('pc:rl:test:orphan', '7');
    expect(await client.pTTL('pc:rl:test:orphan')).toBe(-1);
    const hit = await store.hitWindow('rl:test:orphan', 30_000);
    expect(hit.count).toBe(8);
    expect(await client.pTTL('pc:rl:test:orphan')).toBeGreaterThan(0);
  });

  it('counts every concurrent hit exactly once', async () => {
    const hits = await Promise.all(
      Array.from({ length: 50 }, () => store.hitWindow('rl:test:burst', 60_000)),
    );
    expect(hits.map((h) => h.count).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1),
    );
  });

  it('setIfAbsent grants exactly one winner under concurrency', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => store.setIfAbsent('lock:x', '1', 10_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('getDelete redeems a single-use value exactly once under concurrency', async () => {
    await store.set('registration:t', 'ticket', 10_000);
    const results = await Promise.all(
      Array.from({ length: 20 }, () => store.getDelete('registration:t')),
    );
    expect(results.filter((r) => r === 'ticket')).toHaveLength(1);
  });

  it('incrementIfExists preserves the TTL and ignores missing keys', async () => {
    expect(await store.incrementIfExists('otp:challenge:none')).toBeUndefined();
    await store.set('otp:challenge:h', '0', 120_000);
    expect(await store.incrementIfExists('otp:challenge:h')).toBe(1);
    expect(await client.pTTL('pc:otp:challenge:h')).toBeGreaterThan(100_000);
  });

  it('compare-and-set operations act only on the expected value', async () => {
    await store.set('idempotency:k', 'v1', 10_000);
    expect(await store.replaceIfEquals('idempotency:k', 'other', 'v2', 10_000)).toBe(false);
    expect(await store.replaceIfEquals('idempotency:k', 'v1', 'v2', 10_000)).toBe(true);
    expect(await store.deleteIfEquals('idempotency:k', 'v1')).toBe(false);
    expect(await store.deleteIfEquals('idempotency:k', 'v2')).toBe(true);
    expect(await store.get('idempotency:k')).toBeUndefined();
  });

  it('fails closed when the client is not connected', async () => {
    const offline: RedisClientType = createClient({ url, disableOfflineQueue: true });
    const offlineStore = new RedisEphemeralStore(offline);
    await expect(offlineStore.hitWindow('rl:test:z', 1000)).rejects.toBeInstanceOf(
      EphemeralStoreUnavailableError,
    );
  });
});
