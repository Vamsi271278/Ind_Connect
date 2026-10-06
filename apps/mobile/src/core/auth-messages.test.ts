import type { ErrorCode } from '@project-connect/api-contracts';
import { describe, expect, it } from 'vitest';

import { ApiResponseError, NetworkError } from './api-error';
import { describeAuthFailure, describeNameIssue } from './auth-messages';
import { registrationDraft } from './registration-draft';

const api = (status: number, code: ErrorCode, retry?: number) =>
  new ApiResponseError(status, code, retry);

describe('describeAuthFailure', () => {
  it('maps OTP and phone errors to field messages', () => {
    expect(describeAuthFailure(api(422, 'OTP_INCORRECT'))).toMatchObject({ kind: 'field' });
    expect(describeAuthFailure(api(422, 'OTP_EXPIRED'))).toMatchObject({ kind: 'field' });
    expect(describeAuthFailure(api(422, 'OTP_ATTEMPTS_EXCEEDED'))).toMatchObject({ kind: 'field' });
    expect(describeAuthFailure(api(422, 'PHONE_INVALID'))).toMatchObject({ kind: 'field' });
  });

  it('routes registration outcomes', () => {
    expect(describeAuthFailure(api(422, 'AGE_NOT_ELIGIBLE'))).toEqual({ kind: 'underage' });
    expect(describeAuthFailure(api(401, 'REGISTRATION_TOKEN_INVALID'))).toMatchObject({
      kind: 'restart-verification',
    });
  });

  it('turns throttling into a wait message using the server hint', () => {
    expect(describeAuthFailure(api(429, 'RATE_LIMITED', 90))).toEqual({
      kind: 'banner',
      message: 'Too many attempts. Please wait 2 minutes and try again.',
    });
  });

  it('never exposes transport details', () => {
    const offline = describeAuthFailure(new NetworkError('ECONNRESET 10.0.2.2'));
    const server = describeAuthFailure(api(500, 'INTERNAL_ERROR'));
    for (const failure of [offline, server]) {
      expect(failure.kind).toBe('banner');
      if (failure.kind === 'banner') expect(failure.message).not.toMatch(/\d{3}|ECONN|10\.0/);
    }
  });

  it('does not reveal whether a number has an account', () => {
    const conflict = describeAuthFailure(api(409, 'PHONE_ALREADY_REGISTERED'));
    expect(conflict.kind).toBe('banner');
    if (conflict.kind === 'banner') expect(conflict.message).not.toMatch(/already|account/i);
  });
});

describe('location failures', () => {
  it('explain an unavailable city or an out-of-order step without technical detail', () => {
    expect(describeAuthFailure(api(422, 'CITY_NOT_AVAILABLE'))).toEqual({
      kind: 'banner',
      message: "That city isn't available right now. Please choose another.",
    });
    expect(describeAuthFailure(api(409, 'ONBOARDING_STEP_NOT_REACHED'))).toEqual({
      kind: 'banner',
      message: 'Please finish the earlier steps first.',
    });
  });
});

describe('describeNameIssue', () => {
  it('maps contract issue codes to copy', () => {
    expect(describeNameIssue('required', 'first name')).toBe('Enter your first name.');
    expect(describeNameIssue('too_long', 'description')).toBe('Use 80 characters or fewer.');
    expect(describeNameIssue('invalid_characters', 'first name')).toMatch(/letters/);
  });
});

describe('registrationDraft', () => {
  it('drops a stale registration token when the number changes, and clears fully', () => {
    registrationDraft.setDateOfBirth('1994-08-14');
    registrationDraft.setPhone('+12145550123', 1);
    registrationDraft.setRegistrationToken('token-1');
    registrationDraft.setPhone('+12145550199', 2);
    expect(registrationDraft.getRegistrationToken()).toBeUndefined();
    expect(registrationDraft.getDateOfBirth()).toBe('1994-08-14');
    registrationDraft.clear();
    expect(registrationDraft.getDateOfBirth()).toBeUndefined();
    expect(registrationDraft.getPhone()).toBeUndefined();
  });
});
