import type { RedisClientType } from 'redis';

import { EphemeralStoreUnavailableError } from '../errors/application-error.js';
import type { EphemeralStore } from './ephemeral-store.js';

const KEY_PREFIX = 'pc:';

// All scripts use only commands available in Redis OSS 7.1 (ElastiCache target)
// and touch a single key, so they stay valid under cluster mode.

/** INCR + guaranteed expiry in one atomic step; repairs a TTL-less key. */
const HIT_WINDOW = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}`;

const INCREMENT_IF_EXISTS = `
if redis.call('EXISTS', KEYS[1]) == 1 then
  return redis.call('INCR', KEYS[1])
end
return -1`;

const REPLACE_IF_EQUALS = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
  return 1
end
return 0`;

const DELETE_IF_EQUALS = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('DEL', KEYS[1])
  return 1
end
return 0`;

const asNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  throw new EphemeralStoreUnavailableError('unexpected reply type');
};

const asOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  throw new EphemeralStoreUnavailableError('unexpected reply type');
};

export class RedisEphemeralStore implements EphemeralStore {
  constructor(private readonly client: RedisClientType) {}

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.client.isReady) throw new EphemeralStoreUnavailableError('redis not ready');
    try {
      return await operation();
    } catch (error) {
      if (error instanceof EphemeralStoreUnavailableError) throw error;
      throw new EphemeralStoreUnavailableError('redis command failed', { cause: error });
    }
  }

  hitWindow(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }> {
    return this.run(async () => {
      const reply = await this.client.eval(HIT_WINDOW, {
        keys: [KEY_PREFIX + key],
        arguments: [String(windowMs)],
      });
      if (!Array.isArray(reply) || reply.length !== 2) {
        throw new EphemeralStoreUnavailableError('unexpected reply shape');
      }
      return { count: asNumber(reply[0]), ttlMs: asNumber(reply[1]) };
    });
  }

  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    return this.run(async () => {
      const reply = await this.client.set(KEY_PREFIX + key, value, {
        condition: 'NX',
        expiration: { type: 'PX', value: ttlMs },
      });
      return reply === 'OK';
    });
  }

  set(key: string, value: string, ttlMs: number): Promise<void> {
    return this.run(async () => {
      await this.client.set(KEY_PREFIX + key, value, { expiration: { type: 'PX', value: ttlMs } });
    });
  }

  get(key: string): Promise<string | undefined> {
    return this.run(async () => asOptionalString(await this.client.get(KEY_PREFIX + key)));
  }

  getDelete(key: string): Promise<string | undefined> {
    return this.run(async () => asOptionalString(await this.client.getDel(KEY_PREFIX + key)));
  }

  delete(key: string): Promise<void> {
    return this.run(async () => {
      await this.client.del(KEY_PREFIX + key);
    });
  }

  ttlMs(key: string): Promise<number | undefined> {
    return this.run(async () => {
      const ttl = await this.client.pTTL(KEY_PREFIX + key);
      return ttl >= 0 ? ttl : undefined;
    });
  }

  incrementIfExists(key: string): Promise<number | undefined> {
    return this.run(async () => {
      const reply = asNumber(
        await this.client.eval(INCREMENT_IF_EXISTS, { keys: [KEY_PREFIX + key] }),
      );
      return reply < 0 ? undefined : reply;
    });
  }

  replaceIfEquals(key: string, expected: string, next: string, ttlMs: number): Promise<boolean> {
    return this.run(async () => {
      const reply = await this.client.eval(REPLACE_IF_EQUALS, {
        keys: [KEY_PREFIX + key],
        arguments: [expected, next, String(ttlMs)],
      });
      return asNumber(reply) === 1;
    });
  }

  deleteIfEquals(key: string, expected: string): Promise<boolean> {
    return this.run(async () => {
      const reply = await this.client.eval(DELETE_IF_EQUALS, {
        keys: [KEY_PREFIX + key],
        arguments: [expected],
      });
      return asNumber(reply) === 1;
    });
  }
}
