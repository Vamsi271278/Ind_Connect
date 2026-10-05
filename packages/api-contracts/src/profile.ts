import { z } from 'zod';

const FIRST_NAME_MAX = 50;
const GENDER_SELF_DESCRIPTION_MAX = 80;

// Letters (any script) and combining marks, with single spaces, apostrophes
// (straight or typographic) and hyphens between them. Excludes digits (so no
// phone numbers), URL punctuation and emoji by construction.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '’-][\p{L}\p{M}]+)*$/u;

// Code points, not graphemes: must agree with PostgreSQL varchar(n) limits.
const codePointLength = (value: string): number => Array.from(value).length;

/**
 * O01 first name (SFS §O01, Section N): required, 1–50 characters, Unicode
 * letters with spaces, apostrophes and hyphens; no URLs, phone numbers or
 * emoji-only values.
 */
export const firstNameSchema = z
  .string()
  .transform((value) => value.normalize('NFC').trim().replace(/\s+/gu, ' '))
  .refine((value) => codePointLength(value) >= 1, { message: 'required' })
  .refine((value) => codePointLength(value) <= FIRST_NAME_MAX, { message: 'too_long' })
  .refine((value) => NAME_PATTERN.test(value), { message: 'invalid_characters' });

/** O02 "Prefer to self-describe" text: same character rules, up to 80. */
export const genderSelfDescriptionSchema = z
  .string()
  .transform((value) => value.normalize('NFC').trim().replace(/\s+/gu, ' '))
  .refine((value) => codePointLength(value) >= 1, { message: 'required' })
  .refine((value) => codePointLength(value) <= GENDER_SELF_DESCRIPTION_MAX, {
    message: 'too_long',
  })
  .refine((value) => NAME_PATTERN.test(value), { message: 'invalid_characters' });
