import { randomUUID } from 'node:crypto';

import type { KeyedHasher } from '../crypto/crypto.js';

/**
 * Server-emitted canonical events (ANALYTICS-SPEC Part II). Only names from the
 * canonical registry; properties carry codes and counts, never PII — no names,
 * phone, DOB, gender text, OTP or tokens (Analytics §2.4, §5).
 */
export type AnalyticsEvent =
  | { readonly name: 'otp_verified'; readonly userId: string | null }
  | {
      readonly name: 'onboarding_step_completed';
      readonly userId: string;
      /** Canonical onboarding_step code. duration_seconds is client-measured (B3). */
      readonly stepCode: string;
    }
  /** Analytics §81. Emitted only when Dating actually turns on (after commit). */
  | {
      readonly name: 'dating_enabled';
      readonly userId: string;
      readonly source: 'onboarding' | 'settings';
    }
  /** Analytics §82. Emitted only when Dating actually turns off (after commit). */
  | { readonly name: 'dating_disabled'; readonly userId: string };

/** Envelope fields the server can truthfully supply (Analytics §4). */
export interface TrackedEvent {
  readonly event_id: string;
  readonly event_name: AnalyticsEvent['name'];
  readonly event_version: 1;
  readonly occurred_at: string;
  readonly user_id_pseudonymous: string | null;
  readonly properties: Readonly<Record<string, string | number | boolean>>;
}

/** ADR-030 provider boundary. PostHog arrives later behind this interface. */
export interface AnalyticsProvider {
  publish(event: TrackedEvent): Promise<void>;
}

export class NoopAnalyticsProvider implements AnalyticsProvider {
  publish(): Promise<void> {
    return Promise.resolve();
  }
}

export interface AnalyticsFailureLogger {
  warn(event: Record<string, unknown>): void;
}

/**
 * Builds canonical envelopes and hands them to the provider. Fire-and-forget:
 * analytics never blocks or fails a user action (ADR-042), so callers emit only
 * after their transaction has committed.
 */
export class AnalyticsTracker {
  constructor(
    private readonly provider: AnalyticsProvider,
    private readonly hasher: KeyedHasher,
    private readonly logger: AnalyticsFailureLogger,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Codes only: never names, intents, cities, policy versions or consent times. */
  private static properties(event: AnalyticsEvent): TrackedEvent['properties'] {
    switch (event.name) {
      case 'onboarding_step_completed':
        return { step_code: event.stepCode };
      case 'dating_enabled':
        return { source: event.source };
      case 'otp_verified':
      case 'dating_disabled':
        return {};
    }
  }

  /** Keyed pseudonymous analytics identity; never the internal user UUID. */
  private pseudonym(userId: string | null): string | null {
    return userId === null ? null : this.hasher.hash('analytics-user', userId);
  }

  track(event: AnalyticsEvent): void {
    const tracked: TrackedEvent = {
      event_id: randomUUID(),
      event_name: event.name,
      event_version: 1,
      occurred_at: this.now().toISOString(),
      user_id_pseudonymous: this.pseudonym(event.userId),
      properties: AnalyticsTracker.properties(event),
    };
    try {
      this.provider.publish(tracked).catch(() => {
        this.logger.warn({ event: 'analytics.publish_failed', eventName: tracked.event_name });
      });
    } catch {
      this.logger.warn({ event: 'analytics.publish_failed', eventName: tracked.event_name });
    }
  }
}

export const ANALYTICS = Symbol('ANALYTICS');
