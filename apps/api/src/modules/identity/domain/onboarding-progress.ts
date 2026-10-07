import {
  nextOnboardingStep,
  ONBOARDING_STEPS,
  type OnboardingStatus,
  type OnboardingStep,
} from './account.js';

/**
 * Profile facts relevant to onboarding completion. Supplied by the profile
 * module; identity owns the resulting onboarding state.
 */
export interface OnboardingProfileFacts {
  readonly firstName: string | null;
  readonly genderCode: string | null;
  readonly genderSelfDescription: string | null;
}

/** The profile rule (NAME, GENDER) ends at LOCATION; location has its own rule. */
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

const LOCATION_STEP: OnboardingStep = 'LOCATION';

/**
 * Location may be written only once onboarding has reached LOCATION (B4.1-D3):
 * it is never collected early, while the user is still at NAME or GENDER.
 */
export const hasReachedLocationStep = (step: OnboardingStep): boolean =>
  indexOf(step) >= indexOf(LOCATION_STEP);

/**
 * Applied after a location is saved. Exactly LOCATION → INTENT; at any later
 * step (or COMPLETE) the location is edited and onboarding is untouched.
 */
export function nextOnboardingStateAfterLocation(current: {
  readonly status: OnboardingStatus;
  readonly step: OnboardingStep;
}): OnboardingTransition {
  if (current.step !== LOCATION_STEP) {
    return { status: current.status, step: current.step, completedSteps: [] };
  }
  return { status: current.status, step: 'INTENT', completedSteps: [LOCATION_STEP] };
}

const INTENT_STEP: OnboardingStep = 'INTENT';

/** Intents and dating consent are never collected before INTENT (B4.2A). */
export const hasReachedIntentStep = (step: OnboardingStep): boolean =>
  indexOf(step) >= indexOf(INTENT_STEP);

/**
 * Applied after an intent save. Exactly INTENT → LANGUAGE, and only with at
 * least one active intent (BR-INT-001); later steps are untouched.
 */
export function nextOnboardingStateAfterIntents(
  current: { readonly status: OnboardingStatus; readonly step: OnboardingStep },
  activeIntentCount: number,
): OnboardingTransition {
  if (current.step !== INTENT_STEP || activeIntentCount < 1) {
    return { status: current.status, step: current.step, completedSteps: [] };
  }
  return { status: current.status, step: 'LANGUAGE', completedSteps: [INTENT_STEP] };
}

/** Data for `step` is never collected before onboarding reaches it (B4.1-D3 pattern). */
export const hasReachedStep = (current: OnboardingStep, step: OnboardingStep): boolean =>
  indexOf(current) >= indexOf(step);

/**
 * Generic single-step rule (LANGUAGE, INTERESTS): when the user is exactly at
 * `step` and its data is complete, advance to the next canonical step. At any
 * other step it is inert, so later edits never rewind or skip onboarding.
 */
export function nextOnboardingStateAfterStep(
  current: { readonly status: OnboardingStatus; readonly step: OnboardingStep },
  step: OnboardingStep,
  complete: boolean,
): OnboardingTransition {
  if (current.step !== step || !complete) {
    return { status: current.status, step: current.step, completedSteps: [] };
  }
  return { status: current.status, step: nextOnboardingStep(step), completedSteps: [step] };
}
