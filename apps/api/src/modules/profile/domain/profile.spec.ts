import { GENDER_CODES as CONTRACT_GENDER_CODES } from '@project-connect/api-contracts';
import { describe, expect, it } from 'vitest';

import { EMPTY_PROFILE, GENDER_CODES, mergeProfile, type ProfileState } from './profile.js';

const selfDescribed: ProfileState = {
  firstName: 'Kiran',
  genderCode: 'SELF_DESCRIBE',
  genderSelfDescription: 'Genderfluid',
};

describe('mergeProfile', () => {
  it('applies partial updates and keeps untouched fields', () => {
    const named = mergeProfile(EMPTY_PROFILE, { firstName: 'Ananya' });
    expect(named).toEqual({ ok: true, state: { ...EMPTY_PROFILE, firstName: 'Ananya' } });
    if (!named.ok) return;
    expect(mergeProfile(named.state, { genderCode: 'WOMAN' })).toEqual({
      ok: true,
      state: { firstName: 'Ananya', genderCode: 'WOMAN', genderSelfDescription: null },
    });
  });

  it('requires a self-description with SELF_DESCRIBE', () => {
    expect(mergeProfile(EMPTY_PROFILE, { genderCode: 'SELF_DESCRIBE' })).toMatchObject({
      ok: false,
      issue: { code: 'self_description_required' },
    });
    expect(
      mergeProfile(EMPTY_PROFILE, { genderCode: 'SELF_DESCRIBE', genderSelfDescription: 'Fluid' })
        .ok,
    ).toBe(true);
  });

  it('rejects a self-description without SELF_DESCRIBE (stored or sent)', () => {
    expect(mergeProfile(EMPTY_PROFILE, { genderSelfDescription: 'x' })).toMatchObject({
      ok: false,
      issue: { code: 'self_description_requires_self_describe' },
    });
    expect(
      mergeProfile({ ...EMPTY_PROFILE, genderCode: 'MAN' }, { genderSelfDescription: 'x' }).ok,
    ).toBe(false);
  });

  it('updates only the text for an existing SELF_DESCRIBE profile', () => {
    expect(mergeProfile(selfDescribed, { genderSelfDescription: 'Agender' })).toEqual({
      ok: true,
      state: { ...selfDescribed, genderSelfDescription: 'Agender' },
    });
  });

  it('clears the self-description when switching to another gender', () => {
    expect(mergeProfile(selfDescribed, { genderCode: 'PREFER_NOT_TO_SAY' })).toEqual({
      ok: true,
      state: { firstName: 'Kiran', genderCode: 'PREFER_NOT_TO_SAY', genderSelfDescription: null },
    });
  });

  it('matches the contract gender codes', () => {
    expect(GENDER_CODES).toEqual(CONTRACT_GENDER_CODES);
  });
});
