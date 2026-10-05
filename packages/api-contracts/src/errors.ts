import { z } from 'zod';

/**
 * Stable, client-visible error codes. Clients branch on `code`, never on HTTP
 * status or message text. Adding a code is a contract change; renaming or
 * removing one is a breaking change.
 */
export const ERROR_CODES = [
  // Request shape
  'VALIDATION_FAILED',
  'PHONE_INVALID',
  'PHONE_COUNTRY_NOT_SUPPORTED',
  'IDEMPOTENCY_KEY_REQUIRED',
  // Authentication / account
  'AUTH_REQUIRED',
  'SESSION_INVALID',
  'ACCOUNT_NOT_ACTIVE',
  // Retry / conflict
  'IDEMPOTENCY_KEY_REUSED',
  'REQUEST_IN_PROGRESS',
  'REPLAY_UNAVAILABLE',
  'PHONE_ALREADY_REGISTERED',
  // OTP / registration
  'OTP_INCORRECT',
  'OTP_EXPIRED',
  'OTP_ATTEMPTS_EXCEEDED',
  'REGISTRATION_TOKEN_INVALID',
  'AGE_NOT_ELIGIBLE',
  // Throttling / availability
  'RATE_LIMITED',
  'OTP_UNAVAILABLE',
  'SERVICE_UNAVAILABLE',
  // Generic
  'NOT_FOUND',
  'INTERNAL_ERROR',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** A validation issue location. Never carries the rejected input value. */
export const validationIssueSchema = z.strictObject({
  path: z.string(),
  code: z.string(),
});
export type ValidationIssue = z.infer<typeof validationIssueSchema>;

export const errorDetailsSchema = z.strictObject({
  retryAfterSeconds: z.int().nonnegative().optional(),
  issues: z.array(validationIssueSchema).optional(),
});
export type ErrorDetails = z.infer<typeof errorDetailsSchema>;

export const errorEnvelopeSchema = z.strictObject({
  error: z.strictObject({
    code: errorCodeSchema,
    message: z.string(),
    correlationId: z.string(),
    details: errorDetailsSchema.optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
