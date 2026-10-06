import type { ErrorCode } from '@project-connect/api-contracts';

interface ErrorPresentation {
  readonly status: number;
  readonly message: string;
}

/** Stable HTTP status and user-safe message per error code. */
export const ERROR_PRESENTATION: Readonly<Record<ErrorCode, ErrorPresentation>> = {
  VALIDATION_FAILED: { status: 400, message: 'Some details need attention.' },
  PHONE_INVALID: { status: 400, message: 'Enter a valid mobile number.' },
  PHONE_COUNTRY_NOT_SUPPORTED: {
    status: 400,
    message: 'Numbers from this country are not supported yet.',
  },
  IDEMPOTENCY_KEY_REQUIRED: { status: 400, message: 'A request ID is required.' },
  AUTH_REQUIRED: { status: 401, message: 'Please sign in.' },
  SESSION_INVALID: { status: 401, message: 'Please sign in again.' },
  ACCOUNT_NOT_ACTIVE: { status: 403, message: 'This account cannot be used right now.' },
  IDEMPOTENCY_KEY_REUSED: {
    status: 409,
    message: 'This request ID was already used for a different request.',
  },
  REQUEST_IN_PROGRESS: { status: 409, message: 'This request is already being processed.' },
  REPLAY_UNAVAILABLE: { status: 409, message: 'Please start again.' },
  PHONE_ALREADY_REGISTERED: { status: 409, message: 'This number already has an account.' },
  OTP_INCORRECT: { status: 422, message: "That code isn't right." },
  OTP_EXPIRED: { status: 400, message: 'That code has expired. Request a new one.' },
  OTP_ATTEMPTS_EXCEEDED: { status: 429, message: 'Too many attempts. Request a new code.' },
  REGISTRATION_TOKEN_INVALID: { status: 400, message: 'Please verify your number again.' },
  AGE_NOT_ELIGIBLE: { status: 422, message: 'You must be 18 or older to use Project Connect.' },
  ONBOARDING_STEP_NOT_REACHED: { status: 409, message: 'Please finish the earlier steps first.' },
  CITY_NOT_AVAILABLE: {
    status: 422,
    message: 'This city is not available yet. Please choose another.',
  },
  RATE_LIMITED: { status: 429, message: 'Too many requests. Please try again later.' },
  OTP_UNAVAILABLE: {
    status: 503,
    message: "We couldn't send a code right now. Please try again.",
  },
  SERVICE_UNAVAILABLE: { status: 503, message: 'Service temporarily unavailable.' },
  NOT_FOUND: { status: 404, message: 'Not found.' },
  INTERNAL_ERROR: { status: 500, message: 'Something went wrong. Please try again.' },
};
