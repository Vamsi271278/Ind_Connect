import { ApiResponseError, NetworkError } from './api-error';

/**
 * User-facing copy for auth/onboarding failures (DESIGN-SYSTEM §141: say what
 * happened and what to do; never "HTTP 500"). Copy never confirms whether a
 * number already has an account (no account enumeration).
 */
export type AuthFailure =
  | { readonly kind: 'field'; readonly message: string }
  | { readonly kind: 'banner'; readonly message: string }
  | { readonly kind: 'restart-verification'; readonly message: string }
  | { readonly kind: 'underage' };

const minutes = (seconds: number | undefined): string => {
  if (seconds === undefined) return 'a little while';
  const m = Math.max(1, Math.ceil(seconds / 60));
  return m === 1 ? '1 minute' : `${String(m)} minutes`;
};

export function describeAuthFailure(error: unknown): AuthFailure {
  if (error instanceof NetworkError) {
    return {
      kind: 'banner',
      message: 'Connection problem. Check your internet connection and try again.',
    };
  }
  if (!(error instanceof ApiResponseError)) {
    return {
      kind: 'banner',
      message: "We couldn't complete that. Your information is safe. Please try again.",
    };
  }
  switch (error.code) {
    case 'PHONE_INVALID':
      return { kind: 'field', message: 'Enter a valid phone number.' };
    case 'PHONE_COUNTRY_NOT_SUPPORTED':
      return {
        kind: 'field',
        message: "Project Connect isn't available for numbers from this country yet.",
      };
    case 'OTP_INCORRECT':
      return { kind: 'field', message: "That code isn't right. Check it and try again." };
    case 'OTP_EXPIRED':
      return { kind: 'field', message: 'That code has expired. Request a new one.' };
    case 'OTP_ATTEMPTS_EXCEEDED':
      return { kind: 'field', message: 'Too many incorrect attempts. Request a new code.' };
    case 'REGISTRATION_TOKEN_INVALID':
      return {
        kind: 'restart-verification',
        message: 'Your verification has expired. Please verify your number again.',
      };
    case 'AGE_NOT_ELIGIBLE':
      return { kind: 'underage' };
    case 'RATE_LIMITED':
      return {
        kind: 'banner',
        message: `Too many attempts. Please wait ${minutes(error.retryAfterSeconds)} and try again.`,
      };
    case 'OTP_UNAVAILABLE':
      return { kind: 'banner', message: "We couldn't send your code right now. Please try again." };
    default:
      return {
        kind: 'banner',
        message: "We couldn't complete that. Your information is safe. Please try again.",
      };
  }
}

/** Client-side first-name/self-description checks mirror the API contract codes. */
export function describeNameIssue(
  code: string | undefined,
  field: 'first name' | 'description',
): string {
  switch (code) {
    case 'required':
      return field === 'first name'
        ? 'Enter your first name.'
        : 'Enter a description, or choose another option.';
    case 'too_long':
      return field === 'first name' ? 'Use 50 characters or fewer.' : 'Use 80 characters or fewer.';
    default:
      return 'Use letters, spaces, apostrophes or hyphens only.';
  }
}
