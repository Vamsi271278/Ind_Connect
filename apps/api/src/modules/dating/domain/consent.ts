/** DATA-MODEL §18 consent source. */
export type ConsentSource = 'ONBOARDING' | 'SETTINGS' | 'OTHER';

/**
 * The active (unrevoked) consent, if any. It is evidence that the user
 * affirmatively accepted that configured dating policy version — not proof
 * that they read it.
 */
export interface ActiveConsent {
  readonly id: string;
  readonly policyVersion: string;
}

/** Onboarding opt-ins are ONBOARDING; once onboarding is complete, SETTINGS. */
export const consentSourceFor = (onboardingStatus: string): ConsentSource =>
  onboardingStatus === 'COMPLETE' ? 'SETTINGS' : 'ONBOARDING';

export interface OptInPlan {
  /** Revoke this active consent (it is for an older policy version). */
  readonly revokeConsentId: string | null;
  /** Record a new consent for the current version. */
  readonly recordConsent: boolean;
  /** Activate the DATING intent. */
  readonly activateDating: boolean;
}

/**
 * Opt-in to the current policy version. Idempotent: already consented to this
 * version with DATING active → nothing to do. Restores the invariant
 * "DATING active ⇔ exactly one active consent" whatever the starting state.
 */
export function planOptIn(
  active: ActiveConsent | undefined,
  datingActive: boolean,
  currentVersion: string,
): OptInPlan {
  const current = active !== undefined && active.policyVersion === currentVersion;
  return {
    revokeConsentId: active !== undefined && !current ? active.id : null,
    recordConsent: !current,
    activateDating: !datingActive,
  };
}

export interface OptOutPlan {
  readonly revokeConsentId: string | null;
  readonly deactivateDating: boolean;
}

/** Withdrawal: revoke whatever is active and turn DATING off. Never conditional. */
export const planOptOut = (
  active: ActiveConsent | undefined,
  datingActive: boolean,
): OptOutPlan => ({
  revokeConsentId: active?.id ?? null,
  deactivateDating: datingActive,
});
