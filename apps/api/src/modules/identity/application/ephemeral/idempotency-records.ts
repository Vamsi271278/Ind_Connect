import { errorCodeSchema } from '@project-connect/api-contracts';
import { z } from 'zod';

import { sha256Hex } from '../../../../shared/crypto/crypto.js';
import type { EphemeralStore } from '../../../../shared/redis/ephemeral-store.js';

/**
 * What a completed operation produced. References only — never tokens, OTP
 * codes or dates of birth.
 */
const outcomeSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('session'), sessionId: z.uuid() }),
  z.strictObject({
    type: z.literal('registration'),
    tokenHash: z.string().regex(/^[0-9a-f]{64}$/),
  }),
  z.strictObject({ type: z.literal('error'), code: errorCodeSchema }),
]);
export type OperationOutcome = z.infer<typeof outcomeSchema>;

const recordSchema = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('in_progress'), fingerprint: z.string() }),
  z.strictObject({
    state: z.literal('completed'),
    fingerprint: z.string(),
    outcome: outcomeSchema,
  }),
]);

/** Proof of ownership of a record, needed to complete or abandon it. */
export interface RecordHandle {
  readonly key: string;
  readonly raw: string;
  readonly fingerprint: string;
}

export type BeginResult =
  | { readonly kind: 'started'; readonly handle: RecordHandle }
  | { readonly kind: 'replay'; readonly handle: RecordHandle; readonly outcome: OperationOutcome }
  | { readonly kind: 'key_reused' }
  | { readonly kind: 'in_progress' };

/**
 * Short-lived operation records for retry-safe mutations. The same key with the
 * same payload fingerprint replays; a different payload is rejected. Records
 * live in Redis only (no permanent idempotency table yet).
 */
export class IdempotencyRecords {
  constructor(
    private readonly store: EphemeralStore,
    private readonly settings: { readonly ttlMs: number; readonly lockMs: number },
  ) {}

  async begin(scope: string, idempotencyKey: string, fingerprint: string): Promise<BeginResult> {
    const key = `idempotency:${scope}:${sha256Hex(idempotencyKey)}`;
    const inProgress = JSON.stringify({ state: 'in_progress', fingerprint });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (await this.store.setIfAbsent(key, inProgress, this.settings.lockMs)) {
        return { kind: 'started', handle: { key, raw: inProgress, fingerprint } };
      }
      const raw = await this.store.get(key);
      if (raw === undefined) continue; // expired between the two calls; retry once
      const parsed = recordSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return { kind: 'in_progress' };
      if (parsed.data.fingerprint !== fingerprint) return { kind: 'key_reused' };
      if (parsed.data.state === 'in_progress') return { kind: 'in_progress' };
      return { kind: 'replay', handle: { key, raw, fingerprint }, outcome: parsed.data.outcome };
    }
    return { kind: 'in_progress' };
  }

  /** Records the outcome. Returns the new handle, or undefined if ownership was lost. */
  async complete(
    handle: RecordHandle,
    outcome: OperationOutcome,
  ): Promise<RecordHandle | undefined> {
    const raw = JSON.stringify({ state: 'completed', fingerprint: handle.fingerprint, outcome });
    const ok = await this.store.replaceIfEquals(handle.key, handle.raw, raw, this.settings.ttlMs);
    return ok ? { ...handle, raw } : undefined;
  }

  /** Releases an in-progress record after a transient failure so a retry re-executes. */
  async abandon(handle: RecordHandle): Promise<void> {
    await this.store.deleteIfEquals(handle.key, handle.raw);
  }
}
