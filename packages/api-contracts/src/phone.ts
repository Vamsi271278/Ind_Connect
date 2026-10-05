import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';

export interface NormalizedPhone {
  /** E.164, e.g. `+12145551234`. */
  readonly e164: string;
  /** ISO 3166-1 alpha-2, when the number maps to a single country. */
  readonly country: string | undefined;
}

const MAX_PHONE_INPUT_LENGTH = 32;
const E164 = /^\+[1-9]\d{6,14}$/;

/**
 * Normalizes an international phone number to E.164.
 *
 * Input must be in international form (leading `+` and country calling code);
 * formatting characters (spaces, dashes, parentheses) are accepted. Returns
 * `undefined` for anything that is not a plausible, valid number.
 */
export function normalizePhone(input: string): NormalizedPhone | undefined {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PHONE_INPUT_LENGTH) return undefined;
  if (!trimmed.startsWith('+')) return undefined;

  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed?.isValid()) return undefined;

  const e164 = parsed.number;
  if (!E164.test(e164)) return undefined;
  return { e164, country: parsed.country };
}

/** Masks an E.164 number for display, e.g. `+1 ••• ••• 1234`. */
export function maskPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  const callingCode = parsed?.countryCallingCode ?? '';
  const lastFour = e164.slice(-4);
  return `+${callingCode} ••• ••• ${lastFour}`;
}

/** Raw phone input as sent by clients; normalization happens server-side. */
export const phoneInputSchema = z.string().trim().min(1).max(MAX_PHONE_INPUT_LENGTH);
