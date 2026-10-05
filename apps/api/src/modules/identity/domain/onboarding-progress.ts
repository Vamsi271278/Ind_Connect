import { ONBOARDING_STEPS, type OnboardingStatus, type OnboardingStep } from './account.js';

/**
 * Profile facts relevant to onboarding completion. Supplied by the profile
 * module; identity owns the resulting onboarding state.
 */
export interface OnboardingProfileFacts {
  readonly firstName: string | null;
  readonly genderCode: string | null;
  readonly genderSelfDescription: string | null;
}

/** This slice implements NAME and GENDER; users then park at LOCATION. */
export const PARKING_STEP: OnboardingStep = 'LOCATION';

const nonBlank = (value: string | null): boolean => value !== null && value.trim().length > 0;

/** NAME complete: a valid, non-blank first name is stored. */
export const isNameComplete = (facts: OnboardingProfileFacts): boolean => nonBlank(facts.firstName);

/** GENDER complete: a gender code is stored; SELF_DESCRIBE also needs its text. */
export const isGenderComplete = (facts: OnboardingProfileFacts): boolean =>
  facts.genderCode !== null &&
  (facts.genderCode !== 'SELF_DESCRIBE' || nonBlank(facts.genderSelfDescription));

const indexOf = (step: OnboardingStep): number => ONBOARDING_STEPS.indexOf(step);

export interface OnboardingTransition {
  readonly status: OnboardingStatus;
  readonly step: OnboardingStep;
  /** Steps newly completed by this transition, in order. */
  readonly completedSteps: readonly OnboardingStep[];
}

/**
 * Deterministic and monotonic:
 *   NAME incomplete → NAME; else GENDER incomplete → GENDER; else LOCATION.
 * Never moves backwards; once at or beyond LOCATION, later profile edits do
 * not change onboarding.
 */
export function nextOnboardingState(
  current: { readonly status: OnboardingStatus; readonly step: OnboardingStep },
  facts: OnboardingProfileFacts,
): OnboardingTransition {
  if (indexOf(current.step) >= indexOf(PARKING_STEP)) {
    return { status: current.status, step: current.step, completedSteps: [] };
  }
  const derived: OnboardingStep = !isNameComplete(facts)
    ? 'NAME'
    : !isGenderComplete(facts)
      ? 'GENDER'
      : PARKING_STEP;
  const step = indexOf(derived) > indexOf(current.step) ? derived : current.step;
  return {
    status: current.status,
    step,
    completedSteps: ONBOARDING_STEPS.slice(indexOf(current.step), indexOf(step)),
  };
}
