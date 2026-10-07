// Test helpers for src/core (imported only by *.test.ts files).
import type { DeviceContext, SessionTokens } from '@project-connect/api-contracts';

import type { KeyValueStore } from './storage';

export class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>();
  readonly deletes: string[] = [];

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.values.get(key) ?? null);
  }

  set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.deletes.push(key);
    this.values.delete(key);
    return Promise.resolve();
  }
}

export const DEVICE: DeviceContext = {
  platform: 'android',
  appVersion: '1.0.0',
  osVersion: '15',
  installId: '7d3f8a2e-1c4b-4e5a-9b6c-2f1e3d4c5b6a',
};

const opaque = (seed: string) => seed.padEnd(43, 'x').slice(0, 43);

export const tokens = (n: number, now = Date.parse('2026-10-05T12:00:00Z')): SessionTokens => ({
  accessToken: `access-${String(n)}`,
  accessTokenExpiresAt: new Date(now + 15 * 60_000).toISOString(),
  refreshToken: opaque(`refresh${String(n)}`),
  refreshTokenExpiresAt: new Date(now + 30 * 86_400_000).toISOString(),
});

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const apiError = (status: number, code: string) =>
  json(status, { error: { code, message: 'x', correlationId: 'c-1' } });
