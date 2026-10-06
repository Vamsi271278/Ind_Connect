import { describe, expect, it } from 'vitest';

import { ageInYears, parseCalendarDate } from './age.js';
import { ONBOARDING_STEPS } from './account.js';
import {
  hasReachedLocationStep,
  isGenderComplete,
  isNameComplete,
  nextOnboardingState,
  nextOnboardingStateAfterLocation,
  type OnboardingProfileFacts,
} from './onboarding-progress.js';

const facts = (overrides: Partial<OnboardingProfileFacts> = {}): OnboardingProfileFacts => ({
  firstName: null,
  genderCode: null,
  genderSelfDescription: null,
  ...overrides,
});
const at = (step: 'NAME' | 'GENDER' | 'LOCATION' | 'INTENT' | 'COMPLETE') =>
  ({ status: step === 'COMPLETE' ? 'COMPLETE' : 'IN_PROGRESS', step }) as const;

describe('completion rules', () => {
  it('NAME needs a non-blank first name', () => {
    expect(isNameComplete(facts({ firstName: 'Ananya' }))).toBe(true);
    expect(isNameComplete(facts({ firstName: '   ' }))).toBe(false);
    expect(isNameComplete(facts())).toBe(false);
  });

  it('GENDER needs a code, and SELF_DESCRIBE also needs non-blank text', () => {
    expect(isGenderComplete(facts({ genderCode: 'PREFER_NOT_TO_SAY' }))).toBe(true);
    expect(isGenderComplete(facts({ genderCode: 'SELF_DESCRIBE' }))).toBe(false);
    expect(
      isGenderComplete(facts({ genderCode: 'SELF_DESCRIBE', genderSelfDescription: ' ' })),
    ).toBe(false);
    expect(
      isGenderComplete(facts({ genderCode: 'SELF_DESCRIBE', genderSelfDescription: 'Fluid' })),
    ).toBe(true);
  });
});

describe('nextOnboardingState', () => {
  it('stays at NAME until a name exists, even if gender is set first', () => {
    expect(nextOnboardingState(at('NAME'), facts({ genderCode: 'MAN' }))).toEqual({
      status: 'IN_PROGRESS',
      step: 'NAME',
      completedSteps: [],
    });
  });

  it('NAME → GENDER → LOCATION, reporting each completed step once', () => {
    expect(nextOnboardingState(at('NAME'), facts({ firstName: 'Ravi' }))).toMatchObject({
      step: 'GENDER',
      completedSteps: ['NAME'],
    });
    expect(
      nextOnboardingState(at('GENDER'), facts({ firstName: 'Ravi', genderCode: 'MAN' })),
    ).toMatchObject({
      step: 'LOCATION',
      completedSteps: ['GENDER'],
    });
  });

  it('completes both steps at once when both facts arrive together', () => {
    expect(
      nextOnboardingState(at('NAME'), facts({ firstName: 'Ravi', genderCode: 'WOMAN' })),
    ).toMatchObject({
      step: 'LOCATION',
      completedSteps: ['NAME', 'GENDER'],
    });
  });

  it('is monotonic: never rewinds, and is inert at or beyond LOCATION', () => {
    expect(nextOnboardingState(at('GENDER'), facts())).toMatchObject({
      step: 'GENDER',
      completedSteps: [],
    });
    for (const step of ['LOCATION', 'INTENT', 'COMPLETE'] as const) {
      expect(nextOnboardingState(at(step), facts())).toMatchObject({ step, completedSteps: [] });
    }
  });
});

describe('location step rule (B4.1-D3)', () => {
  it('allows location only from LOCATION onward', () => {
    const allowed = ONBOARDING_STEPS.filter(hasReachedLocationStep);
    expect(allowed[0]).toBe('LOCATION');
    for (const step of ['AGE', 'PHONE', 'NAME', 'GENDER'] as const) {
      expect(hasReachedLocationStep(step)).toBe(false);
    }
    expect(hasReachedLocationStep('COMPLETE')).toBe(true);
  });

  it('advances exactly LOCATION → INTENT, reporting LOCATION once', () => {
    expect(nextOnboardingStateAfterLocation(at('LOCATION'))).toEqual({
      status: 'IN_PROGRESS',
      step: 'INTENT',
      completedSteps: ['LOCATION'],
    });
  });

  it('is inert after LOCATION (never rewinds, never skips ahead)', () => {
    for (const step of ['INTENT', 'COMPLETE'] as const) {
      expect(nextOnboardingStateAfterLocation(at(step))).toEqual({
        ...at(step),
        completedSteps: [],
      });
    }
  });
});

describe('ageInYears (UTC-12 reference)', () => {
  const dob = (value: string) => {
    const parsed = parseCalendarDate(value);
    if (parsed === undefined) throw new Error('bad date');
    return parsed;
  };

  it('counts whole years and never runs ahead of the true age', () => {
    expect(ageInYears(dob('1995-06-15'), new Date('2026-10-05T12:00:00Z'))).toBe(31);
    expect(ageInYears(dob('2008-10-05'), new Date('2026-10-05T12:00:00Z'))).toBe(18);
    expect(ageInYears(dob('2008-10-05'), new Date('2026-10-05T08:00:00Z'))).toBe(17);
    expect(ageInYears(dob('2008-02-29'), new Date('2026-02-28T12:00:00Z'))).toBe(17);
    expect(ageInYears(dob('2008-02-29'), new Date('2026-03-01T12:00:00Z'))).toBe(18);
  });
});
