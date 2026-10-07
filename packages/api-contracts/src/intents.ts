import { z } from 'zod';

import { onboardingStatusSchema, onboardingStepSchema } from './enums.js';

/** BR-INT-002 top-level intents (DATA-MODEL §17, parent_code NULL). */
export const TOP_LEVEL_INTENT_CODES = ['FRIENDSHIP', 'ACTIVITIES', 'NETWORKING', 'DATING'] as const;
export const topLevelIntentCodeSchema = z.enum(TOP_LEVEL_INTENT_CODES);
export type TopLevelIntentCode = z.infer<typeof topLevelIntentCodeSchema>;

/**
 * Intents set through PUT /users/me/intents. DATING is never accepted there:
 * it changes only with dating consent (PUT/DELETE /users/me/dating/consent).
 */
export const SOCIAL_INTENT_CODES = ['FRIENDSHIP', 'ACTIVITIES', 'NETWORKING'] as const;
export const socialIntentCodeSchema = z.enum(SOCIAL_INTENT_CODES);
export type SocialIntentCode = z.infer<typeof socialIntentCodeSchema>;

/** Same format as dating_consents.policy_version. */
export const datingPolicyVersionSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/);

// ---------------------------------------------------------------- GET /profile/intents

export const intentOptionSchema = z.strictObject({
  code: topLevelIntentCodeSchema,
  label: z.string(),
  description: z.string().nullable(),
});
export type IntentOption = z.infer<typeof intentOptionSchema>;

/**
 * O04 choices: active top-level intents in display order. DATING is present
 * only while the Dating kill switch is on, and `dating` then carries the
 * policy version a consent is recorded against; otherwise `dating` is null.
 * Dating sub-intents are never listed here.
 */
export const intentOptionsResponseSchema = z.strictObject({
  options: z.array(intentOptionSchema),
  dating: z.strictObject({ policyVersion: datingPolicyVersionSchema }).nullable(),
});
export type IntentOptionsResponse = z.infer<typeof intentOptionsResponseSchema>;

// ---------------------------------------------------------------- PUT /users/me/intents

/**
 * The complete set of active non-dating intents (replace semantics). Empty is
 * valid only while Dating is active, since at least one intent must remain.
 */
export const updateMyIntentsBodySchema = z.strictObject({
  intents: z
    .array(socialIntentCodeSchema)
    .max(SOCIAL_INTENT_CODES.length)
    .refine((codes) => new Set(codes).size === codes.length, { message: 'duplicate_intent' }),
});
export type UpdateMyIntentsBody = z.infer<typeof updateMyIntentsBodySchema>;

export const myIntentsResponseSchema = z.strictObject({
  activeIntents: z.array(topLevelIntentCodeSchema),
  onboarding: z.strictObject({
    status: onboardingStatusSchema,
    step: onboardingStepSchema,
  }),
});
export type MyIntentsResponse = z.infer<typeof myIntentsResponseSchema>;

// ---------------------------------------------------------------- PUT/DELETE /users/me/dating/consent

/**
 * O05 affirmative opt-in. `policyVersion` must equal the currently served
 * version: the record is evidence that the user affirmatively accepted that
 * configured dating policy version (not proof of reading it).
 */
export const putDatingConsentBodySchema = z.strictObject({
  policyVersion: datingPolicyVersionSchema,
});
export type PutDatingConsentBody = z.infer<typeof putDatingConsentBodySchema>;

/** Self-only result. Consent history, timestamps and source are never returned. */
export const datingConsentResponseSchema = z.strictObject({
  datingEnabled: z.literal(true),
});
export type DatingConsentResponse = z.infer<typeof datingConsentResponseSchema>;
