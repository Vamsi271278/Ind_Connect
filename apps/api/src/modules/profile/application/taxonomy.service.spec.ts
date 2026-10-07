import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingStep } from '../../identity/domain/account.js';

const failure = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return { code: error.code, details: error.details };
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('TaxonomyService', () => {
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
  const completed = (stepCode: string) =>
    h.analyticsProvider.events.filter(
      (e) => e.event_name === 'onboarding_step_completed' && e.properties.step_code === stepCode,
    );

  describe('languages', () => {
    it.each(['INTENT', 'LOCATION', 'NAME'] as const)(
      'rejects a save at %s and stores nothing',
      async (step) => {
        setStep(step);
        expect((await failure(h.taxonomyService.updateMyLanguages(userId, ['en']))).code).toBe(
          'ONBOARDING_STEP_NOT_REACHED',
        );
        expect(h.taxonomy.languagesOf(userId)).toEqual([]);
      },
    );

    it('at LANGUAGE: saves and advances to INTERESTS once; later edits replace without rewinding', async () => {
      setStep('LANGUAGE');
      const first = await h.taxonomyService.updateMyLanguages(userId, ['te', 'en']);
      expect(first).toEqual({
        languages: [
          { code: 'en', displayName: 'English' },
          { code: 'te', displayName: 'Telugu' },
        ],
        onboarding: { status: 'IN_PROGRESS', step: 'INTERESTS' },
      });
      await h.taxonomyService.updateMyLanguages(userId, ['hi']);
      expect(h.taxonomy.languagesOf(userId)).toEqual(['hi']);
      expect(user().onboardingStep).toBe('INTERESTS');
      expect(completed('LANGUAGE')).toHaveLength(1);
    });

    it('fails the whole save on any unknown or inactive code, keeping the previous set', async () => {
      setStep('LANGUAGE');
      await h.taxonomyService.updateMyLanguages(userId, ['en']);
      h.taxonomy.inactiveLanguages.add('ta');
      for (const codes of [
        ['te', 'xx'],
        ['te', 'ta'],
      ]) {
        expect(await failure(h.taxonomyService.updateMyLanguages(userId, codes))).toEqual({
          code: 'VALIDATION_FAILED',
          details: { issues: [{ path: 'languages', code: 'language_not_available' }] },
        });
      }
      expect(h.taxonomy.languagesOf(userId)).toEqual(['en']);
    });

    it('enforces at least one language on every save', async () => {
      setStep('COMPLETE');
      expect((await failure(h.taxonomyService.updateMyLanguages(userId, []))).code).toBe(
        'VALIDATION_FAILED',
      );
    });
  });

  describe('interests', () => {
    const three = ['CRICKET', 'HIKING', 'TENNIS'];

    it('rejects a save before INTERESTS', async () => {
      setStep('LANGUAGE');
      expect((await failure(h.taxonomyService.updateMyInterests(userId, three))).code).toBe(
        'ONBOARDING_STEP_NOT_REACHED',
      );
      expect(h.taxonomy.interestCodesOf(userId)).toEqual([]);
    });

    it('at INTERESTS: saves by code and advances to PHOTO; returns codes, labels, categories', async () => {
      setStep('INTERESTS');
      const result = await h.taxonomyService.updateMyInterests(userId, three);
      expect(result.onboarding).toEqual({ status: 'IN_PROGRESS', step: 'PHOTO' });
      expect(result.interests).toEqual([
        { code: 'CRICKET', label: 'Cricket', categoryCode: 'SPORTS' },
        { code: 'TENNIS', label: 'Tennis', categoryCode: 'SPORTS' },
        { code: 'HIKING', label: 'Hiking', categoryCode: 'OUTDOORS' },
      ]);
      expect(JSON.stringify(result)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
      expect(completed('INTERESTS')).toHaveLength(1);
    });

    it('enforces at least three on every save, including later edits', async () => {
      setStep('INTERESTS');
      await h.taxonomyService.updateMyInterests(userId, three);
      expect(
        (await failure(h.taxonomyService.updateMyInterests(userId, ['CRICKET', 'HIKING']))).code,
      ).toBe('VALIDATION_FAILED');
      expect(h.taxonomy.interestCodesOf(userId).sort()).toEqual([...three].sort());
    });

    it('fails atomically on an unknown or withdrawn interest', async () => {
      setStep('INTERESTS');
      await h.taxonomyService.updateMyInterests(userId, three);
      h.taxonomy.inactiveInterests.add('CAMPING');
      for (const codes of [
        ['CRICKET', 'HIKING', 'CHESS'],
        ['CRICKET', 'HIKING', 'CAMPING'],
      ]) {
        expect((await failure(h.taxonomyService.updateMyInterests(userId, codes))).details).toEqual(
          { issues: [{ path: 'interests', code: 'interest_not_available' }] },
        );
      }
      expect(h.taxonomy.interestCodesOf(userId).sort()).toEqual([...three].sort());
      expect(user().onboardingStep).toBe('PHOTO');
    });
  });

  it('re-checks the account under the lock', async () => {
    setStep('LANGUAGE');
    h.store.setAccountStatus(userId, 'SUSPENDED');
    expect((await failure(h.taxonomyService.updateMyLanguages(userId, ['en']))).code).toBe(
      'ACCOUNT_NOT_ACTIVE',
    );
  });

  it('rolls back the selection when the onboarding update fails (one transaction)', async () => {
    setStep('LANGUAGE');
    vi.spyOn(h.onboarding, 'recordStepProgress').mockRejectedValueOnce(new Error('simulated'));
    await expect(h.taxonomyService.updateMyLanguages(userId, ['en'])).rejects.toThrow('simulated');
    expect(h.taxonomy.languagesOf(userId)).toEqual([]);
    expect(user().onboardingStep).toBe('LANGUAGE');
    expect(completed('LANGUAGE')).toHaveLength(0);
  });

  it('restores saved choices in the self projection and keeps them out of analytics', async () => {
    setStep('LANGUAGE');
    await h.taxonomyService.updateMyLanguages(userId, ['te']);
    await h.taxonomyService.updateMyInterests(userId, ['CRICKET', 'HIKING', 'TENNIS']);
    const me = await h.profileService.getMe(userId);
    expect(me.languages).toEqual([{ code: 'te', displayName: 'Telugu' }]);
    expect(me.interests.map((i) => i.code)).toEqual(['CRICKET', 'TENNIS', 'HIKING']);
    const dump = JSON.stringify(h.analyticsProvider.events);
    for (const value of ['te', 'Telugu', 'CRICKET', 'HIKING']) {
      expect(dump).not.toContain(`"${value}"`);
    }
  });
});
