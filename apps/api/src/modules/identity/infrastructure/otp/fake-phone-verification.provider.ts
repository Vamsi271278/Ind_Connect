import { timingSafeEqual } from 'node:crypto';

import type { Secret } from '../../../../config/secret.js';
import { sha256Hex } from '../../../../shared/crypto/crypto.js';
import type {
  Clock,
  PhoneCheckResult,
  PhoneVerificationProvider,
} from '../../application/ports.js';

/**
 * Local/test stand-in for Twilio Verify. Accepts one configured code. Holds
 * per-number state in process memory keyed by a hash of the number.
 *
 * It refuses to exist in production, independently of configuration
 * validation, and never logs or returns the code.
 */
export class FakePhoneVerificationProvider implements PhoneVerificationProvider {
  private readonly pending = new Map<string, { expiresAtMs: number; attempts: number }>();

  constructor(
    private readonly code: Secret,
    private readonly settings: { readonly codeTtlMs: number; readonly maxAttempts: number },
    private readonly clock: Clock,
    nodeEnv: string,
  ) {
    if (nodeEnv === 'production') {
      throw new Error('FakePhoneVerificationProvider cannot be used in production');
    }
  }

  start(input: { readonly phoneE164: string }): Promise<void> {
    this.pending.set(sha256Hex(input.phoneE164), {
      expiresAtMs: this.clock.now().getTime() + this.settings.codeTtlMs,
      attempts: 0,
    });
    return Promise.resolve();
  }

  check(input: { readonly phoneE164: string; readonly code: string }): Promise<PhoneCheckResult> {
    const key = sha256Hex(input.phoneE164);
    const entry = this.pending.get(key);
    if (entry === undefined || this.clock.now().getTime() >= entry.expiresAtMs) {
      this.pending.delete(key);
      return Promise.resolve('expired');
    }

    const expected = Buffer.from(this.code.reveal(), 'utf8');
    const given = Buffer.from(input.code, 'utf8');
    if (expected.length === given.length && timingSafeEqual(expected, given)) {
      this.pending.delete(key);
      return Promise.resolve('approved');
    }

    entry.attempts += 1;
    if (entry.attempts >= this.settings.maxAttempts) {
      this.pending.delete(key);
      return Promise.resolve('max_attempts');
    }
    return Promise.resolve('incorrect');
  }
}
