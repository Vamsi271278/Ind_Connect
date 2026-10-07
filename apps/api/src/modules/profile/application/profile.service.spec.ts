import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createIdentityHarness,
  type IdentityHarness,
} from '../../../../test/support/identity-harness.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';

const errorCode = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    if (error instanceof ApplicationError) return error.code;
    throw error;
  }
  throw new Error('expected an ApplicationError');
};

describe('ProfileService', () => {
  let h: IdentityHarness;
  let userId: string;

  beforeEach(async () => {
    h = createIdentityHarness();
    userId = (await h.signUp('+12145550123', '1995-06-15')).account.id;
  });

  const stepOf = () => h.store.state.users.find((u) => u.id === userId)?.onboardingStep;

  it('returns the self projection: masked phone and computed age, no DOB or raw phone', async () => {
    const me = await h.profileService.getMe(userId);
    expect(me).toEqual({
      id: userId,
      accountStatus: 'PENDING_VERIFICATION',
      onboarding: { status: 'IN_PROGRESS', step: 'NAME' },
      profile: { firstName: null, genderCode: null, genderSelfDescription: null },
      phoneMasked: '+1 ••• ••• 0123',
      age: 31,
      location: null,
      activeIntents: [],
      datingEnabled: false,
    });
    const text = JSON.stringify(me);
    expect(text).not.toContain('1995-06-15');
    expect(text).not.toContain('2145550123');
  });

  it('advances NAME → GENDER → LOCATION and emits one canonical event per completed step', async () => {
    await h.profileService.updateMyProfile(userId, { firstName: 'Ananya' });
    expect(stepOf()).toBe('GENDER');
    const final = await h.profileService.updateMyProfile(userId, { genderCode: 'WOMAN' });
    expect(final.onboarding.step).toBe('LOCATION');

    const steps = h.analyticsProvider.events.filter(
      (e) => e.event_name === 'onboarding_step_completed',
    );
    expect(steps.map((e) => e.properties)).toEqual([
      { step_code: 'NAME' },
      { step_code: 'GENDER' },
    ]);
  });

  it('does not advance past NAME when gender comes first', async () => {
    await h.profileService.updateMyProfile(userId, { genderCode: 'MAN' });
    expect(stepOf()).toBe('NAME');
    await h.profileService.updateMyProfile(userId, { firstName: 'Ravi' });
    expect(stepOf()).toBe('LOCATION');
  });

  it('never rewinds onboarding when the name or gender is edited later', async () => {
    await h.profileService.updateMyProfile(userId, { firstName: 'Ravi', genderCode: 'MAN' });
    await h.profileService.updateMyProfile(userId, { firstName: 'Ravindra' });
    await h.profileService.updateMyProfile(userId, {
      genderCode: 'SELF_DESCRIBE',
      genderSelfDescription: 'Genderfluid',
    });
    expect(stepOf()).toBe('LOCATION');
    expect(
      h.analyticsProvider.events.filter((e) => e.event_name === 'onboarding_step_completed'),
    ).toHaveLength(2);
  });

  it('rejects an invalid merged gender state and changes nothing', async () => {
    expect(
      await errorCode(h.profileService.updateMyProfile(userId, { genderCode: 'SELF_DESCRIBE' })),
    ).toBe('VALIDATION_FAILED');
    expect(h.profiles.rows.size).toBe(0);
    expect(stepOf()).toBe('NAME');
  });

  it('rolls back the profile write if the onboarding update fails (one transaction)', async () => {
    vi.spyOn(h.onboarding, 'recordProfileProgress').mockRejectedValueOnce(new Error('simulated'));
    await expect(h.profileService.updateMyProfile(userId, { firstName: 'Ananya' })).rejects.toThrow(
      'simulated',
    );
    expect(h.profiles.rows.get(userId)).toBeUndefined();
    expect(stepOf()).toBe('NAME');
    expect(
      h.analyticsProvider.events.some((e) => e.event_name === 'onboarding_step_completed'),
    ).toBe(false);
  });

  it('keeps names, gender text and identifiers out of analytics', async () => {
    await h.profileService.updateMyProfile(userId, {
      firstName: 'Ananya',
      genderCode: 'SELF_DESCRIBE',
      genderSelfDescription: 'Genderfluid',
    });
    const dump = JSON.stringify(h.analyticsProvider.events);
    for (const secret of ['Ananya', 'Genderfluid', 'SELF_DESCRIBE', userId, '2145550123', '1995']) {
      expect(dump).not.toContain(secret);
    }
  });

  it('a failing analytics provider never fails the profile update', async () => {
    h.analyticsProvider.failing = true;
    await expect(
      h.profileService.updateMyProfile(userId, { firstName: 'Ananya' }),
    ).resolves.toMatchObject({
      onboarding: { step: 'GENDER' },
    });
  });
});
