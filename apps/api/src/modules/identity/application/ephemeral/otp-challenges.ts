import type { EphemeralStore } from '../../../../shared/redis/ephemeral-store.js';

/**
 * Per-phone OTP challenge state, keyed by the phone HMAC. Holds only an
 * attempt counter and a resend cooldown marker — never the code.
 */
export class OtpChallenges {
  constructor(
    private readonly store: EphemeralStore,
    private readonly settings: { readonly codeTtlMs: number; readonly cooldownMs: number },
  ) {}

  private challengeKey = (phoneHash: string) => `otp:challenge:${phoneHash}`;
  private cooldownKey = (phoneHash: string) => `otp:cooldown:${phoneHash}`;

  async acquireCooldown(
    phoneHash: string,
  ): Promise<{ readonly ok: true } | { readonly ok: false; readonly retryAfterSeconds: number }> {
    const key = this.cooldownKey(phoneHash);
    if (await this.store.setIfAbsent(key, '1', this.settings.cooldownMs)) return { ok: true };
    const remaining = (await this.store.ttlMs(key)) ?? this.settings.cooldownMs;
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(remaining / 1000)) };
  }

  releaseCooldown(phoneHash: string): Promise<void> {
    return this.store.delete(this.cooldownKey(phoneHash));
  }

  /** Opens (or resets) the challenge window with a zero attempt count. */
  open(phoneHash: string): Promise<void> {
    return this.store.set(this.challengeKey(phoneHash), '0', this.settings.codeTtlMs);
  }

  /** Counts a verification attempt. Undefined when no live challenge exists. */
  recordAttempt(phoneHash: string): Promise<number | undefined> {
    return this.store.incrementIfExists(this.challengeKey(phoneHash));
  }

  close(phoneHash: string): Promise<void> {
    return this.store.delete(this.challengeKey(phoneHash));
  }
}
