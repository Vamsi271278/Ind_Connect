import type { EphemeralStore } from '../../../../shared/redis/ephemeral-store.js';

export interface RateRule {
  readonly name: string;
  readonly limit: number;
  readonly windowMs: number;
}

export type RateDecision =
  { readonly allowed: true } | { readonly allowed: false; readonly retryAfterSeconds: number };

/** Fixed-window limiter over atomic counters. `subject` must be log-safe (hashed). */
export class RateLimiter {
  constructor(private readonly store: EphemeralStore) {}

  async hit(rule: RateRule, subject: string): Promise<RateDecision> {
    const { count, ttlMs } = await this.store.hitWindow(
      `rl:${rule.name}:${subject}`,
      rule.windowMs,
    );
    if (count <= rule.limit) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)) };
  }

  /** Applies every rule; reports the longest wait among those exceeded. */
  async hitAll(checks: readonly (readonly [RateRule, string])[]): Promise<RateDecision> {
    let retryAfterSeconds = 0;
    for (const [rule, subject] of checks) {
      const decision = await this.hit(rule, subject);
      if (!decision.allowed)
        retryAfterSeconds = Math.max(retryAfterSeconds, decision.retryAfterSeconds);
    }
    return retryAfterSeconds > 0 ? { allowed: false, retryAfterSeconds } : { allowed: true };
  }
}
