import { z } from 'zod';

import { calendarDateSchema } from './dates.js';
import { accountStatusSchema, onboardingStatusSchema, onboardingStepSchema } from './enums.js';
import { phoneInputSchema } from './phone.js';

/** Header carrying the client-generated operation ID for retry-safe mutations. */
export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const idempotencyKeySchema = z.uuid();

/** 32 random bytes, base64url without padding. */
const opaqueTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

const versionSchema = z.string().regex(/^[0-9A-Za-z.+-]{1,32}$/);

/** Minimal device/app context (no fingerprinting; ADR-098). */
export const deviceContextSchema = z.strictObject({
  platform: z.enum(['ios', 'android']),
  appVersion: versionSchema,
  osVersion: versionSchema,
  /** Random per-install identifier generated and kept by the app. */
  installId: z.uuid(),
});
export type DeviceContext = z.infer<typeof deviceContextSchema>;

// ---------------------------------------------------------------- requests

export const otpRequestBodySchema = z.strictObject({
  phone: phoneInputSchema,
  installId: z.uuid(),
});
export type OtpRequestBody = z.infer<typeof otpRequestBodySchema>;

export const otpVerifyBodySchema = z.strictObject({
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{6}$/),
  device: deviceContextSchema,
});
export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>;

export const registrationBodySchema = z.strictObject({
  registrationToken: opaqueTokenSchema,
  dateOfBirth: calendarDateSchema,
  device: deviceContextSchema,
});
export type RegistrationBody = z.infer<typeof registrationBodySchema>;

export const refreshBodySchema = z.strictObject({
  refreshToken: opaqueTokenSchema,
  device: deviceContextSchema,
});
export type RefreshBody = z.infer<typeof refreshBodySchema>;

export const logoutBodySchema = z.strictObject({
  refreshToken: opaqueTokenSchema,
});
export type LogoutBody = z.infer<typeof logoutBodySchema>;

// ---------------------------------------------------------------- responses

export const otpRequestResponseSchema = z.strictObject({
  expiresInSeconds: z.int().positive(),
  resendAvailableInSeconds: z.int().nonnegative(),
});
export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;

export const sessionTokensSchema = z.strictObject({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
  refreshToken: opaqueTokenSchema,
  refreshTokenExpiresAt: z.iso.datetime(),
});
export type SessionTokens = z.infer<typeof sessionTokensSchema>;

export const accountSummarySchema = z.strictObject({
  userId: z.uuid(),
  accountStatus: accountStatusSchema,
  onboardingStatus: onboardingStatusSchema,
  onboardingStep: onboardingStepSchema,
});
export type AccountSummary = z.infer<typeof accountSummarySchema>;

export const authenticatedResultSchema = z.strictObject({
  result: z.literal('authenticated'),
  session: sessionTokensSchema,
  account: accountSummarySchema,
});
export type AuthenticatedResult = z.infer<typeof authenticatedResultSchema>;

export const registrationRequiredResultSchema = z.strictObject({
  result: z.literal('registration_required'),
  registrationToken: opaqueTokenSchema,
  registrationTokenExpiresInSeconds: z.int().positive(),
});
export type RegistrationRequiredResult = z.infer<typeof registrationRequiredResultSchema>;

export const otpVerifyResponseSchema = z.discriminatedUnion('result', [
  authenticatedResultSchema,
  registrationRequiredResultSchema,
]);
export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;

export const registrationResponseSchema = authenticatedResultSchema;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;

export const refreshResponseSchema = z.strictObject({
  session: sessionTokensSchema,
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
