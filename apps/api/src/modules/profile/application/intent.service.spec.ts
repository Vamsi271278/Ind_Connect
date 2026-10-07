import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingStep } from '../../identity/domain/account.js';

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('IntentService', () => {
  let h: IdentityHarness;
  let userId: string;

  beforeEach(async () => {
    h = createIdentityHarness();
    userId = (await h.signUp('+12145550123', '1995-06-15')).account.id;
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
  const intentSteps = () =>
    h.analyticsProvider.events.filter(
      (e) => e.event_name === 'onboarding_step_completed' && e.properties.step_code === 'INTENT',
    );

  it('offers the four top-level options with the policy version while Dating is on', async () => {
    const view = await h.intentService.listOptions();
    expect(view.options.map((o) => o.code)).toEqual([
      'FRIENDSHIP',
      'ACTIVITIES',
      'NETWORKING',
      'DATING',
    ]);
    expect(view.dating).toEqual({ policyVersion: 'dating-test-v1' });
  });

  it.each(['NAME', 'GENDER', 'LOCATION'] as const)(
    'rejects intent writes at %s and stores nothing',
    async (step) => {
      setStep(step);
      expect(await errorCode(h.intentService.updateMyIntents(userId, ['FRIENDSHIP']))).toBe(
        'ONBOARDING_STEP_NOT_REACHED',
      );
      expect(h.intents.activeOf(userId)).toEqual([]);
    },
  );

  it('at INTENT: saves the selection and advances to LANGUAGE once', async () => {
    setStep('INTENT');
    const view = await h.intentService.updateMyIntents(userId, ['NETWORKING', 'FRIENDSHIP']);
    expect(view).toEqual({
      activeIntents: ['FRIENDSHIP', 'NETWORKING'],
      onboarding: { status: 'IN_PROGRESS', step: 'LANGUAGE' },
    });
    await h.intentService.updateMyIntents(userId, ['ACTIVITIES']);
    expect(user().onboardingStep).toBe('LANGUAGE');
    expect(intentSteps()).toHaveLength(1);
  });

  it('replaces the social set, keeping deselected rows as inactive history', async () => {
    setStep('INTENT');
    await h.intentService.updateMyIntents(userId, ['FRIENDSHIP', 'ACTIVITIES']);
    h.clock.advance(1000);
    await h.intentService.updateMyIntents(userId, ['ACTIVITIES']);
    expect(h.intents.activeOf(userId)).toEqual(['ACTIVITIES']);
    expect(h.intents.rows.get(userId)?.get('FRIENDSHIP')).toMatchObject({
      active: false,
      deselectedAt: h.clock.now(),
    });
  });

  it('requires at least one active intent; an empty list is valid only with Dating on', async () => {
    setStep('INTENT');
    expect(await errorCode(h.intentService.updateMyIntents(userId, []))).toBe('INTENT_REQUIRED');
    expect(user().onboardingStep).toBe('INTENT');

    await h.datingConsentService.optIn(userId, 'dating-test-v1');
    const view = await h.intentService.updateMyIntents(userId, []);
    expect(view).toMatchObject({ activeIntents: ['DATING'], onboarding: { step: 'LANGUAGE' } });
  });

  it('never touches DATING: social edits leave an active Dating as it is', async () => {
    setStep('INTENT');
    await h.datingConsentService.optIn(userId, 'dating-test-v1');
    await h.intentService.updateMyIntents(userId, ['FRIENDSHIP']);
    await h.intentService.updateMyIntents(userId, ['ACTIVITIES']);
    expect(h.intents.activeOf(userId)).toEqual(['ACTIVITIES', 'DATING']);
    expect(h.consents.activeFor(userId)).toHaveLength(1);
  });

  it('rejects a withdrawn (inactive) option', async () => {
    setStep('INTENT');
    h.intents.inactiveOptions.add('NETWORKING');
    expect(await errorCode(h.intentService.updateMyIntents(userId, ['NETWORKING']))).toBe(
      'VALIDATION_FAILED',
    );
  });

  it('re-checks the account under the lock', async () => {
    setStep('INTENT');
    h.store.setAccountStatus(userId, 'SUSPENDED');
    expect(await errorCode(h.intentService.updateMyIntents(userId, ['FRIENDSHIP']))).toBe(
      'ACCOUNT_NOT_ACTIVE',
    );
    expect(h.intents.activeOf(userId)).toEqual([]);
  });

  it('rolls back the intents if the onboarding update fails (one transaction)', async () => {
    setStep('INTENT');
    vi.spyOn(h.onboarding, 'recordIntentProgress').mockRejectedValueOnce(new Error('simulated'));
    await expect(h.intentService.updateMyIntents(userId, ['FRIENDSHIP'])).rejects.toThrow(
      'simulated',
    );
    expect(h.intents.activeOf(userId)).toEqual([]);
    expect(user().onboardingStep).toBe('INTENT');
    expect(intentSteps()).toHaveLength(0);
  });

  it('restores saved choices in the self projection without consent details', async () => {
    setStep('INTENT');
    await h.datingConsentService.optIn(userId, 'dating-test-v1');
    await h.intentService.updateMyIntents(userId, ['FRIENDSHIP']);
    const me = await h.profileService.getMe(userId);
    expect(me).toMatchObject({
      activeIntents: ['FRIENDSHIP', 'DATING'],
      datingEnabled: true,
      location: null,
    });
    expect(JSON.stringify(me)).not.toMatch(/policy|consent|source/i);
  });

  it('keeps chosen intents out of analytics', async () => {
    setStep('INTENT');
    await h.intentService.updateMyIntents(userId, ['FRIENDSHIP', 'NETWORKING']);
    const dump = JSON.stringify(h.analyticsProvider.events);
    expect(dump).not.toContain('FRIENDSHIP');
    expect(dump).not.toContain('NETWORKING');
  });
});
