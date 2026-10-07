import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { AnalyticsTracker } from '../../../shared/analytics/analytics.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingStep } from '../../identity/domain/account.js';
import { DatingIntentWriter } from '../../profile/application/intent.service.js';
import { DatingConsentService } from './dating-consent.service.js';

const VERSION = 'dating-test-v1';

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('DatingConsentService', () => {
  let h: IdentityHarness;
  let userId: string;

  const setup = async (dating?: { enabled: boolean; policyVersion: string | null }) => {
    h = createIdentityHarness(dating === undefined ? {} : { dating });
    userId = (await h.signUp('+12145550123', '1995-06-15')).account.id;
  };
  beforeEach(async () => {
    await setup();
  });

  const user = () => {
    const found = h.store.state.users.find((u) => u.id === userId);
    if (found === undefined) throw new Error('no user');
    return found;
  };
  const setStep = (step: OnboardingStep) => {
    Object.assign(user(), {
      onboardingStep: step,
      onboardingStatus: step === 'COMPLETE' ? 'COMPLETE' : 'IN_PROGRESS',
    });
  };
  const datingActive = () => h.intents.activeOf(userId).includes('DATING');
  const activeConsents = () => h.consents.activeFor(userId);
  /** The invariant: DATING active ⇔ exactly one active consent. */
  const expectInvariant = () => {
    expect(datingActive()).toBe(activeConsents().length === 1);
    expect(activeConsents().length).toBeLessThanOrEqual(1);
  };
  const events = (name: string) => h.analyticsProvider.events.filter((e) => e.event_name === name);

  describe('opt-in (PUT)', () => {
    it('records ONBOARDING consent and activates DATING atomically', async () => {
      setStep('INTENT');
      await h.datingConsentService.optIn(userId, VERSION);
      expect(datingActive()).toBe(true);
      expect(activeConsents()).toEqual([
        expect.objectContaining({ policyVersion: VERSION, source: 'ONBOARDING', revokedAt: null }),
      ]);
      expectInvariant();
      expect(events('dating_enabled').map((e) => e.properties)).toEqual([{ source: 'onboarding' }]);
    });

    it('is idempotent: a repeat adds no consent row and no event', async () => {
      setStep('INTENT');
      await h.datingConsentService.optIn(userId, VERSION);
      await h.datingConsentService.optIn(userId, VERSION);
      expect(h.consents.rows).toHaveLength(1);
      expect(events('dating_enabled')).toHaveLength(1);
      expectInvariant();
    });

    it('records SETTINGS once onboarding is complete', async () => {
      setStep('COMPLETE');
      await h.datingConsentService.optIn(userId, VERSION);
      expect(activeConsents()[0]?.source).toBe('SETTINGS');
      expect(events('dating_enabled')[0]?.properties).toEqual({ source: 'settings' });
    });

    it.each(['NAME', 'GENDER', 'LOCATION'] as const)(
      'is rejected at %s and stores nothing',
      async (step) => {
        setStep(step);
        expect(await errorCode(h.datingConsentService.optIn(userId, VERSION))).toBe(
          'ONBOARDING_STEP_NOT_REACHED',
        );
        expect(h.consents.rows).toHaveLength(0);
        expect(datingActive()).toBe(false);
      },
    );

    it('rejects a policy version other than the one served', async () => {
      setStep('INTENT');
      expect(await errorCode(h.datingConsentService.optIn(userId, 'dating-old-v0'))).toBe(
        'DATING_POLICY_OUTDATED',
      );
      expect(h.consents.rows).toHaveLength(0);
      expectInvariant();
    });

    it('re-consent to a new policy version revokes the old record and keeps history', async () => {
      setStep('INTENT');
      await h.datingConsentService.optIn(userId, VERSION);
      await setupWithExisting('dating-test-v2');
      expect(h.consents.rows.map((r) => [r.policyVersion, r.revokedAt === null])).toEqual([
        [VERSION, false],
        ['dating-test-v2', true],
      ]);
      expectInvariant();
      // DATING stayed on: no second dating_enabled.
      expect(events('dating_enabled')).toHaveLength(1);
    });

    it.each(['SUSPENDED', 'BANNED'] as const)(
      'fails closed for a %s account under the lock',
      async (status) => {
        setStep('INTENT');
        h.store.setAccountStatus(userId, status);
        expect(await errorCode(h.datingConsentService.optIn(userId, VERSION))).toBe(
          'ACCOUNT_NOT_ACTIVE',
        );
        expect(h.consents.rows).toHaveLength(0);
      },
    );

    it('rolls back the consent if activating DATING fails (never consent without DATING)', async () => {
      setStep('INTENT');
      vi.spyOn(h.intents.repository, 'activateIntent').mockRejectedValueOnce(
        new Error('simulated'),
      );
      await expect(h.datingConsentService.optIn(userId, VERSION)).rejects.toThrow('simulated');
      expect(h.consents.rows).toHaveLength(0);
      expect(datingActive()).toBe(false);
      expect(events('dating_enabled')).toHaveLength(0);
    });

    it('repairs a DATING row without consent instead of leaving it', async () => {
      setStep('INTENT');
      await h.intents.repository.activateIntent(userId, 'DATING', h.clock.now());
      await h.datingConsentService.optIn(userId, VERSION);
      expectInvariant();
    });
  });

  describe('opt-out (DELETE)', () => {
    it('revokes consent and deactivates DATING atomically, keeping history', async () => {
      setStep('INTENT');
      await h.datingConsentService.optIn(userId, VERSION);
      await h.datingConsentService.optOut(userId);
      expect(datingActive()).toBe(false);
      expect(h.consents.rows).toHaveLength(1);
      expect(h.consents.rows[0]?.revokedAt).not.toBeNull();
      expectInvariant();
      expect(events('dating_disabled')).toHaveLength(1);
    });

    it('is idempotent and emits nothing when Dating was already off', async () => {
      await h.datingConsentService.optOut(userId);
      await h.datingConsentService.optOut(userId);
      expect(events('dating_disabled')).toHaveLength(0);
    });

    it('is allowed when DATING is the only intent: zero intents, no rewind', async () => {
      setStep('INTENT');
      await h.datingConsentService.optIn(userId, VERSION);
      await h.intentService.updateMyIntents(userId, []);
      expect(user().onboardingStep).toBe('LANGUAGE');
      await h.datingConsentService.optOut(userId);
      expect(h.intents.activeOf(userId)).toEqual([]);
      expect(user().onboardingStep).toBe('LANGUAGE');
      expectInvariant();
    });

    it.each(['SUSPENDED', 'BANNED', 'DEACTIVATED'] as const)(
      'is never blocked by account status (%s)',
      async (status) => {
        setStep('INTENT');
        await h.datingConsentService.optIn(userId, VERSION);
        h.store.setAccountStatus(userId, status);
        await h.datingConsentService.optOut(userId);
        expect(datingActive()).toBe(false);
        expectInvariant();
      },
    );

    it('rolls back the revocation if deactivating DATING fails (never DATING without consent)', async () => {
      setStep('INTENT');
      await h.datingConsentService.optIn(userId, VERSION);
      vi.spyOn(h.intents.repository, 'deactivateIntent').mockRejectedValueOnce(
        new Error('simulated'),
      );
      await expect(h.datingConsentService.optOut(userId)).rejects.toThrow('simulated');
      expect(datingActive()).toBe(true);
      expect(activeConsents()).toHaveLength(1);
      expectInvariant();
    });
  });

  describe('kill switch off', () => {
    beforeEach(async () => {
      await setup({ enabled: false, policyVersion: null });
      setStep('INTENT');
    });

    it('rejects opt-in before touching anything', async () => {
      expect(await errorCode(h.datingConsentService.optIn(userId, VERSION))).toBe(
        'DATING_NOT_ELIGIBLE',
      );
      expect(h.consents.rows).toHaveLength(0);
      expect(datingActive()).toBe(false);
    });

    it('still allows opt-out of a consent given while it was on', async () => {
      // Consent recorded earlier (switch on), then the switch was turned off.
      await h.consents.repository.recordConsent(userId, {
        policyVersion: VERSION,
        source: 'ONBOARDING',
        at: h.clock.now(),
      });
      await h.intents.repository.activateIntent(userId, 'DATING', h.clock.now());
      await h.datingConsentService.optOut(userId);
      expect(datingActive()).toBe(false);
      expectInvariant();
    });

    it('hides DATING from the offered intent options', async () => {
      const view = await h.intentService.listOptions();
      expect(view.options.map((o) => o.code)).toEqual(['FRIENDSHIP', 'ACTIVITIES', 'NETWORKING']);
      expect(view.dating).toBeNull();
    });
  });

  it('keeps consent details out of analytics and the self projection', async () => {
    setStep('INTENT');
    await h.datingConsentService.optIn(userId, VERSION);
    const me = await h.profileService.getMe(userId);
    expect(me.datingEnabled).toBe(true);
    const dump = JSON.stringify([me, h.analyticsProvider.events]);
    expect(dump).not.toContain(VERSION);
    expect(dump).not.toContain('consentedAt');
    expect(dump).not.toContain('ONBOARDING');
    expect(JSON.stringify(h.analyticsProvider.events)).not.toContain(userId);
  });

  /** Simulates a policy update: same stores, newly configured version. */
  async function setupWithExisting(newVersion: string): Promise<void> {
    const service = new DatingConsentService({
      unitOfWork: h.unitOfWork,
      consents: h.consents,
      datingIntent: new DatingIntentWriter(h.intents),
      onboarding: h.onboarding,
      analytics: new AnalyticsTracker(h.analyticsProvider, h.hasher, h.logger),
      clock: h.clock,
      dating: { enabled: true, policyVersion: newVersion },
    });
    h.clock.advance(1000);
    await service.optIn(userId, newVersion);
  }
});
