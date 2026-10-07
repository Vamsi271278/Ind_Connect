import { z } from 'zod';

import { onboardingStatusSchema, onboardingStepSchema } from './enums.js';

/** ISO 639 language code, lowercase (DATA-MODEL §12). */
export const languageCodeSchema = z.string().regex(/^[a-z]{2,3}$/);
/** Stable interest code (DATA-MODEL §14), e.g. BADMINTON. Never a database UUID. */
export const interestCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]{1,39}$/);
/** Stable interest category code (DATA-MODEL §15), e.g. SPORTS. */
export const interestCategoryCodeSchema = z.string().regex(/^[A-Z][A-Z0-9_]{1,39}$/);

/** BR-PROF-011: at least one language on every save. */
export const LANGUAGES_MIN = 1;
/** Activation (Analytics §484 / GR): at least three interests on every save. */
export const INTERESTS_MIN = 3;

// Payload bounds only (not business maximums): larger than any taxonomy.
const LANGUAGES_PAYLOAD_MAX = 50;
const INTERESTS_PAYLOAD_MAX = 200;

const unique = (codes: readonly string[]) => new Set(codes).size === codes.length;

export const languageSchema = z.strictObject({
  code: languageCodeSchema,
  displayName: z.string(),
});
export type Language = z.infer<typeof languageSchema>;

export const interestSchema = z.strictObject({
  code: interestCodeSchema,
  label: z.string(),
});
export type Interest = z.infer<typeof interestSchema>;

/** A saved interest in the self projection: enough to restore O07 selection. */
export const selectedInterestSchema = z.strictObject({
  code: interestCodeSchema,
  label: z.string(),
  categoryCode: interestCategoryCodeSchema,
});
export type SelectedInterest = z.infer<typeof selectedInterestSchema>;

// ---------------------------------------------------------------- GET /profile/languages

/** O06 options: active languages in display order (bounded reference data). */
export const languageListResponseSchema = z.strictObject({
  languages: z.array(languageSchema),
});
export type LanguageListResponse = z.infer<typeof languageListResponseSchema>;

// ---------------------------------------------------------------- GET /profile/interests

/** O07 options: active categories, each with its active interests, in display order. */
export const interestCatalogResponseSchema = z.strictObject({
  categories: z.array(
    z.strictObject({
      code: interestCategoryCodeSchema,
      label: z.string(),
      interests: z.array(interestSchema),
    }),
  ),
});
export type InterestCatalogResponse = z.infer<typeof interestCatalogResponseSchema>;

// ---------------------------------------------------------------- PUT /users/me/languages, /interests

/** The complete set (replace semantics). Unknown or inactive codes fail the whole save. */
export const updateMyLanguagesBodySchema = z.strictObject({
  languages: z
    .array(languageCodeSchema)
    .min(LANGUAGES_MIN)
    .max(LANGUAGES_PAYLOAD_MAX)
    .refine(unique, { message: 'duplicate_language' }),
});
export type UpdateMyLanguagesBody = z.infer<typeof updateMyLanguagesBodySchema>;

export const updateMyInterestsBodySchema = z.strictObject({
  interests: z
    .array(interestCodeSchema)
    .min(INTERESTS_MIN)
    .max(INTERESTS_PAYLOAD_MAX)
    .refine(unique, { message: 'duplicate_interest' }),
});
export type UpdateMyInterestsBody = z.infer<typeof updateMyInterestsBodySchema>;

const onboardingSchema = z.strictObject({
  status: onboardingStatusSchema,
  step: onboardingStepSchema,
});

export const myLanguagesResponseSchema = z.strictObject({
  languages: z.array(languageSchema),
  onboarding: onboardingSchema,
});
export type MyLanguagesResponse = z.infer<typeof myLanguagesResponseSchema>;

export const myInterestsResponseSchema = z.strictObject({
  interests: z.array(selectedInterestSchema),
  onboarding: onboardingSchema,
});
export type MyInterestsResponse = z.infer<typeof myInterestsResponseSchema>;
