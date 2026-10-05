import { z } from 'zod';

/** BR-AUTH-010 / DATA-MODEL `users.account_status`. */
export const ACCOUNT_STATUSES = [
  'ACTIVE',
  'PENDING_VERIFICATION',
  'LIMITED',
  'UNDER_REVIEW',
  'SUSPENDED',
  'BANNED',
  'DEACTIVATED',
  'DELETION_PENDING',
  'DELETED',
] as const;
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

/** DATA-MODEL `users.onboarding_status`. */
export const ONBOARDING_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'] as const;
export const onboardingStatusSchema = z.enum(ONBOARDING_STATUSES);
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

/** DATA-MODEL `users.onboarding_step`, in canonical flow order. */
export const ONBOARDING_STEPS = [
  'AGE',
  'PHONE',
  'NAME',
  'GENDER',
  'LOCATION',
  'INTENT',
  'LANGUAGE',
  'INTERESTS',
  'PHOTO',
  'ABOUT',
  'VERIFICATION',
  'NOTIFICATIONS',
  'COMPLETE',
] as const;
export const onboardingStepSchema = z.enum(ONBOARDING_STEPS);
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

/** DATA-MODEL `gender_options` initial codes. */
export const GENDER_CODES = [
  'WOMAN',
  'MAN',
  'NON_BINARY',
  'SELF_DESCRIBE',
  'PREFER_NOT_TO_SAY',
] as const;
export const genderCodeSchema = z.enum(GENDER_CODES);
export type GenderCode = z.infer<typeof genderCodeSchema>;
