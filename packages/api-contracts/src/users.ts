import { z } from 'zod';

import {
  accountStatusSchema,
  genderCodeSchema,
  onboardingStatusSchema,
  onboardingStepSchema,
} from './enums.js';
import { firstNameSchema, genderSelfDescriptionSchema } from './profile.js';

// ---------------------------------------------------------------- PATCH /users/me/profile

/**
 * O01/O02 profile write. Whitelisted fields only (AUTHORIZATION §XXX/§XXXI);
 * anything else is rejected. `lastName` is intentionally absent (Phase-2
 * decision: deferred, requires an additive migration first).
 *
 * Cross-field rules that depend on the stored profile (self-description only
 * with SELF_DESCRIBE) are enforced by the server on the merged result.
 */
export const updateProfileBodySchema = z
  .strictObject({
    firstName: firstNameSchema.optional(),
    genderCode: genderCodeSchema.optional(),
    genderSelfDescription: genderSelfDescriptionSchema.optional(),
  })
  .refine(
    (body) =>
      body.firstName !== undefined ||
      body.genderCode !== undefined ||
      body.genderSelfDescription !== undefined,
    { message: 'at_least_one_field' },
  )
  .refine(
    (body) =>
      body.genderSelfDescription === undefined ||
      body.genderCode === undefined ||
      body.genderCode === 'SELF_DESCRIBE',
    { message: 'self_description_requires_self_describe', path: ['genderSelfDescription'] },
  );
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

// ---------------------------------------------------------------- GET /users/me

/**
 * SelfUserDto (AUTHORIZATION §XLI). Own-account projection only: masked phone
 * and server-computed age — never the raw phone, date of birth, session or
 * token-family identifiers, moderation state or database timestamps.
 */
export const selfUserSchema = z.strictObject({
  id: z.uuid(),
  accountStatus: accountStatusSchema,
  onboarding: z.strictObject({
    status: onboardingStatusSchema,
    step: onboardingStepSchema,
  }),
  profile: z.strictObject({
    firstName: z.string().nullable(),
    genderCode: genderCodeSchema.nullable(),
    genderSelfDescription: z.string().nullable(),
  }),
  phoneMasked: z.string(),
  age: z.int().min(18),
});
export type SelfUser = z.infer<typeof selfUserSchema>;

// ---------------------------------------------------------------- GET /app/bootstrap

/**
 * ADR-076 public bootstrap state. `account` is present only when the request
 * carries a valid access token; a missing, invalid or expired token yields
 * `null` (never an error), so maintenance/update gating always works.
 * Subscription entitlement is deferred to the billing slice.
 */
export const bootstrapResponseSchema = z.strictObject({
  maintenanceMode: z.boolean(),
  minimumSupportedVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  featureFlags: z.record(z.string(), z.boolean()),
  account: z
    .strictObject({
      status: accountStatusSchema,
      onboardingStatus: onboardingStatusSchema,
      onboardingStep: onboardingStepSchema,
    })
    .nullable(),
});
export type BootstrapResponse = z.infer<typeof bootstrapResponseSchema>;
