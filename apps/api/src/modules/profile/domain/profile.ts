/** Profile rules for the onboarding fields (O01 first name, O02 gender). */

export const GENDER_CODES = [
  'WOMAN',
  'MAN',
  'NON_BINARY',
  'SELF_DESCRIBE',
  'PREFER_NOT_TO_SAY',
] as const;
export type GenderCode = (typeof GENDER_CODES)[number];

export interface ProfileState {
  readonly firstName: string | null;
  readonly genderCode: GenderCode | null;
  readonly genderSelfDescription: string | null;
}

export const EMPTY_PROFILE: ProfileState = {
  firstName: null,
  genderCode: null,
  genderSelfDescription: null,
};

/** Already format-validated by the request contract. */
export interface ProfilePatch {
  readonly firstName?: string | undefined;
  readonly genderCode?: GenderCode | undefined;
  readonly genderSelfDescription?: string | undefined;
}

export type ProfileMergeResult =
  | { readonly ok: true; readonly state: ProfileState }
  | {
      readonly ok: false;
      readonly issue: {
        readonly path: string;
        readonly code: 'self_description_requires_self_describe' | 'self_description_required';
      };
    };

/**
 * Applies a patch to the stored profile and enforces the gender invariant on
 * the merged result: a self-description exists if and only if the gender is
 * SELF_DESCRIBE. Choosing another gender clears a previous self-description.
 */
export function mergeProfile(current: ProfileState, patch: ProfilePatch): ProfileMergeResult {
  const genderCode = patch.genderCode ?? current.genderCode;
  const switchedAway = patch.genderCode !== undefined && patch.genderCode !== 'SELF_DESCRIBE';
  const genderSelfDescription =
    patch.genderSelfDescription ?? (switchedAway ? null : current.genderSelfDescription);

  if (genderSelfDescription !== null && genderCode !== 'SELF_DESCRIBE') {
    return {
      ok: false,
      issue: { path: 'genderSelfDescription', code: 'self_description_requires_self_describe' },
    };
  }
  if (genderCode === 'SELF_DESCRIBE' && genderSelfDescription === null) {
    return {
      ok: false,
      issue: { path: 'genderSelfDescription', code: 'self_description_required' },
    };
  }
  return {
    ok: true,
    state: {
      firstName: patch.firstName ?? current.firstName,
      genderCode,
      genderSelfDescription,
    },
  };
}
