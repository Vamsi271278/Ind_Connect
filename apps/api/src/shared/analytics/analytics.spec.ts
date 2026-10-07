import { describe, expect, it } from 'vitest';

import { InMemoryAnalyticsProvider } from '../../../test/support/in-memory-analytics.js';
import { Secret } from '../../config/secret.js';
import { KeyedHasher } from '../crypto/crypto.js';
import { AnalyticsTracker } from './analytics.js';

const USER = '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f';

const make = () => {
  const provider = new InMemoryAnalyticsProvider();
  const warnings: Record<string, unknown>[] = [];
  const tracker = new AnalyticsTracker(
    provider,
    new KeyedHasher(new Secret('analytics-test-pepper-0123456789abcdef')),
    { warn: (event) => warnings.push(event) },
    () => new Date('2026-10-05T12:00:00Z'),
  );
  return { provider, tracker, warnings };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AnalyticsTracker', () => {
  it('emits canonical envelopes with a keyed pseudonym, never the user ID', () => {
    const { provider, tracker } = make();
    tracker.track({ name: 'onboarding_step_completed', userId: USER, stepCode: 'NAME' });
    tracker.track({ name: 'otp_verified', userId: null });

    const [step, otp] = provider.events;
    expect(step).toMatchObject({
      event_name: 'onboarding_step_completed',
      event_version: 1,
      occurred_at: '2026-10-05T12:00:00.000Z',
      properties: { step_code: 'NAME' },
    });
    expect(step?.user_id_pseudonymous).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(provider.events)).not.toContain(USER);
    expect(otp).toMatchObject({
      event_name: 'otp_verified',
      user_id_pseudonymous: null,
      properties: {},
    });
  });

  it('gives the same user the same pseudonym across events', () => {
    const { provider, tracker } = make();
    tracker.track({ name: 'otp_verified', userId: USER });
    tracker.track({ name: 'onboarding_step_completed', userId: USER, stepCode: 'GENDER' });
    expect(provider.events[0]?.user_id_pseudonymous).toBe(provider.events[1]?.user_id_pseudonymous);
  });

  it('never throws when the provider fails; logs the failure without payload', async () => {
    const { provider, tracker, warnings } = make();
    provider.failing = true;
    expect(() => {
      tracker.track({ name: 'otp_verified', userId: USER });
    }).not.toThrow();
    await flush();
    expect(warnings).toEqual([{ event: 'analytics.publish_failed', eventName: 'otp_verified' }]);
  });
});
