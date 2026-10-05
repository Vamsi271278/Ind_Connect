import {
  ACCOUNT_STATUSES as CONTRACT_ACCOUNT_STATUSES,
  ONBOARDING_STATUSES as CONTRACT_ONBOARDING_STATUSES,
  ONBOARDING_STEPS as CONTRACT_ONBOARDING_STEPS,
} from '@project-connect/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_STATUSES,
  canUseSelfService,
  FIRST_STEP_AFTER_REGISTRATION,
  nextOnboardingStep,
  ONBOARDING_STATUSES,
  ONBOARDING_STEPS,
} from './account.js';

describe('onboarding order', () => {
  it('follows the canonical age-first order', () => {
    expect(ONBOARDING_STEPS.slice(0, 5)).toEqual(['AGE', 'PHONE', 'NAME', 'GENDER', 'LOCATION']);
    expect(FIRST_STEP_AFTER_REGISTRATION).toBe('NAME');
  });

  it('advances one step at a time and stops at COMPLETE', () => {
    expect(nextOnboardingStep('NAME')).toBe('GENDER');
    expect(nextOnboardingStep('GENDER')).toBe('LOCATION');
    expect(nextOnboardingStep('NOTIFICATIONS')).toBe('COMPLETE');
    expect(nextOnboardingStep('COMPLETE')).toBe('COMPLETE');
  });
});

describe('self-service account statuses (fail closed)', () => {
  it('allows only ACTIVE and PENDING_VERIFICATION', () => {
    const allowed = ACCOUNT_STATUSES.filter((status) => canUseSelfService(status));
    expect(allowed).toEqual(['ACTIVE', 'PENDING_VERIFICATION']);
  });
});

describe('contract parity', () => {
  it('domain state lists match the published API contract', () => {
    expect(ACCOUNT_STATUSES).toEqual(CONTRACT_ACCOUNT_STATUSES);
    expect(ONBOARDING_STATUSES).toEqual(CONTRACT_ONBOARDING_STATUSES);
    expect(ONBOARDING_STEPS).toEqual(CONTRACT_ONBOARDING_STEPS);
  });
});
