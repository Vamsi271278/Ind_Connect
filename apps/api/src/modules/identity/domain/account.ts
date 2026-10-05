/** Account lifecycle and onboarding state (BR-AUTH-010, DATA-MODEL §users). */

export const ACCOUNT_STATUSES = [
  'ACTIVE',
  'PENDING_VERIFICATION',
  'LIMITED',
  'UNDER_REVIEW',
  'SUSPENDED',
  'BANNED',
  'DEACTIVATED',
  'DELETION_PENDING',
  'DELETED',
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ONBOARDING_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

/** Canonical onboarding order (SFS Section P, age-first). */
export const ONBOARDING_STEPS = [
  'AGE',
  'PHONE',
  'NAME',
  'GENDER',
  'LOCATION',
  'INTENT',
  'LANGUAGE',
  'INTERESTS',
  'PHOTO',
  'ABOUT',
  'VERIFICATION',
  'NOTIFICATIONS',
  'COMPLETE',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** AGE and PHONE are complete by the time an account exists. */
export const FIRST_STEP_AFTER_REGISTRATION: OnboardingStep = 'NAME';

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(index + 1, ONBOARDING_STEPS.length - 1)] ?? 'COMPLETE';
}

/**
 * Statuses that may sign in and use self/onboarding endpoints in this slice.
 * Everything else fails closed until restricted-state flows (P20) exist.
 */
const SELF_SERVICE_STATUSES: ReadonlySet<AccountStatus> = new Set([
  'ACTIVE',
  'PENDING_VERIFICATION',
]);

export const canUseSelfService = (status: AccountStatus): boolean =>
  SELF_SERVICE_STATUSES.has(status);

export const isAccountStatus = (value: string): value is AccountStatus =>
  (ACCOUNT_STATUSES as readonly string[]).includes(value);

export const isOnboardingStatus = (value: string): value is OnboardingStatus =>
  (ONBOARDING_STATUSES as readonly string[]).includes(value);

export const isOnboardingStep = (value: string): value is OnboardingStep =>
  (ONBOARDING_STEPS as readonly string[]).includes(value);
